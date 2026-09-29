---
type: "Integration Guide"
title: "Angular"
description: "Own a gamepad service through an Angular component lifecycle."
tags: ["angular", "integration"]
where: ["gamepad-ui-engine"]
sources:
  - title: "Public package exports"
    resource: "../../../src/index.ts"
  - title: "Service implementation"
    resource: "../../../src/service/GamepadService.ts"
generated:
  by: process:maintain-documentation
  at: "2026-09-24T05:34:57.831Z"
doc_version: 1
status: draft
---
# Angular

Document version: 1 | Updated: 2026-09-24T05:34:57.831Z

Latest change: Organized this guide in the OKF knowledge base.

Install with `npm install gamepad-ui-engine`. To try unreleased changes, install the local tarball described in [BUILDING.md](../operations/building-and-packaging.md#testing-the-package-inside-another-project).

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

`autoAddStyles: true` opts into the library’s default focus styles. For your own styles, use the focus data attributes described in [API.md](../foundations/api.md#focus-presentation).
