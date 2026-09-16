# GamepadService methods

The current public methods are listed in [API.md](API.md#lifecycle-and-focus-methods). Use `GamepadService` directly when your application owns a component lifecycle. Use `gamepadService()` and its companion factory helpers for one shared page-level instance.

`destroy()` is full teardown. `resetInput()` is for an input-source reset or host recovery and preserves subscribers. `setActiveScope()` and `clearActiveScope()` provide explicit modal or contained-navigation scope control.
