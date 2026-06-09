# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Internal architecture refactor. The public `GamepadService` API (methods, events, options) is
unchanged; the orchestrator was decomposed into focused collaborators and browser side-effects
were moved behind an injectable seam.

### Added

- **`PlatformAdapter` seam** — an injectable abstraction over the browser globals the library
  touches at runtime (timing, the Gamepad API, window events, navigation fallbacks, and
  DOM-mutation observation). Supply your own via the new `platform` config option to run in a
  non-standard host or to drive the input loop deterministically in tests; defaults to a
  browser-backed adapter, so existing usage is unaffected:
  ```ts
  new GamepadService({ platform: myAdapter });
  ```
  `PlatformAdapter`, `BrowserPlatformAdapter`, `defaultPlatformAdapter`, and `WindowEventListener`
  are exported from the package.
- **Per-controller button-index table** — `CONTROLLER_MAPPINGS[type].indices` is now the single
  source of truth for the primary/back/shoulder/D-pad button indices (previously hardcoded in the
  mapping helper functions). New exported types: `ButtonIndices`, `ShoulderIndices`, `DpadIndices`.

### Changed

- **Internal decomposition (no public API change)** — `GamepadService` is now a thin facade over
  `InputPipeline` (polling loop + connected pads), `FocusRenderer` (single-context element
  discovery and focus presentation), `StatusReporter`, and `NavigationPolicy` (the emit-or-fall-back
  navigation/back policy). The multi-subscriber event registry is now a single shared
  `TypedEmitter` used by both the service and each `GamepadNavigationContext`.
- **`getShoulderIndices` / `getDpadIndices` now read from `CONTROLLER_MAPPINGS`** and use their
  `controllerType` argument (previously ignored). Return values are unchanged for all built-in
  controller types; the functions now return a fresh object each call.

### Breaking

- **ESM-only distribution** — the package no longer ships a CommonJS bundle. The dual `es`/`cjs`
  Vite build is now `es`-only, the single runtime artifact is `dist/index.js`, and the
  `exports.require` / `module` fields were removed (`exports` now resolves `types` → `import`).
  `require('gamepad-controller')` no longer resolves — consume the package with `import` (or a
  dynamic `import()` from CommonJS). The public API and types are otherwise unchanged. Type
  resolution was hardened in the process: the two remaining extensionless relative imports in
  `src/interfaces/` now carry explicit `.js` specifiers so `node16`/`nodenext` TypeScript
  resolution of the emitted `.d.ts` files succeeds.
- **`GamepadNavigationContext.select()` no longer falls back to `window.location.href`** when used
  standalone without an `onNavigationRequest` handler — it now delegates navigation solely through
  the provided handler. The `GamepadService` flow is unaffected (it always supplies a handler,
  routed through `NavigationPolicy`, which still falls back to `window.location` when no
  `navigationrequest` subscriber is registered). Direct `GamepadNavigationContext` consumers that
  relied on the implicit fallback must pass an `onNavigationRequest` callback.

### Docs

- **New [API.md](API.md)** — a complete reference for the public surface: every exported function,
  `GamepadService` method, event, flat/grouped option, the platform seam, and the type catalogue.
- **New [ARCHITECTURE.md](ARCHITECTURE.md)** — documents the facade/collaborator decomposition
  (`InputPipeline`, `FocusRenderer`, `StatusReporter`, `NavigationPolicy`, `TypedEmitter`) and the
  injectable `PlatformAdapter` seam.
- **New [MIGRATION_1.0_TO_NEXT.md](MIGRATION_1.0_TO_NEXT.md)** — part two of the migration trail,
  covering `1.0` → this release (the additive `platform` option / index table and the one breaking
  `GamepadNavigationContext.select()` change). [MIGRATION.md](MIGRATION.md) now links to it as the
  continuation.
- **GAMEPAD_SERVICE_METHODS.md** — added a *Singleton factory vs. direct instantiation* section
  clarifying the shared-instance factory behavior versus `new GamepadService(...)`, and noting the
  removal of `initGamepadNavigation` from the public API.
- **README** — added an API.md/ARCHITECTURE.md guide index, the platform-seam option, the new
  `ButtonIndices`/`ShoulderIndices`/`DpadIndices` types, a singleton callout, and corrected the
  stale custom-controller `ControllerMappings` snippet to the real per-type shape.

## [1.0.0] - 2026-06-07

### Added

- **`navigationrequest` event** — emitted when a link or shoulder-nav triggers navigation.
  SPA frameworks (React Router, Angular Router, etc.) can subscribe instead of letting the
  library mutate `window.location.href` directly:
  ```js
  service.on('navigationrequest', (href, element) => router.push(href));
  ```
  Falls back to a direct `window.location.href` assignment only when no subscriber is
  registered, so zero-config HTML pages continue to work unchanged.
- **`Direction` and `ShoulderButton` union types** exported from the package.
  TypeScript consumers can now import these for their own navigation handlers:
  ```ts
  import type { Direction, ShoulderButton } from 'gamepad-controller';
  ```

### Changed

- **Game loop pauses when no controller is connected** and resumes automatically on the
  first connect — eliminates idle 60 fps CPU burn when the page has no active gamepad.
- **All controllers registered at startup** — `detectExistingGamepads` now registers every
  already-connected pad, not just the first one found. Pages loaded with multiple controllers
  plugged in now behave identically to connecting them after load.
- **`MutationObserver` no longer fires on `style`/`class` mutations** — removes spurious
  focusable-element cache invalidations caused by CSS animations and style transitions.
- **Custom-event game loop now prunes stale pads** — mirrors the native loop's behavior;
  disconnected pad entries no longer persist in the internal gamepad map.
- **`CONTROLLER_MAPPINGS` is now frozen** — `Object.freeze()` applied at declaration.
  The `ControllerMappings` interface uses `readonly` arrays. Runtime and compile-time
  mutations are both rejected.
- **`GamepadService.options` is `readonly Readonly<…>`** — the options object can no longer
  be mutated from outside the service.
- **Navigation parameters are now union-typed** — all `direction: string` parameters across
  the navigation pipeline use `Direction`; shoulder-button parameters use `ShoulderButton`.
  TypeScript catches invalid values at compile time instead of silently no-opping at runtime.

### Removed

- **`normalizeOptions` removed from public API** — it was an internal config-pipeline helper
  that leaked through the exports. Use the documented flat or grouped options shapes directly.
- **`LOG_PREFIX` removed from public API** — internal constant, not useful to consumers.
  `logger` and `Logger` are still exported for log-level control.
- **Dead `singleContextMode` field removed** from `GamepadService` — the value is
  always derivable as `!options.enableDualContext` if needed.

### Fixed

- Multi-controller setups: all pads connected before page load are now fully tracked.
- Custom-event mode: stale pad entries are now pruned on the same schedule as native mode.

---

## [1.0.0-rc.1] - 2026-06-05

First release candidate for a stable `1.0`. Focus: runtime resilience, internal
decomposition, broader test coverage, and documentation correctness. Normal consumers that
import from the package root and use the documented API need no code changes — see
[MIGRATION.md](MIGRATION.md).

### Added

- **`gamepaderror` event** — emitted (once) when the Gamepad API is blocked by
  `Permissions-Policy: gamepad` or a cross-origin iframe; the input loop keeps running.
- **Grouped options** — `GamepadServiceConfig` accepts nested groups (`navigation`, `input`,
  `styling`, `status`, `scrolling`, `context`, `customEvents`) alongside the existing flat
  options (flat still fully supported; nested wins on conflict). New exported
  `normalizeOptions()` helper.
- **`scrollBehavior` option** (`'smooth' | 'auto'`, default `'smooth'`) to control
  `scrollIntoView` behavior on focus and avoid animation churn on dense UIs.
- **Test coverage gate** — V8 coverage via `npm run test:coverage`, enforced in CI. Test count
  grew from 41 to 87 across new suites for `domUtils`, `gamepadNavigation`, `factory`,
  `contextManager`, options normalization, and the Permissions-Policy guard.

### Changed

- **Runtime resilience** — `navigator.getGamepads()` is now wrapped so a `SecurityError`
  no longer tears down the `requestAnimationFrame` loop.
- **Internal refactor** — `processGamepad` decomposed into focused helpers
  (`processButtonEdges`, `processPrimaryAction`, `processBackAction`, `processShoulderAction`,
  `processDirectionalMove`, `processRightStickScroll`); focus/scroll DOM logic extracted to a
  `focusView` module.
- **Performance** — focusable-element scan is memoized (invalidated on resize, refresh,
  manual element changes, and DOM mutations via `MutationObserver`); the focusable-selector
  list is built once.
- **Project structure** — `Interfaces/` → `interfaces/`; `gamepadContextManager.ts` →
  `contexts/GamepadContextManager.ts`; `controllerMappings.ts` → `mappings/controllerMappings.ts`.
  The public entry (`index.ts`) re-exports the same symbols, so only deep imports are affected.
- **Types** — `debounce`/`throttle` generics tightened (`unknown`/`Parameters<T>` instead of
  `any`).

### Fixed

- The polling loop surviving policy-restricted environments (previously could throw on every
  frame).

### Docs

- Removed legacy `service.onX = fn` setter examples from README,
  GAMEPAD_ACTION_DETECTION.md, and GAMEPAD_SERVICE_METHODS.md in favor of `service.on(event, fn)`.
- Documented Permissions-Policy behavior, the `gamepaderror` event, grouped options, and
  `scrollBehavior`. Extended MIGRATION.md with the `0.x → 1.0` upgrade path.

## [0.1.0]

- Re-cut of the package with a small, curated public API: multi-subscriber `on()`/`off()`
  event model, removal of leaked internal exports, leveled logging, configurable cooldowns,
  stricter device validation, and custom-event-mode fixes. See
  [MIGRATION.md](MIGRATION.md#history-100--01x) for details.
