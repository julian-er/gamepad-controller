# Host snapshot protocol for gamepad-controller 1.0.0

## Page setup

```ts
import { GamepadService } from 'gamepad-controller';

const service = new GamepadService({
  useCustomEvents: true,
  navigationMode: 'spatial',
});
service.init();
```

The defaults are `hubgamepadconnected`, `hubgamepaddisconnected`, and `hubgamepadstatechanged`. They can be changed with `customConnectedEvent`, `customDisconnectedEvent`, and `customStateChangedEvent` (or the `customEvents` option group).

## Required state event schema

Dispatch a `CustomEvent` whose `detail` has this complete shape:

```ts
type HostGamepadSnapshot = {
  gamepad: {
    index: number;
    id: string;
    buttons: Array<{ pressed: boolean; value?: number; touched?: boolean }>;
    axes: number[];
    connected?: boolean;
    mapping?: string;
    timestamp?: number;
  };
};
```

`index` must be a nonnegative safe integer. Button `value` must be finite from `0` through `1`; every axis must be finite from `-1` through `1`. `touched` and `connected`, when supplied, must be booleans. `mapping` may only be `''` or `'standard'`, and `timestamp` must be finite and nonnegative. Send the complete controller shape expected by the standard mapping (the example uses 17 buttons and four axes). For example, the baseline snapshot reports every button released:

```ts
window.dispatchEvent(new CustomEvent('hubgamepadstatechanged', {
  detail: { gamepad: {
    index: 0, id: 'WinUI controller', connected: true, mapping: 'standard',
    timestamp: performance.now(),
    buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
    axes: [0, 0, 0, 0],
  } },
}));
```

Malformed snapshots are rejected rather than partially merged into prior input. A valid state snapshot can establish a connection even if a separate connect event was missed.

## Delivery and reset rules

1. Send one complete baseline snapshot when a controller becomes available or the page starts receiving input. It establishes edge state and does not produce a phantom primary selection. If primary is held in that baseline, it must be released and pressed again before automatic selection; held directional and scroll input can continue repeating.
2. Send another complete snapshot whenever any button or axis changes, including every release.
3. Preserve order: if press and release occur before the browser animation frame, deliver both snapshots in that order.
4. On disconnect, dispatch the configured disconnect event and call `service.resetInput()` when the page owns the reset boundary.
5. Around app suspension or foreground recovery, call `service.resetInput()` and send a fresh complete snapshot when input is valid again.

```ts
window.dispatchEvent(new CustomEvent('hubgamepaddisconnected', { detail: { gamepad: { index: 0 } } }));
service.resetInput();
```

`resetInput()` preserves event subscriptions and configuration; it clears connected devices, edge state, queued snapshots, and the current controller label. Changes-only delivery means silence does not prove a host failure, and held directional or scroll input continues between snapshots. A release, disconnect, or reset stops that held state.

## WebView2 boundary

Use the host’s normal WebView2 message mechanism to communicate with the intended document, validate the page origin before forwarding native input, and validate native-side data before dispatching it. A DOM custom event is visible to page code and does not authenticate its sender; it must not itself grant native authority.
