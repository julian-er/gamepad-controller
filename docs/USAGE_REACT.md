# React

Install with `npm install gamepad-controller`. To try unreleased changes, install the local tarball described in [BUILDING.md](BUILDING.md#testing-the-package-inside-another-project).

## Component lifecycle

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

Register listeners and manual targets inside the same effect before `init()`. `destroy()` clears both. React Strict Mode’s development setup/cleanup cycle should create a fresh service each time the effect runs. Give each mounted view a unique container selector; do not run overlapping services over the same targets.

Effects run on the client. In a framework with server/client component boundaries, place this component on the client side. Run `refresh()` after React commits a changed target collection. Include values that configure the owned service in the effect dependencies so cleanup happens before recreation.

`autoAddStyles: true` opts into default focus styles. See [API.md](API.md#focus-presentation) to supply your own.
