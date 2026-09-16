# Website verification record

## Integrated refactor verification — 2026-09-16

This verification covers the completed atomic-design extraction as an integrated website and
library workspace. It supplements the historical T1 safeguard baseline below.

### Automated checks

Run from the repository root:

- `npm run lint`: passed (exit 0).
- `npm run typecheck`: passed (exit 0).
- `npm test`: passed (exit 0): 23 test files, 155 passed tests.
- `npm run build`: passed (exit 0): 25 modules transformed.
- `npm --prefix website run typecheck`: passed (exit 0).
- `npm --prefix website test`: passed (exit 0): 12 test files, 72 passed tests.
- `npm --prefix website run build`: passed (exit 0): 168 modules transformed.

Some test and build starts in the restricted sandbox failed while spawning esbuild with
`EPERM`. The identical commands passed when rerun with the approved execution permission; no
source or configuration workaround was applied.

### Refactor contracts

- The documentation registry contains 43 documents in the established order, backed by 22
  canonical reference-source tuples. Tests continue to validate source coverage, stable unique
  routes, local links and anchors, parsing, pagination, and search-visible content.
- Compatibility facades retain the established import paths: `components.tsx` keeps its six
  named re-exports; `content.ts` and `reference.ts` retain the content/reference surface; and
  `Controller.tsx` and `ControllerArtwork.tsx` retain the controller exports.
- Demo source views load the actual controller molecule and the complete Xbox, PlayStation, and
  arcade artwork implementations, rather than the compatibility facades.
- The source viewer loads `site.scss` followed by every Sass dependency in cascade order:
  `_demos.scss`, `_tokens.scss`, `_tokens_light.scss`, `_fonts.scss`, `_base.scss`,
  `_header.scss`, `_landing.scss`, `_playground.scss`, `_landing-footer.scss`, `_docs.scss`,
  `_responsive.scss`, and `_framework.scss`. This matches the ordered `@use` declarations in
  `site.scss`.
- The production CSS is byte-identical to the pre-extraction baseline: 38,665 bytes, SHA-256
  `BC5832E75AF71CED16817FF61CB9962E7CEB567C515E66ED4CEF0B9CDDD5C9ED`.

### Fresh browser verification

- Desktop light and dark themes rendered without a visual failure.
- On the host-bridge framework tabs, keyboard End selected Angular and moved focus to its tab.
- Simulated input advanced the playground from `NODE 01` to `NODE 02`; selection then focused
  `Living room`.
- Navigating away from the running playground removed its controls on the destination route,
  confirming the route teardown behavior visible to the user.
- Search opened with focus in its input, and search filtering narrowed the result set. Escape
  closed the dialog but left focus on the document rather than returning it to the Search
  trigger. This is an accepted pre-existing focus-restoration defect, unchanged by the refactor
  and characterized by the executable safeguard test.
- A genuine `390 × 844` CSS-pixel viewport was inspected in light and dark themes. The mobile
  menu control was available, the narrow layout remained intact, and page inspection reported
  zero horizontal overflow.

### Limits and unverified behavior

- Physical controller behavior was not verified; no physical controller was connected.
- Native Gamepad API permissions and device telemetry remain browser- and hardware-dependent and
  were not exercised.
- Browser back/forward traversal has executable jsdom coverage, but no separate live Edge
  back/forward journey was run.
- Reduced-motion behavior was not runtime-emulated. The reduced-motion rules are nevertheless
  proven unchanged by the exact compiled-CSS byte and SHA-256 match above.
- Desktop and mobile screenshots were inspected through the browser automation surface but were
  not persisted. The available capture displayed screenshots without exposing a writable
  screenshot artifact path.

## Historical baseline — T1 safeguards — 2026-09-16

This baseline was captured before the extractions from the local Vite server at
`http://127.0.0.1:5173/`. Its counts describe T1 and are retained for comparison with the fresh
integrated results above.

### Automated checks

- `npm --prefix website run typecheck`: passed (exit 0).
- `npm --prefix website test`: passed (exit 0): 12 test files, 70 passed tests.
- `npm --prefix website run build`: passed (exit 0): 129 modules transformed; production build
  completed in 1.29 s.

The focused safeguard suite covered hash-route changes, browser `history.back()`,
`history.forward()`, and `history.go(-1)` traversal with real `hashchange` delivery, anchors,
unknown documents, unavailable theme storage, and demo suspension for search/menu. It also sent
Escape through the dialog path and characterized the current focus result (body rather than the
Search trigger). Existing documentation tests covered framework-tab keyboard selection and
code-copy success/failure.

### Browser baseline

- Desktop: a manually driven local Edge session returned an 1887 × 860 viewport screenshot. The
  interactive playground rendered in both dark and light themes without an observed visual
  failure.
- Simulated input: the default simulated input started the playground, activated the right
  control, and advanced the sandbox from `NODE 01` to `NODE 02`, with browser focus on
  `Living room`.
- Route teardown: navigating from the running playground to `#/docs/host-bridge` rendered the
  destination with no playground controls remaining. This visually verified route replacement,
  but did not instrument service destruction.
- Keyboard: on the host-bridge framework tabs, focusing Vanilla TS and pressing End selected and
  focused Angular.
- Search: opening Search documentation focused the input. Escape closed the dialog but left
  focus on the document web area instead of the invoking Search documentation button. This is
  the accepted pre-existing focus-restoration defect; the refactor did not change it.

### Mobile responsive baseline

- Edge applied an actual `390 × 844` CSS-pixel viewport to
  `http://127.0.0.1:5173/#/docs/introduction`. Inspection reported `window.innerWidth = 390` and
  `window.innerHeight = 844`, with the mobile-menu control displayed. The override was reset;
  the normal viewport subsequently reported `1912 × 914`.
- In light and dark themes, the compact header, single-column introduction, and
  interactive-preview card remained visible. Inspection reported no horizontal overflow for
  either `.site-header` or `main`.
