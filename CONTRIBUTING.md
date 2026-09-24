# Contributing

Thanks for considering a contribution to `gamepad-ui-engine`.

## Prerequisites

- Node.js >= 20.19
- pnpm 12.4.2, via Corepack: `corepack enable`

## Setup

Fork the repository, clone your fork, then install from the repo root:

```bash
pnpm install
```

This installs both the library workspace and the `website/` workspace.

## Branches

`main` contains released library code and the live documentation website. `development`
collects library changes for the next release. Choose the starting branch and PR target by
what the change needs:

| Change | Branch from | PR target |
| --- | --- | --- |
| Library source, tests, root package/build configuration, or a website example needing unreleased library behavior | `development` | `development` |
| Website-only change that works with the library on `main` | `main` | `main` |
| Repository guidance or CI-only change that does not change library behavior | `main` | `main` |
| Release preparation (maintainers) | `development` | `main`, from `release/vX.Y.Z` |
| Urgent fix to released library code (maintainers) | `main` | `main`, from `hotfix/vX.Y.Z` |

Fork contributors should create their branch from the appropriate upstream branch and target
the same branch in their PR. `main` is protected by a repository ruleset (see
[RELEASING.md](RELEASING.md#one-time-setup)): no direct pushes, every change lands through a
PR with green required checks. CI rejects library-affecting PRs to `main` unless they come
from a maintainer's `release/vX.Y.Z` or `hotfix/vX.Y.Z` branch in this repository. The
library-affecting path list is maintained in `.github/scripts/check-pr-target.mjs`.

Branch names use a `type/short-kebab-description` shape, for example `fix/axis-deadzone`:

- `feat/`, `fix/`, `docs/`, `chore/`, `refactor/`, `test/`

`release/vX.Y.Z` and `hotfix/vX.Y.Z` branches are maintainer-only; see
[RELEASING.md](RELEASING.md). After a website-only PR or release reaches `main`, bring
`main` back into `development` before preparing another release.

## Making changes

- Consumer examples and website code import only from the `gamepad-ui-engine` public entry
  point — never private library modules.
- Docs and sample claims must match the current public API (`src/index.ts`,
  `docs/API.md`).
- UI interaction changes need browser verification recorded per
  [website/VERIFICATION.md](website/VERIFICATION.md).
- Preserve unrelated working-tree changes; keep your diff scoped to the task.

See [AGENTS.md](AGENTS.md) for the full repository guidance, including consumer skills.

## Checks before opening a PR

Run the checks that match what you touched. These mirror the CI jobs in
`.github/workflows/ci.yml`.

### Library checks — CI jobs `library (20.x)` and `library (24.x)`

```bash
pnpm run lint
pnpm run format:check
pnpm run typecheck
pnpm run test:coverage
pnpm run build
pnpm pack --dry-run
```

Formatting fix: `pnpm run format`.

### Website checks — CI job `website`

```bash
pnpm --filter gamepad-ui-engine-website run typecheck
pnpm --filter gamepad-ui-engine-website run test
pnpm --filter gamepad-ui-engine-website run build
```

Dev server: `pnpm --filter gamepad-ui-engine-website run dev`.

## Commit messages and PR titles

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`.

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `ci`, `build`.
Scopes seen in history: `core`, `website`, `examples`, `package`.

Mark breaking changes with `!` after the type/scope (e.g. `feat(core)!: ...`) and include a
`BREAKING CHANGE:` note in the body.

Your PR title must itself be a valid Conventional Commit, since it becomes the squash commit
message.

## Opening a pull request

- Draft PRs are welcome for early feedback.
- Check that the PR targets the branch specified under [Branches](#branches).
- Keep PRs focused on one change.
- Fill out the PR template.
- CI must be green before merge: `branch policy`, `library (20.x)`, `library (24.x)`, and `website`.
- Merges are squash merges; the PR title becomes the commit message, so it must be a
  Conventional Commit.
- `main` is protected by a repository ruleset (see
  [RELEASING.md](RELEASING.md#one-time-setup)) — there are no direct pushes, only PRs.

## Changelog

User-facing changes add a bullet under the topmost section in
[docs/CHANGELOG.md](docs/CHANGELOG.md), currently `## Unreleased`.

## Releases

Releases are tag-driven and handled by the maintainer. A release PR brings library changes
from `development` to `main`; a tag on the merged commit publishes the package. CI runs on
every PR and push to `main`, and `main` is deployed automatically to GitHub Pages. See
[RELEASING.md](RELEASING.md) for the full release process.
