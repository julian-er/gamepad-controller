# Migration Guide: `1.0.0` → `0.1.0`

> The previous `1.0.0` was never a locked public release. This version re-cuts the package as
> `0.1.0` with a small, deliberate public API. The changes below are a **clean break** — there
> are no deprecated aliases. Most apps that used the documented factory functions need only the
> event-handler change.

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
