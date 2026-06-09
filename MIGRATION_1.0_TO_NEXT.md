# Migration Guide — `1.0` → architecture-refactor release

> This is **part two** of the migration trail. Part one — [MIGRATION.md](MIGRATION.md) — covers the
> earlier legs (`0.x` → `0.1` → `1.0`). This document continues from `1.0` to the current
> architecture-refactor release (the `[Unreleased]` section in [CHANGELOG.md](CHANGELOG.md)).
>
> **Full path:** `1.0.0` (original) → `0.1.x` (API lockdown) → `1.0` (runtime resilience + grouped
> options) → **this release** (internal decomposition + platform seam).

---

## TL;DR

| Area | Status | Action needed |
|---|---|---|
| `GamepadService` methods, events, options | **Unchanged** | None |
| Factory helpers (`gamepadService`, `initGamepadForPage`, …) | **Unchanged** | None |
| `service.on(...)` event API | **Unchanged** | None |
| New `platform` config option + `PlatformAdapter` exports | **Additive** | None (opt-in) |
| `CONTROLLER_MAPPINGS[type].indices` + index types | **Additive** | None (opt-in) |
| `getShoulderIndices` / `getDpadIndices` now honor `controllerType` | **Behavior** | None for built-in types |
| `GamepadNavigationContext.select()` standalone fallback | **Breaking** | Only if you use the context class **directly** |

**Most apps need zero changes.** The public `GamepadService` API — methods, events, and options —
is byte-for-byte compatible. The single breaking change affects only consumers who instantiate
`GamepadNavigationContext` themselves (an advanced, uncommon path).

---

## What changed under the hood (no action required)

The orchestrator was decomposed into focused collaborators and browser side-effects were moved
behind an injectable seam. This is an **internal** change — see [ARCHITECTURE.md](ARCHITECTURE.md)
for the full picture. The observable behavior of the public API is unchanged.

`GamepadService` is now a thin facade over:

- **`InputPipeline`** — polling loop + connected pads,
- **`FocusRenderer`** — single-context element discovery and focus presentation,
- **`StatusReporter`** — status-element lifecycle,
- **`NavigationPolicy`** — the emit-or-fall-back navigation/back policy,
- a single shared **`TypedEmitter`** used by both the service and each `GamepadNavigationContext`.

You cannot import these collaborators from the package — they are not part of the public surface.

---

## 1. New: the `platform` config option (additive)

`PlatformAdapter` is a new injectable abstraction over the browser globals the library touches at
runtime (timing, the Gamepad API, window events, navigation fallbacks, and DOM-mutation
observation). It defaults to a browser-backed adapter, so **existing usage is unaffected**.

Supply your own to run in a non-standard host or to drive the input loop deterministically in tests:

```ts
import { GamepadService, type PlatformAdapter } from 'gamepad-controller';

const myAdapter: PlatformAdapter = {
    isBrowser: true,
    now: () => performance.now(),
    requestAnimationFrame: (cb) => requestAnimationFrame(cb),
    cancelAnimationFrame: (h) => cancelAnimationFrame(h),
    getGamepads: () => navigator.getGamepads(),
    addWindowListener: (t, l) => window.addEventListener(t, l),
    removeWindowListener: (t, l) => window.removeEventListener(t, l),
    assignLocation: (href) => { window.location.href = href; },
    historyBack: () => window.history.back(),
    createMutationObserver: (cb) => new MutationObserver(cb),
};

new GamepadService({ platform: myAdapter });
```

Newly exported symbols:

```ts
import {
    BrowserPlatformAdapter,   // the default implementation (class)
    defaultPlatformAdapter,   // shared default instance
} from 'gamepad-controller';
import type { PlatformAdapter, WindowEventListener } from 'gamepad-controller';
```

> The `platform` field is a **runtime dependency, not a serializable option** — it is stripped
> before option normalization, so it never collides with the grouped/flat options.

See [API.md](API.md#platform-seam) and [ARCHITECTURE.md](ARCHITECTURE.md#the-platform-seam) for
details.

---

## 2. New: per-controller button-index table (additive)

`CONTROLLER_MAPPINGS[type].indices` is now the single source of truth for the
primary/back/shoulder/D-pad button indices (previously hardcoded inside the mapping helper
functions). This correctly accounts for, e.g., Nintendo's swapped A/B at indices 0/1.

New exported types:

```ts
import type { ButtonIndices, ShoulderIndices, DpadIndices } from 'gamepad-controller';

// ButtonIndices = { primary, back, shoulder: { l1, r1 }, dpad: { up, down, left, right } }
```

Read indices directly when you need them:

```ts
import { CONTROLLER_MAPPINGS } from 'gamepad-controller';

const { primary, back } = CONTROLLER_MAPPINGS.nintendo.indices;
```

Nothing to migrate — this is purely additive.

---

## 3. Behavior: `getShoulderIndices` / `getDpadIndices` honor `controllerType`

These helpers now **read from `CONTROLLER_MAPPINGS`** and use their `controllerType` argument
(previously the argument was ignored and a constant object was returned).

- **Return values are unchanged for all built-in controller types** (`xbox`, `playstation`,
  `nintendo`, `unknown`).
- They now return a **fresh object each call** (previously could return a shared reference). If you
  were (incorrectly) caching the returned object by identity, switch to caching by value.

No action is required for normal use.

---

## 4. Breaking: `GamepadNavigationContext.select()` standalone fallback removed

**This is the only breaking change, and it affects only consumers who instantiate
`GamepadNavigationContext` directly.**

Previously, calling `select()` on a standalone `GamepadNavigationContext` (one you constructed
yourself, not obtained through `GamepadService`) would fall back to mutating `window.location.href`
when the focused element was a navigation link and no handler was provided. It now delegates
navigation **solely** through the optional `onNavigationRequest` argument passed to `select()`.

### If you go through `GamepadService` — nothing changes

The `GamepadService` flow always supplies a handler, routed through `NavigationPolicy`, which
**still** falls back to `window.location` when no `navigationrequest` subscriber is registered.
Zero-config HTML pages continue to navigate exactly as before.

### If you use `GamepadNavigationContext` directly — pass a handler to `select()`

`select()` accepts an optional `onNavigationRequest` callback. Supply it to own the navigation
side-effect (the constructor signature is unchanged):

```diff
  const context = new GamepadNavigationContext('content', {
      containerSelector: '.content',
      navigationMode: 'spatial',
  });
  context.activate();

- context.select(); // used to mutate window.location.href for nav-item links
+ context.select((href, element) => {
+     // You now own the navigation side-effect. To restore the old behavior:
+     window.location.href = href;
+     // …or hand it to your SPA router instead:
+     // router.push(href);
+ });
```

> Only elements with the `nav-item` class **and** an `href` route through this handler. Regular
> elements are still activated via a native `click()`, which is unchanged.

**Why the change:** the implicit `window.location` mutation made the context class impossible to
use cleanly inside an SPA and impossible to test without a real browser. Centralizing the
fallback in `NavigationPolicy` keeps the contract in one place and keeps the side-effect
injectable.

---

## Checklist

- [ ] **Using the factory or `GamepadService` directly?** No changes required.
- [ ] **Subscribing with `service.on(...)`?** No changes required.
- [ ] **Want host/test injection?** Pass `{ platform: yourAdapter }` (optional).
- [ ] **Reading button indices manually?** You can now use `CONTROLLER_MAPPINGS[type].indices`.
- [ ] **Constructing `GamepadNavigationContext` yourself and relying on link auto-navigation?**
      Pass an `onNavigationRequest` handler.

---

## See also

- [MIGRATION.md](MIGRATION.md) — part one (`0.x` → `0.1` → `1.0`).
- [ARCHITECTURE.md](ARCHITECTURE.md) — the internal structure this release introduces.
- [API.md](API.md) — full public API reference.
- [CHANGELOG.md](CHANGELOG.md) — the `[Unreleased]` section records this refactor.
