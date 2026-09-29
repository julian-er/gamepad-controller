# Documentation refresh — 2026-09-29

Mode: refresh. Improve reading and navigation within the existing React/Sass identity.
Installation is the repeatable visual baseline. Each `before`/`after` image is the same
route at 1280, 768, or 375 CSS pixels wide and 900 high, in light or dark mode.

| Issue | Evidence | Impact | Effort | Risk | Resolution |
| --- | --- | --- | --- | --- | --- |
| Small reference text | `.doc-section > p`: 13px baseline | High | Low | Low | 16px, 1.8 line height, bounded article measure |
| Dense navigation and page index | `.nav-group > a`: 11px; page-index buttons: 10px | High | Low | Low | 14px navigation and 13px index, wider rail and larger rows |
| Weak article/section separation | Baseline title, badges, and first section share an undivided canvas | Medium | Low | Low | Shared `.doc-header`, larger heading scale, ruled title boundary |
| Tiny code controls and examples | Baseline code: 11px desktop/10px mobile; copy label: 9px | High | Low | Low | 13px/12px code, 12px copy controls, stronger line-number contrast |
| Small API tables and no keyboard scroll stop | Table text: 12px/11px; `.table-scroll` lacks tabindex | High | Low | Low | 14px cells and named focusable scroll regions |
| Small search result summaries | `.search-results p`: 11px | Medium | Low | Low | 13px summaries, 15px result titles |

## Rubric comparison

Scores are a design assessment tied to the selectors and screenshots below, not a
claim of measured user outcomes or full accessibility conformance.

| Dimension | Before | After | Evidence |
| --- | --- | --- | --- |
| Hierarchy | 3 | 4 | `.doc-header`, `.doc-section > h2`; desktop/mobile captures |
| Typography | 2 | 4 | Computed paragraph 13→16px, navigation 11→14px; bounded prose |
| Color and contrast | 4 | 4 | Existing semantic text/accent pairs retained; line numbers strengthened |
| Layout and spacing | 3 | 4 | Wider rail, title boundary, consistent article gutters; captures at three widths |
| Components and consistency | 3 | 4 | Shared docs template and section component; scoped radius/size variables |
| States | 3 | 3 | Search empty/results, selected framework, copy success, navigation selection preserved |
| Responsiveness | 3 | 4 | Three-width theme matrix; API tables also checked at 320px with internal overflow |
| Accessibility | 3 | 4 | Focusable named table regions, visible section anchors, larger navigation/copy controls |
| Performance | 4 | 4 | No dependencies/assets added to runtime; production JS 151.32 kB gzip |
| Content | 4 | 4 | Registry, copy, routes, source links and metadata unchanged |

## Before and after

| Width | Light | Dark |
| --- | --- | --- |
| 1280 | [Before](before-light-1280.jpg) / [After](after-light-1280.jpg) | [Before](before-dark-1280.jpg) / [After](after-dark-1280.jpg) |
| 768 | [Before](before-light-768.jpg) / [After](after-light-768.jpg) | [Before](before-dark-768.jpg) / [After](after-dark-768.jpg) |
| 375 | [Before](before-light-375.jpg) / [After](after-light-375.jpg) | [Before](before-dark-375.jpg) / [After](after-dark-375.jpg) |

## Deferred

The previously recorded search focus-restoration defect and a broader modal/drawer
interaction audit are outside this visual refresh. No new demo integration or hardware
behavior was introduced. Full screen-reader, forced-colors, reduced-motion emulation,
physical-device, and field performance checks remain unverified. Existing reduced-motion
rules remain in place. See [verification](../../VERIFICATION.md) for actual checks.
