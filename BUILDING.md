# Building & Packaging `gamepad-controller`

This guide covers building the library from source, packing it, and testing it locally
inside another project.

## Prerequisites

- **Node.js ≥ 18** and npm.
- The library targets **ES2017** and ships an **ESM-only** bundle plus type declarations.

## Install

```bash
npm install
```

## Scripts

| Script | What it does |
|---|---|
| `npm run build` | Cleans `dist/` and builds the ESM bundle and `.d.ts` types via Vite. |
| `npm run build:types` | Emits only the `.d.ts` declaration files (`tsc --emitDeclarationOnly`). |
| `npm run typecheck` | Type-checks the project without emitting (`tsc --noEmit`). |
| `npm test` | Runs the Vitest suite once. |
| `npm run test:coverage` | Runs the suite with V8 coverage and enforces the coverage thresholds. |
| `npm run test:watch` | Runs Vitest in watch mode. |
| `npm run lint` | Lints `src/` with ESLint. |
| `npm run format` | Formats `src/` with Prettier. |
| `npm run clean` | Removes `dist/`. |

## Build output

`npm run build` produces:

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

To produce a publishable tarball:

```bash
npm pack
```

This honors the `files` allow-list in `package.json` (the `dist/` folder and the documentation
markdown files). Tarballs are git-ignored — never commit a `.tgz`.

`npm publish` runs `prepublishOnly` first, which lints, tests, and builds, so a broken build
cannot be published.

## Testing the package inside another project

Two options:

**1. Pack + install the tarball (closest to a real install):**

```bash
npm run build
npm pack                      # -> gamepad-controller-1.0.0-rc.1.tgz
cd ../my-app
npm install ../gamepad-controller/gamepad-controller-1.0.0-rc.1.tgz
```

**2. `npm link` (live local development):**

```bash
# in the library
npm run build && npm link
# in the consuming app
npm link gamepad-controller
```

There is also a bundled `examples/` workspace:

```bash
npm run example-test   # build + pack, then install & run the examples dev server
```

## Runtime requirements & caveats (document these for consumers)

- **Secure context:** `navigator.getGamepads()` only works in a secure context
  (HTTPS or `localhost`). Over plain HTTP the native mode is inert — use `localhost` for
  local testing.
- **Background tabs:** the input loop runs on `requestAnimationFrame`, which browsers pause
  for backgrounded/hidden tabs. Gamepad input is therefore not read while the tab is not
  visible.
- **Feature detection:** when the Gamepad API is absent (and custom-event mode is not used),
  the service logs a warning and stays inert rather than throwing. It also no-ops in
  non-browser environments (SSR) — call `init()` only on the client.
- **Permissions-Policy:** if `navigator.getGamepads()` is blocked (`Permissions-Policy: gamepad`
  or a cross-origin iframe without `allow="gamepad"`), it throws `SecurityError`. The library
  catches it, keeps the loop alive, and emits the error once via the `gamepaderror` event.
- **`color-mix` styling:** the optional injected styles (`gamepadUtils.addStyles()`) use
  `color-mix(in srgb, …)`, which needs Chromium 111+, Firefox 113+, or Safari 16.2+. The
  library itself does not require this; it only affects the opt-in default stylesheet.
