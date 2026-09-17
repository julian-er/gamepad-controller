# Building & Packaging `gamepad-controller`

This guide covers building the library from source, packing it, and testing it locally
inside another project. Version 1.0.0 is the planned first package publication; use a local tarball until it is available from the registry.

## Prerequisites

- **Node.js ≥ 20.19** and pnpm (pinned via packageManager; `corepack enable`). This is the tested development baseline for the current Vite and
  Vitest toolchain; use a currently supported Node.js release for ongoing development.
- The development toolchain uses **Vite 6.4.3** and **Vitest 4.1.11**, as configured in package.json.
- The package ships an **ESM-only** browser bundle and TypeScript declarations. The JavaScript build target follows the installed Vite defaults; the configuration does not declare an ES2017 browser support guarantee.

## Install

```bash
pnpm install
```

## Scripts

| Script | What it does |
|---|---|
| `pnpm run build` | Cleans `dist/` and builds the ESM bundle and `.d.ts` types via Vite. |
| `pnpm run build:types` | Emits only the `.d.ts` declaration files (`tsc --emitDeclarationOnly`). |
| `pnpm run typecheck` | Type-checks the project without emitting (`tsc --noEmit`). |
| `pnpm run test` | Runs the Vitest suite once. |
| `pnpm run test:coverage` | Runs the suite with V8 coverage and enforces the coverage thresholds. |
| `pnpm run test:watch` | Runs Vitest in watch mode. |
| `pnpm run lint` | Lints `src/` with ESLint. |
| `pnpm run format` | Formats `src/` with Prettier. |
| `pnpm run format:check` | Checks formatting without modifying files. |
| `pnpm run clean` | Removes `dist/`. |

## Build output

`pnpm run build` produces:

```
dist/
  index.js           # ES module build  (package "main" / "import")
  types/
    index.d.ts       # Public type declarations ("types")
    ...              # Internal declaration files (not re-exported by the barrel)
```

The package is **ESM-only**. Its `exports` map resolves `types` → `import` in that order, so modern
bundlers and `node16`/`nodenext` TypeScript resolution pick up the correct entry and types.
`require('gamepad-controller')` is intentionally unsupported — consume it with `import` (or a
dynamic `import()` from CommonJS).

`"sideEffects": false` is declared, so bundlers can tree-shake any unused exports out of
consumer bundles.

## Packing

Build before packing: `pnpm pack` does not run the prepublishOnly build checks.

```bash
pnpm run build
pnpm pack --dry-run
pnpm pack
```

This honors the `files` allow-list in `package.json`: `dist/`, the root README, all `docs/`
guides, and the portable `skills/` folders are included. LICENSE is not part of that
allow-list — npm always includes a root `LICENSE` file in the published tarball regardless of
`files`. Tarballs are git-ignored — never commit a `.tgz`.

Publishing is done by the release workflow; see [RELEASING.md](https://github.com/julian-er/gamepad-controller/blob/main/RELEASING.md). When publishing locally, `prepublishOnly` runs the full check: linting, type-checking, tests, and a build. Keep lifecycle scripts enabled for this check.

## Testing the package inside another project

Two options:

**1. Pack + install the tarball (closest to a real install):**

```bash
pnpm run build
pnpm pack                     # -> gamepad-controller-1.0.0.tgz
cd ../my-app
npm install ../gamepad-controller/gamepad-controller-1.0.0.tgz
```

Note: The consuming app can use any package manager (npm, yarn, pnpm); the example above shows npm for cross-manager compatibility.

**2. `link` (live local development):**

```bash
# in the library
pnpm run build
# in the consuming app (pnpm)
pnpm link ../gamepad-controller
# in the consuming app (npm)
npm link ../gamepad-controller
```

## Runtime requirements & caveats (document these for consumers)

- **Secure context:** `navigator.getGamepads()` only works in a secure context
  (HTTPS or `localhost`). Over plain HTTP the native mode is inert — use `localhost` for
  local testing.
- **Background tabs:** the input loop runs on `requestAnimationFrame`, which browsers pause
  for backgrounded/hidden tabs. Gamepad input is therefore not read while the tab is not
  visible.
- **Feature detection:** when the Gamepad API is absent (and custom-event mode is not used),
  native controller input is unavailable; the service can still manage DOM focus. With warning logging enabled it reports the missing API. init() also no-ops in
  non-browser environments (SSR) — call `init()` only on the client.
- **Permissions-Policy:** if `navigator.getGamepads()` is blocked (`Permissions-Policy: gamepad`
  or a cross-origin iframe without `allow="gamepad"`), it throws `SecurityError`. The library
  catches it, keeps the loop alive, and emits the error once via the `gamepaderror` event.
- **`color-mix` styling:** the optional injected styles (`gamepadUtils.addStyles()`) use
  `color-mix(in srgb, …)`. Use a browser with support for that CSS feature, or supply your own focus stylesheet. The library’s navigation logic does not depend on it.
