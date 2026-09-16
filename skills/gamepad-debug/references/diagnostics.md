# Diagnostics for gamepad-controller 1.0.0

## Add a temporary event probe

```ts
const names = [
  'controllerconnect', 'controllerdisconnect', 'buttondown', 'buttonup',
  'beforeaction', 'action', 'focus', 'select', 'gamepaderror',
] as const;

const stopProbes = names.map((name) => service.on(name, (...args) => {
  console.debug(`[gamepad:${name}]`, ...args);
}));

// When finished debugging:
// stopProbes.forEach((off) => off());
```

## Check the lifecycle first

`init()` must run after the application has rendered its target DOM. Make sure unmounted components call `destroy()`. `destroy()` clears event subscribers and manual elements; when the same service is initialized again, register those callbacks and elements again.

`resetInput()` is narrower: it keeps subscriptions and configuration, while clearing connected device state, button edges, queued host snapshots, and the controller label. Use it for host reset/recovery, not component teardown.

## Symptom guide

| Symptom | Check |
| --- | --- |
| No input at all | Confirm `init()`, browser Gamepad API availability/permission, then `controllerconnect` and `gamepaderror`. In custom-event mode, verify the configured event names. |
| Primary action fires twice | Log `buttondown`, `buttonup`, `beforeaction`, and `action`. One press should select once until release. Look for two live services after a remount. |
| Default action did not run | Inspect `beforeaction`: an application listener may call `preventDefault()`. A thrown pre-action listener also suppresses that action while reporting an error. |
| Focus skips a target | Check whether it is attached, visible, enabled, non-inert, and inside the active scope. Call `refresh()` after application DOM changes. |
| Focus escapes a dialog | Call `setActiveScope(dialog)` after making the dialog visible; call `clearActiveScope()` only after close. |
| Host input sticks | Verify a complete release snapshot, explicit disconnect, or `resetInput()`. Do not expect silence in a changes-only stream to release held input. |
| Host press is lost | Verify ordered full snapshots: initial, press, then release. Do not merge a press and release into one final state before dispatch. |

Listener errors are isolated: later subscribers and future frames should keep running. Capture the reported `gamepaderror` with the reproduction details before treating it as a library defect.
