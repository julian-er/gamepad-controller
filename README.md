# Gamepad Controller

A TypeScript library for advanced gamepad navigation and UI control in web applications. Supports dual context navigation, custom mapping, and is compatible with Xbox, PlayStation, Nintendo, and generic controllers.

> **Heads up (1.0):** the event API uses a **multi-subscriber** `service.on('focus', fn)` API
> (not single-slot `service.onFocus = fn` setters), options can now be passed in a **grouped**
> shape (flat options still work), and a few internal modules moved. If you're upgrading from a
> `0.x`/`1.0.0` build, read the **[Migration Guide](MIGRATION.md)** — most of it is find-and-replace.

## 📚 Guides

- **[BUILDING.md](BUILDING.md)** — build, pack, and test the library locally
- **[USAGE_REACT.md](USAGE_REACT.md)** — React integration (`useGamepad` hook)
- **[USAGE_ANGULAR.md](USAGE_ANGULAR.md)** — Angular integration (injectable service)
- **[USAGE_VANILLA.md](USAGE_VANILLA.md)** — vanilla JS / CDN usage
- **[MIGRATION.md](MIGRATION.md)** — upgrading from `1.0.0`

## ⚙️ Runtime requirements

- **Secure context:** the native Gamepad API only works over **HTTPS or `localhost`**.
- **Background tabs:** the input loop uses `requestAnimationFrame`, which browsers pause for
  hidden/backgrounded tabs — input is not read while the tab is not visible.
- **SSR-safe:** `init()` no-ops in non-browser environments; call it on the client only.
- **Permissions-Policy:** the Gamepad API can be disabled by `Permissions-Policy: gamepad`
  or inside a cross-origin iframe without `allow="gamepad"`. When that happens
  `navigator.getGamepads()` throws `SecurityError`; the library catches it, keeps the input
  loop alive (in case access is granted later), and surfaces it once via the `gamepaderror`
  event — subscribe to it if you want to show a fallback UI.
- **`color-mix` styling:** the optional injected default styles use `color-mix(in srgb, …)`
  (Chromium 111+, Firefox 113+, Safari 16.2+). This affects only the opt-in stylesheet.
- **Logging:** quiet by default (`logLevel: 'error'`). Set `logLevel: 'debug'` while developing.

## 🎮 Features

- **Dual Context Navigation**: Separate navigation for menu and content areas
- **Multiple Navigation Modes**: Grid-based and spatial navigation
- **Controller Support**: Xbox, PlayStation, Nintendo, and generic gamepads
- **TypeScript Support**: Full type declarations and IntelliSense
- **Modern Architecture**: Modular, tree-shakable codebase
- **Memory Management**: Automatic cleanup and leak prevention
- **Customizable Styling**: Optional CSS with theming support
- **Auto-Detection**: Automatically finds navigable elements
- **Accessibility**: ARIA support and keyboard fallbacks
- **Performance Optimized**: Efficient game loop with smart polling

## 📦 Installation

### From Package File (Recommended for Development)

1. Build and package the library:
   ```sh
   npm run build
   npm pack
   ```

2. Install in your project:
   ```sh
   npm install /path/to/gamepad-controller-0.1.0.tgz
   ```

### From NPM (When Published)
```sh
npm install gamepad-controller
```

## 🚀 Quick Start

### Basic Navigation Setup

```ts
import { gamepadService } from 'gamepad-controller';

// Simple one-line initialization for any page
const gamepad = gamepadService('.container', {
    navigationMode: 'spatial',
    focusedClass: 'gamepad-focused',
    selectedClass: 'gamepad-selected'
});
```

### Super Simple Page Setup

```ts
import { initGamepadForPage } from 'gamepad-controller';

// Automatic setup with sensible defaults
const gamepad = initGamepadForPage({
    enableNavigation: true,
    enableBackButton: true
});
```

### Dual Context Navigation

```ts
import { initDualContextGamepad } from 'gamepad-controller';

// Separate navigation for menu and content
const gamepad = initDualContextGamepad({
    menuContextSelector: '.nav-menu, nav',
    contentContextSelector: '.main-content',
    enableDualContext: true
});
```

## 🎮 WinUI Integration & Custom Events

The gamepad controller library supports **dual operation modes** to work in environments where native browser gamepad APIs are restricted, such as **WinUI applications**.

### Native Browser Mode (Default)
Uses standard Web Gamepad API:
- `navigator.getGamepads()` for gamepad state polling
- `gamepadconnected` and `gamepaddisconnected` events
- Works in all modern browsers

### Custom Events Mode (WinUI Integration)
Uses custom DOM events for gamepad input:
- `hubgamepadconnected` for controller connection
- `hubgamepaddisconnected` for controller disconnection  
- `hubgamepadstatechanged` for gamepad state updates

### WinUI Custom Events Setup

```ts
import { initCustomEventGamepad } from 'gamepad-controller';

// Initialize for WinUI with custom events
const gamepad = initCustomEventGamepad({
    enableNavigation: true,
    enableBackButton: true,
    focusedClass: 'gamepad-focused'
});
```

### Custom Event Configuration

```ts
import { initCustomEventGamepad } from 'gamepad-controller';

// Configure custom event names (optional)
const gamepad = initCustomEventGamepad({
    useCustomEvents: true,
    customConnectedEvent: 'myAppGamepadConnected',
    customDisconnectedEvent: 'myAppGamepadDisconnected', 
    customStateChangedEvent: 'myAppGamepadStateChanged',
    enableNavigation: true,
    enableDualContext: true,
    menuContextSelector: '.nav-menu',
    contentContextSelector: '.content'
});
```

### WinUI Event Dispatching

Your WinUI application should dispatch events in this format:

```ts
// Connection event
window.dispatchEvent(new CustomEvent('hubgamepadconnected', {
    detail: {
        gamepad: {
            index: 0,
            connected: true,
            timestamp: performance.now(),
            buttons: [/* button states */],
            axes: [/* axis values */]
        }
    }
}));

// State change event
window.dispatchEvent(new CustomEvent('hubgamepadstatechanged', {
    detail: {
        gamepad: {
            axes: [-0.1658, 0.0557, -0.0194, 0.0200],
            buttons: [
                { pressed: true, value: 1 },
                { pressed: false, value: 0 },
                // ... more buttons
            ],
            connected: true,
            index: 0,
            timestamp: 1753294113544
        }
    }
}));

// Disconnection event
window.dispatchEvent(new CustomEvent('hubgamepaddisconnected', {
    detail: {
        gamepad: {
            index: 0,
            connected: false,
            timestamp: performance.now()
        }
    }
}));
```

### Custom Events API Compatibility

The custom events mode maintains **full API compatibility** with the native mode:
- Same events via `on(event, cb)` (`'focus'`, `'select'`, `'backbutton'`, etc.)
- Same navigation modes (spatial, grid, horizontal)
- Same configuration options
- Same TypeScript interfaces
- Same dual context support

### Choosing the Right Mode

| Mode | Use Case | Event Source | Best For |
|------|----------|--------------|----------|
| **Native** | Web browsers | Browser Gamepad API | Standard web applications |
| **Custom Events** | WinUI/Restricted environments | Custom DOM events | Desktop apps, embedded browsers |

### Migration Between Modes

Switching between modes requires only changing the initialization function:

```ts
// Native mode
const gamepad = initGamepadForPage(options);

// Custom events mode  
const gamepad = initCustomEventGamepad(options);
```

All other code remains unchanged, ensuring easy migration and testing across different environments.

## 📖 API Reference

### TypeScript Types and Interfaces

The library provides comprehensive TypeScript support with full type definitions:

```ts
// Import main service class
import { GamepadService } from 'gamepad-controller';

// Import helper functions
import { gamepadService, initGamepadForPage, initDualContextGamepad } from 'gamepad-controller';

// Import TypeScript interfaces and types
import type { 
    GamepadServiceOptions,
    GamepadNavigationContextOptions,
    NavigationState,
    ControllerMappings,
    GridDimensions,
    GamepadContextManagerCallback
} from 'gamepad-controller';
```

### Using Types in Your Project

```ts
// Type your configuration options
const options: GamepadServiceOptions = {
    navigationMode: 'spatial',
    focusedClass: 'my-focused-class',
    enableRightStickScroll: true,
    scrollSpeed: 1.5
};

// Type your event handlers
const handleFocus = (element: Element, index: number): void => {
    console.log(`Element ${index} focused:`, element);
};

const handleControllerConnect = (gamepad: Gamepad): void => {
    console.log('Controller connected:', gamepad.id);
};

// Type your service instance
const gamepadInstance: GamepadService = gamepadService('.container', options);
gamepadInstance.on('focus', handleFocus);
gamepadInstance.on('controllerconnect', handleControllerConnect);
```

### Available Interfaces

| Interface | Description | Use Case |
|-----------|-------------|----------|
| `GamepadServiceOptions` | Main configuration options | Service initialization |
| `GamepadNavigationContextOptions` | Context-specific options | Dual context setup |
| `NavigationState` | Current navigation state | Internal state management |
| `ControllerMappings` | Controller button mappings | Custom controller support |
| `GridDimensions` | Grid layout dimensions | Grid navigation |
| `GamepadContextManagerCallback` | Context switch callback | Dual context events |

### Custom Controller Configuration

```ts
import type { ControllerMappings } from 'gamepad-controller';

const customMapping: ControllerMappings = {
    up: 12,
    down: 13,
    left: 14,
    right: 15,
    primary: 0,
    secondary: 1
};
```

### Extending Service Options

```ts
// Extend the interface for custom options
interface CustomGamepadOptions extends GamepadServiceOptions {
    customFeature?: boolean;
    customHandler?: (data: any) => void;
}

const customOptions: CustomGamepadOptions = {
    navigationMode: 'spatial',
    focusedClass: 'custom-focus',
    customFeature: true,
    customHandler: (data) => console.log('Custom handler:', data)
};
```

### Type Safety Benefits

- **IntelliSense Support**: Full autocomplete and type checking in VS Code and other TypeScript-aware editors
- **Compile-time Validation**: Catch configuration errors before runtime
- **Better Documentation**: Type hints show available options and expected values
- **Refactoring Safety**: Rename and refactor with confidence

### Common Type Patterns

```ts
// Event handler typing
type GamepadEventHandler = (element: Element, index: number) => void;
type ControllerEventHandler = (gamepad: Gamepad) => void;

// Configuration with strict typing
const config: GamepadServiceOptions = {
    navigationMode: 'spatial', // TypeScript ensures valid values
    debounceTime: 100,         // Type-checked number
    enableRightStickScroll: true // Type-checked boolean
};

// Service instance with full typing
const service: GamepadService = gamepadService('.container', config);
service.on('focus', (element, index) => {
    // TypeScript knows element is Element and index is number
    console.log(`Focused element ${index}:`, element.tagName);
});
```

### Main Functions

#### `gamepadService(containerSelector?, options?)`
Creates a gamepad navigation service for a specific container or the entire page.

**Parameters:**
- `containerSelector` (string | null): CSS selector for navigation container
- `options` (GamepadServiceOptions): Configuration options

#### `initGamepadForPage(options?)`
Quick initialization with automatic setup and event handlers for standard web environments.

#### `initDualContextGamepad(options?)`
Sets up dual context navigation for menu and content areas with native gamepad APIs.

#### `initCustomEventGamepad(options?)`
Initializes gamepad service for WinUI/custom events environments. Automatically configures custom event listeners and provides the same API as native mode.

**Parameters:**
- `options` (GamepadServiceOptions): Configuration options with custom events enabled by default

#### `initGamepadNavigation(options?)`
Low-level initialization function with full control.

#### `cleanupGamepadService()`
Manually cleanup the global gamepad service instance and free memory.

### Configuration Options

```ts
interface GamepadServiceOptions {
    // Core Settings
    debounceTime?: number;              // Input debounce (default: 150ms)
    deadzone?: number;                  // Analog stick deadzone (default: 0.1)
    containerSelector?: string | null;  // Navigation container
    
    // Styling
    focusedClass?: string;              // CSS class for focused elements
    selectedClass?: string;             // CSS class for selected elements
    statusElementId?: string | null;    // Status display element ID
    
    // Navigation Behavior
    navigationMode?: 'grid' | 'spatial' | 'horizontal'; // Navigation algorithm
    wrapNavigation?: boolean;            // Wrap around edges
    autoDetectElements?: boolean;        // Auto-find navigable elements
    
    // Features
    enableNavigation?: boolean;          // Enable D-pad navigation
    enableBackButton?: boolean;          // Enable back button
    enableShoulderNavigation?: boolean;  // Enable R1/L1 navigation
    
    // Right Stick Scrolling
    enableRightStickScroll?: boolean;    // Enable right stick for window scrolling (default: true)
    scrollSpeed?: number;                // Multiplier for scroll speed (default: 1)
    scrollDebounceTime?: number;         // Debounce time for scrolling (default: 50ms)

    // Focus scrolling
    scrollBehavior?: 'smooth' | 'auto';  // scrollIntoView behavior on focus (default: 'smooth';
                                         // use 'auto' to avoid animation churn on dense UIs)
    
    // Dual Context
    enableDualContext?: boolean;         // Enable dual context mode
    menuContextSelector?: string;        // Menu area selector
    contentContextSelector?: string | null; // Content area selector
    
    // Custom Events Support (WinUI Integration)
    useCustomEvents?: boolean;           // Enable custom events mode (default: false)
    customConnectedEvent?: string;       // Custom connection event name (default: 'hubgamepadconnected')
    customDisconnectedEvent?: string;    // Custom disconnection event name (default: 'hubgamepaddisconnected')
    customStateChangedEvent?: string;    // Custom state change event name (default: 'hubgamepadstatechanged')
    
    // Automation
    autoCreateStatusElement?: boolean;   // Auto-create status display
    autoAddStyles?: boolean;            // Auto-add default styles
    useDataAttributes?: boolean;        // Use data-* attributes
    useGamepadIndex?: boolean;          // Enable gamepad-index attribute filtering
    onlyViewport?: boolean;             // Only include elements visible in viewport (default: false)
}
```

#### Grouped options (optional)

Every flat option above keeps working. You can also pass a **grouped** shape for readability —
where a value appears in both, the nested group wins:

```ts
const gamepad = gamepadService('.app', {
    navigation: { navigationMode: 'spatial', deadzone: 0.15 },
    input: { enableBackButton: true, backButtonCooldown: 300 },
    styling: { focusedClass: 'app-focused', scrollBehavior: 'auto' },
    scrolling: { enableRightStickScroll: true, scrollSpeed: 1.5 },
    context: { enableDualContext: true, menuContextSelector: '.nav' },
    customEvents: { useCustomEvents: true },
});
```

Groups: `navigation`, `input`, `styling`, `status`, `scrolling`, `context`, `customEvents`.

### Event Handlers

Events use a multi-subscriber `on(event, listener)` API. Each `on()` returns an unsubscribe
function, and multiple subscribers can listen to the same event without clobbering each other.

```ts
// Focus events
const offFocus = gamepad.on('focus', (element: Element, index: number) => {
    console.log('Element focused:', element);
});

// Selection events
gamepad.on('select', (element: Element, index: number) => {
    console.log('Element selected:', element);
});

// Controller events
gamepad.on('controllerconnect', (pad: Gamepad) => console.log('Controller connected', pad.id));
gamepad.on('controllerdisconnect', (pad: Gamepad) => console.log('Controller disconnected'));

// Navigation events
gamepad.on('backbutton', () => console.log('Back button pressed'));
gamepad.on('contextswitch', (newContext, oldContext) => console.log('Context switched'));

// Generic per-button events
gamepad.on('buttondown', (index, pad) => console.log('button down', index));
gamepad.on('buttonup', (index, pad) => console.log('button up', index));

// Runtime error (e.g. Gamepad API blocked by Permissions-Policy)
gamepad.on('gamepaderror', (err) => console.warn('gamepad blocked:', err.message));

// Unsubscribe when done
offFocus();
// or: gamepad.off('focus', handler);
```

**Event names:** `focus`, `select`, `controllerconnect`, `controllerdisconnect`, `backbutton`,
`navigationmenuopen`, `buttondown`, `buttonup`, `contextswitch`, `gamepaderror`.

> If you do **not** subscribe to `'backbutton'`, the default behavior (`window.history.back()`)
> still runs. Subscribe to override it.

### Memory Management

The library automatically handles memory cleanup, but you can also manage it manually:

```ts
import { cleanupGamepadService } from 'gamepad-controller';

// Manual cleanup (useful in SPAs)
cleanupGamepadService();

// Or via service utility
gamepadService.cleanup();

// Service instance cleanup
const gamepad = initGamepadForPage();
// ... use gamepad
gamepad.destroy(); // Clean up this specific instance
```

## 🔌 Device filtering (what counts as a "gamepad")

`navigator.getGamepads()` does **not** return only game controllers. Browsers surface many
HID devices as `Gamepad` objects — webcams, headset dongles, some keyboards/mice — often with
a few buttons but **no axes (sticks)**. You'll see them in `gamepadconnected` logs like:

```
Gamepad connected at index 1: Brio 300 (Vendor: 046d Product: 0942) with 7 buttons, 0 axes.
Gamepad connected at index 2: Microsoft USB Link (Vendor: 045e Product: 083c) with 7 buttons, 0 axes.
```

The library filters these out via `isValidGamepad`, which only accepts a device when:

1. **`gamepad.mapping === 'standard'`** — the browser matched it to the Standard Gamepad
   layout, so it's a real controller; **or**
2. it reports enough real inputs to plausibly be a controller: **≥ 4 buttons _and_ ≥ 2 axes**
   (one stick). A 0-axis webcam/headset is rejected.

Rejected devices never enter the service's state, are not counted by
`isControllerConnected()`, and never drive navigation. The `gamepadconnected`/
`gamepaddisconnected` events themselves are dispatched by the browser for every device — that
logging is outside the library's control — but only valid controllers are acted upon.

```ts
import { GamepadService } from 'gamepad-controller';

// isValidGamepad is applied internally — your real DualShock/Xbox pad is accepted,
// while a webcam or headset reporting 0 axes is ignored.
const service = new GamepadService();
service.init();
service.on('controllerconnect', (pad) => {
    // Only fires for a device that passed validation.
    console.log('Real controller connected:', pad.id, pad.mapping);
});
```

> If you have a legitimate controller that reports a non-standard mapping **and** fewer than
> 2 axes, it would be filtered out. Open an issue with its `id`/button/axis counts and we can
> widen the heuristic or expose tuning options.

## 🔍 Viewport Filtering

### Element Detection Options

The library can be configured to include all focusable elements or only those visible in the viewport:

```ts
// Include all elements (default behavior)
const gamepad = gamepadService('.container', {
    onlyViewport: false  // Include all focusable elements
});

// Only include elements visible in viewport
const gamepad = gamepadService('.container', {
    onlyViewport: true   // Only include viewport-visible elements
});
```

### Use Cases

- **`onlyViewport: false`** (default): Best for navigation menus, toolbars, or when you want to navigate to off-screen elements
- **`onlyViewport: true`**: Best for content-heavy pages where you only want to navigate visible elements

### Example: Dynamic Content

```ts
// Initialize with all elements
const gamepad = gamepadService('.container', {
    onlyViewport: false
});

// Add new elements dynamically
const newElement = document.createElement('button');
newElement.textContent = 'New Button';
container.appendChild(newElement);

// Refresh to include new elements
gamepad.refresh();
```

## 🎨 Styling

### Quick Styling Setup

```ts
import { addNavigationStyles } from 'gamepad-controller';

// Add default navigation styles
addNavigationStyles();
```

### Custom CSS Classes

```css
/* Focused element styling */
.gamepad-focused {
    outline: 2px solid #007acc;
    outline-offset: 2px;
    background-color: rgba(0, 122, 204, 0.1);
}

/* Selected element styling */
.gamepad-selected {
    background-color: #007acc;
    color: white;
}
```

### Data Attributes for Enhanced Styling

```html
<!-- Enhanced styling with data attributes -->
<button data-gamepad-focusable="true" data-title="Save Game">
    Save
</button>
```

### Custom Navigation Selection

Use `gamepad-index="true"` to explicitly mark elements as focusable when the feature is enabled:

```html
<!-- Enable gamepad-index in service options -->
<script>
const gamepad = initGamepadForPage({
    useGamepadIndex: true
});
</script>

<!-- HTML with explicit focusable marking -->
<div class="menu">
    <button gamepad-index="true">Focusable Button</button>
    <button>Not focusable (no gamepad-index)</button>
    <button gamepad-index="true">Another Focusable Button</button>
    <div>Regular div (not focusable)</div>
    <input gamepad-index="true" type="text" placeholder="Focusable input" />
    <input type="text" placeholder="Not focusable input" />
</div>
```

**Navigation Selection Features:**
- When `useGamepadIndex: false` → All normally focusable elements are included
- When `useGamepadIndex: true` → Only elements with `gamepad-index="true"` are included
- Provides precise control over which elements can receive gamepad focus
- Perfect for complex layouts where you want to limit navigation scope
- Works with both spatial and grid navigation modes

## 🧭 Navigation Modes

The gamepad controller supports different navigation algorithms optimized for different UI patterns:

### Spatial Navigation (Default)
**Best for:** Most web layouts, menus, forms, irregular layouts
- Finds the nearest element in the direction of movement
- Works naturally with any layout regardless of structure
- Intelligent direction detection based on element positions
- Handles complex layouts with mixed element sizes

```ts
const gamepad = gamepadService('.container', {
    navigationMode: 'spatial' // Default mode
});
```

### Grid Navigation
**Best for:** Card grids, image galleries, uniform layouts
- Assumes elements are arranged in a regular grid pattern
- Moves in predictable rows and columns
- Calculates grid dimensions automatically
- More predictable movement in structured layouts

```ts
const gamepad = gamepadService('.grid-container', {
    navigationMode: 'grid',
    wrapNavigation: true // Wrap to opposite side when reaching edge
});
```

### Horizontal Navigation
**Best for:** Menu bars, tab lists, horizontal toolbars
- Optimized for single-row horizontal navigation
- **Available only in dual context mode** (used automatically for menu areas)
- Supports wrapping from last to first element
- Only responds to left/right navigation, ignores up/down

```ts
// Used automatically in dual context mode
const gamepad = initDualContextGamepad({
    menuContextSelector: '.nav-menu', // Uses horizontal navigation
    contentContextSelector: '.content' // Uses spatial navigation
});

// NOT available in single context mode - will fallback to spatial
const gamepad = gamepadService('.menu', {
    navigationMode: 'horizontal' // ⚠️ Only available in dual context mode
});
```

### Navigation Mode Comparison

| Mode | Use Case | Movement | Wrapping | Structure | Availability |
|------|----------|----------|----------|-----------|--------------|
| **Spatial** | General layouts, menus, forms | Nearest element | Smart wrapping | Any layout | All modes |
| **Grid** | Card grids, galleries | Row/column based | Edge wrapping | Regular grid | Single context only |
| **Horizontal** | Menu bars, tabs | Left/right only | First ↔ last | Single row | Dual context only |

### Mode Availability

- **Single Context Mode** (`gamepadService`): Supports `'spatial'` and `'grid'` navigation
- **Dual Context Mode** (`initDualContextGamepad`): Supports `'spatial'` and `'horizontal'` navigation
- **Context Manager**: Supports `'spatial'` and `'horizontal'` navigation

### Choosing the Right Mode

```ts
// Complex layouts with mixed elements
const gamepad = gamepadService('.page', {
    navigationMode: 'spatial' // Handles any layout
});

// Uniform card grid
const gamepad = gamepadService('.card-grid', {
    navigationMode: 'grid' // Predictable grid movement
});

// Navigation menu
const gamepad = gamepadService('.nav-menu', {
    navigationMode: 'spatial' // Works well for menus
});
```

## 🎮 Analog Stick Deadzone Configuration

### What is Deadzone?

The **deadzone** is a threshold value that determines how much an analog stick must be moved before it registers as input. This prevents unwanted navigation from:
- **Controller drift** - When sticks don't return to perfect center position
- **Accidental touches** - Light pressure that shouldn't trigger navigation
- **Worn controllers** - Older controllers with loose sticks

### Default Deadzone Value

The library uses a default deadzone of **0.1** (10% of full stick range), which works well for most controllers and users.

### How Deadzone Works

```ts
// Analog stick values range from -1.0 to 1.0
// With deadzone = 0.1:
// - Stick values between -0.1 and 0.1 are ignored
// - Only values outside this range trigger navigation
// - Prevents accidental movement from slight stick positions

const gamepad = gamepadService('.container', {
    deadzone: 0.1 // 10% deadzone (default)
});
```

### Adjusting Deadzone

#### For Sensitive Controllers (New/Precise)
```ts
const gamepad = gamepadService('.container', {
    deadzone: 0.05 // 5% - More sensitive, responds to smaller movements
});
```

#### For Worn/Drifting Controllers
```ts
const gamepad = gamepadService('.container', {
    deadzone: 0.2 // 20% - Less sensitive, requires more stick movement
});
```

#### Disable Deadzone (Not Recommended)
```ts
const gamepad = gamepadService('.container', {
    deadzone: 0 // No deadzone - responds to any stick movement
});
```

### Visual Deadzone Explanation

```
Analog Stick Range: -1.0 ←→ 1.0
                        ┌─────────────────────┐
Deadzone (0.1):    -0.1 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 0.1
                        ╚═════════════════════╝
                           Ignored Range
                        
← Active Range →      ← Ignored →      ← Active Range →
```

### Common Deadzone Values

| Value | Sensitivity | Best For |
|-------|-------------|----------|
| `0.05` | Very High | New controllers, precise users |
| `0.1` | High | Default - works for most users |
| `0.15` | Medium | General use, slightly worn controllers |
| `0.2` | Low | Worn controllers, accessibility needs |
| `0.25` | Very Low | Heavily worn/drifting controllers |

### Deadzone and Scrolling

The deadzone also affects right stick scrolling:

```ts
const gamepad = gamepadService('.container', {
    deadzone: 0.1,              // Navigation deadzone
    enableRightStickScroll: true,
    scrollSpeed: 1.0            // Scrolling uses same deadzone value
});
```

### Testing Your Deadzone

```ts
const gamepad = gamepadService('.container', {
    deadzone: 0.1
});

// Test navigation responsiveness
gamepad.on('focus', (element, index) => {
    console.log(`Focused element ${index}: ${element.tagName}`);
});

// If navigation is too sensitive: increase deadzone
// If navigation is unresponsive: decrease deadzone
```

## 🎯 Navigation Controls

| Controller | Navigate | Select | Back | Menu Navigation | Scroll |
|------------|----------|--------|------|-----------------|---------|
| Xbox | D-pad / Left Stick | A | B | RB / LB | Right Stick |
| PlayStation | D-pad / Left Stick | X | Circle | R1 / L1 | Right Stick |
| Nintendo | D-pad / Left Stick | B | A | R / L | Right Stick |

## 🎮🎮 Multiple Controllers

Every connected controller drives the **same shared navigation cursor** (a couch / hand-off
model): any player can pick up any pad and move the focus, without one pad clobbering another.

- **Per-pad input state.** Each controller keeps its own edge-detection flags and cooldown
  timestamps (keyed by `gamepad.index`), so processing several pads in the same frame can't
  interfere — an idle pad can't reset the active pad's back-button edge.
- **Per-pad button mapping.** Each pad is mapped by its **own** detected type, so a mixed
  setup works correctly — e.g. Nintendo's swapped A/B is honored on the Nintendo pad even
  while an Xbox pad is also connected.
- **Status reflects all of them.** The status element lists every connected controller, e.g.
  `🎮 Xbox + PlayStation controller connected`.

```ts
const gamepad = gamepadService('.container');

// The most-recently-active controller's type (back-compat).
gamepad.getControllerType();   // e.g. 'xbox'

// Every connected controller type, de-duplicated.
gamepad.getControllerTypes();  // e.g. ['xbox', 'playstation']
```

> Stale slots are pruned automatically: if a `gamepaddisconnected` event is missed, a pad that
> vanishes from `navigator.getGamepads()` is dropped on the next frame so the type list and
> per-pad state stay accurate.

### Controller Detection (vendor-ID fallbacks)

Detection matches `gamepad.id` against per-type regex patterns, with a minimum button/axis
gate to keep non-controller HID devices out. Because browsers don't always include a readable
name (Chrome often reports only a USB vendor code, e.g. `Wireless Controller (... Vendor: 054c ...)`),
the patterns also match known **vendor IDs** as a fallback:

| Type | Vendor ID | Notes |
| ---- | --------- | ----- |
| Xbox | `045e` | Microsoft (also matches `xbox`, `microsoft`, `x-input`) |
| PlayStation | `054c` | Sony — DualShock / DualSense (also `playstation`, `dualsense`, `dualshock`, `ps3`–`ps5`) |
| Nintendo | `057e` | Switch Pro Controller / Joy-Con (also `nintendo`, `switch`, `pro controller`) |

The `minButtons`/`minAxes` validation gate keeps non-controller devices that share a vendor ID
(headsets, keyboards) from being mis-detected as gamepads.

## 📋 Usage Examples

### Grid Navigation Example

Perfect for card layouts, image galleries, and uniform grids:

```ts
import { gamepadService } from 'gamepad-controller';

const gamepad = gamepadService('.grid-container', {
    navigationMode: 'grid',        // Grid-based movement
    focusedClass: 'focused',
    selectedClass: 'selected',
    wrapNavigation: true           // Wrap around edges
});

// Add styling
gamepad.addNavigationStyles();
```

```html
<!-- HTML Structure -->
<div class="grid-container">
    <div class="card">Card 1</div>
    <div class="card">Card 2</div>
    <div class="card">Card 3</div>
    <div class="card">Card 4</div>
    <!-- Grid navigation moves in predictable rows/columns -->
</div>
```

### Spatial Navigation Example

Ideal for complex layouts, forms, and irregular element arrangements:

```ts
import { gamepadService } from 'gamepad-controller';

const gamepad = gamepadService('.content-area', {
    navigationMode: 'spatial',     // Finds nearest element in direction
    focusedClass: 'focused',
    selectedClass: 'selected',
    wrapNavigation: false          // Don't wrap for complex layouts
});
```

```html
<!-- HTML Structure -->
<div class="content-area">
    <h1>Page Title</h1>
    <button class="action-btn">Primary Action</button>
    <div class="sidebar">
        <button>Settings</button>
        <button>Help</button>
    </div>
    <main>
        <p>Content with <a href="#">links</a> and <button>buttons</button></p>
    </main>
    <!-- Spatial navigation finds nearest element regardless of structure -->
</div>
```

### Dual Context Navigation Example

Separate navigation contexts for menu and content areas:

```ts
import { initDualContextGamepad } from 'gamepad-controller';

const gamepad = initDualContextGamepad({
    menuContextSelector: '.main-nav',    // Horizontal navigation (R1/L1)
    contentContextSelector: '.content-area', // Spatial navigation (left stick)
    enableShoulderNavigation: true
});

// Custom menu selection handler
gamepad.on('select', (element) => {
    if (element.classList.contains('nav-item')) {
        // Handle menu navigation
        const href = element.getAttribute('href');
        if (href) window.location.href = href;
    }
});
```

```html
<!-- HTML Structure -->
<nav class="main-nav">
    <!-- R1/L1 navigates horizontally through menu -->
    <a href="/" class="nav-item">Home</a>
    <a href="/about" class="nav-item">About</a>
    <a href="/contact" class="nav-item">Contact</a>
</nav>
<div class="content-area">
    <!-- Left stick navigates spatially through content -->
    <h1>Page Content</h1>
    <button>Action 1</button>
    <button>Action 2</button>
    <form>
        <input type="text" placeholder="Search...">
        <button type="submit">Search</button>
    </form>
</div>
```

### Custom Element Filtering Example

```ts
import { gamepadService } from 'gamepad-controller';

const gamepad = gamepadService('.form-container', {
    useGamepadIndex: true,
    navigationMode: 'spatial'
});
```

```html
<!-- Form with explicit focusable element control -->
<form class="form-container">
    <input gamepad-index="true" type="text" placeholder="First Name" />
    <input gamepad-index="true" type="text" placeholder="Last Name" />
    <input gamepad-index="true" type="email" placeholder="Email" />
    <button gamepad-index="true" type="submit">Submit</button>
    <button gamepad-index="true" type="button">Cancel</button>
    <!-- This input will NOT be focusable (no gamepad-index attribute) -->
    <input type="text" placeholder="Optional Notes" />
    <!-- This div will NOT be focusable (no gamepad-index="true") -->
    <div>Some decorative content</div>
</form>
```

## 🎮 Custom Button Callbacks

You can override the behavior of **any button** on the gamepad using the `onButtonDown` and `onButtonUp` callbacks in `GamepadService`.

### Common Button Index Mapping

| Index | Xbox         | PlayStation   | Nintendo      | Description         |
|-------|--------------|--------------|--------------|---------------------|
| 0     | A            | Cross (X)    | B            | Primary/Select      |
| 1     | B            | Circle (O)   | A            | Back/Cancel         |
| 2     | X            | Square (☐)   | Y            | Secondary           |
| 3     | Y            | Triangle (△) | X            | Tertiary            |
| 4     | LB           | L1           | L             | Left Shoulder       |
| 5     | RB           | R1           | R             | Right Shoulder      |
| 6     | LT           | L2           | ZL            | Left Trigger        |
| 7     | RT           | R2           | ZR            | Right Trigger       |
| 8     | View         | Share        | -             | Select/Share/Menu   |
| 9     | Menu         | Options      | +             | Start/Pause         |
| 10    | LS           | L3           | L3            | Left Stick Press    |
| 11    | RS           | R3           | R3            | Right Stick Press   |
| 12    | D-pad Up     | D-pad Up     | D-pad Up      | D-pad Up            |
| 13    | D-pad Down   | D-pad Down   | D-pad Down    | D-pad Down          |
| 14    | D-pad Left   | D-pad Left   | D-pad Left    | D-pad Left          |
| 15    | D-pad Right  | D-pad Right  | D-pad Right   | D-pad Right         |
| 16    | Xbox         | PS           | Home          | System/Home         |

> **Note:** Button indices may vary for some controllers. Always test with your target device.

### Usage Example

```ts
import { GamepadService } from 'gamepad-controller';

const gamepadService = new GamepadService({
  // ...options
});

// Subscribe with on('buttondown'/'buttonup', cb). Each call returns an unsubscribe function.
gamepadService.on('buttondown', (buttonIndex, gamepad) => {
  if (buttonIndex === 0) {
    // X/A/Cross pressed
    alert('Primary button pressed!');
  } else if (buttonIndex === 1) {
    // O/B/Circle pressed
    alert('Back button pressed!');
  } else {
    console.log('Button', buttonIndex, 'pressed');
  }
});

gamepadService.on('buttonup', (buttonIndex, gamepad) => {
  if (buttonIndex === 0) {
    console.log('Primary button released!');
  } else if (buttonIndex === 1) {
    console.log('Back button released!');
  } else {
    console.log('Button', buttonIndex, 'released');
  }
});

gamepadService.init();
```

- `buttonIndex` is the index of the button (see your controller mapping for details).
- `gamepad` is the Gamepad object from the browser API.

You can use this to implement custom actions for any button, including X/A, O/B, triggers, shoulders, etc.

## 📜 Right Stick Scrolling

The gamepad controller includes built-in window scrolling support using the right analog stick, similar to how X/A is used for actions and Circle/B for back navigation.

### Basic Usage
```javascript
const gamepadService = new GamepadService({
    enableRightStickScroll: true, // Enabled by default
    scrollSpeed: 1, // Scroll speed multiplier (default: 1)
    scrollDebounceTime: 50, // Debounce time for smooth scrolling (default: 50ms)
});
```

### Configuration Options
- **`enableRightStickScroll`**: Enable/disable right stick scrolling (default: `true`)
- **`scrollSpeed`**: Multiplier for scroll speed - higher values = faster scrolling (default: `1`)
- **`scrollDebounceTime`**: Debounce time in milliseconds for smooth scrolling (default: `50ms`)

### Examples

**Faster Scrolling:**
```javascript
const gamepadService = new GamepadService({
    scrollSpeed: 2, // 2x faster scrolling
});
```

**Disable Scrolling:**
```javascript
const gamepadService = new GamepadService({
    enableRightStickScroll: false, // Disable right stick scrolling
});
```

**Custom Scroll Settings:**
```javascript
const gamepadService = new GamepadService({
    enableRightStickScroll: true,
    scrollSpeed: 1.5, // 1.5x speed
    scrollDebounceTime: 25, // Faster response (more sensitive)
});
```

> **🎮 Controls**: 
> - **Left Stick/D-Pad**: Navigate between elements
> - **Right Stick**: Scroll the window/page
> - **X/A**: Select/Click elements
> - **Circle/B**: Go back
> - **R1/L1**: Navigate between sections

## Status Element Options

The gamepad controller now provides flexible options for showing connection status:

### Option 1: No Status Element (Default)
```javascript
const gamepadService = new GamepadService({
    // No status element will be created (autoCreateStatusElement is false by default)
});
```

### Option 2: Provide Your Own Status Element
```javascript
const gamepadService = new GamepadService({
    statusElementId: 'my-custom-status', // Element must exist in your HTML
});
```

### Option 3: Auto-Create Status Element
```javascript
const gamepadService = new GamepadService({
    autoCreateStatusElement: true, // Creates a default status element
});
```

### Option 4: Both Options Combined
```javascript
const gamepadService = new GamepadService({
    statusElementId: 'custom-status',
    autoCreateStatusElement: true, // Fallback if custom element doesn't exist
});
```

### Option 5: Bypass Status System (Advanced)
```javascript
const gamepadService = new GamepadService({
    statusElementId: null,           // No GamepadService status integration
    autoCreateStatusElement: false,  // No auto-creation
    // ... other options
});

// Handle status updates manually with your own function
const updateStatus = (id, message, type = '') => {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = message;
        element.className = `status ${type}`;
    }
};

// Use your own status update logic
gamepadService.on('controllerconnect', (gamepad) => {
    updateStatus('my-status', `🎮 Controller connected: ${gamepad.id}`, 'success');
});

gamepadService.on('controllerdisconnect', (gamepad) => {
    updateStatus('my-status', '🎮 Controller disconnected', 'warning');
});
```

> **💡 Pro Tip**: Use the bypass approach when you need complete control over styling and status updates, or when integrating with existing UI frameworks that manage their own status elements.

## 🛠️ Development

### Project Structure

```
gamepad-controller/
├── src/                    # Source code
│   ├── core/              # Core GamepadService classes
│   ├── utils/             # Utility functions
│   ├── Interfaces/        # TypeScript interfaces
│   └── index.ts           # Main exports
├── examples/              # Vite-based examples
│   └── pages/            # Example implementations
├── dist/                 # Compiled output
└── docs/                 # Documentation
```

### Building the Library

```sh
# Install dependencies
npm install

# Build TypeScript and generate types
npm run build

# Create package for distribution
npm pack
```