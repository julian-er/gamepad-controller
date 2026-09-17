# gamepad-controller website

A React + TypeScript landing page and documentation site, styled with Sass and the supplied Stitch design system.

## Run locally

From the repository root:

```sh
pnpm install
pnpm --filter gamepad-controller-website run dev
```

Open the local URL printed by Vite.

```sh
pnpm --filter gamepad-controller-website run typecheck
pnpm --filter gamepad-controller-website run test
pnpm --filter gamepad-controller-website run build
pnpm --filter gamepad-controller-website run preview
```

The website has its own Vitest/jsdom development dependencies in the workspace.

## Structure

- `src/main.tsx`: minimal `createRoot`/`StrictMode` bootstrap and global Sass entry.
- `src/app/App.tsx`: application shell; `src/hooks/` owns theme and route state; `src/pages/` owns landing, documentation, and not-found pages; `src/templates/` owns the documentation layout.
- `src/content.ts`: documentation/type compatibility facade. `src/content/` owns content types, authored copy, reference metadata and loading, document generation, and registry assembly.
- `src/examples.ts`: Vanilla TS/JavaScript, React, and Angular examples and lifecycle adapters.
- `src/reference.ts`: compatibility facade for allowlisted local consumer Markdown guides and skills; parsing and link implementations live in `src/utils/markdown.ts` and `src/utils/reference-link.ts`. Markdown is content only; raw HTML and embedded instructions are not executed.
- `src/components/{atoms,molecules,organisms}/`: atomic implementations for the site's UI; `src/components.tsx` is the six-export compatibility facade for keyboard-accessible framework tabs, selected-code copying, and inline source links.
- `src/Playground.tsx`: real GamepadService integration and lifecycle.
- `src/Controller.tsx` and `src/ControllerArtwork.tsx`: compatibility facades for the controller previews and artwork; geometry and bindings are implemented in `src/components/molecules/Controller/`.
- `src/simulation.ts`: complete, ordered custom-event snapshots for the demo.
- `src/styles/site.scss`: ordered Sass facade; `_*.scss` files in `src/styles/` contain the token and application-style implementations.
- `src/demos/source-files.ts`: lazy source-viewer manifest.
- `public/images/`: three full-resolution Stitch marketing images.
- `design/stitch/`: original screen code, previews, token files, design systems, and source manifest.
- `tests/`: React integration checks using the actual library.

Runtime dependencies are only React, React DOM, and gamepad-controller. There is no Tailwind, router, UI kit, icon package, animation library, or syntax-highlighting dependency. Fonts and images are self-hosted.

## Local library integration

The dependency is `gamepad-controller: workspace:*`. Vite and TypeScript resolve its public entry point to `../src/index.ts`, so the playground documents and exercises the current checkout without depending on a stale library build. It imports no private library modules.

## Playground

Select **Simulated input** and **Start demo**. Use the on-screen buttons, or focus a tile and use arrow keys and Enter. Simulation sends complete baseline/press/release snapshots through the library's custom-event transport, with website-specific event names. The library handles geometry, focus, and selection.

Select **Native controller**, start the demo, connect hardware, and press a controller button. Controller visibility and Gamepad API permissions are browser-dependent. Native telemetry reads the browser's axes; input actions and focus come from the service. Skins change the preview and simulated device identity; they do not remap physical hardware.

Stop, route changes, configuration changes, and unmount destroy the owned service. Simulation releases held inputs when focus leaves the sandbox, on pointer cancellation, window blur, or page hiding.

## Deployment

Build to `website/dist/` and serve that directory with any static host over HTTPS. Hash routes support deep documentation links without server rewrites. Vite uses a relative asset base so the site can be hosted under a repository subdirectory. Never publish `design/stitch/` as executable site content: these raw reference exports include third-party CDN code.

The `main` branch is deployed automatically to GitHub Pages at https://julian-er.github.io/gamepad-controller/ by `.github/workflows/pages.yml`.

## Documentation maintenance

Verify changes against the local public API in `../src/index.ts`, `../docs/API.md`, and the service options/events. Keep authored copy in `src/content/authored.ts`, reference routes and the allowlist in `src/content/reference-sources.ts`, assembly and ordering in `src/content/registry.ts`, and parsing and links in `src/utils/markdown.ts` and `src/utils/reference-link.ts`. Version 1.0.0 is the planned first publication, and the site labels it unreleased. The design's sample performance numbers were deliberately excluded because they were not measurements of this library.

The site includes dedicated Angular and vanilla guides, all consumer guides listed in `referenceSources`, and four AI consumer skills with their references. Source Markdown changes are incorporated at build time. The three primary framework examples are read directly from `../docs/USAGE_VANILLA.md`, `../docs/USAGE_REACT.md` and `../docs/USAGE_ANGULAR.md`. Internal Markdown links resolve to local documentation routes, including section anchors. The site uses the public library entry point; it does not advertise an Angular directive or a React package subpath.

Framework tabs support Left/Right, Home/End, selection with a mouse, and copying the active example. Terminal, CSS, schema text, and harness commands retain their own language labels. Framework-neutral fragments preserve their source execution order; complete service-construction examples can show framework-specific lifecycle placement. Reset, teardown and other fragments do not create a new service implicitly. Recipes still require the application elements and handlers described in their guide.

See `VERIFICATION.md` for checks and runtime limitations.

## Example gallery

Open `#/docs/examples` after starting the website. All eight cookbook projects are live: Treasure Tiles, film catalog, portfolio, focus timer, recipe browser, product explorer, plan chooser, and quiz night. Each route supports pointer and native keyboard interaction while idle, plus native controller input or complete simulated snapshots after Start.

The app owns content, scoring, timers, and local views. `DemoShell` and `useDemoSession` own controller input. Stop preserves app state; Reset remounts fresh app state. Leaving the route, hiding the page, blurring the window, or opening documentation search/navigation stops input. The focus timer also pauses. Nothing resumes automatically.

Every app page includes its challenge, library concepts, cookbook section, and a source viewer. Source files load individually on demand: the actual app, shared host and dialog where applicable, controller/artwork modules, simulation, `site.scss` plus every ordered Sass partial, theme tokens, and checkout configuration. Copy copies exactly the selected source text. These components require the existing website checkout; they are not standalone bundles. `registry.ts` references the other app modules, fonts live under `public/fonts`, and Sass resolves its partials through `site.scss`. The standalone vanilla Treasure Tiles starter is in `../docs/PROJECT_COOKBOOK.md`.

The gallery uses data-attribute focus presentation. The current library's class-based focus updates can retrigger its DOM observer indefinitely while a native modal is open; the gallery avoids that interaction with the public `useDataAttributes` option. The original basic playground retains its existing presentation.

Recipe scrolling targets the service's `.demo-app-surface` viewport. Right-stick controls send full four-axis snapshots and reset on release or cancellation. Use the 10-second focus-timer preset for a short verification journey. Physical controller coverage and browser evidence are recorded in `VERIFICATION.md`.
