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
  import { GamepadService } from 'https://cdn.jsdelivr.net/npm/gamepad-ui-engine@1.0.0/dist/index.js';
  // Create the service after the navigation elements exist.
</script>
```

The package is ESM only; the CDN URL is a module import, not a classic script with a global variable. Version 1.0.0 is the first published release. To try unreleased changes, [build and install a local tarball](docs/BUILDING.md#testing-the-package-inside-another-project).

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

`GamepadService` owns an instance's input and focus lifecycle. Subscribe with `service.on(event, listener)` before `init()` when you need controller or navigation events; the returned function removes that listener. Use `service.refresh()` after changing navigation elements, and call `service.destroy()` when the owning view is removed. See the [public API reference](docs/API.md) and [configuration guide](docs/CONFIGURATION.md) for methods, events, and options.

## Documentation

- [Package guide](docs/README.md)
- [Project cookbook: websites, small apps, landing pages, and mini games](docs/PROJECT_COOKBOOK.md)
- [Vanilla JavaScript / TypeScript](docs/USAGE_VANILLA.md), [React](docs/USAGE_REACT.md), [Angular](docs/USAGE_ANGULAR.md)
- [Public API](docs/API.md) and [architecture](docs/ARCHITECTURE.md)
- [Building and packaging](docs/BUILDING.md)
- [First-release notes](docs/CHANGELOG.md)
- [AI consumer skills](docs/AGENT_SKILLS.md)
- [Contributing](CONTRIBUTING.md)

Library guides live in `docs/`. Portable AI skill folders remain self-contained in `skills/`.

- [Complete configuration](docs/CONFIGURATION.md)
- [Complete public contracts](docs/PUBLIC_API.md)
