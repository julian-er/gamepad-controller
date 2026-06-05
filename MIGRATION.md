# Migration Guide

This guide covers two upgrade paths:

- **[Upgrading to `1.0`](#upgrading-to-10-from-0x)** — folder/file relocations and the new
  grouped options (both backward-compatible for normal consumers).
- **[`1.0.0` → `0.1.0` history](#history-100--01x)** — the earlier API lockdown (event
  setters → `on()`, removed internal exports). Still applies to `1.0`.

---

## Upgrading to `1.0` (from `0.x`)

**Good news for most apps:** if you import from the package root (`from 'gamepad-controller'`)
and use the documented `GamepadService` / factory API, **no code changes are required**. The
public entry point (`index.ts`) re-exports exactly the same symbols.

### 1. Internal modules moved (only affects deep imports)

A few internal files were relocated. The public barrel is unchanged, so this only matters if
you reached *past* it into internal paths (not recommended, but documented here):

| Before | After |
|---|---|
| `gamepad-controller/dist/.../Interfaces/*` | `.../interfaces/*` (lowercased) |
| `src/gamepadContextManager` | `src/contexts/GamepadContextManager` |
| `src/controllerMappings` | `src/mappings/controllerMappings` |

Fix: import these from the package root instead — `import { GamepadContextManager,
CONTROLLER_MAPPINGS } from 'gamepad-controller'`.

### 2. New: grouped options (flat options still work)

Options can now be passed in a nested, discoverable shape **or** the existing flat shape. Flat
options remain fully supported — nothing to change unless you want the grouped form. Where a
value appears in both, the **nested group wins**.

```js
// Flat (still valid)
gamepadService('.app', { navigationMode: 'spatial', deadzone: 0.15, backButtonCooldown: 300 });

// Grouped (equivalent)
gamepadService('.app', {
    navigation: { navigationMode: 'spatial', deadzone: 0.15 },
    input: { backButtonCooldown: 300 },
});
```

Flat → group mapping:

| Group | Flat keys it carries |
|---|---|
| `navigation` | `navigationMode`, `wrapNavigation`, `deadzone`, `debounceTime`, `autoDetectElements`, `enableNavigation`, `containerSelector`, `onlyViewport`, `useGamepadIndex` |
| `input` | `enableBackButton`, `backButtonCooldown`, `enableShoulderNavigation`, `shoulderCooldown` |
| `styling` | `focusedClass`, `selectedClass`, `useDataAttributes`, `autoAddStyles`, `scrollBehavior` |
| `status` | `statusElementId`, `autoCreateStatusElement`, `navigationMenuSelector`, `logLevel` |
| `scrolling` | `enableRightStickScroll`, `scrollSpeed`, `scrollDebounceTime` |
| `context` | `gamepadContext`, `enableDualContext`, `menuContextSelector`, `contentContextSelector` |
| `customEvents` | `useCustomEvents`, `customConnectedEvent`, `customDisconnectedEvent`, `customStateChangedEvent` |

The collapse is done by the exported `normalizeOptions(config)` helper if you need it directly.

### 3. New: `scrollBehavior` option

Focus now scrolls via a configurable behavior. Default is `'smooth'` (unchanged); set
`'auto'` to avoid scroll-animation churn during rapid navigation on dense UIs:

```js
gamepadService('.app', { scrollBehavior: 'auto' });
```

### 4. New: `gamepaderror` event (Permissions-Policy hardening)

If `navigator.getGamepads()` is blocked (`Permissions-Policy: gamepad` or a cross-origin
iframe without `allow="gamepad"`), the library no longer risks crashing the input loop — it
catches the `SecurityError`, keeps polling, and emits a `gamepaderror` event once:

```js
service.on('gamepaderror', (err) => showFallbackUI(err));
```

---

## History: `1.0.0` → `0.1.x`

> The previous `1.0.0` was never a locked public release. The `0.1.x` line re-cut the package
> with a small, deliberate public API. The changes below are a **clean break** — there are no
> deprecated aliases. They still apply in `1.0`.

## TL;DR

| Area | Before (`1.0.0`) | After (`0.1.0`) |
|---|---|---|
| Event handlers | `service.onFocus = fn` (single slot) | `service.on('focus', fn)` (multi-subscriber, returns unsubscribe) |
| Internal functions | `gameLoop`, `navigateGrid`, `setupEventListeners`, … importable from the package | Removed from the public surface |
| `cssUtils` stubs | `onFocus`, `onSelect`, `getCurrentElement`, `onControllerConnect` (no-ops) | Removed |
| Logging | always-on `console.*` | leveled `logLevel` option, default `'error'` |
| Custom-event mode | shoulder nav broken; listeners leaked | fixed and cleaned up on `destroy()` |

## 1. Event handlers: setters → `on()` / `off()`

Single-slot setters silently clobbered each other and are gone. Use `on()`, which supports
multiple subscribers and returns an unsubscribe function.

```diff
- service.onFocus = (el, index) => { /* ... */ };
- service.onSelect = (el, index) => { /* ... */ };
- service.onControllerConnect = (gp) => { /* ... */ };
- service.onBackButton = () => { /* ... */ };
- service.onContextSwitch = (next, prev) => { /* ... */ };
+ service.on('focus', (el, index) => { /* ... */ });
+ service.on('select', (el, index) => { /* ... */ });
+ service.on('controllerconnect', (gp) => { /* ... */ });
+ service.on('backbutton', () => { /* ... */ });
+ service.on('contextswitch', (next, prev) => { /* ... */ });
```

Event name map (all lowercase):

| Old setter | New event |
|---|---|
| `onFocus` | `'focus'` |
| `onSelect` | `'select'` |
| `onControllerConnect` | `'controllerconnect'` |
| `onControllerDisconnect` | `'controllerdisconnect'` |
| `onBackButton` | `'backbutton'` |
| `onNavigationMenuOpen` | `'navigationmenuopen'` |
| `onButtonDown` | `'buttondown'` |
| `onButtonUp` | `'buttonup'` |
| `onContextSwitch` | `'contextswitch'` |

**Back button default unchanged:** if you do **not** subscribe to `'backbutton'`, the library
still calls `window.history.back()`. Subscribe to override that behavior.

Unsubscribe when you no longer need a handler:

```js
const off = service.on('focus', handler);
off(); // or service.off('focus', handler);
```

## 2. Removed internal exports

`export *` previously leaked ~40 internal functions. These are **no longer exported** from the
package: `gameLoop`, `createCustomEventGameLoop`, `setupEventListeners`,
`setupCustomEventListeners`, `removeEventListeners`, `startGameLoop`, `stopGameLoop`,
`navigateGrid`, `navigateSpatial`, `handleSelection`, `handleBackButton`,
`handleShoulderNavigation`, `handleScrolling`, `getFocusableElements`,
`calculateGridDimensions`, `isElementInViewport`, `findNearestInDirection`,
`getElementDistance`, `debounce`, `throttle`, etc.

If you depended on one of these, switch to the supported API (the `GamepadService` class,
the factory functions, or `gamepadUtils`). The full public surface is documented in the README.

## 3. Removed no-op stubs

`getCurrentElement`, `onFocus`, `onSelect`, and `onControllerConnect` exported from
`cssUtils` were no-op compatibility stubs and have been deleted. Use `service.on(...)` and
`service.getCurrentElement()` / `gamepadUtils.getCurrentElement()` instead.

## 4. New: leveled logging

The library no longer floods the console. Control verbosity with `logLevel`:

```js
gamepadService('.app', { logLevel: 'debug' }); // 'silent' | 'error' | 'warn' | 'info' | 'debug'
```

Default is `'error'`. You can also import and drive the logger directly:

```js
import { logger } from 'gamepad-controller';
logger.setLevel('info');
```

## 5. New: configurable cooldowns

Back/shoulder cooldowns are now options (previously hard-coded at 300 ms):

```js
gamepadService('.app', { backButtonCooldown: 250, shoulderCooldown: 400 });
```

## 6. Newly exported, genuinely-useful helpers

These were previously hidden and are now exported: `CONTROLLER_MAPPINGS`, `getButtonName`,
`getAxisName`, `getPrimaryActionButtonIndex`, `getBackButtonIndex`, `getShoulderIndices`,
`getDpadIndices`, and the `GamepadContextManager` / `GamepadNavigationContext` classes
(returned by `getContext()` / `getActiveContext()`).

## 7. Stricter device validation (behavior change)

`isValidGamepad` is now stricter, so non-controller HID devices that the browser surfaces as
gamepads (webcams, headset dongles, etc.) are no longer treated as controllers. A device is
accepted only when:

1. `gamepad.mapping === 'standard'`, **or**
2. it reports **≥ 4 buttons and ≥ 2 axes**.

Previously any device with at least 1 button and 1 axis passed. In practice this only changes
behavior for odd HID devices (a 0-axis "gamepad" is now correctly ignored); real controllers
are unaffected. See the README's **Device filtering** section. If a legitimate controller is
wrongly filtered, open an issue with its `id` and button/axis counts.

## 8. Bug fixes you get for free

- **Shoulder navigation in custom-event mode** now works (arguments were swapped before).
- **No listener leak**: custom-event listeners are removed on `destroy()` / re-init.

## 8. Packaging / types

`package.json` now declares a `types` condition in `exports`, `"sideEffects": false`, and a
correct `files` list. If you import types, no change is needed — `import type { ... } from
'gamepad-controller'` resolves through the barrel.
