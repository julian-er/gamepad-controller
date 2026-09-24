import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkPrTarget, isLibraryFile } from './check-pr-target.mjs';

const pr = {
  base: 'main',
  head: 'feat/axis-deadzone',
  headRepo: 'contributor/gamepad-controller',
  repository: 'julian-er/gamepad-controller',
};

test('website-only PRs may target main, including website lockfile changes', () => {
  assert.deepEqual(
    checkPrTarget({ ...pr, files: ['website/src/App.tsx', 'website/package.json', 'pnpm-lock.yaml'] }),
    [],
  );
});

test('library files in mixed PRs must not target main directly', () => {
  assert.deepEqual(
    checkPrTarget({ ...pr, files: ['website/src/App.tsx', 'src/index.ts', 'tests/factory.test.ts'] }),
    ['src/index.ts', 'tests/factory.test.ts'],
  );
  assert.equal(isLibraryFile('package.json'), true);
  assert.equal(isLibraryFile('vite.config.ts'), true);
});

test('library PRs may target development', () => {
  assert.deepEqual(checkPrTarget({ ...pr, base: 'development', files: ['src/index.ts'] }), []);
});

test('same-repository release and hotfix PRs may target main', () => {
  for (const head of ['release/v1.2.3', 'release/v2.0.0-rc.1', 'hotfix/v1.2.4']) {
    assert.deepEqual(
      checkPrTarget({ ...pr, head, headRepo: pr.repository, files: ['src/index.ts', 'package.json'] }),
      [],
    );
  }
});

test('forks cannot bypass the policy with a release branch name', () => {
  assert.deepEqual(checkPrTarget({ ...pr, head: 'release/v1.2.3', files: ['src/index.ts'] }), [
    'src/index.ts',
  ]);
  assert.deepEqual(
    checkPrTarget({ base: 'main', head: 'release/v1.2.3', files: ['src/index.ts'] }),
    ['src/index.ts'],
  );
});
