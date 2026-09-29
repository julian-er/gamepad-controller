# Website design

The audience is developers integrating controller navigation into web interfaces. The
landing page introduces the engine; documentation is a working reference for reading,
copying examples, and exploring the existing playgrounds.

## Visual direction

Retain the supplied console-inspired identity: slate surfaces, mint navigation and focus,
Geist headings/body, and JetBrains Mono for code and reference labels. Documentation's
signature is a clear title block between persistent navigation and a quiet page index.
Use space and type to distinguish the article from the rails; avoid decorative gradients,
extra imagery, and display effects in long-form reference material.

The original [Stitch reference](design/stitch/DESIGN.md) is provenance, not a generated
runtime contract. Existing runtime Sass remains the canonical token source. This guide
records the implemented refresh without changing the original design export.

## Runtime ownership

| Role | Owner and consumption |
| --- | --- |
| Dark/light palette and font families | `src/styles/_tokens.scss` and `_tokens_light.scss` export `--gc-*`; `_base.scss` maps them to semantic surface, text, and accent aliases |
| Documentation reading size | `_docs.scss`: `--doc-body-size` drives 16px article paragraphs |
| Documentation labels | `_docs.scss`: `--doc-label-size` drives 11px group, eyebrow, and page-index labels |
| Navigation rail | `_docs.scss`: `--doc-rail-width` drives the 272px desktop sidebar and article offset |
| Reference containers | `_docs.scss`: `--doc-radius` drives 8px navigation, code, table, note, and pagination corners |
| Scrollbars | `_base.scss`: semantic thumb/track/hover/active aliases inherit theme colors, with system behavior in forced colors |
| Responsive geometry | `_responsive.scss`: page index hides at 1250px; sidebar becomes 240px at 1000px and a drawer at 760px |

Navigation uses 14px text; code uses 13px on desktop and 12px on mobile; table cells use
14px. Article measure is bounded at 72ch; the article container is capped at 1000px.
Long code and tables scroll inside their own surfaces. Tables have named keyboard-focusable
regions. Both themes retain identical content hierarchy and visible mint keyboard focus.
No new fonts, icon sets, UI libraries, or motion dependencies are required.

## Preserved contracts

Keep routes, navigation labels, section IDs, guide copy, source links, package identity,
SEO metadata, framework selection/copy behavior, and demo lifecycle contracts stable.
The landing layout and controller presentation are separate from documentation reading
styles. Shared search and scrollbar presentation follow the same existing theme aliases.

Before/after captures and the scored audit live in [docs-refresh](design/docs-refresh/README.md).
Checks and browser limits are recorded in [VERIFICATION.md](VERIFICATION.md).
