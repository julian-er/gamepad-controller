# Gamepad action detection

Primary selection is press-edge based: holding the primary button produces one automatic selection and requires release before another. Directional navigation and right-stick scrolling may repeat while held according to their debounce options.

Raw button edges emit `buttondown` and `buttonup`. Analog movement and held-input repeats do not require new button edges. Automatic actions use the common synchronous `beforeaction` event and completion `action` event. See [API.md](API.md#events) for the action object and cancellation contract.

For changes-only custom hosts, send full press and release snapshots in order. The library retains held directional and scrolling state between unchanged snapshots; explicit release, disconnect, or `resetInput()` clears it.
