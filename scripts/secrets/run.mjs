import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ORGANIZATION_ID = '3d3a20ba-afd6-4d95-a8b6-3b47ca41c844';
const PROJECT_ID = '758aa6f1-ecca-43b1-84e2-d3d47ad73b58';
const DOMAIN = 'https://app.infisical.com';
const controlKeys = /^(?:INFISICAL_|NODE_OPTIONS$|NODE_PATH$|PATH$|PATHEXT$|COMSPEC$)/i;

export function validateConfig(config) {
    if (
        config.version !== 1 ||
        config.organizationId !== ORGANIZATION_ID ||
        config.domain !== DOMAIN ||
        config.projectId !== PROJECT_ID
    )
        throw new Error('Startup is restricted to this project in Julian Rosalen, US Cloud.');
    if (!config.profiles || typeof config.profiles !== 'object') throw new Error('Missing Infisical startup profiles.');
    for (const profile of Object.values(config.profiles)) {
        if (!Array.isArray(profile.sources) || !profile.sources.length)
            throw new Error('Missing startup secret sources.');
        for (const source of profile.sources) {
            if (
                !['dev', 'staging'].includes(source.environment) ||
                !/^(?:\/|\/workstation\/[a-z0-9-]+)$/.test(source.path)
            )
                throw new Error(
                    'Startup only reads explicit development/staging variable folders; recovery folders are excluded.'
                );
        }
    }
}

export function readFolder(config, source, parentEnv = process.env, execute = spawnSync) {
    validateConfig(config);
    const env = { ...parentEnv };
    for (const name of Object.keys(env))
        if (/^INFISICAL_/i.test(name) && !['INFISICAL_CLI', 'INFISICAL_PROFILE'].includes(name)) delete env[name];
    const result = execute(
        parentEnv.INFISICAL_CLI || 'infisical',
        [
            'sm',
            'export',
            '--projectId',
            PROJECT_ID,
            '--org',
            ORGANIZATION_ID,
            '--domain',
            DOMAIN,
            '--profile',
            parentEnv.INFISICAL_PROFILE || 'windows-recovery',
            '--env',
            source.environment,
            '--path',
            source.path,
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
            maxBuffer: 4 * 1024 * 1024,
            stdio: ['ignore', 'pipe', 'pipe'],
        }
    );
    if (result.error || result.status !== 0)
        throw new Error(
            'Infisical startup failed. Sign in to US Cloud with profile windows-recovery and access to Julian Rosalen. Local env files were not used as a fallback; CLI details withheld.'
        );
    let data;
    try {
        data = JSON.parse(result.stdout);
    } catch {
        throw new Error('Unexpected Infisical response; contents withheld.');
    }
    if (Array.isArray(data)) {
        if (!data.every((item) => typeof item?.key === 'string' && typeof item?.value === 'string'))
            throw new Error('Invalid Infisical variable response.');
        data = Object.fromEntries(data.map((item) => [item.key, item.value]));
    }
    if (!data || typeof data !== 'object' || Object.values(data).some((value) => typeof value !== 'string'))
        throw new Error('Invalid Infisical variable response.');
    return data;
}

export function selectProfile(config, name, command) {
    const requested = config.profiles[name];
    if (!requested) throw new Error('Unknown Infisical startup profile.');
    if (command[0] === 'vite') {
        const modeIndex = command.indexOf('--mode');
        const mode =
            modeIndex >= 0 ? command[modeIndex + 1] : command.find((arg) => arg.startsWith('--mode='))?.slice(7);
        if (mode && requested.viteModes?.[mode]) name = requested.viteModes[mode];
    }
    if (!config.profiles[name]) throw new Error('Missing environment-specific startup profile.');
    return name;
}

export async function loadEnvironment(config, name, { parentEnv = process.env, fetch = readFolder } = {}) {
    validateConfig(config);
    const profile = config.profiles[name];
    if (!profile) throw new Error('Unknown Infisical startup profile.');
    const values = Object.create(null);
    for (const source of profile.sources) {
        const remote = await fetch(config, source, parentEnv);
        for (const [key, value] of Object.entries(remote)) {
            if (
                !/^[A-Z_][A-Z0-9_]*$/.test(key) ||
                controlKeys.test(key) ||
                typeof value !== 'string' ||
                key === 'FILE_BASE64' ||
                key === 'BACKUP_KEY_BASE64'
            )
                throw new Error('Unexpected process-control or recovery key in a runtime folder; values withheld.');
            if (source.allowedPrefixes && !source.allowedPrefixes.some((prefix) => key.startsWith(prefix)))
                throw new Error('A runtime folder contains a variable outside its allowed scope.');
            if (source.allowedKeys && !source.allowedKeys.includes(key))
                throw new Error('A server runtime folder contains an unexpected variable name.');
            if (Object.hasOwn(values, key) && values[key] !== value)
                throw new Error('Conflicting runtime folders; choose one explicit environment.');
            values[key] = value;
        }
    }
    const missing = (profile.requiredKeys || []).filter((key) => !values[key]?.trim());
    if (missing.length)
        throw new Error(
            `Missing required Infisical variables: ${missing.join(', ')}. Existing hosted secrets and env files were not changed.`
        );
    if (profile.minimumVariables && Object.keys(values).length < profile.minimumVariables)
        throw new Error('The required runtime folder is empty. Existing env files were preserved.');
    const env = { ...parentEnv };
    for (const key of Object.keys(env)) if (/^INFISICAL_/i.test(key)) delete env[key];
    for (const [key, value] of Object.entries(values)) {
        // Windows treats environment names without regard to case. Clear aliases
        // before applying authoritative vault values, even when tested on Unix.
        for (const inherited of Object.keys(env)) if (inherited.toUpperCase() === key) delete env[inherited];
        env[key] = value;
    }
    env.INFISICAL_RUNTIME_ORG = ORGANIZATION_ID;
    env.INFISICAL_RUNTIME_PROJECT = PROJECT_ID;
    env.INFISICAL_RUNTIME_PROFILE = name;
    if (profile.wrangler) {
        env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV = 'false';
        env.CLOUDFLARE_INCLUDE_PROCESS_ENV = 'true';
    }
    return { env, variableCount: Object.keys(values).length, profile };
}

export function resolveCommand(command, cwd) {
    const [name, ...args] = command;
    if (!name || command.some((arg) => arg.includes('\0'))) throw new Error('Missing or invalid startup command.');
    if (name === 'node') return [process.execPath, args];
    if (['vite', 'wrangler'].includes(name)) {
        const require = createRequire(join(cwd, 'package.json'));
        let packagePath;
        try {
            packagePath = require.resolve(`${name}/package.json`);
        } catch {
            throw new Error(`Install this workspace's dependencies before starting ${name}.`);
        }
        const package_ = JSON.parse(readFileSync(packagePath, 'utf8'));
        const bin = typeof package_.bin === 'string' ? package_.bin : package_.bin?.[name];
        if (!bin) throw new Error('Missing local startup executable.');
        return [process.execPath, [resolve(dirname(packagePath), bin), ...args]];
    }
    if (name === 'python') return [name, args];
    throw new Error('Unsupported startup executable; use node, vite, wrangler or python without a shell.');
}

export function startChild(command, cwd, env) {
    const [executable, args] = resolveCommand(command, cwd);
    return new Promise((done, reject) => {
        const child = spawn(executable, args, { cwd, env, shell: false, windowsHide: true, stdio: 'inherit' });
        const forward = (signal) => child.kill(signal);
        const interrupt = () => forward('SIGINT'),
            terminate = () => forward('SIGTERM');
        process.on('SIGINT', interrupt);
        process.on('SIGTERM', terminate);
        const cleanup = () => {
            process.off('SIGINT', interrupt);
            process.off('SIGTERM', terminate);
        };
        child.once('error', () => {
            cleanup();
            reject(new Error('Startup executable could not start; credentials withheld.'));
        });
        child.once('exit', (code, signal) => {
            cleanup();
            done(code ?? (signal === 'SIGINT' ? 130 : 143));
        });
    });
}

async function main() {
    const root = fileURLToPath(new URL('../../', import.meta.url));
    const config = JSON.parse(readFileSync(join(root, 'infisical-runtime.json'), 'utf8'));
    const args = process.argv.slice(2),
        separator = args.indexOf('--'),
        command = separator >= 0 ? args.slice(separator + 1) : [];
    const check = args.length === 2 && args[1] === '--check';
    if ((!check && separator !== 1) || !args[0] || (!check && !command.length))
        throw new Error('Usage: node scripts/secrets/run.mjs <profile> -- <command> [args], or <profile> --check.');
    validateConfig(config);
    const name = selectProfile(config, args[0], command),
        profile = config.profiles[name];
    if (profile.wrangler && ['.dev.vars', '.dev.vars.local'].some((file) => existsSync(join(root, file))))
        throw new Error(
            'Wrangler dev-vars files would mask Infisical variables. Existing files were preserved; resolve that configuration before starting.'
        );
    const loaded = await loadEnvironment(config, name);
    console.log(
        `Infisical: ${config.projectName}, ${name}, ${loaded.variableCount} variables loaded from Julian Rosalen.`
    );
    if (!check) process.exitCode = await startChild(command, process.cwd(), loaded.env);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
    main().catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });
