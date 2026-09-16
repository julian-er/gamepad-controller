# Architecture

`GamepadService` is the public lifecycle owner. It composes the input pipeline, focus renderer, status reporter, action dispatch callbacks, and platform adapter behind one package entry point.

```text
native Gamepad API ─┐
                    ├─ Input pipeline ─ action callbacks ─ GamepadService events
custom DOM events ──┘          │
                               └─ Focus renderer ─ DOM focus / active scope
```

Both input transports are normalized into full `Gamepad`-like snapshots before action processing. The custom path owns a validated copy of each supplied snapshot and queues ordered snapshots so a press/release sequence arriving between animation frames is retained.

`beforeaction` is the synchronous policy boundary. For button-triggered actions it runs after raw edges and before an automatic effect; analog and repeated held-input actions do not require a new button edge. Its `preventDefault()` suppresses that effect; `action` is emitted after an automatic effect completes. Subscriber errors are isolated and surfaced through `gamepaderror`; a failed pre-action callback suppresses the current automatic effect.

The focus renderer distinguishes target registration from current eligibility. Manual references retain their order across hide/detach cycles. At navigation and activation time, a candidate must be in the relevant document, visible, enabled, non-inert, and inside each active scope. An open native `<dialog>` matching `:modal` supplies one scope; a modal containing native focus wins, otherwise the last matching open modal in document order is used. Explicit scopes form a stack and restore prior eligible focus as they unwind. Browser focus is applied to eligible `HTMLElement` targets.

`destroy()` releases listeners, animation work, subscriptions, targets, focus/context state, and input state. `resetInput()` is intentionally narrower: it clears device and edge state while preserving configuration and subscriptions for a host recovery boundary.

`PlatformAdapter` is the test and non-standard-host seam over timing, Gamepad API access, window events, browser navigation, and mutation observation. It is exported from the package for consumers that need a custom platform.
