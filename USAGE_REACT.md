# Using `gamepad-controller` in React

## Install

```bash
npm install gamepad-controller
```

## A reusable `useGamepad` hook

Create the `GamepadService` once and **destroy it in the effect cleanup** so listeners and the
animation-frame loop are torn down on unmount (React Strict Mode mounts effects twice in dev —
the cleanup makes this safe).

```tsx
// useGamepad.ts
import { useEffect, useRef } from 'react';
import { GamepadService, type GamepadServiceOptions } from 'gamepad-controller';

export function useGamepad(options: GamepadServiceOptions = {}) {
  const serviceRef = useRef<GamepadService | null>(null);

  useEffect(() => {
    const service = new GamepadService(options);
    serviceRef.current = service;
    service.init();

    return () => {
      service.destroy();
      serviceRef.current = null;
    };
    // Intentionally run once on mount. If options can change at runtime, key the
    // component or memoize `options` and add it here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return serviceRef;
}
```

## Subscribing to events

Because `on()` supports multiple subscribers and returns an unsubscribe function, subscriptions
compose cleanly with effects:

```tsx
import { useEffect } from 'react';
import { useGamepad } from './useGamepad';

export function Menu() {
  const gamepad = useGamepad({ navigationMode: 'spatial' });

  useEffect(() => {
    const service = gamepad.current;
    if (!service) return;
    const offSelect = service.on('select', (el) => {
      console.log('selected', el);
    });
    return offSelect; // unsubscribe on unmount / re-run
  }, [gamepad]);

  return (
    <nav className="nav-menu">
      <button className="gamepad-focusable">Home</button>
      <button className="gamepad-focusable">Library</button>
      <button className="gamepad-focusable">Settings</button>
    </nav>
  );
}
```

## After conditional rendering / list changes

The service caches the set of navigable elements. When your rendered elements change, refresh:

```tsx
useEffect(() => {
  gamepad.current?.refresh();
}, [items, gamepad]);
```

## SSR / Next.js

`GamepadService` touches `window`/`document`/`navigator` only inside `init()`, and `init()`
no-ops in a non-browser environment. Still, only run it on the client:

- In the App Router, put the component using `useGamepad` under `'use client'`.
- The `useEffect`-based hook above already guarantees client-only execution.

## Styling

Style via data attributes (recommended — better isolation):

```css
[data-gamepad-focused='true'] { outline: 2px solid #4f46e5; }
[data-gamepad-selected='true'] { background: #4f46e5; color: white; }
```

Or inject the bundled defaults once:

```tsx
import { gamepadUtils } from 'gamepad-controller';
useEffect(() => {
  gamepadUtils.addStyles();
  return () => gamepadUtils.removeStyles();
}, []);
```

## Notes

- Use `localhost`/HTTPS in dev — the Gamepad API requires a secure context.
- Set `{ logLevel: 'debug' }` while developing; the default is `'error'` (quiet).
