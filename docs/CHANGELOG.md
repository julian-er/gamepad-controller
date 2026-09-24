# Release notes

## Unreleased

## 1.0.1 — 2026-09-24

### Package and documentation

- Improved npm search metadata, README onboarding, and GitHub Pages metadata for the Gamepad UI Engine identity.
- Updated the README CDN example to use the 1.0.1 package release.

### Website

- Added an explicit-start controller playground with complete standard-button, stick, trigger,
  simulation, focus, suspension, and teardown behavior.
- Added an opt-in Three.js preview using the supplied Xbox Elite and PS5 models, while keeping
  the default and fallback 2D views available for unsupported or nonstandard mappings.
- Added conservative automatic style selection and independent manual visual controls without
  implying exact hardware identity or remapping controller input.
- Added model attribution, source links, loading and lifecycle recovery safeguards, and
  documentation for rendering budgets and asset limitations.

## 1.0.0 — 2026-09-17

This is the first published package. No earlier package releases are documented.

### Included in the first release

- Browser gamepad input and a validated custom-event transport for native hosts.
- Grid, spatial and horizontal navigation with native DOM focus.
- Persistent manual targets, dynamic discovery, explicit scopes and menu/content contexts.
- Synchronous cancellable `beforeaction` events and `action` completion notifications.
- Press-edge primary selection, held directional input and configurable right-stick scrolling.
- Instance-owned initialization and teardown, plus input reset for host recovery.
- Controller mapping helpers, typed configuration, an injectable platform adapter and optional focus styles.
- An ES-module distribution with TypeScript declarations.
- React, Angular and vanilla JavaScript/TypeScript guides, a documentation playground and four portable AI consumer skills.
- Published to npm as `gamepad-ui-engine`.

See [API.md](API.md) for the contracts, [BUILDING.md](BUILDING.md) for building and packing from source, and [AGENT_SKILLS.md](AGENT_SKILLS.md) for the consumer skills.
