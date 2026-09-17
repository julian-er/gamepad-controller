# Releasing `gamepad-ui-engine`

This guide is for maintainers cutting a release. Contributors do not need it — see
[CONTRIBUTING.md](CONTRIBUTING.md) for the day-to-day PR flow.

## Overview

Releases are prepared on a `release/*` branch, merged into `main` through the normal PR
process, then triggered by pushing a `vX.Y.Z` tag on the merge commit. The tag push runs
[`.github/workflows/release.yml`](.github/workflows/release.yml), which re-verifies the
release, publishes to npm, and creates the GitHub Release.

```
release/vX.Y.Z (bump version + CHANGELOG heading)
        │
        ▼  PR → CI: library (20.x), library (24.x), website
      main  ◄──────────────────────────────── squash merge
        │
        ▼  maintainer: git tag -a vX.Y.Z on the merge commit, then push the tag
push tag vX.Y.Z
        │
        ▼
.github/workflows/release.yml
   ┌─ tag matches package.json version? ──fail──► stop (see "What the release workflow checks")
   │
   ├─ tagged commit is on origin/main? ──fail──► stop
   │
   ├─ install, lint, typecheck, test:coverage, build ──fail──► stop
   │
   ├─ already published on npm? ──yes──► skip "Publish to npm"
   │            │no
   │            ▼
   │      npm publish --provenance --access public --tag <latest|next>
   │
   └─ extract docs/CHANGELOG.md section for this version
              │
              ▼
     create/update the GitHub Release (marked prerelease for `-` versions)
```

`main` is protected once the [One-time setup](#one-time-setup) rulesets exist: every change, including a release branch, lands through a pull request with green required checks. Nothing in this guide pushes to `main` directly.

## Versioning

This library follows [Semantic Versioning](https://semver.org/), scoped to the public API
re-exported from [`src/index.ts`](src/index.ts) (internal modules such as
`core/gamepadEventHandler`, `core/gamepadNavigation`, or `utils/domUtils` are not part of the
contract, even if reachable through a deep import).

- **Major** — a change that can break an existing consumer without any code change on their
  side: removing or renaming an export from `src/index.ts` (a class, function, type, or
  constant such as `GamepadService`, `gamepadUtils`, `CONTROLLER_MAPPINGS`, …); an incompatible
  change to a public method signature, an options-group shape (`GamepadServiceConfig` and the
  `*OptionsGroup` types), or an event payload/contract (`GamepadServiceEventMap`,
  `GamepadActionEvent`, `GamepadEvent`); or a default runtime behavior change that a consumer
  can observe and that isn't purely a bug fix.
- **Minor** — a backwards-compatible addition: a new export, a new optional config field, a new
  event, a new controller-mapping helper, or anything else a consumer can ignore and keep
  working exactly as before.
- **Patch** — a fix, performance improvement, dependency bump, or documentation change that adds
  or removes nothing from `src/index.ts`.

Release candidates (`X.Y.0-rc.N`) are only used ahead of a minor or major `X.Y.0` release.
Patches are never shipped as release candidates.

## One-time setup

These steps must be completed once, before the first `v1.0.0` tag is pushed — the package is
**not yet published to npm**. Kept here for reference and for recovery if OIDC ever needs
re-checking. Do them in this order:

1. **Merge the `release/v1.0.0` PR to `main`.** Follow the normal PR flow (see
   [Standard release](#standard-release)) up through the squash merge; do not tag yet.
2. **Publish `1.0.0` manually.** From the now up-to-date `main`:
   ```bash
   pnpm install --frozen-lockfile
   npm login
   npm publish --access public --provenance=false
   ```
   `prepublishOnly` (`pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build`)
   runs automatically as part of `npm publish`. `--provenance=false` is required here: the
   package sets `publishConfig.provenance: true`, which requests provenance attestation —
   that only works from a CI OIDC context, so a local `npm publish` without
   `--provenance=false` fails with `EUSAGE`. Trusted publishing cannot be configured until the
   package exists on the registry, so the very first version is always published this way,
   locally and without provenance.
3. **Configure the npm trusted publisher.** On npmjs.com → the package → Settings → Trusted
   publisher → GitHub Actions, set: owner `julian-er`, repository `gamepad-controller`,
   workflow filename `release.yml`, environment `npm`. The trusted publisher must be allowed
   to publish directly, because release.yml runs `npm publish`; if npmjs.com only grants staged
   publishing, the "Publish to npm" step fails. See [Troubleshooting & recovery](#troubleshooting--recovery).
4. **Create the GitHub environment.** Repository Settings → Environments → new environment
   named `npm`, restricted to tags matching `v*`. `release.yml` runs its publish job under
   `environment: npm`, which is what lets the OIDC token exchange with npm's trusted-publisher
   check succeed.
5. **Enable GitHub Pages.** Repository Settings → Pages → Build and deployment → Source, set to
   "GitHub Actions". This is what lets [`pages.yml`](.github/workflows/pages.yml) deploy the
   site.
6. **Create the repository rulesets.** Repository Settings → Rules → Rulesets:
   - A branch ruleset targeting `main`: require a pull request before merging (0 required
     approvals), require status checks `library (20.x)`, `library (24.x)`, `website`, block
     force pushes, block branch deletion.
   - A tag ruleset targeting `v*`: block tag update, block tag deletion.
   No ruleset exists until this step is done — tags and `main` are unprotected before then.
7. **Tag and push `v1.0.0`.** `git tag -a v1.0.0 -m "v1.0.0"` on the merge commit, then
   `git push origin v1.0.0`. The release workflow's "already published on npm?" check will see
   `1.0.0` already on the registry from step 2, skip "Publish to npm", and create the GitHub
   Release from `docs/CHANGELOG.md`.

From `1.0.1` on, the workflow publishes with OIDC and npm provenance — no long-lived npm token
is stored anywhere.

## Standard release

1. `git switch main && git pull`
2. `git switch -c release/vX.Y.Z`
3. `pnpm version X.Y.Z --no-git-tag-version`
4. Move the `## X.Y.Z — Unreleased` entries in `docs/CHANGELOG.md` under a dated heading:
   `## X.Y.Z — YYYY-MM-DD`. Update any other "unreleased" or "before publication" wording
   elsewhere in the docs that referred to this version.
5. Run the full local checks (mirrors CI — see [CONTRIBUTING.md](CONTRIBUTING.md)):
   ```bash
   pnpm run lint
   pnpm run format:check
   pnpm run typecheck
   pnpm run test:coverage
   pnpm run build
   pnpm pack --dry-run
   pnpm --filter gamepad-ui-engine-website run typecheck
   pnpm --filter gamepad-ui-engine-website run test
   pnpm --filter gamepad-ui-engine-website run build
   ```
6. Commit: `git commit -m "chore(release): vX.Y.Z"`.
7. `git push -u origin release/vX.Y.Z`.
8. Open a PR titled `chore(release): vX.Y.Z` (the PR title becomes the squash commit message).
9. Wait for CI to go green (`library (20.x)`, `library (24.x)`, `website`), then squash merge.
10. `git switch main && git pull`.
11. Tag the merge commit: `git tag -a vX.Y.Z -m "vX.Y.Z"`.
12. `git push origin vX.Y.Z`.
13. Watch the **Release** workflow run in the Actions tab (see
    [Post-release checks](#post-release-checks) for what to verify once it finishes).

## Release candidates

1. Branch from `main`: `release/vX.Y.0-rc.N`.
2. `pnpm version X.Y.0-rc.N --no-git-tag-version`.
3. CHANGELOG heading: `## X.Y.0-rc.N — YYYY-MM-DD`.
4. Same PR → CI → squash merge → tag flow as a standard release, but the tag is
   `vX.Y.0-rc.N`.
5. Because the version string contains a `-`, `release.yml` computes `dist-tag=next` and
   `prerelease=true` automatically — it publishes under `npm install gamepad-ui-engine@next`
   and marks the GitHub Release as a prerelease. No extra flag is needed.
6. To promote a release candidate, do a normal **standard release** of `X.Y.0` — npm versions
   are immutable, so there is no "promote" command; it's a new version publish under the
   `latest` dist-tag.

## Hotfixes

Branch `hotfix/vX.Y.Z` from `main`, then follow the same PR → CI → squash merge → tag flow as
a standard release (steps 3–13 above). There are no maintenance branches for old versions —
every hotfix lands on top of current `main`.

## What the release workflow checks

In the order they run in `release.yml`:

- **Checkout** (`fetch-depth: 0`) — fetches full history so the ancestry guard below can walk
  the commit graph.
- **Guard - tag matches package.json version** — fails if the pushed tag isn't `v` followed by
  the exact `version` field in `package.json`. Failure message: `Tag '<tag>' does not match
  package.json version '<version>' (expected tag 'v<version>').` Fix: either the tag or the
  version was wrong; there is no way to "fix" a live tag (see
  [Troubleshooting & recovery](#troubleshooting--recovery)) — release the correct version next.
- **Guard - commit is merged into main** — fails if the tagged commit is not an ancestor of
  `origin/main`. Failure message: `Commit <sha> is not an ancestor of origin/main; refusing to
  release from an unmerged commit.` This means the tag was pushed on a branch or unmerged
  commit — merge to `main` first, then tag the merge commit.
- **Compute release metadata** — derives `VERSION` from `package.json`, and sets `dist-tag` to
  `next` (with `prerelease=true`) when the version contains a `-`, otherwise `latest`
  (`prerelease=false`). Informational only; nothing to fail here.
- **Set up pnpm** / **Set up Node.js** — installs the pinned pnpm and Node.js 24.x, with the
  npm registry URL configured for the later OIDC publish.
- **Ensure npm >= 11.5.1** — upgrades the runner's global npm if it's older than 11.5.1
  (trusted publishing requires it). Self-healing; not a failure gate.
- **Install dependencies** (`pnpm install --frozen-lockfile`) — fails if `pnpm-lock.yaml` is out
  of sync with `package.json`/`website/package.json` (e.g. you forgot to commit a lockfile
  update).
- **Lint** (`pnpm run lint`) — fails on ESLint errors in `src/`.
- **Typecheck** (`pnpm run typecheck`) — fails on TypeScript errors (`tsc --noEmit`).
- **Test with coverage** (`pnpm run test:coverage`) — fails on any failing test or a coverage
  threshold miss.
- **Build** (`pnpm run build`) — fails if the Vite library build errors.
- **Check whether this version is already published** — runs `npm view
  gamepad-ui-engine@<version> version`; sets `published=true` if it resolves. Not a failure
  gate — just decides whether the next step runs.
- **Publish to npm** — runs only `if: steps.check-published.outputs.published != 'true'`:
  `npm publish --provenance --access public --tag <latest|next>`. Fails on authentication/OIDC
  problems (see [Troubleshooting & recovery](#troubleshooting--recovery)) or other registry
  errors. If the version is already published (e.g. the manual 1.0.0 bootstrap), this step is
  skipped and the workflow continues.
- **Extract release notes** — an `awk` pass over `docs/CHANGELOG.md` that finds the `## `
  heading whose *first token* equals `VERSION` exactly, and copies that section (up to the next
  `## ` heading) into `release-notes.md`. If nothing matches, it falls back to `Release
  <VERSION>.`.
- **Create or update GitHub release** — `gh release create <tag> --notes-file release-notes.md
  --title <tag>` (with `--prerelease` for `-` versions), falling back to `gh release edit` if a
  release for that tag already exists. This is what lets a re-run after a publish succeeds but
  a release-creation failure recover without re-publishing.

## Troubleshooting & recovery

- **A bad version was published.** Never unpublish. Run
  `npm deprecate gamepad-ui-engine@X.Y.Z "reason"` and ship a patch release through the
  standard flow.
- **The workflow failed *before* "Publish to npm"** (a guard, lint, typecheck, tests, or the
  build). Merge the fix through a normal PR into `main`. What you can do with the failed tag
  depends on whether the `v*` tag ruleset from [One-time setup](#one-time-setup) is active: if
  it is active, the tag cannot be moved or deleted, so release the *next* patch/minor version
  instead of reusing the failed tag. If the tag ruleset is not active yet (or a maintainer has
  configured an explicit ruleset bypass), delete the tag locally and remotely and re-push it on
  the fixed `main` commit: `git tag -d vX.Y.Z && git push origin :vX.Y.Z`, then re-tag and push.
  Tags are unprotected until the ruleset exists.
- **The workflow failed *after* "Publish to npm"** (typically the GitHub Release step). Re-run
  the failed job from the Actions tab. "Check whether this version is already published" will
  now see the version on the registry and skip republishing, while the release-notes/GitHub
  Release steps run again.
- **"Publish to npm" fails with 403/ENEEDAUTH although the trusted publisher exists.** Check that
  the trusted publisher allows direct publishing (not only staged), and that workflow filename
  `release.yml`, environment `npm`, owner and repository match exactly. Then re-run the failed
  job from the Actions tab (publish is attempted again because the version is not yet on npm).
- **OIDC publish fails with `ENEEDAUTH` or a `404`.** Check that the npmjs.com trusted-publisher
  fields match exactly: workflow filename `release.yml`, environment `npm`, repository owner
  `julian-er` and name `gamepad-controller`. Confirm the job actually ran under
  `environment: npm` (visible in the Actions run summary).

## Post-release checks

- `npm view gamepad-ui-engine version` and `npm view gamepad-ui-engine dist-tags` — confirm
  the new version and that `latest`/`next` point where expected.
- The npm version page shows a provenance badge (from `--provenance`) for versions 1.0.1 and later;
  the manually published 1.0.0 has no provenance.
- A GitHub Release for the tag exists with notes pulled from `docs/CHANGELOG.md`.
- If `website/`, `src/`, `docs/`, or `skills/` changed, confirm
  [the Pages site](https://julian-er.github.io/gamepad-controller/) reflects the update.
