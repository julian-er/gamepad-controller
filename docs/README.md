# gamepad-ui-engine

Browser gamepad navigation for grid, spatial, and horizontal UI layouts. The current package version is **1.0.1**. It uses the native Gamepad API by default and can accept a validated custom-event input transport for WinUI/WebView2 hosts.

**Install:** Install the published package from npm. To try unreleased changes, [build and install a local tarball](knowledge/operations/building-and-packaging.md#testing-the-package-inside-another-project).

From npm:

```sh
npm install gamepad-ui-engine
```

Render a unique `#catalog` container with buttons, links or inputs before running this code.

```js
import { GamepadService } from 'gamepad-ui-engine';

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

Explore the [project cookbook](knowledge/features/project-cookbook.md) for websites, small apps, landing pages, and mini games. Start with a complete Treasure Tiles game, then try a film catalog, portfolio, focus timer, recipe browser, product explorer, plan chooser, or quiz.

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

Enable `useCustomEvents: true` when a native host sends gamepad state. Send a complete initial baseline snapshot and complete snapshots for every input change, including releases. The baseline does not select when primary is initially held; release and press it again to select. Preserve press/release ordering, dispatch disconnect/reset explicitly, call `resetInput()` around recovery, then send a fresh snapshot. See [API.md](knowledge/foundations/api.md#custom-event-host-transport) and [USAGE_VANILLA.md](knowledge/integrations/vanilla.md).

Custom DOM events are a transport, not a trust boundary. A WebView2 host must validate the intended document origin and its native payload before forwarding it.

## Knowledge base

Browse the [knowledge base](knowledge/index.md) by category:

- [Architecture](knowledge/architecture/index.md) — service and runtime boundaries.
- [Features](knowledge/features/index.md) — action behavior and project examples.
- [Foundations](knowledge/foundations/index.md) — public API, service, and configuration contracts.
- [Integrations](knowledge/integrations/index.md) — framework setup and consumer skills.
- [Operations](knowledge/operations/index.md) — building and packaging.

See the [release notes](CHANGELOG.md) for package history.
