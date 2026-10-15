import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ORGANIZATION_ID = '3d3a20ba-afd6-4d95-a8b6-3b47ca41c844';
const DOMAIN = 'https://app.infisical.com';

function fail(message) {
    throw new Error(message);
}
function git(root, args) {
    const result = spawnSync('git', ['-C', root, ...args], {
        encoding: 'utf8',
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.error) fail('Git is required; diagnostics withheld.');
    return result;
}

export function destinationPath(root, path) {
    if (
        typeof path !== 'string' ||
        !path ||
        isAbsolute(path) ||
        path.includes('\\') ||
        path
            .split('/')
            .some(
                (part) => !part || part === '.' || part === '..' || part.toLowerCase() === '.git' || part.includes(':')
            )
    )
        fail('Unsafe recovery path.');
    const target = resolve(root, ...path.split('/'));
    const remainder = relative(root, target);
    if (!remainder || remainder.startsWith(`..${sep}`) || isAbsolute(remainder))
        fail('Recovery path escapes the repository.');
    let current = root;
    for (const part of remainder.split(sep)) {
        current = resolve(current, part);
        try {
            if (lstatSync(current).isSymbolicLink()) fail('Recovery refuses symbolic links and junctions.');
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }
    }
    return target;
}

export function readRemote(config, file) {
    const executable = process.env.INFISICAL_CLI || 'infisical';
    const env = { ...process.env };
    for (const key of [
        'INFISICAL_TOKEN',
        'INFISICAL_ENVIRONMENT',
        'INFISICAL_PROJECT_ID',
        'INFISICAL_SECRET_PATH',
        'INFISICAL_API_URL',
        'INFISICAL_DOMAIN',
        'INFISICAL_ORG',
    ])
        delete env[key];
    const result = spawnSync(
        executable,
        [
            'sm',
            'export',
            '--projectId',
            config.projectId,
            '--org',
            ORGANIZATION_ID,
            '--domain',
            DOMAIN,
            '--env',
            file.environment,
            '--path',
            file.recoveryFolder,
            '--format',
            'json',
            '--expand=false',
            '--include-imports=false',
            '--secret-overriding=false',
            '--telemetry=false',
            '--silent',
        ],
        {
            env,
            encoding: 'utf8',
            windowsHide: true,
            timeout: 60000,
            maxBuffer: 16 * 1024 * 1024,
            stdio: ['ignore', 'pipe', 'pipe'],
        }
    );
    if (result.error || result.status !== 0)
        fail('Infisical recovery failed. Check login, access and CLI version; response withheld.');
    let data;
    try {
        data = JSON.parse(result.stdout);
    } catch {
        fail('Invalid Infisical response; contents withheld.');
    }
    if (Array.isArray(data)) {
        if (!data.every((item) => typeof item?.key === 'string' && typeof item?.value === 'string'))
            fail('Unexpected Infisical response schema.');
        data = Object.fromEntries(data.map((item) => [item.key, item.value]));
    }
    if (
        data?.FILE_FORMAT !== 'raw-bytes-v1' ||
        typeof data.FILE_BASE64 !== 'string' ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data.FILE_BASE64)
    )
        fail('Recovery secret is missing or invalid; contents withheld.');
    return Buffer.from(data.FILE_BASE64, 'base64');
}

export async function recover(config, { root, restore = false, fetch = readRemote } = {}) {
    if (
        config.organizationId !== ORGANIZATION_ID ||
        config.domain !== DOMAIN ||
        !/^[0-9a-f-]{36}$/.test(config.projectId)
    )
        fail('Recovery is restricted to the approved Julian Rosalen organization and US instance.');
    if (!Array.isArray(config.files)) fail('Invalid recovery configuration.');
    root = realpathSync(root);
    const top = git(root, ['rev-parse', '--show-toplevel']);
    if (top.status !== 0 || realpathSync(top.stdout.trim()).toLowerCase() !== root.toLowerCase())
        fail('Run against the root of a Git checkout.');
    const prepared = [];
    const destinations = new Set();
    for (const file of config.files) {
        if (
            !['dev', 'staging', 'prod'].includes(file.environment) ||
            typeof file.recoveryFolder !== 'string' ||
            !/^\/recovery\/files\/[a-z0-9-]+$/.test(file.recoveryFolder)
        )
            fail('Invalid environment or recovery folder.');
        const target = destinationPath(root, file.path);
        if (destinations.has(target.toLowerCase())) fail('Duplicate recovery destination.');
        destinations.add(target.toLowerCase());
        if (
            git(root, ['ls-files', '--error-unmatch', '--', file.path]).status === 0 ||
            git(root, ['check-ignore', '-q', '--', file.path]).status !== 0
        )
            fail('Recovery destination must be untracked and ignored by Git.');
        const bytes = await fetch(config, file);
        if (!Buffer.isBuffer(bytes)) fail('Invalid recovered file representation.');
        const exists = existsSync(target);
        if (exists && (!lstatSync(target).isFile() || !readFileSync(target).equals(bytes)))
            fail(`Existing file differs: ${file.path}. It was not overwritten.`);
        if (!exists && !restore) fail(`Missing file: ${file.path}. Use --restore to create missing files.`);
        prepared.push({ file, target, bytes, exists });
    }
    const created = [];
    try {
        for (const item of prepared) {
            destinationPath(root, item.file.path);
            if (!item.exists) {
                mkdirSync(dirname(item.target), { recursive: true });
                writeFileSync(item.target, item.bytes, { flag: 'wx', mode: 0o600 });
                created.push(item.target);
            }
            if (!readFileSync(item.target).equals(item.bytes))
                fail('Post-restoration comparison failed; details withheld.');
        }
    } catch {
        // Only files created by this invocation are removed on failure. Existing
        // originals are never deleted or overwritten.
        for (const target of created) unlinkSync(target);
        fail('Recovery was rolled back for newly created files; existing files were preserved.');
    }
    return {
        project: config.projectName,
        organization: 'Julian Rosalen',
        filesCompared: prepared.length,
        filesCreated: created.length,
        originalFilesPreserved: true,
        unresolved: config.unresolved ?? [],
    };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    try {
        const args = process.argv.slice(2);
        const allowed = new Set(['--restore', '--verify', '--target']);
        let root = fileURLToPath(new URL('../../', import.meta.url));
        for (let index = 0; index < args.length; index++) {
            if (!allowed.has(args[index])) fail('Supported options: --verify, --restore, --target <checkout>.');
            if (args[index] === '--target') {
                if (!args[index + 1]) fail('Missing target checkout.');
                root = resolve(args[++index]);
            }
        }
        if (args.includes('--restore') && args.includes('--verify')) fail('Choose either --restore or --verify.');
        const config = JSON.parse(readFileSync(new URL('../../secrets-recovery.json', import.meta.url), 'utf8'));
        console.log(JSON.stringify(await recover(config, { root, restore: args.includes('--restore') })));
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}
