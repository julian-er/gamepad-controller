# API Reference

The complete public API surface of `gamepad-controller`. **Only the symbols re-exported from the
package root (`from 'gamepad-controller'`) are supported** — internal modules
(`core/gamepadEventHandler`, `core/gamepadNavigation`, `utils/domUtils`, the collaborator classes,
etc.) are intentionally not exported and may change without notice.

For conceptual guides see the [README](README.md); for the internal structure see
[ARCHITECTURE.md](ARCHITECTURE.md); for upgrades see [MIGRATION.md](MIGRATION.md) and
[MIGRATION_1.0_TO_NEXT.md](MIGRATION_1.0_TO_NEXT.md).

## Contents

- [Exports at a glance](#exports-at-a-glance)
- [Factory functions](#factory-functions)
- [`gamepadUtils` façade](#gamepadutils-façade)
- [`GamepadService`](#gamepadservice)
  - [Constructor](#constructor)
  - [Events](#events)
  - [Methods](#methods)
- [Configuration options](#configuration-options)
  - [Flat options](#flat-options)
  - [Grouped options](#grouped-options)
- [Dual-context classes](#dual-context-classes)
  - [`GamepadContextManager`](#gamepadcontextmanager)
  - [`GamepadNavigationContext`](#gamepadnavigationcontext)
- [Controller mapping helpers](#controller-mapping-helpers)
- [Platform seam](#platform-seam)
- [Styling utilities](#styling-utilities)
- [Logger](#logger)
- [Exported types](#exported-types)

---

## Exports at a glance

```ts
import {
    // Core class
    GamepadService,

    // Factory helpers + façade
    gamepadService,
    initGamepadForPage,
    initDualContextGamepad,
    initCustomEventGamepad,
    cleanupGamepadService,
    gamepadUtils,

    // Dual-context classes
    GamepadContextManager,
    GamepadNavigationContext,

    // Controller mapping helpers
    CONTROLLER_MAPPINGS,
    getButtonName,
    getAxisName,
    getPrimaryActionButtonIndex,
    getBackButtonIndex,
    getShoulderIndices,
    getDpadIndices,

    // Platform seam
    BrowserPlatformAdapter,
    defaultPlatformAdapter,

    // Styling utilities
    addNavigationStyles,
    removeNavigationStyles,
    getNavigationCSS,
    getExampleCSS,
    printCSSExamples,

    // Logger
    logger,
    Logger,
} from 'gamepad-controller';

import type {
    // Service config + event map
    GamepadServiceOptions,
    GamepadServiceConfig,
    GamepadServiceEventMap,

    // Grouped option shapes
    NavigationOptionsGroup,
    InputOptionsGroup,
    StylingOptionsGroup,
    StatusOptionsGroup,
    ScrollingOptionsGroup,
    ContextOptionsGroup,
    CustomEventsOptionsGroup,

    // Context + navigation types
    GamepadNavigationContextOptions,
    GamepadContextManagerCallback,
    NavigationState,
    GridDimensions,
    Direction,
    ShoulderButton,

    // Controller mapping types
    ControllerType,
    ControllerMapping,
    ControllerMappings,
    ControllerValidation,
    ButtonIndices,
    ShoulderIndices,
    DpadIndices,

    // Platform seam types
    PlatformAdapter,
    WindowEventListener,

    // Misc
    GamepadEvent,
    NavigationStyleOptions,
    LogLevel,
} from 'gamepad-controller';
```

---

## Factory functions

These convenience helpers manage a **single shared** `GamepadService` instance for the common
"one navigation controller per page" case. Calling any of them destroys the previous shared
instance first. For multiple independent controllers, construct
[`new GamepadService(...)`](#gamepadservice) directly — the class is **not** a singleton. See
[GAMEPAD_SERVICE_METHODS.md](GAMEPAD_SERVICE_METHODS.md#singleton-factory-vs-direct-instantiation).

### `gamepadService(containerSelector?, options?)`

The primary factory. Creates, initializes, and returns the shared `GamepadService`.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `containerSelector` | `string \| null \| undefined` | `null` | CSS selector limiting the navigation scope; `null` scans the whole page. |
| `options` | [`GamepadServiceConfig`](#configuration-options) | `{}` | Flat and/or grouped options merged over sensible defaults. |

**Returns:** `GamepadService` (already `init()`-ed).

```ts
const gamepad = gamepadService('.app', { navigationMode: 'spatial', enableDualContext: true });
```

### `initGamepadForPage(options?)`

One-line setup with page-wide defaults (`gamepadService(null, options)` under the hood). Logs
control hints. **Returns:** `GamepadService`.

### `initDualContextGamepad(options?)`

Dual-context setup (`enableDualContext: true`, `useDataAttributes: false` by default): a horizontal
**menu** context (R1/L1) and a spatial **content** context (stick). **Returns:** `GamepadService`.

### `initCustomEventGamepad(options?)`

Custom-event mode for WinUI/host integrations where the native Gamepad API is absent — listens to
custom DOM events instead of `navigator.getGamepads()`. Defaults the three custom event names to
`hubgamepadconnected` / `hubgamepaddisconnected` / `hubgamepadstatechanged`. **Returns:**
`GamepadService`.

### `cleanupGamepadService()`

Destroys the shared factory instance and frees its resources. Safe to call when none exists.
**Returns:** `void`.

---

## `gamepadUtils` façade

A bag of helpers operating on the shared factory instance. **Every method is safe to call when no
instance is active** (returns a null/empty/`false` sentinel).

| Method | Returns | Description |
|---|---|---|
| `getInstance()` | `GamepadService \| null` | The shared instance, or `null`. |
| `isConnected()` | `boolean` | Whether a controller is connected. |
| `getCurrentElement()` | `Element \| null` | The focused element. |
| `getCurrentIndex()` | `number` | Focused element index, or `-1`. |
| `getElements()` | `Element[]` | All navigable elements. |
| `navigateToElement(el)` | `boolean` | Focus a specific element by reference. |
| `navigateToIndex(i)` | `boolean` | Focus a specific element by index. |
| `refresh()` | `void` | Re-detect elements after DOM changes. |
| `addStyles(opts?)` | `void` | Inject the optional default navigation styles. |
| `removeStyles()` | `void` | Remove the injected styles. |
| `printCSSExamples()` | `void` | Print example CSS to the console. |
| `cleanup()` | `void` | Destroy the shared instance. |
| `getNavigationInfo()` | `object \| null` | Snapshot: connection, controller type, focus, counts, enabled flags. |
| `isDualContextEnabled()` | `boolean` | Whether dual-context mode is on. |
| `getActiveContext()` | `GamepadNavigationContext \| null` | The active context. |
| `getContext(id)` | `GamepadNavigationContext \| null` | A context by id. |
| `switchToContext(id)` | `boolean` | Activate a context by id. |
| `getAllContexts()` | `GamepadNavigationContext[]` | All registered contexts. |
| `getMenuContext()` / `getContentContext()` | `GamepadNavigationContext \| null` | The `'menu'` / `'content'` context. |
| `switchToMenu()` / `switchToContent()` | `boolean` | Activate the `'menu'` / `'content'` context. |

---

## `GamepadService`

The core class. The factory helpers wrap it; you can also use it directly for full control and for
running multiple independent instances.

```ts
import { GamepadService } from 'gamepad-controller';

const service = new GamepadService({ navigationMode: 'spatial' });
const off = service.on('focus', (el, i) => console.log('focused', i, el));
service.init();
// …later
off();
service.destroy();
```

### Constructor

```ts
new GamepadService(config?: GamepadServiceConfig)
```

Accepts the flat and/or grouped [options](#configuration-options) plus the optional
[`platform`](#platform-seam) seam. Does **not** start the input loop — call `init()`.

`service.options` is exposed as `readonly Readonly<GamepadServiceOptions>` (the resolved flat
options; cannot be mutated from outside).

### Events

Subscribe with `on(event, listener)` — multiple subscribers per event are supported and each
`on()` returns an unsubscribe function. Remove with `off(event, listener)`.

```ts
on<K extends keyof GamepadServiceEventMap>(event: K, listener: GamepadServiceEventMap[K]): () => void
off<K extends keyof GamepadServiceEventMap>(event: K, listener: GamepadServiceEventMap[K]): void
```

| Event | Listener signature | Fires when |
|---|---|---|
| `focus` | `(element: Element, index: number)` | Focus moves to an element. |
| `select` | `(element: Element, index: number)` | The primary action (A/Cross) activates an element. |
| `controllerconnect` | `(gamepad: Gamepad)` | A valid controller connects. |
| `controllerdisconnect` | `(gamepad: Gamepad)` | A controller disconnects. |
| `backbutton` | `()` | Back/cancel (B/Circle) is pressed. **No subscriber → `window.history.back()`.** |
| `navigationrequest` | `(href: string, element: Element)` | A nav-link or shoulder page-transition fires. **No subscriber → `window.location.href = href`.** |
| `navigationmenuopen` | `(button: string)` | A navigation-menu open is triggered. |
| `buttondown` | `(buttonIndex: number, gamepad: Gamepad)` | Any button transitions to pressed. |
| `buttonup` | `(buttonIndex: number, gamepad: Gamepad)` | Any button transitions to released. |
| `contextswitch` | `(newContext, oldContext \| null)` | The active context changes (dual-context). |
| `gamepaderror` | `(error: Error)` | The Gamepad API is blocked (`Permissions-Policy: gamepad`). Fires once; loop keeps running. |

> **Fallback contract:** `backbutton` and `navigationrequest` fall back to the browser **only when
> no subscriber is registered**. Subscribe to fully override the default side-effect. This is
> centralized in `NavigationPolicy` — see [ARCHITECTURE.md](ARCHITECTURE.md#the-emit-or-fall-back-policy).

### Methods

#### Lifecycle

| Method | Returns | Description |
|---|---|---|
| `init()` | `void` | Attach listeners, detect elements, optionally inject styles/status, and start the input loop. No-op if already running or in a non-browser environment. |
| `destroy()` | `void` | Stop the loop, remove all listeners, clear focus/state/subscribers, destroy contexts. Idempotent. |

#### Element & focus (single context)

| Method | Returns | Description |
|---|---|---|
| `detectElements()` | `void` | Re-scan focusable elements and recompute grid dimensions. |
| `setElements(elements)` | `void` | Set the navigable set manually, bypassing auto-detection. |
| `updateFocus()` | `void` | Re-apply focus styling to the current element. |
| `clearFocus()` | `void` | Remove focus/selected styling from all elements. |
| `navigateToIndex(index)` | `boolean` | Move focus to a specific index; `false` if out of range. |
| `refresh()` | `void` | Invalidate the focusable memo and re-detect (works in both modes). |

#### Queries

| Method | Returns | Description |
|---|---|---|
| `getCurrentElement()` | `Element \| null` | The focused element (active context in dual mode). |
| `getCurrentIndex()` | `number` | The focused index, or `-1`. |
| `getElements()` | `Element[]` | All navigable elements. |
| `getControllerType()` | `string` | Type of the most-recently-active controller (e.g. `'xbox'`). |
| `getControllerTypes()` | `string[]` | De-duplicated list of connected controller types. |
| `isControllerConnected()` | `boolean` | Whether any controller is connected. |

#### Dual context

| Method | Returns | Description |
|---|---|---|
| `getContext(id)` | `GamepadNavigationContext \| undefined` | A registered context by id. |
| `getActiveContext()` | `GamepadNavigationContext \| null` | The active context. |
| `switchToContext(id)` | `boolean` | Activate a context by id. |
| `getAllContexts()` | `GamepadNavigationContext[]` | All registered contexts. |
| `setupDualContextMode()` | `void` | Registers the `menu`/`content` contexts (called by `init()` when `enableDualContext` is set). |

`service.contextManager` exposes the underlying [`GamepadContextManager`](#gamepadcontextmanager).

---

## Configuration options

`GamepadServiceConfig` is what the constructor and factories accept. It is `GamepadServiceOptions`
(flat) plus the optional nested [groups](#grouped-options) and the [`platform`](#platform-seam)
seam. `normalizeOptions` collapses groups into the flat shape internally — **where a value appears
in both a flat field and a group, the group wins**. (`normalizeOptions` is **not** exported.)

### Flat options

| Option | Type | Default | Description |
|---|---|---|---|
| `debounceTime` | `number` | `150` | Input debounce in ms. |
| `deadzone` | `number` | `0.1` | Analog-stick deadzone (0–1). |
| `backButtonCooldown` | `number` | `300` | Cooldown (ms) between back-button activations. |
| `shoulderCooldown` | `number` | `300` | Cooldown (ms) between shoulder activations. |
| `logLevel` | `LogLevel` | `'error'` | `'silent' \| 'error' \| 'warn' \| 'info' \| 'debug'`. |
| `containerSelector` | `string \| null` | `null` | Limit navigation scope to a container. |
| `statusElementId` | `string \| null` | `null` | Element id to show gamepad status in. |
| `autoCreateStatusElement` | `boolean` | `false` | Auto-create a default status element. |
| `focusedClass` | `string` | `'gamepad-focused'` | CSS class for focused elements. |
| `selectedClass` | `string` | `'gamepad-selected'` | CSS class for selected elements. |
| `navigationMode` | `'grid' \| 'spatial' \| 'horizontal'` | `'grid'`¹ | Navigation algorithm. |
| `wrapNavigation` | `boolean` | `true` | Wrap focus at edges. |
| `autoDetectElements` | `boolean` | `true` | Auto-find navigable elements. |
| `enableNavigation` | `boolean` | `true` | Enable directional navigation. |
| `enableBackButton` | `boolean` | `true` | Enable the back button. |
| `enableShoulderNavigation` | `boolean` | `true` | Enable R1/L1 navigation. |
| `enableRightStickScroll` | `boolean` | `true` | Right stick scrolls the window. |
| `scrollSpeed` | `number` | `1` | Scroll-speed multiplier. |
| `scrollDebounceTime` | `number` | `50` | Scroll debounce in ms. |
| `scrollBehavior` | `'smooth' \| 'auto'` | `'smooth'` | `scrollIntoView` behavior on focus; `'auto'` avoids animation churn on dense UIs. |
| `navigationMenuSelector` | `string` | `'.nav-menu, nav, .navigation'` | Navigation-menu selector. |
| `autoAddStyles` | `boolean` | `false` | Inject the default stylesheet. |
| `useDataAttributes` | `boolean` | `true` | Use `data-*` attributes instead of classes for focus/selection. |
| `useGamepadIndex` | `boolean` | `undefined` | Only treat elements with `gamepad-index="true"` as focusable. |
| `onlyViewport` | `boolean` | `false` | Only include elements visible in the viewport. |
| `gamepadContext` | `string` | `'default'` | Context label set on the document. |
| `enableDualContext` | `boolean` | `false` | Enable dual-context mode. |
| `menuContextSelector` | `string` | `'.nav-menu, nav, .navigation'` | Menu-area selector (dual context). |
| `contentContextSelector` | `string \| null` | `null` | Content-area selector (dual context). |
| `useCustomEvents` | `boolean` | `false` | Listen to custom DOM events instead of the native Gamepad API. |
| `customConnectedEvent` | `string` | `'hubgamepadconnected'` | Custom connect event name. |
| `customDisconnectedEvent` | `string` | `'hubgamepaddisconnected'` | Custom disconnect event name. |
| `customStateChangedEvent` | `string` | `'hubgamepadstatechanged'` | Custom state-change event name (detail: `{ gamepad: Gamepad }`). |

¹ The `GamepadService` constructor default is `'grid'`; the `gamepadService()` / `initGamepadForPage()`
factories override it to `'spatial'`.

### Grouped options

A nested, discoverable shape over the flat options. Every group is optional, and the flat fields
remain fully supported.

```ts
gamepadService('.app', {
    navigation:   { navigationMode: 'spatial', wrapNavigation: true, deadzone: 0.15, debounceTime: 150,
                    autoDetectElements: true, enableNavigation: true, containerSelector: '.app',
                    onlyViewport: false, useGamepadIndex: false },
    input:        { enableBackButton: true, backButtonCooldown: 300, enableShoulderNavigation: true,
                    shoulderCooldown: 300 },
    styling:      { focusedClass: 'app-focused', selectedClass: 'app-selected', useDataAttributes: true,
                    autoAddStyles: false, scrollBehavior: 'auto' },
    status:       { statusElementId: 'gp-status', autoCreateStatusElement: true,
                    navigationMenuSelector: '.nav', logLevel: 'error' },
    scrolling:    { enableRightStickScroll: true, scrollSpeed: 1.5, scrollDebounceTime: 50 },
    context:      { gamepadContext: 'default', enableDualContext: true, menuContextSelector: '.nav',
                    contentContextSelector: '.content' },
    customEvents: { useCustomEvents: false, customConnectedEvent: 'hubgamepadconnected',
                    customDisconnectedEvent: 'hubgamepaddisconnected',
                    customStateChangedEvent: 'hubgamepadstatechanged' },
});
```

| Group | Interface | Flat keys it carries |
|---|---|---|
| `navigation` | `NavigationOptionsGroup` | `navigationMode`, `wrapNavigation`, `deadzone`, `debounceTime`, `autoDetectElements`, `enableNavigation`, `containerSelector`, `onlyViewport`, `useGamepadIndex` |
| `input` | `InputOptionsGroup` | `enableBackButton`, `backButtonCooldown`, `enableShoulderNavigation`, `shoulderCooldown` |
| `styling` | `StylingOptionsGroup` | `focusedClass`, `selectedClass`, `useDataAttributes`, `autoAddStyles`, `scrollBehavior` |
| `status` | `StatusOptionsGroup` | `statusElementId`, `autoCreateStatusElement`, `navigationMenuSelector`, `logLevel` |
| `scrolling` | `ScrollingOptionsGroup` | `enableRightStickScroll`, `scrollSpeed`, `scrollDebounceTime` |
| `context` | `ContextOptionsGroup` | `gamepadContext`, `enableDualContext`, `menuContextSelector`, `contentContextSelector` |
| `customEvents` | `CustomEventsOptionsGroup` | `useCustomEvents`, `customConnectedEvent`, `customDisconnectedEvent`, `customStateChangedEvent` |

---

## Dual-context classes

Returned by `GamepadService.getContext()` / `getActiveContext()`. You can also use them directly
for fully custom multi-area navigation.

### `GamepadContextManager`

Manages multiple independent navigation contexts.

| Member | Signature | Description |
|---|---|---|
| `registerContext(id, options?)` | `→ GamepadNavigationContext` | Create and register a context. |
| `getContext(id)` | `→ GamepadNavigationContext \| undefined` | Look up a context. |
| `getAllContexts()` | `→ GamepadNavigationContext[]` | All contexts. |
| `setActiveContext(id)` | `→ boolean` | Activate one context, deactivate the previous, fire the switch callback. |
| `getActiveContext()` | `→ GamepadNavigationContext \| null` | The active context. |
| `setContextSwitchCallback(fn)` | `→ void` | Register a `(newCtx, oldCtx) => void` callback. |
| `handleNavigation(direction)` | `→ boolean` | Navigate within the active context. |
| `handleSelection(onNavigationRequest?)` | `→ boolean` | Select in the active context, routing nav-links through the handler. |
| `handleShoulderNavigation(button)` | `→ boolean` | Switch to / navigate the menu context via `'R1'`/`'L1'`. |
| `handleStickNavigation(direction)` | `→ boolean` | Switch to / navigate the content context. |
| `refresh()` | `→ void` | Re-detect elements in every context. |
| `destroy()` | `→ void` | Deactivate, clear listeners/elements, and drop all contexts. |

### `GamepadNavigationContext`

A single independent navigation area with its own focus state. Construct with
`new GamepadNavigationContext(id, options?)` where `options` is `GamepadNavigationContextOptions`.

**Events** (via `on(event, listener)`, returns an unsubscribe function): `focus`, `select`,
`activate`, `deactivate`.

| Method | Signature | Description |
|---|---|---|
| `detectElements()` | `→ void` | Scan focusable elements (if `autoDetectElements`). |
| `activate()` / `deactivate()` | `→ void` | Toggle active state and focus styling. |
| `updateFocus()` / `clearFocus()` | `→ void` | Apply / clear focus styling. |
| `navigate(direction)` | `→ boolean` | Move focus (horizontal or spatial per `navigationMode`). |
| `navigateToIndex(index)` | `→ boolean` | Focus a specific index. |
| `select(onNavigationRequest?)` | `→ boolean` | Toggle selection; route `nav-item` links through the handler, otherwise `click()`. |
| `getCurrentElement()` / `getCurrentIndex()` / `getElements()` | — | Focus queries. |
| `hasElements()` | `→ boolean` | Whether the context has any elements. |
| `refresh()` | `→ void` | Re-detect and re-focus. |

> **Breaking in the architecture-refactor release:** standalone `select()` no longer falls back to
> `window.location.href` — pass an `onNavigationRequest` handler. See
> [MIGRATION_1.0_TO_NEXT.md](MIGRATION_1.0_TO_NEXT.md#4-breaking-gamepadnavigationcontextselect-standalone-fallback-removed).

---

## Controller mapping helpers

```ts
import {
    CONTROLLER_MAPPINGS,
    getButtonName, getAxisName,
    getPrimaryActionButtonIndex, getBackButtonIndex,
    getShoulderIndices, getDpadIndices,
} from 'gamepad-controller';
```

| Symbol | Signature | Description |
|---|---|---|
| `CONTROLLER_MAPPINGS` | `Readonly<ControllerMappings>` | Frozen per-type mapping table. `CONTROLLER_MAPPINGS[type].indices` is the single source of truth for button indices. |
| `getButtonName(type, index)` | `→ string` | Human label for a button index on a controller type. |
| `getAxisName(type, index)` | `→ string` | Human label for an axis index. |
| `getPrimaryActionButtonIndex(type)` | `→ number` | Index of the primary action (A/Cross). |
| `getBackButtonIndex(type)` | `→ number` | Index of back/cancel (B/Circle). |
| `getShoulderIndices(type)` | `→ ShoulderIndices` | `{ l1, r1 }` for the type. Reads `CONTROLLER_MAPPINGS`; returns a fresh object each call. |
| `getDpadIndices(type)` | `→ DpadIndices` | `{ up, down, left, right }` for the type. |

`type` is a [`ControllerType`](#exported-types): `'xbox' | 'playstation' | 'nintendo' | 'unknown'`.

```ts
const { primary, back } = CONTROLLER_MAPPINGS.nintendo.indices; // accounts for swapped A/B
```

---

## Platform seam

The injectable abstraction over browser globals (timing, the Gamepad API, window events,
navigation fallbacks, DOM-mutation observation). Pass `config.platform` to override; defaults to a
browser-backed adapter, so normal usage needs nothing. See
[ARCHITECTURE.md](ARCHITECTURE.md#the-platform-seam) for the rationale.

```ts
import {
    BrowserPlatformAdapter,    // default implementation (class)
    defaultPlatformAdapter,    // shared default instance
} from 'gamepad-controller';
import type { PlatformAdapter, WindowEventListener } from 'gamepad-controller';
```

### `PlatformAdapter` interface

| Member | Signature | Description |
|---|---|---|
| `isBrowser` | `readonly boolean` | Whether `window` + `document` are present. |
| `now()` | `→ number` | High-resolution-ish current time (ms) for cooldown/debounce math. |
| `requestAnimationFrame(cb)` | `→ number` | Schedule a frame; returns a cancel handle. |
| `cancelAnimationFrame(handle)` | `→ void` | Cancel a scheduled frame. |
| `getGamepads()` | `→ (Gamepad \| null)[]` | The live gamepad set. `[]` when absent; **may throw `SecurityError`** under `Permissions-Policy`. |
| `addWindowListener(type, listener)` | `→ void` | Add a window-level listener. |
| `removeWindowListener(type, listener)` | `→ void` | Remove a window-level listener. |
| `assignLocation(href)` | `→ void` | Navigate the top-level context (navigation fallback). |
| `historyBack()` | `→ void` | Go back in history (back fallback). |
| `createMutationObserver(callback)` | `→ MutationObserver \| null` | Create an observer, or `null` if unavailable. |

```ts
new GamepadService({ platform: defaultPlatformAdapter });   // explicit default
new GamepadService({ platform: myFakeAdapter });            // deterministic tests / non-standard host
```

---

## Styling utilities

Optional helpers for the default focus/selection stylesheet (also surfaced through `gamepadUtils`).

| Function | Signature | Description |
|---|---|---|
| `addNavigationStyles(options?)` | `(NavigationStyleOptions) → void` | Inject the default navigation stylesheet. |
| `removeNavigationStyles()` | `→ void` | Remove the injected stylesheet. |
| `getNavigationCSS(options?)` | `→ string` | The CSS as a string (for SSR / manual injection). |
| `getExampleCSS()` | `→ string` | Example/starter CSS as a string. |
| `printCSSExamples()` | `→ void` | Log example CSS to the console. |

`NavigationStyleOptions` lets you tune the generated colors/classes.

---

## Logger

Leveled logging, quiet by default (`'error'`).

```ts
import { logger, Logger } from 'gamepad-controller';
import type { LogLevel } from 'gamepad-controller'; // 'silent'|'error'|'warn'|'info'|'debug'

logger.setLevel('debug');
```

| Symbol | Description |
|---|---|
| `logger` | The shared `Logger` instance the library uses. `setLevel(level)`, `error/warn/info/debug(...)`. |
| `Logger` | The class, if you want your own instance. |
| `LogLevel` | The level union type. |

The level is also set from the `logLevel` option at construction.

---

## Exported types

| Type | Shape / meaning |
|---|---|
| `GamepadServiceOptions` | The flat options ([table above](#flat-options)). |
| `GamepadServiceConfig` | `GamepadServiceOptions` + grouped fields + `platform`. Accepted by the constructor/factories. |
| `GamepadServiceEventMap` | The strongly-typed [event map](#events). |
| `NavigationOptionsGroup` … `CustomEventsOptionsGroup` | The seven [grouped option](#grouped-options) shapes. |
| `GamepadNavigationContextOptions` | Per-context options (`navigationMode`, `containerSelector`, `role`, `focusedClass`, `selectedClass`, `useDataAttributes`, `wrapNavigation`, `autoDetectElements`, `onlyViewport`, `useGamepadIndex`). |
| `GamepadContextManagerCallback` | `(newContext, oldContext \| null) => void`. |
| `NavigationState` | Single-context state (`focusedElementIndex`, `elements`, `gridDimensions`, `options`, `onFocus`, `onSelect`). |
| `GridDimensions` | `{ rows: number; cols: number }`. |
| `Direction` | `'up' \| 'down' \| 'left' \| 'right'`. |
| `ShoulderButton` | `'L1' \| 'R1'`. |
| `ControllerType` | `'xbox' \| 'playstation' \| 'nintendo' \| 'unknown'`. |
| `ControllerMapping` | `{ buttons, axes, validation, indices }` (all `readonly`). |
| `ControllerMappings` | `{ xbox, playstation, nintendo, unknown }` of `ControllerMapping`. |
| `ControllerValidation` | `{ minButtons, minAxes, idPatterns? }`. |
| `ButtonIndices` | `{ primary, back, shoulder: ShoulderIndices, dpad: DpadIndices }`. |
| `ShoulderIndices` | `{ l1, r1 }`. |
| `DpadIndices` | `{ up, down, left, right }`. |
| `PlatformAdapter` | The [platform seam](#platform-seam) interface. |
| `WindowEventListener` | `(event: Event) => void`. |
| `GamepadEvent` | The gamepad connect/disconnect event shape used internally and surfaced in custom-event mode. |
| `NavigationStyleOptions` | Options for `addNavigationStyles` / `getNavigationCSS`. |
| `LogLevel` | `'silent' \| 'error' \| 'warn' \| 'info' \| 'debug'`. |

---

## See also

- [README.md](README.md) — feature overview and conceptual guides.
- [ARCHITECTURE.md](ARCHITECTURE.md) — internal structure and the platform seam.
- [GAMEPAD_SERVICE_METHODS.md](GAMEPAD_SERVICE_METHODS.md) — factory vs direct instantiation.
- [GAMEPAD_ACTION_DETECTION.md](GAMEPAD_ACTION_DETECTION.md) — button/action detection details.
- [MIGRATION.md](MIGRATION.md) · [MIGRATION_1.0_TO_NEXT.md](MIGRATION_1.0_TO_NEXT.md) — upgrade paths.
