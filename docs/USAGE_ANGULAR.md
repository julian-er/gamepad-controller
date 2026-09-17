# Angular

Install with `npm install gamepad-ui-engine`. To try unreleased changes, install the local tarball described in [BUILDING.md](BUILDING.md#testing-the-package-inside-another-project).

## Component lifecycle

Import `CatalogComponent` in its parent standalone component. The library itself is framework-neutral; there is no Angular-provided service or gamepad directive. Render only one instance with this container ID, or give each instance a unique selector.

```ts
import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { GamepadService } from 'gamepad-ui-engine';

@Component({
  selector: 'app-catalog',
  standalone: true,
  template: '<main id="catalog"><button>Play</button><button>Library</button></main>',
})
export class CatalogComponent implements AfterViewInit, OnDestroy {
  private service?: GamepadService;

  ngAfterViewInit(): void {
    this.service = new GamepadService({
      containerSelector: '#catalog', navigationMode: 'spatial',
      autoAddStyles: true,
    });
    this.service.init();
  }

  ngOnDestroy(): void { this.service?.destroy(); }
}
```

Initialize after the view creates its targets. Register event listeners before `init()`. If Angular changes targets later, call `refresh()` after the rendered DOM update. Call `destroy()` from `ngOnDestroy`.

For server-rendered applications, guard browser-only setup and initialize after hydration has completed. The shown example is for a client-rendered view. Route asynchronous service callbacks through the application’s change-detection mechanism when they update Angular state.

`autoAddStyles: true` opts into the library’s default focus styles. For your own styles, use the focus data attributes described in [API.md](API.md#focus-presentation).
