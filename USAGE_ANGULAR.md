# Using `gamepad-controller` in Angular

## Install

```bash
npm install gamepad-controller
```

## An injectable service wrapper

Wrap `GamepadService` in an Angular service. Initialize on first use and clean up via
`DestroyRef`. Because the input loop runs on `requestAnimationFrame`, create it
**outside the Angular zone** with `NgZone.runOutsideAngular` so the rAF loop does not trigger
change detection on every frame; re-enter the zone only inside event callbacks that update UI.

```ts
// gamepad.service.ts
import { Injectable, NgZone, DestroyRef, inject } from '@angular/core';
import { GamepadService, type GamepadServiceOptions } from 'gamepad-controller';

@Injectable({ providedIn: 'root' })
export class GamepadController {
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private service: GamepadService | null = null;

  init(options: GamepadServiceOptions = {}): GamepadService {
    if (this.service) return this.service;

    // Build + run the rAF loop outside Angular's zone.
    this.service = this.zone.runOutsideAngular(() => {
      const svc = new GamepadService({ logLevel: 'error', ...options });
      svc.init();
      return svc;
    });

    // Ensure teardown when the providing scope is destroyed.
    this.destroyRef.onDestroy(() => this.destroy());
    return this.service;
  }

  /** Subscribe to a service event; runs the callback back inside the Angular zone. */
  on<K extends Parameters<GamepadService['on']>[0]>(
    event: K,
    listener: Parameters<GamepadService['on']>[1]
  ): () => void {
    if (!this.service) throw new Error('GamepadController not initialized');
    return this.service.on(event, ((...args: unknown[]) =>
      this.zone.run(() => (listener as (...a: unknown[]) => void)(...args))) as never);
  }

  refresh(): void {
    this.service?.refresh();
  }

  destroy(): void {
    this.service?.destroy();
    this.service = null;
  }
}
```

## Using it in a standalone component

```ts
import { Component, OnInit, inject } from '@angular/core';
import { GamepadController } from './gamepad.service';

@Component({
  standalone: true,
  selector: 'app-menu',
  template: `
    <nav class="nav-menu">
      <button class="gamepad-focusable">Home</button>
      <button class="gamepad-focusable">Library</button>
      <button class="gamepad-focusable">Settings</button>
    </nav>
  `,
})
export class MenuComponent implements OnInit {
  private readonly gamepad = inject(GamepadController);

  ngOnInit(): void {
    this.gamepad.init({ navigationMode: 'spatial' });
    this.gamepad.on('select', (el) => console.log('selected', el));
  }
}
```

`DestroyRef.onDestroy` (registered in `init()`) tears the service down automatically — you do
not need a manual `ngOnDestroy` in every component. If you scope `GamepadController` to a
component (via `providers: [GamepadController]`) instead of `root`, teardown follows that
component's lifecycle.

## After `*ngIf` / `@for` changes

The service caches navigable elements, so refresh after the view updates:

```ts
this.gamepad.refresh();
```

## Styling

Use data-attribute selectors in your component styles (or global styles):

```css
[data-gamepad-focused='true'] { outline: 2px solid #1976d2; }
[data-gamepad-selected='true'] { background: #1976d2; color: white; }
```

## Notes

- Serve over `localhost`/HTTPS — the Gamepad API requires a secure context.
- `init()` no-ops outside the browser, so it is safe under Angular Universal/SSR (it simply
  does nothing on the server; call it from a browser-only lifecycle hook).
