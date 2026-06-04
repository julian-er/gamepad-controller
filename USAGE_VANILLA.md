# Using `gamepad-controller` in Vanilla JS

## Install

```bash
npm install gamepad-controller
```

Or load the ESM build directly from a CDN (no build step):

```html
<script type="module">
  import { initGamepadForPage } from 'https://esm.sh/gamepad-controller';
  initGamepadForPage();
</script>
```

## Quick start (one-liner)

```js
import { initGamepadForPage } from 'gamepad-controller';

const gamepad = initGamepadForPage();

gamepad.on('focus', (el, index) => console.log('focused', index, el));
gamepad.on('select', (el) => console.log('selected', el));
```

`initGamepadForPage()` auto-detects focusable elements (`button`, `a[href]`, `[tabindex]`,
`.nav-item`, `.gamepad-focusable`, …), enables D-pad/stick navigation, the back button
(B/Circle), and shoulder navigation (L1/R1).

> **Secure context:** the native Gamepad API only works over HTTPS or `localhost`.

## Subscribing to events

Events support **multiple independent subscribers** — each `on()` returns an unsubscribe
function:

```js
const offFocus = gamepad.on('focus', (el, i) => { /* ... */ });
// later
offFocus();
```

Available events: `focus`, `select`, `controllerconnect`, `controllerdisconnect`,
`backbutton`, `navigationmenuopen`, `buttondown`, `buttonup`, `contextswitch`.

> If you subscribe to `backbutton`, your handler runs instead of the default
> `history.back()`. With no `backbutton` subscriber, the back button navigates browser history.

## Scoping & configuration

```js
import { gamepadService } from 'gamepad-controller';

const gamepad = gamepadService('.app', {
  navigationMode: 'spatial',   // 'spatial' | 'grid'
  focusedClass: 'is-focused',  // when useDataAttributes is false
  useDataAttributes: true,     // style via [data-gamepad-focused] instead of a class
  debounceTime: 150,
  deadzone: 0.1,
  logLevel: 'error',           // 'silent' | 'error' | 'warn' | 'info' | 'debug'
});
```

## Styling

Styles are **opt-in**. Either bring your own CSS targeting the data attributes…

```css
[data-gamepad-focused="true"] { outline: 2px solid #007bff; }
[data-gamepad-selected="true"] { background: #007bff; color: #fff; }
```

…or inject the bundled defaults:

```js
import { gamepadUtils } from 'gamepad-controller';
gamepadUtils.addStyles();          // inject default styles
gamepadUtils.printCSSExamples();   // print copy-pasteable CSS to the console
```

## Dual-context navigation (menu + content)

```js
import { initDualContextGamepad, gamepadUtils } from 'gamepad-controller';

initDualContextGamepad({
  menuContextSelector: '.nav-menu',
  contentContextSelector: '.content',
});

// L1/R1 move within the menu, the left stick moves within content.
gamepadUtils.switchToMenu();
gamepadUtils.switchToContent();
```

## Custom-event mode (WinUI / host integrations)

When the native Gamepad API is unavailable, drive the library from custom DOM events:

```js
import { initCustomEventGamepad } from 'gamepad-controller';

initCustomEventGamepad({
  customConnectedEvent: 'hubgamepadconnected',
  customStateChangedEvent: 'hubgamepadstatechanged',
  customDisconnectedEvent: 'hubgamepaddisconnected',
});

// The host dispatches state each frame:
window.dispatchEvent(new CustomEvent('hubgamepadstatechanged', {
  detail: { gamepad: /* a Gamepad-shaped object: { index, id, buttons, axes } */ },
}));
```

## Cleanup

```js
import { cleanupGamepadService } from 'gamepad-controller';
cleanupGamepadService(); // stops the loop and removes all listeners (native + custom)
```

## Refreshing after DOM changes

```js
import { gamepadUtils } from 'gamepad-controller';
document.body.appendChild(newButton);
gamepadUtils.refresh(); // re-detect navigable elements
```
