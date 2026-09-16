# Integration examples for gamepad-controller 1.0.0

Before publication, build the library and install its local tarball. The npm registry command applies after the first publication. The snippets below render a unique #catalog container; do not mount overlapping instances.

## Vanilla JavaScript or TypeScript

```js
import { GamepadService } from 'gamepad-controller';

// HTML: <main id="catalog"><button>Play</button><button>Library</button></main>
export function mountCatalog() {
  const service = new GamepadService({
    containerSelector: '#catalog', navigationMode: 'spatial',
    autoAddStyles: true,
  });
  service.init();
  return () => service.destroy();
}

const dispose = mountCatalog();
// Call dispose() when your application removes this view.
```

`gamepadService(containerSelector, options)` is a convenience factory for a single shared page instance. Prefer `new GamepadService()` when a component owns its own lifecycle or when multiple independent instances are needed.

## React

Create the service in an effect whose dependencies identify the UI it owns. Returning `destroy()` prevents subscriptions and event listeners from surviving unmount.

```tsx
import { useEffect } from 'react';
import { GamepadService } from 'gamepad-controller';

export function Catalog() {
  useEffect(() => {
    const service = new GamepadService({
      containerSelector: '#catalog', navigationMode: 'spatial',
      autoAddStyles: true,
    });
    service.init();
    return () => service.destroy();
  }, []);

  return <main id="catalog">
    <button>Play</button><button>Library</button>
  </main>;
}
```

Do not create a new service in every render. If the container changes identity, let the effect destroy the old instance before creating the new one.

## Angular

Initialize after the view is available and clean up in `ngOnDestroy`.

```ts
import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { GamepadService } from 'gamepad-controller';

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

## Useful options

`enableNavigation: false` suppresses automatic focus, activation, history/link navigation, context changes, and scrolling. Raw `buttondown`, `buttonup`, controller status, and error events continue; explicit public commands such as `navigateToIndex()` remain usable.

Use `useGamepadIndex: true` when only elements marked `gamepad-index="true"` should participate. Set `autoAddStyles: true` only if the application wants the package’s default focus styles.
