# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
