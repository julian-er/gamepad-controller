# API reference

This reference covers the public `gamepad-controller` **1.0.0** entry point.

## Create a service

```ts
import { GamepadService } from 'gamepad-controller';

// Render #catalog with focusable controls before initialization.
const service = new GamepadService({
  containerSelector: '#catalog', navigationMode: 'spatial', autoAddStyles: true,
});
service.init();
// When the owning view is removed, call service.destroy().
```

`gamepadService(containerSelector?, options?)`, `initGamepadForPage(options?)`, and `initDualContextGamepad(options?)` create an initialized shared instance. `initCustomEventGamepad(options?)` creates that shared instance with `useCustomEvents: true`. A factory call replaces the previous shared instance. Call `cleanupGamepadService()` to destroy the shared instance; use a directly owned `GamepadService` for component lifecycles.

## Lifecycle and focus methods

| Method | Meaning |
| --- | --- |
| `init()` | Attach input listeners and start this lifecycle. Repeated calls while active are ignored. |
| `destroy()` | Remove owned resources and clear subscribers, targets, focus, contexts, and input state. Re-register subscribers and manual targets before a later `init()`. |
| `resetInput()` | Clear connected devices, button-edge state, queued host snapshots, and controller label while preserving configuration and subscribers. |
| `setElements(elements)` | Store a copied, ordered manual target registry. |
| `getElements()` | Return a copy of the registered/discovered list. |
| `refresh()` / `detectElements()` | Re-evaluate navigation targets after application DOM changes. |
| `navigateToIndex(index)` | Explicitly focus a target by index; returns whether it succeeded. |
| `setActiveScope(scope)` | Limit automatic focus/navigation to descendants of `scope`; each new non-null scope saves the prior scope and focus. Passing `null` clears directly. |
| `clearActiveScope()` | Unwind one explicit scope, restoring the prior scope and prior focus when eligible. |
| `getCurrentElement()` / `getCurrentIndex()` | Query current focus. |
| `on(event, listener)` / `off(event, listener)` | Subscribe or remove a callback. `on()` returns an unsubscribe function. |
| `updateFocus()` / `clearFocus()` | Reapply or clear single-context focus presentation. Contexts own focus in dual-context mode. |
| `getControllerType()` / `getControllerTypes()` | Query the most recently active family or all connected families. |
| `isControllerConnected()` | Whether a controller is connected. |
| `getContext(id)` / `getActiveContext()` / `getAllContexts()` | Query registered menu/content contexts. |
| `switchToContext(id)` | Activate a registered context; returns success. |
| `setupDualContextMode()` | Set up configured contexts; normally called by `init()` when dual-context navigation is enabled. |

Automatic navigation skips detached, hidden, disabled, inert, and out-of-scope targets. An open native `<dialog>` matching `:modal` supplies an automatic scope; a modal containing native focus wins, otherwise the last matching open modal in document order is used. When an explicit scope is active too, a target must be inside both scopes. Eligible `HTMLElement` targets receive browser focus, and an eligible keyboard or pointer focus transition updates the gamepad cursor. `enableNavigation: false` disables automatic focus, selection, navigation, contexts, and scrolling while retaining raw input/controller/error events and explicit methods.

## Events

Use `service.on(name, listener)`; it returns an unsubscribe function. `off(name, listener)` removes a known listener.

```ts
const off = service.on('beforeaction', (event) => {
  if (event.type === 'select') event.preventDefault();
});
```

`beforeaction` and `action` receive:

```ts
type GamepadActionEvent = {
  type: 'move' | 'select' | 'back' | 'shoulder' | 'scroll';
  gamepad: Gamepad;
  target: Element | null;
  direction?: 'up' | 'down' | 'left' | 'right';
  button?: string;
  defaultPrevented: boolean;
  preventDefault(): void;
};
```

For button-triggered actions, raw button edges precede `beforeaction`. After synchronous cancellation checks, at most one automatic effect runs; `action` reports successful completion. Analog movement and held-input repeats do not require a new button edge. Cancelled or unsuccessful effects do not emit `action`. Cancellation must happen synchronously. A completion listener cannot undo an effect; a failed pre-action callback suppresses that action’s default effect.

Other events are `focus(element, index)`, `select(element, index)`, `controllerconnect(gamepad)`, `controllerdisconnect(gamepad)`, `buttondown(index, gamepad)`, `buttonup(index, gamepad)`, `backbutton()`, `navigationrequest(href, element)`, `navigationmenuopen(button)`, `contextswitch(newContext, oldContext)`, and `gamepaderror(error)`.

## Focus presentation

Use `autoAddStyles: true` for the optional default stylesheet, or supply your own visible focus styles. By default the renderer uses data attributes; set `useDataAttributes: false` to apply `focusedClass` and `selectedClass` instead.

```css
[data-gamepad-focused="true"], .is-focused, :focus-visible {
  outline: 2px solid #10b981;
  outline-offset: 4px;
}
```

The `backbutton` and `navigationrequest` events are notifications: subscribing does not suppress browser history or location changes. For application routing, cancel the relevant `beforeaction` synchronously, then invoke your router.

## Options

See [Configuration](CONFIGURATION.md) for every flat/grouped key, effective default, validation rule and factory override. See [Complete public contracts](PUBLIC_API.md) for all method signatures, event payloads, helpers and types.

## Custom-event host transport

Set `useCustomEvents: true`. Defaults: `hubgamepadconnected`, `hubgamepaddisconnected`, `hubgamepadstatechanged`.

The state event's `detail` must be:

```ts
type HostSnapshot = { gamepad: {
  index: number; id: string;
  buttons: Array<{ pressed: boolean; value?: number; touched?: boolean }>;
  axes: number[];
  connected?: boolean; mapping?: string; timestamp?: number;
} };
```

The host sends a full initial baseline snapshot and full snapshots whenever a button or axis changes, including releases. The baseline establishes edge state without a phantom primary selection: a primary button held in it must be released and pressed again before automatic selection, while held directional and scroll input can continue repeating. The host preserves delivery order, signals disconnect/reset explicitly, and supplies a fresh snapshot after recovery. `index` must be a nonnegative safe integer; button values must be finite in `[0, 1]`; axes must be finite in `[-1, 1]`; supplied `touched`/`connected` values must be booleans; `mapping` is `''` or `'standard'`; and supplied timestamps are finite and nonnegative. Malformed state is rejected without partial mutation. Silence is normal in a changes-only stream, so it does not release held directional/scroll input; release, disconnect, or `resetInput()` does.

See [USAGE_VANILLA.md](USAGE_VANILLA.md) for a dispatch example and [AGENT_SKILLS.md](AGENT_SKILLS.md) for portable host guidance.
