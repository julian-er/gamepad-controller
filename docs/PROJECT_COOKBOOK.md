# Project cookbook

Build something you can explore from the couch. These projects use gamepad-controller to move focus and activate ordinary web controls. Your application owns the content, state, routes, and game rules.

All eight projects are playable in the documentation site Example gallery, with controller simulation, challenges, API explanations, and source files. Try a project there, then use the briefs below to build your own version. The original interactive playground remains available for exploring basic controller input.

The gallery uses React components inside a shared documentation host; its source viewer identifies the required support files. For a standalone starting point, the complete vanilla Treasure Tiles example below includes its own HTML, CSS, and JavaScript.

## Choose a project

| Category | Concept | What the user tries | Library features to explore |
| --- | --- | --- | --- |
| Website | Living-room film catalog | Browse posters, open details, return to the same poster | Spatial navigation, active scopes, focus restoration |
| Website | Playable portfolio | Explore project cards and follow a case-study link | Native links, visible focus, responsive geometry |
| Small app | Focus timer | Choose a duration, start a session, open settings | Horizontal navigation, buttons, scoped settings |
| Small app | Recipe browser | Filter recipes, choose a dish, browse cooking steps | Target refresh, ordered targets, content scrolling |
| Landing page | Product explorer | Compare features and open a product preview | Spatial navigation, buttons, scoped preview |
| Landing page | Plan chooser | Compare plans and inspect a pricing explanation | Horizontal navigation, semantic links, scoped details |
| Mini game | Treasure Tiles | Reveal tiles until you find the treasure | Spatial navigation, primary selection, cancelled back action |
| Mini game | Quiz night | Choose an answer and advance to the next question | Explicit target order, refresh, focus after rendering |

## Start here: Treasure Tiles

This small DOM game demonstrates a complete interaction: move between tiles, press the primary select button to reveal one, and use the back button to start a new round. Mouse clicks and keyboard Tab/Enter also work through native buttons. The library handles controller focus and activation; the application handles scoring and tile contents.

Prerequisites: an existing vanilla JavaScript project with an ES-module bundler and gamepad-controller installed. Before the first release, follow [local tarball installation](BUILDING.md#testing-the-package-inside-another-project). See [the vanilla guide](USAGE_VANILLA.md) for setup, or port the mount/cleanup ownership using [React](USAGE_REACT.md) or [Angular](USAGE_ANGULAR.md).

Create these three files in that project's served application directory. If your project already has an HTML entry point, put the markup into its body and adapt the asset paths. Render only one instance of this example at a time.

### HTML: index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Treasure Tiles</title>
    <link rel="stylesheet" href="./treasure.css">
  </head>
  <body>
    <main id="treasure">
      <h1>Treasure Tiles</h1>
      <p>Move with the D-pad or left stick. Select to reveal. Back starts a new round.</p>
      <p>You can also use Tab and Enter, or click a tile.</p>
      <div class="board" role="group" aria-label="Treasure board"></div>
      <p class="result" role="status"></p>
      <button class="restart" type="button">New round</button>
    </main>
    <script type="module" src="./treasure.js"></script>
  </body>
</html>
```

### CSS: treasure.css

```css
body { font-family: system-ui, sans-serif; margin: 2rem; }
#treasure { max-width: 32rem; margin: auto; }
.board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.board button { min-height: 5rem; }
button { font: inherit; padding: 0.75rem; cursor: pointer; }
button[data-gamepad-focused="true"], button:focus-visible {
  outline: 3px solid #4338ca;
  outline-offset: 4px;
}
.result { min-height: 3rem; }
```

### JavaScript: treasure.js

```js
import { GamepadService } from 'gamepad-controller';

export function mountTreasure() {
  const root = document.querySelector('#treasure');
  const board = root.querySelector('.board');
  const result = root.querySelector('.result');
  const restart = root.querySelector('.restart');
  const tiles = Array.from({ length: 9 }, (_, index) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.dataset.tile = String(index);
    return tile;
  });
  board.replaceChildren(...tiles);

  let treasure = 0;
  let finished = false;
  const revealed = new Set();
  function newRound() {
    treasure = Math.floor(Math.random() * tiles.length);
    finished = false;
    revealed.clear();
    tiles.forEach((tile, index) => {
      tile.textContent = `Tile ${index + 1}`;
      tile.setAttribute('aria-label', `Tile ${index + 1}, hidden`);
    });
    result.textContent = 'Find the treasure. Each new tile counts as one attempt.';
  }
  function onClick(event) {
    const tile = event.target instanceof Element
      ? event.target.closest('button[data-tile]') : null;
    if (!tile || !board.contains(tile) || finished) return;
    const index = Number(tile.dataset.tile);
    if (revealed.has(index)) return;
    revealed.add(index);
    finished = index === treasure;
    tile.textContent = finished ? 'Treasure!' : 'Empty';
    tile.setAttribute('aria-label', `Tile ${index + 1}, ${tile.textContent}`);
    result.textContent = finished
      ? `Treasure found in ${revealed.size} attempts! Start a new round to play again.`
      : `Attempts: ${revealed.size}. Keep looking!`;
  }

  const service = new GamepadService({
    containerSelector: '#treasure',
    navigationMode: 'spatial',
  });
  function restartRound() {
    newRound();
    service.navigateToIndex(0);
  }
  board.addEventListener('click', onClick);
  restart.addEventListener('click', restartRound);
  service.on('beforeaction', (event) => {
    if (event.type === 'back') {
      event.preventDefault();
      restartRound();
    }
  });
  newRound();
  service.init();
  service.setElements([...tiles, restart]);

  return () => {
    board.removeEventListener('click', onClick);
    restart.removeEventListener('click', restartRound);
    service.destroy();
  };
}

let dispose = mountTreasure();
window.addEventListener('pagehide', () => dispose());
window.addEventListener('pageshow', (event) => {
  if (event.persisted) dispose = mountTreasure();
});
```

Run your project's development server, open the page, connect a controller, and press a button so the browser can expose it. Native controller availability depends on the browser and its Gamepad API permissions. Keep the keyboard and pointer controls available when no controller is detected.

The board uses spatial navigation even though CSS displays three columns: the library follows rendered geometry and the restart button can live outside the board. Revealed tiles remain focusable so the board stays predictable; the application ignores repeat reveals. Only text changes during a round, so the target list does not need rebuilding. Back is cancelled synchronously before resetting, preventing the default history action. Use ordinary click handlers for game logic so pointer, keyboard, and controller activation share the same path.

### Try these experiments

- Reveal the same empty tile twice: the attempt count should increase only once.
- Hold primary select: it should not reveal a second tile without a new press.
- Find the treasure, then select another tile: the finished round should stay unchanged.
- Press Back: a new round should begin with focus on the first tile and no history navigation.
- Change the CSS to two columns: spatial movement should follow the new layout without changing navigation code.
- Start a new round with the keyboard or pointer: the first tile receives focus through the same restart handler.

## Websites: browse and explore

### Living-room film catalog

Build a responsive collection of poster buttons. Selecting a poster opens details with Play, Save, and Close controls. Use `navigationMode: 'spatial'` for the poster layout and an explicit scope for a custom details panel: show it, call `setActiveScope(panel)`, then call `clearActiveScope()` before hiding it. Keep the panel inside the service container and include its controls in the discovered or manual target list.

Try opening the last poster, navigating inside its details, and closing it. Focus should return to that poster if it remains eligible. Handle Close through a native button and intercept `beforeaction` for Back while the panel is open. Test a narrow layout and a filtered-out poster: the application needs an eligible fallback when the original target disappears. The app supplies media playback and saved-item storage.

### Playable portfolio

Turn project cards into real links, arranged around a hero and a contact section. Use spatial navigation and a visible focus style that fits your visual design. Native links keep the portfolio usable without a controller. Start with normal page navigation; an SPA router must cancel the relevant select action synchronously before routing, as explained in the [API reference](API.md#focus-presentation).

Try reaching every case study on both wide and narrow layouts. Avoid making decorative cards focusable or adding a second controller-only route system. Add a custom project preview as an extension once ordinary link activation works.

## Small apps: accomplish a task

### Focus timer

Build a horizontal row of duration presets and a Start/Pause button with `navigationMode: 'horizontal'`. Your app owns the clock; the library activates the existing buttons. Add a settings panel using an active scope. If settings need vertical navigation, use a spatial layout for the whole app instead of forcing every control into a horizontal sequence.

Try repeated Start presses, leaving and returning to the view, and opening settings during a session. Define whether the timer keeps running when the view unmounts. Dispose the service and any app-owned intervals independently. Do not assume gamepad navigation implements text entry for editable durations; offer preset buttons or a separate input method.

### Recipe browser

Build category filters above recipe buttons. When filtering changes the DOM, call `refresh()` after rendering. If using `setElements()`, supply the new ordered list before refreshing; refresh alone does not replace a manual registry. Put the recipe steps in scrollable content and explore the library's right-stick scrolling options in [Configuration](CONFIGURATION.md).

Try a filter with zero results, then restore the full collection. Keep filters reachable and choose a visible fallback if the focused recipe disappears. Add saved recipes as a later app feature; persistence belongs to the application.

## Landing pages: make the offer explorable

### Product explorer

Build a hero call to action, feature buttons, and a product-preview panel. Use spatial navigation to follow the visual arrangement. Keep long marketing paragraphs as readable content instead of turning each paragraph into a navigation stop. A preview panel can demonstrate scoped navigation without leaving the page.

Try reaching the call to action from the last feature and closing the preview with both a button and controller Back. If the preview loads asynchronously, render usable controls before refreshing targets. The app owns animation and product rendering; a small static preview is the simplest first experiment.

### Plan chooser

Build a row of plan cards, each with a real destination link and a button that opens pricing details. Use horizontal navigation for a single-row comparison; use spatial navigation if the page wraps into multiple rows. Explicit scopes keep a pricing explanation separate from the underlying actions.

Try switching between monthly and annual pricing while a plan remains focused. Update existing text where possible to preserve focus. If controls are replaced, refresh after rendering and restore an eligible target. Start with demo destinations; checkout and billing are separate application integrations.

## Mini games: play through ordinary controls

### Extend Treasure Tiles

Add a move limit, a round summary, or difficulty buttons that change the board size. Rebuild the target registry after adding or removing tiles, then choose the first eligible tile. To show a round-summary panel, use an active scope and include a New round button inside it.

Try shrinking the board while its last tile is focused. This exposes stale target lists immediately. Keep one owned service for the view and dispose it on teardown. A move limit needs only application state; it does not require new input handling.

### Quiz night

Render one question with four answer buttons and a Next button. Use `setElements()` for a deliberate answer order and ordinary click handlers for answers. After rendering the next question, replace the target list and focus the first answer. Keep the score and answer lock in application state so repeated activation cannot award points twice.

Try answering twice, advancing after the final question, and restarting. If answer buttons become disabled, provide an eligible Next control and deliberately move focus there. Begin with one shared controller; per-player ownership and multiplayer scoring need additional app logic.

## Choose the right level of ambition

The documentation gallery makes all eight concepts immediately playable. Each app demonstrates a distinct interaction and has its own implementation and maintenance needs, supported by a shared input host. Use the concept briefs to adapt an experience to your project, inspect the gallery's React app and support files to understand its implementation, or begin with the standalone vanilla Treasure Tiles starter when you want a complete HTML, CSS, and JavaScript example outside the documentation host.

DOM quizzes, tile games, menus, and turn-based choices fit the library's focus-and-activate model. Continuous character movement, physics, and canvas gameplay require an application game loop and input policy. Use the library for those games' menus first; raw button events do not supply a physics engine or a complete analog gameplay loop.

After trying the starter, explore the live film catalog and its scoped details panel. It demonstrates entering and leaving a secondary UI while preserving focus. Adapt that pattern to your own collection, then verify return focus, filtering, and narrow layouts before expanding it into a full media app.

## Checklist for every project

- Mount after rendering the owned container; destroy the service when removing its view.
- Keep real buttons and links, keyboard access, readable labels, and visible focus.
- Keep one automatic activation path: avoid running the same business action in both a click listener and a library select listener.
- Refresh after DOM changes; replace manual target lists when their membership changes.
- Cancel a default action in `beforeaction`, synchronously, when the application takes ownership of it.
- Test hidden and disabled controls, no results, disconnects, and focus return from panels.
- Use the [configuration guide](CONFIGURATION.md) and [public contracts](PUBLIC_API.md) when extending a concept.

