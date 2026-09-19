# Website verification record

## Three.js controller playground — 2026-09-19

This record covers the integrated home and documentation playground at the current working-tree
artifact. Earlier sections remain historical baselines.

### Automated and build checks

- `pnpm --filter gamepad-ui-engine-website run typecheck`: passed (exit 0).
- `pnpm --filter gamepad-ui-engine-website run test`: passed (exit 0): 14 files, 95 tests.
- `pnpm --filter gamepad-ui-engine-website run build`: passed (exit 0): 180 modules transformed.
- `git diff --check`: passed (exit 0).
- The source-viewer dependency manifest includes `controller-preview.ts` alongside the shared demo
  session and simulation sources.

The production build keeps the relative Vite base. The main JavaScript is recorded by Vite as
148.20 kB gzip, compared with the accepted 144.90 kB gzip baseline: a 3.30 kB initial delta,
within the 10 kB limit. The deferred renderer, shared rig/Three, and model adapters total about
150 kB gzip, within the 250 KiB deferred limit. Vite reports decimal kB; these values are not
labelled KiB.

### Production browser verification

- The production preview was mounted at `/gamepad-controller/`, where relative JavaScript chunks,
  CSS, fonts, and both GLBs resolved from that non-root path.
- Chrome 153 and Edge 140 were exercised at 1280 × 800 and 390 × 844 CSS pixels. The home CTA
  reached the idle Start control without starting input. Home and documentation playgrounds
  started simulation, moved focus, selected a tile, released input, stopped, and removed the
  canvas/service on route teardown. No horizontal overflow or page error was observed.
- All eight gallery routes—Treasure Tiles, film catalog, portfolio, focus timer, recipe browser,
  product explorer, plan chooser, and quiz night—started simulation, moved focus, selected or
  changed the app, released input, stopped, and tore down on navigation. Treasure Tiles was also
  checked for its complete snapshot simulation path and preserved app state across Stop.
- Screenshots and raw browser evidence are retained with the T6 run evidence. These desktop/mobile
  checks use desktop Chrome and Edge viewport emulation; they are not physical mobile-device runs.

### 3D budgets and supplied-asset exceptions

The models load only after Start, a visible preview, and an explicit 3D choice. Cold and running
2D journeys request no Three.js or GLB resources; selecting one style does not fetch the other.

| Model | Original bytes | Source triangles | Rendered triangles | Draw calls | 30 s active-input runs |
| --- | ---: | ---: | ---: | ---: | --- |
| Xbox Elite | 15,218,700 | 109,702 | 113,926 | 38 | median 8.3/8.3/8.3 ms; p95 9.1/9.0/9.0 ms |
| PS5 | 17,035,156 | 138,544 | 131,503 | 39 | median 8.3/8.3/8.3 ms; p95 9.0/8.9/8.9 ms |

Both models remain within the limits of 60 draw calls, 20 ms median, and 33 ms p95 on the test
machine (Windows, Chrome 153 headless, ANGLE/D3D11, NVIDIA GeForce RTX 4060 Ti, DPR 1.5). Their
bytes and triangle counts are documented exceptions to the original asset limits and are managed
through explicit opt-in loading. Xbox geometry is grouped into semantic controls at runtime and
its transmission is disabled. PS5 transparent double-sided materials use a single rendering pass
and transmission is disabled. No environment map, shadow, or postprocessing cost is added.

Deterministic tests cover sustained slow-render demand lowering DPR and then returning to the 2D
fallback. No actual slow-GPU stress test was performed, so this is a tested policy rather than a
hardware performance claim.

### Limits and unverified hardware

- No physical Xbox controller or DualSense was available. Physical compatibility, reconnect,
  transport-specific identifiers, multi-pad behavior on real devices, and browser/OS interception
  of system buttons remain unverified. This does not replace the deterministic complete-snapshot
  and multi-pad software coverage.
- Visual labels describe a selected style or conservative family hint, never exact detected
  hardware or official endorsement. Gamepad API exposure and identifiers vary by browser, OS,
  connection, and permission state.
- Chrome/Edge desktop browser evidence does not establish universal browser or mobile GPU support.

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
