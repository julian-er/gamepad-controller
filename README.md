# Gamepad UI Engine (gamepad-controller)

[![npm version](https://img.shields.io/npm/v/gamepad-ui-engine)](https://www.npmjs.com/package/gamepad-ui-engine)
[![License: MIT](https://img.shields.io/npm/l/gamepad-ui-engine)](LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/gamepad-ui-engine)](https://www.npmjs.com/package/gamepad-ui-engine)

## Description

Gamepad UI Engine is a browser library for controller-driven UI navigation. It supports spatial, grid, and horizontal layouts in vanilla JavaScript/TypeScript, React, and Angular, plus custom-event input from a host. The npm package is [`gamepad-ui-engine`](https://www.npmjs.com/package/gamepad-ui-engine); its source repository is [`gamepad-controller`](https://github.com/julian-er/gamepad-controller).

## Live Demo

Explore the [GitHub Pages demo and documentation](https://julian-er.github.io/gamepad-controller/), including interactive examples.

## Installation

Install the published package from npm:

```sh
npm install gamepad-ui-engine
```

For a browser page without a bundler, import the versioned ESM build from a CDN in a module script:

```html
<script type="module">
  import { GamepadService } from 'https://cdn.jsdelivr.net/npm/gamepad-ui-engine@1.0.1/dist/index.js';
  // Create the service after the navigation elements exist.
</script>
```

The package is ESM only; the CDN URL is a module import, not a classic script with a global variable. Version 1.0.0 was the first published release. To try unreleased changes, [build and install a local tarball](docs/knowledge/operations/building-and-packaging.md#testing-the-package-inside-another-project).

## Quick Start

Add a container with focusable elements:

```html
<main id="catalog">
  <button>Play</button>
  <button>Library</button>
</main>
```

Initialize the service after that HTML is rendered, and destroy it when the view is removed:

```js
import { GamepadService } from 'gamepad-ui-engine';

const service = new GamepadService({
  containerSelector: '#catalog',
  navigationMode: 'spatial',
  autoAddStyles: true,
});

service.init();
// When removing this view: service.destroy();
```

## API Usage

`GamepadService` owns an instance's input and focus lifecycle. Subscribe with `service.on(event, listener)` before `init()` when you need controller or navigation events; the returned function removes that listener. Use `service.refresh()` after changing navigation elements, and call `service.destroy()` when the owning view is removed. See the [public API reference](docs/knowledge/foundations/api.md) and [configuration guide](docs/knowledge/foundations/configuration.md) for methods, events, and options.

## Documentation

- [Package guide](docs/README.md)
- [Knowledge base by category](docs/knowledge/index.md)
- [Project cookbook: websites, small apps, landing pages, and mini games](docs/knowledge/features/project-cookbook.md)
- [Vanilla JavaScript / TypeScript](docs/knowledge/integrations/vanilla.md), [React](docs/knowledge/integrations/react.md), [Angular](docs/knowledge/integrations/angular.md)
- [Public API](docs/knowledge/foundations/api.md) and [architecture](docs/knowledge/architecture/overview.md)
- [Building and packaging](docs/knowledge/operations/building-and-packaging.md)
- [Release notes](docs/CHANGELOG.md)
- [AI consumer skills](docs/knowledge/integrations/consumer-skills.md)
- [Contributing](CONTRIBUTING.md)

Current library guides live in `docs/knowledge/`; release notes and the package entry guide remain in `docs/`. Portable AI skill folders remain self-contained in `skills/`.

- [Complete configuration](docs/knowledge/foundations/configuration.md)
- [Complete public contracts](docs/knowledge/foundations/public-api.md)
