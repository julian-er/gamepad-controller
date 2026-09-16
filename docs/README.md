# gamepad-controller

Browser gamepad navigation for grid, spatial, and horizontal UI layouts. Version **1.0.0** uses the native Gamepad API by default and can accept a validated custom-event input transport for WinUI/WebView2 hosts.

**Release status:** 1.0.0 is being prepared as the first published package. Before publication, [build and install a local tarball](BUILDING.md#testing-the-package-inside-another-project). After publication:

```sh
npm install gamepad-controller
```

Render a unique `#catalog` container with buttons, links or inputs before running this code.

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

`beforeaction` is synchronous and cancellable. Its `preventDefault()` prevents the automatic move, select, back, shoulder, or scroll effect. `action` reports an automatic effect that completed. Holding primary select activates once per press; direction and right-stick scrolling can repeat while held.

## Projects to try

Explore the [project cookbook](PROJECT_COOKBOOK.md) for websites, small apps, landing pages, and mini games. Start with a complete Treasure Tiles game, then try a film catalog, portfolio, focus timer, recipe browser, product explorer, plan chooser, or quiz.

## Navigation targets and dialogs

Use `setElements(elements)` to keep an explicit, ordered target list. The service copies the array; hidden and detached targets remain registered and become usable again when eligible. Call `refresh()` after application DOM changes.

Use an explicit scope for a custom dialog:

```ts
dialog.hidden = false;
gamepad.setActiveScope(dialog);

// On close
gamepad.clearActiveScope();
dialog.hidden = true;
```

The active scope limits automatic navigation to descendants. Open native `<dialog>` elements are automatically scoped when the browser supports `:modal`. For nested custom scopes, pair `setActiveScope()` with `clearActiveScope()`; that restores the prior scope and eligible focus target.

## Custom hosts

Enable `useCustomEvents: true` when a native host sends gamepad state. Send a complete initial baseline snapshot and complete snapshots for every input change, including releases. The baseline does not select when primary is initially held; release and press it again to select. Preserve press/release ordering, dispatch disconnect/reset explicitly, call `resetInput()` around recovery, then send a fresh snapshot. See [API.md](API.md#custom-event-host-transport) and [USAGE_VANILLA.md](USAGE_VANILLA.md).

Custom DOM events are a transport, not a trust boundary. A WebView2 host must validate the intended document origin and its native payload before forwarding it.

## Framework guides and agent skills

- [Vanilla JavaScript](USAGE_VANILLA.md)
- [React](USAGE_REACT.md)
- [Angular](USAGE_ANGULAR.md)
- [API reference](API.md)
- [Architecture](ARCHITECTURE.md)
- [First-release notes](CHANGELOG.md)
- [Portable consumer skills](AGENT_SKILLS.md)

- [Complete configuration](CONFIGURATION.md)
- [Complete public contracts](PUBLIC_API.md)
