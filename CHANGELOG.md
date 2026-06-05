# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
