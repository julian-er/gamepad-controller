# Vanilla JavaScript / TypeScript

Install with `npm install gamepad-controller`. To try unreleased changes, install the local tarball described in [BUILDING.md](BUILDING.md#testing-the-package-inside-another-project).

## Mount a view

Use an ES-module bundler for the bare package import. In an unbundled browser page, configure an import map first. Render this HTML before executing the module:

```html
<main id="catalog">
  <button>Play</button>
  <button>Library</button>
</main>
```

The following is valid JavaScript and TypeScript (`catalog.js` or `catalog.ts`):

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

For an SPA, call `dispose()` when the view is removed. For a page that can enter the browser’s back/forward cache, replace the final `const dispose = mountCatalog()` call with:

```js
let disposePage = mountCatalog();
window.addEventListener('pagehide', () => disposePage());
window.addEventListener('pageshow', (event) => {
  if (event.persisted) disposePage = mountCatalog();
});
```

## Host input instead of native polling

Use this setup instead of the preceding native setup when a host forwards input. The host must send full snapshots on every change, including releases:

```js
import { GamepadService } from 'gamepad-controller';

const service = new GamepadService({
  containerSelector: '#catalog', navigationMode: 'spatial',
  useCustomEvents: true, autoAddStyles: true,
});
service.init();

window.dispatchEvent(new CustomEvent('hubgamepadstatechanged', {
  detail: { gamepad: {
    index: 0, id: 'host controller', connected: true,
    buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
    axes: [0, 0, 0, 0],
  } },
}));
// On view teardown: service.destroy();
```

The all-released snapshot establishes the input baseline. A primary button held in that baseline must be released and pressed again to select. Preserve snapshot delivery order. On a host disconnect or recovery boundary, dispatch the disconnect event or call `service.resetInput()`, then send a fresh baseline when valid input resumes. See [API.md](API.md#custom-event-host-transport).
