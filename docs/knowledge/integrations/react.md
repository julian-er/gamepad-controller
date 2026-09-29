---
type: "Integration Guide"
title: "React"
description: "Own a gamepad service through a React component lifecycle."
tags: ["react", "integration"]
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
# React

Document version: 1 | Updated: 2026-09-24T05:34:57.831Z

Latest change: Organized this guide in the OKF knowledge base.

Install with `npm install gamepad-ui-engine`. To try unreleased changes, install the local tarball described in [BUILDING.md](../operations/building-and-packaging.md#testing-the-package-inside-another-project).

## Component lifecycle

```tsx
import { useEffect } from 'react';
import { GamepadService } from 'gamepad-ui-engine';

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

Register listeners and manual targets inside the same effect before `init()`. `destroy()` clears both. React Strict Mode’s development setup/cleanup cycle should create a fresh service each time the effect runs. Give each mounted view a unique container selector; do not run overlapping services over the same targets.

Effects run on the client. In a framework with server/client component boundaries, place this component on the client side. Run `refresh()` after React commits a changed target collection. Include values that configure the owned service in the effect dependencies so cleanup happens before recreation.

`autoAddStyles: true` opts into default focus styles. See [API.md](../foundations/api.md#focus-presentation) to supply your own.
