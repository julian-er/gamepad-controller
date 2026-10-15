import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateConfig, readFolder, selectProfile, loadEnvironment, startChild } from './run.mjs';

const installed = JSON.parse(readFileSync(new URL('../../infisical-runtime.json', import.meta.url), 'utf8'));
const config = () => ({
    ...installed,
    profiles: { app: { sources: [{ environment: 'dev', path: '/workstation/local' }], requiredKeys: ['APP_TOKEN'] } },
});

test('rejects another organization, instance, project, production or recovery folder before fetching', async () => {
    for (const patch of [{ organizationId: 'other' }, { domain: 'https://eu.infisical.com' }, { projectId: 'other' }]) {
        let fetched = false;
        await assert.rejects(
            loadEnvironment({ ...config(), ...patch }, 'app', {
                fetch: () => {
                    fetched = true;
                    return {};
                },
            })
        );
        assert.equal(fetched, false);
    }
    for (const source of [
        { environment: 'prod', path: '/' },
        { environment: 'dev', path: '/recovery/backups/key' },
    ]) {
        const candidate = config();
        candidate.profiles.app.sources = [source];
        assert.throws(() => validateConfig(candidate));
    }
});

test('CLI calls pin organization, project, domain and folder and withhold failures', () => {
    const parentEnv = {
        PATH: process.env.PATH,
        INFISICAL_ORG: 'other',
        INFISICAL_DOMAIN: 'https://unwanted.invalid',
        INFISICAL_TOKEN: 'fixture-unwanted-token',
        INFISICAL_PROFILE: 'fixture-login',
    };
    const source = config().profiles.app.sources[0];
    const result = readFolder(config(), source, parentEnv, (_executable, args, options) => {
        for (const [flag, expected] of [
            ['--org', installed.organizationId],
            ['--projectId', installed.projectId],
            ['--domain', installed.domain],
            ['--env', 'dev'],
            ['--path', source.path],
            ['--profile', 'fixture-login'],
        ])
            assert.equal(args[args.indexOf(flag) + 1], expected);
        assert.equal(options.env.INFISICAL_TOKEN, undefined);
        assert.equal(options.env.INFISICAL_ORG, undefined);
        assert.ok(args.includes('--expand=false'));
        assert.ok(args.includes('--include-imports=false'));
        return { status: 0, stdout: '{"APP_TOKEN":"fixture-vault-token"}' };
    });
    assert.equal(result.APP_TOKEN, 'fixture-vault-token');
    for (const response of [
        { status: 1, stdout: 'fixture-private-value', stderr: 'fixture-private-value' },
        { status: 0, stdout: 'fixture-private-value' },
    ]) {
        assert.throws(
            () => readFolder(config(), source, parentEnv, () => response),
            (error) => !error.message.includes('fixture-private-value')
        );
    }
});

test('current vault variables override inherited aliases without reading or rewriting dotenv files', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'infisical-startup-check-'));
    const file = join(directory, '.env.local'),
        original = Buffer.from('APP_TOKEN=fixture-stale-file\n');
    writeFileSync(file, original);
    try {
        const parent = {
            Path: 'fixture-path',
            app_token: 'fixture-stale-parent',
            APP_TOKEN: 'fixture-stale-parent',
            INFISICAL_TOKEN: 'fixture-login-token',
        };
        const result = await loadEnvironment(config(), 'app', {
            parentEnv: parent,
            fetch: () => ({ APP_TOKEN: 'fixture-vault-token' }),
        });
        assert.equal(result.env.APP_TOKEN, 'fixture-vault-token');
        assert.equal(result.env.app_token, undefined);
        assert.equal(result.env.INFISICAL_TOKEN, undefined);
        assert.equal(result.env.INFISICAL_RUNTIME_ORG, installed.organizationId);
        assert.deepEqual(readFileSync(file), original);
        assert.equal(parent.APP_TOKEN, 'fixture-stale-parent');
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});

test('missing required values, conflicting scopes and process-control keys stop startup', async () => {
    await assert.rejects(loadEnvironment(config(), 'app', { fetch: () => ({}) }), /Missing required/);
    for (const key of ['NODE_OPTIONS', 'PATH', 'INFISICAL_ORG', 'FILE_BASE64', 'BACKUP_KEY_BASE64'])
        await assert.rejects(
            loadEnvironment(config(), 'app', { fetch: () => ({ APP_TOKEN: 'fixture', [key]: 'fixture-control' }) })
        );
    const candidate = config();
    candidate.profiles.app.sources.push({ environment: 'dev', path: '/workstation/second' });
    await assert.rejects(
        loadEnvironment(candidate, 'app', { fetch: (_config, source) => ({ APP_TOKEN: source.path }) }),
        /Conflicting/
    );
});

test('frontend folders reject server variables and Vite beta selects its explicit staging profile', async () => {
    const candidate = config();
    candidate.profiles.app.sources[0].allowedPrefixes = ['VITE_'];
    candidate.profiles.app.requiredKeys = [];
    await assert.rejects(
        loadEnvironment(candidate, 'app', { fetch: () => ({ SMTP_PASSWORD: 'fixture-server-secret' }) }),
        /allowed scope/
    );
    candidate.profiles.app.viteModes = { beta: 'beta' };
    candidate.profiles.beta = { sources: [{ environment: 'staging', path: '/workstation/beta' }] };
    assert.equal(selectProfile(candidate, 'app', ['vite', '--mode', 'beta']), 'beta');
    assert.equal(selectProfile(candidate, 'app', ['vite', '--mode=beta']), 'beta');
    assert.equal(selectProfile(candidate, 'app', ['node', 'script.mjs', '--mode', 'beta']), 'app');
});

test('a child receives in-memory values and its exit status is returned without a shell', async () => {
    const loaded = await loadEnvironment(config(), 'app', { fetch: () => ({ APP_TOKEN: 'fixture-vault-token' }) });
    const code = await startChild(
        ['node', '-e', 'if (process.env.APP_TOKEN !== "fixture-vault-token") process.exit(9); process.exit(23);'],
        fileURLToPath(new URL('../../', import.meta.url)),
        loaded.env
    );
    assert.equal(code, 23);
});
