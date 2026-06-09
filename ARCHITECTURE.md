# Architecture

This document explains the **internal** structure of `gamepad-controller` after the collaborator
refactor. It is for contributors and for consumers who inject a custom
[`PlatformAdapter`](#the-platform-seam). **None of this changes the public API** — if you only use
`GamepadService`, the factory helpers, and `service.on(...)`, you can skip this document.

> **TL;DR:** `GamepadService` is now a thin **facade**. It owns lifecycle (`init`/`destroy`),
> dual-context wiring, and the public event API, and delegates everything else to four focused
> collaborators plus an injectable browser seam. The observable behavior of the public API is
> unchanged.

---

## Why the refactor

The previous `GamepadService` concentrated polling-loop mechanics, DOM focus presentation,
status-element lifecycle, navigation fallbacks, and direct `window`/`navigator`/`performance`
access in one class. That made the orchestrator hard to test deterministically and hard to evolve
without regression risk (see the *Architectural concentration debt* and *runtime adapter* items in
[LIBRARY_AUDIT.md](LIBRARY_AUDIT.md)).

The refactor:

1. **Inverts the browser dependency** behind a single [`PlatformAdapter`](#the-platform-seam) seam,
   so timing, the Gamepad API, window events, navigation, and DOM-mutation observation are
   injectable and can be driven deterministically in tests.
2. **Decomposes the orchestrator** into focused collaborators, each owning one concern.
3. **Consolidates the event machinery** into a single reusable `TypedEmitter`, shared by the
   service and every navigation context.

---

## Component map

```
                       ┌─────────────────────────────────────────────┐
                       │              GamepadService                  │
                       │  (facade: lifecycle, dual-context wiring,    │
                       │   public on()/off() event API)               │
                       └───────────────┬─────────────────────────────┘
                                       │ composes
          ┌───────────────┬───────────┼────────────┬──────────────────┐
          ▼               ▼           ▼            ▼                  ▼
   ┌─────────────┐ ┌─────────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐
   │InputPipeline│ │FocusRenderer│ │ Status   │ │NavigationPol.│ │ TypedEmitter │
   │ polling loop│ │ element scan│ │ Reporter │ │ emit-or-fall │ │ multi-sub    │
   │ + pad state │ │ + focus DOM │ │ status   │ │ -back policy │ │ event registry│
   └──────┬──────┘ └──────┬──────┘ └────┬─────┘ └──────┬───────┘ └──────┬───────┘
          │               │             │              │                │
          └───────────────┴─────────────┴──────────────┴────────────────┘
                                       │ all browser side-effects routed through
                                       ▼
                            ┌─────────────────────┐
                            │   PlatformAdapter    │  (injectable seam)
                            │ now/raf/getGamepads/ │
                            │ window events/nav/   │
                            │ MutationObserver     │
                            └─────────────────────┘
```

| Module | File | Responsibility |
|---|---|---|
| `GamepadService` | [src/core/GamepadService.ts](src/core/GamepadService.ts) | Facade. Lifecycle (`init`/`destroy`), dual-context setup, public `on`/`off` event API, and bridging collaborator callbacks to the shared emitter. |
| `InputPipeline` | [src/core/InputPipeline.ts](src/core/InputPipeline.ts) | The input runtime: connected-pad map, per-pad edge/cooldown state, the native and custom-event game loops, and connect/disconnect handlers that pause/resume the loop. |
| `FocusRenderer` | [src/core/FocusRenderer.ts](src/core/FocusRenderer.ts) | Single-context navigation state and focus presentation: element discovery, grid-dimension computation, focused-index bookkeeping, and applying/clearing focus styling. |
| `StatusReporter` | [src/core/StatusReporter.ts](src/core/StatusReporter.ts) | The on-screen status-indicator lifecycle — ensuring the element exists and syncing the resolved id back into options/event state. |
| `NavigationPolicy` | [src/core/NavigationPolicy.ts](src/core/NavigationPolicy.ts) | The "emit if a consumer is subscribed, otherwise fall back to the browser" decision for `backbutton` and `navigationrequest`. |
| `TypedEmitter` | [src/core/EventEmitter.ts](src/core/EventEmitter.ts) | A small strongly-typed multi-subscriber emitter shared by the service and each `GamepadNavigationContext`. |
| `PlatformAdapter` | [src/core/platform/PlatformAdapter.ts](src/core/platform/PlatformAdapter.ts) | The injectable seam over browser globals. |

---

## The platform seam

`PlatformAdapter` is the single abstraction over the browser globals the library touches at
runtime — **timing, the Gamepad API, window events, navigation fallbacks, and DOM-mutation
observation**:

```ts
export interface PlatformAdapter {
    readonly isBrowser: boolean;

    now(): number;
    requestAnimationFrame(callback: FrameRequestCallback): number;
    cancelAnimationFrame(handle: number): void;

    getGamepads(): (Gamepad | null)[];

    addWindowListener(type: string, listener: WindowEventListener): void;
    removeWindowListener(type: string, listener: WindowEventListener): void;

    assignLocation(href: string): void;
    historyBack(): void;

    createMutationObserver(callback: MutationCallback): MutationObserver | null;
}
```

- The default implementation, `BrowserPlatformAdapter`, reads each global **at call time** (not at
  construction) so test spies installed on `window`/`navigator` after the adapter is created still
  take effect.
- `getGamepads()` returns `[]` when the Gamepad API is absent and **intentionally propagates**
  `SecurityError` (from `Permissions-Policy: gamepad`) so the input loop can catch it and emit
  `gamepaderror` once while continuing to poll.
- **DOM *querying*** (`querySelector` / `getComputedStyle` / `getBoundingClientRect`) deliberately
  stays in `domUtils` — it is a much larger surface and is already isolated there.

Inject your own adapter via the `platform` config option to run in a non-standard host or to drive
the input loop deterministically in tests:

```ts
new GamepadService({ platform: myAdapter });
```

`PlatformAdapter`, `BrowserPlatformAdapter`, `defaultPlatformAdapter`, and `WindowEventListener` are
all exported from the package. See [API.md](API.md#platform-seam) for the full reference.

---

## How the collaborators interact

### Shared state by reference

Two pieces of mutable state are shared **by reference** so collaborators stay in sync without an
event hop:

- `FocusRenderer.state` (`NavigationState`) — the single-context focus state. `InputPipeline`
  receives the same object and drives the focused index from the polling loop; `FocusRenderer`
  renders it.
- `InputPipeline.state` (`GamepadEventState`) — connected pads, per-pad input state, and the
  bridged input callbacks. `StatusReporter` reads the resolved status-element id from it.

### Callback bridging

Collaborators expose **single-slot** callbacks (`onFocus`, `onSelect`, `onControllerConnect`, …).
`GamepadService` bridges each of these to the **multi-subscriber** `TypedEmitter` in its
constructor, e.g.:

```ts
this.focus.state.onFocus = (el, i) => this.emit('focus', el, i);
this.input.state.onBackButton = () => this.navigationPolicy.requestBack();
this.input.state.onNavigationRequest = (href, el) =>
    this.navigationPolicy.requestNavigation(href, el);
```

This is why consumers get the multi-subscriber `service.on('focus', …)` API while the internals
stay simple.

### The emit-or-fall-back policy

`NavigationPolicy` centralizes a contract that used to be duplicated between the service and
`GamepadNavigationContext.select()`:

- **`backbutton`** — if a consumer is subscribed, emit it; otherwise call `platform.historyBack()`.
- **`navigationrequest`** — if a consumer is subscribed (e.g. an SPA router), emit it; otherwise
  call `platform.assignLocation(href)` so zero-config static pages still navigate.

Because the fallbacks route through `PlatformAdapter`, they are deterministically testable and a
no-op outside a browser environment.

### Loop pause/resume

`InputPipeline` pauses the `requestAnimationFrame` loop when the last controller disconnects and
resumes it on the first connect — eliminating idle 60 fps CPU burn when no pad is present. The
native and custom-event loops share the same pause/resume and stale-pad-pruning behavior.

---

## Lifecycle

### `init()`

1. No-op if already running, or if `platform.isBrowser` is false (SSR-safe).
2. `InputPipeline.setupListeners()` — attach native or custom-event connection listeners.
3. Register the debounced `resize` handler and a `MutationObserver` (drops the focusable-element
   memo when the observed subtree mutates).
4. Detect elements (single context) **or** wire up the two contexts (dual context).
5. Optionally inject default styles and ensure the status element via `StatusReporter`.
6. `InputPipeline.start()` — choose the native vs custom-event loop and begin polling.

### `destroy()`

Stops the loop, removes native **and** custom-event listeners, removes the resize listener,
cancels the debounce, disconnects the observer, clears focus/elements/callbacks, drops every
subscriber (`emitter.clear()`), and destroys the context manager. Safe and idempotent.

---

## Testing seam

Supplying a fake `PlatformAdapter` lets unit tests:

- step `requestAnimationFrame` frames manually and assert per-frame behavior,
- return scripted `getGamepads()` snapshots (including throwing `SecurityError`),
- assert navigation fallbacks (`assignLocation` / `historyBack`) without touching real
  `window.location` / `window.history`.

See [tests/platformAdapter.test.ts](tests/platformAdapter.test.ts),
[tests/navigationPolicy.test.ts](tests/navigationPolicy.test.ts), and
[tests/eventEmitter.test.ts](tests/eventEmitter.test.ts).

---

## Related documents

- [API.md](API.md) — full public API reference (includes the exported platform-seam symbols).
- [MIGRATION.md](MIGRATION.md) — upgrade hub (`0.x` → `0.1` → `1.0`).
- [MIGRATION_1.0_TO_NEXT.md](MIGRATION_1.0_TO_NEXT.md) — `1.0` → architecture-refactor release.
- [CHANGELOG.md](CHANGELOG.md) — the `[Unreleased]` section records this refactor.
