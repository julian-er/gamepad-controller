import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const libraryFiles = new Set([
  'package.json',
  'eslint.config.js',
  'tsconfig.json',
  'vite.config.ts',
  'vitest.config.ts',
]);

export function isLibraryFile(path) {
  return path.startsWith('src/') || path.startsWith('tests/') || libraryFiles.has(path);
}

export function checkPrTarget({ base, head, headRepo, repository, files }) {
  if (base !== 'main') return [];

  const affected = files.filter(isLibraryFile);
  if (affected.length === 0) return [];

  const maintainerBranch =
    Boolean(repository) &&
    Boolean(headRepo) &&
    headRepo === repository &&
    /^(?:release\/v\d+\.\d+\.\d+(?:-rc\.\d+)?|hotfix\/v\d+\.\d+\.\d+)$/.test(head);

  return maintainerBranch ? [] : affected;
}

function main() {
  const { PR_BASE, PR_HEAD, PR_HEAD_REPO, GITHUB_REPOSITORY, PR_CHANGED_FILES } =
    process.env;

  if (PR_BASE !== 'main') {
    console.log(`PR targets ${PR_BASE}; branch policy applies only to main.`);
    return;
  }

  if (!PR_CHANGED_FILES) throw new Error('Missing PR_CHANGED_FILES path.');

  const files = readFileSync(PR_CHANGED_FILES, 'utf8')
    .split('\0')
    .filter(Boolean);

  const rejected = checkPrTarget({
    base: PR_BASE,
    head: PR_HEAD,
    headRepo: PR_HEAD_REPO,
    repository: GITHUB_REPOSITORY,
    files,
  });

  if (rejected.length) {
    console.error('Library changes to main require a same-repository release/vX.Y.Z or hotfix/vX.Y.Z PR:');
    for (const path of rejected) console.error(`  ${path}`);
    process.exitCode = 1;
  } else {
    console.log('PR target follows the branch policy.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
