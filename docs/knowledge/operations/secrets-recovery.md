---
type: Operations Guide
title: Local secret recovery
description: Restore ignored local environment files from the approved Infisical project without overwriting originals.
tags: [operations, secrets, recovery, infisical]
where: [gamepad-controller]
sources:
  - title: Runtime launcher
    path: ../../../scripts/secrets/run.mjs
  - title: Runtime profiles
    path: ../../../infisical-runtime.json
    - title: Recovery implementation
      path: ../../../scripts/secrets/recover.mjs
    - title: Project recovery mapping
      path: ../../../secrets-recovery.json
generated:
    by: process:maintain-documentation
    at: 2026-10-15T03:45:53.112Z
doc_version: 2
status: draft
---

# Local secret recovery

Document version: 2.

Latest change: Added automatic Infisical variable injection to local startup commands while retaining env recovery.

This repository uses Infisical US Cloud in the **Julian Rosalen** organization.
The project mapping is in [secrets-recovery.json](../../../secrets-recovery.json).
It contains paths and project identifiers only. Credentials and original file
contents must never be committed. The script explicitly pins the organization,
instance, project, environment and recovery folder. Git branches do not select
production secrets.

## Prerequisites

Use the Node version required by this repository, Git and the official Infisical
CLI. Version 0.44.0 was used during setup. Install the CLI from its
[official installation guide](https://infisical.com/docs/cli/install).
On Windows, the documented package-manager command is `winget install infisical`.
Then run `infisical login --domain https://app.infisical.com` and select only
Julian Rosalen. Browser login must not use email/password command-line flags.
Do not paste tokens into chat or commit CLI login data. If you use a named CLI
profile, select it with `INFISICAL_PROFILE`. `INFISICAL_CLI` can identify the
official executable when it is not on PATH; never commit a machine-specific path.

## Compare or restore

From the root of a fresh Git checkout, run:

```powershell
node scripts/secrets/recover.mjs --restore
node scripts/secrets/recover.mjs --verify
```

The default mode is verification. Restore mode creates only missing ignored
files. An existing byte-identical file is retained; any different existing file
aborts recovery. Tracked files, unsafe paths, symbolic links and junctions are
rejected. All remote files are fetched and all destinations are checked before
writing. If a write fails, only files created during that invocation are removed.
Original files are never overwritten or deleted. Output contains counts and
status only; CLI output and response errors are captured rather than echoed.

The recovery copy preserves original file bytes. Native variable folders are
separate for each source file, so values with the same names are not merged.
OAuth and SMTP credentials remain server-only. Recovery preserves their original
files; automatic startup injects current values in memory. Never place client secrets,
service-role keys or SMTP passwords in VITE variables or client bundles.

For a separate scratch checkout, use `--target <checkout-root>`. That target
must itself be a Git checkout root with appropriate ignore rules. Do not test by
deleting or renaming the working originals.

Repositories without inventoried local files report zero restored files. This
does not prove that hosted provider credentials or local databases are recoverable.
Review the `unresolved` entries in the mapping and the external recovery report.

## Backup boundaries

Database and Storage backups are separate from these env files. Entrekiwis backup
keys are stored in its Infisical staging environment under
`/recovery/backups/beta` and `/recovery/backups/ci`. Restoring DPAPI files alone
does not establish recovery after reinstalling Windows. Encrypted backup data
must also be preserved outside the PC and tested with the portable vault key.
No deployment, hosted configuration update, key rotation or email delivery is
part of this recovery command.

## Change delivery

Follow this repository's existing branch, commit, PR and verification rules.
Recovery setup does not authorize direct pushes to protected branches, merging
unrelated local experiments, discarding local work or changing deployment flows.
Re-run a round-trip recovery check after deliberately updating secrets; this
setup is a point-in-time recovery snapshot, not automatic ongoing synchronization.

## Automatic startup

Normal local startup commands now use `scripts/secrets/run.mjs` and the explicit
profiles in `infisical-runtime.json`. The launcher reads current native variables
from Julian Rosalen, US Cloud, before spawning the application. It pins the
organization and project even when another login profile is selected. Sign in once:

```powershell
infisical login --save-as windows-recovery --domain https://app.infisical.com
```

The named profile `windows-recovery` is the default; `INFISICAL_PROFILE` may select
another authorized login. `INFISICAL_CLI` may point to the official executable.
Use `npm run secrets:check` (or the repository's pnpm equivalent) to check access
without starting services; `npm run test:secrets` runs isolated synthetic checks.
No credentials are placed in package commands, written to env files or printed.
Network/login failures and missing required variables stop startup before the
application is launched; there is no automatic fallback to stale local values.
The launcher does not load `/recovery` snapshots or backup keys.

`pnpm dev`, website dev and website preview read dev `/`. This project currently has no inventoried secret variables. Library build/test/publish commands remain independent of vault login. Root package configuration changes follow a feature PR to `development` under CONTRIBUTING.md.

Restart a running process after changing variables in Infisical. Runtime loading
is read-only: changes do not rewrite the point-in-time recovery snapshots.
Existing env files are retained; injected values take precedence for matching
names. Build/CI/deployment commands and hosted credentials are not migrated by
this local-startup integration. Preview serves an existing compiled bundle;
frontend build-time variable changes require rebuilding that bundle.

The isolated runtime checks also run in the repository's normal `test` validation command. These tests use synthetic values and do not require Infisical login.

During an Infisical-launched Vite process, dotenv file loading is disabled. Local
files remain untouched and cannot silently reintroduce a variable removed from the
vault. Direct CI/build invocation retains its existing environment-loading rules.
