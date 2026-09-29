# Home page review and refresh — 2026-09-29

Mode: refresh within the existing React/Sass identity. Retain the content, assets,
navigation destinations, package identity, and explicit playground Start boundary.

## Review and implemented improvements

| Finding | Evidence | Impact / effort / risk | Resolution |
| --- | --- | --- | --- |
| Hero separates the main message from the product image by a long vertical stack | Before desktop capture: controller stage begins around 600px and facts are below the first screen | High / medium / low | Split copy/image composition, balanced headline, fact strip visible within the 900px desktop capture |
| Install command is easy to overlook | `.install-command`: unframed 11px text; local-build note competes with the image boundary | Medium / low / low | Bordered copy control grouped with the actions and installation note |
| Reading and link sizes are inconsistent | `.use-case-grid p` and `.feature-grid p`: 12px; feature links and footer: 11px | High / low / low | 16px feature prose, 14px links/actions, 13px footer links |
| Integration examples and playground choices are small | Integration code 11px/10px; mode/input 10px; standard button labels 8px | High / low / low | 13px/12px integration code, 12px choices, larger control rows and telemetry labels |
| Light primary button misses normal-text contrast | Existing `#059669` / white pair: calculated 3.77:1 | High / low / low | Existing semantic accent `#047857` / white: measured 5.48:1 |
| Phone actions lack a stable common edge when wrapping | Larger action labels no longer fit side by side at 375px | Medium / low / low | Full-width stacked actions, preserving reading order |

## Rubric comparison

These scores reflect source and visual review, not measured usability or full accessibility
conformance. The same full-page route is captured at 1280 and 375 × 900 in each theme.

| Dimension | Before | After | Evidence |
| --- | --- | --- | --- |
| Hierarchy | 3 | 4 | Split hero with one primary action and adjacent controller image; desktop screenshots |
| Typography | 2 | 4 | Computed feature prose now 16px; larger integration code, links, footer, and controls |
| Color and contrast | 3 | 4 | Light primary improves 3.77→5.48:1; dark primary measures 6.28:1 |
| Layout and spacing | 3 | 4 | Hero closes at about 784px at 1280 width; bounded section shell and full-width phone actions |
| Components and consistency | 3 | 4 | Existing buttons, install command, framework tabs, playground, cards and icons retained |
| States | 3 | 3 | Copy success, selected tab, simulated selection, Start/Stop and navigation preserved |
| Responsiveness | 3 | 4 | No page overflow at 320/375/768/1280; final three-width production theme matrix |
| Accessibility | 3 | 4 | Better action contrast, larger targets/text; keyboard tab selection and copy verified |
| Performance | 4 | 4 | Same self-hosted fonts/images; no new dependencies; production CSS 9.72 kB gzip |
| Content | 4 | 4 | All existing headlines, claims, links, package facts, image alternatives and guide content retained |

## Before and after

| Width | Light | Dark |
| --- | --- | --- |
| 1280 | [Before](before-light-1280.jpg) / [After](after-light-1280.jpg) | [Before](before-dark-1280.jpg) / [After](after-dark-1280.jpg) |
| 375 | [Before](before-light-375.jpg) / [After](after-light-375.jpg) | [Before](before-dark-375.jpg) / [After](after-dark-375.jpg) |
| 768 | [Final light](after-light-768.jpg) | [Final dark](after-dark-768.jpg) |

The 768px final layout was verified, but a separate before capture was not retained at
that width. Compact hero captures are also available in [light](after-hero-light-1280.jpg)
and [dark](after-hero-dark-1280.jpg).

## Preserved contracts and limits

No route, label, guide text, SEO metadata, source link, image alternative, demo service,
snapshot protocol, or framework lifecycle implementation changed. Existing documentation
refresh work is preserved. The original image assets and integration examples are reused.

Physical controller, 3D/GPU, screen-reader, forced-colors, 200% zoom, reduced-motion
emulation, field performance, and additional browser-engine coverage were not part of
this pass. The historical search focus-restoration defect is unchanged. These areas
remain separate interaction/hardware verification work; no new motion was added.
See [VERIFICATION.md](../../VERIFICATION.md) for executed checks and browser evidence.
