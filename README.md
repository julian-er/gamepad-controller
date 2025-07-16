# Gamepad Controller

A TypeScript library for advanced gamepad navigation and UI control in web applications. Supports dual context navigation, custom mapping, and is compatible with Xbox, PlayStation, Nintendo, and generic controllers.

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
   npm install /path/to/gamepad-controller-1.0.0.tgz
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
gamepadInstance.onFocus = handleFocus;
gamepadInstance.onControllerConnect = handleControllerConnect;
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
service.onFocus = (element, index) => {
    // TypeScript knows element is Element and index is number
    console.log(`Focused element ${index}:`, element.tagName);
};
```

### Main Functions

#### `gamepadService(containerSelector?, options?)`
Creates a gamepad navigation service for a specific container or the entire page.

**Parameters:**
- `containerSelector` (string | null): CSS selector for navigation container
- `options` (GamepadServiceOptions): Configuration options

#### `initGamepadForPage(options?)`
Quick initialization with automatic setup and event handlers.

#### `initDualContextGamepad(options?)`
Sets up dual context navigation for menu and content areas.

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
    
    // Dual Context
    enableDualContext?: boolean;         // Enable dual context mode
    menuContextSelector?: string;        // Menu area selector
    contentContextSelector?: string | null; // Content area selector
    
    // Automation
    autoCreateStatusElement?: boolean;   // Auto-create status display
    autoAddStyles?: boolean;            // Auto-add default styles
    useDataAttributes?: boolean;        // Use data-* attributes
    useGamepadIndex?: boolean;          // Enable gamepad-index attribute filtering
    onlyViewport?: boolean;             // Only include elements visible in viewport (default: false)
}
```

### Event Handlers

```ts
// Focus events
gamepad.onFocus = (element: Element, index: number) => {
    console.log('Element focused:', element);
};

// Selection events
gamepad.onSelect = (element: Element, index: number) => {
    console.log('Element selected:', element);
};

// Controller events
gamepad.onControllerConnect = (gamepad: Gamepad) => {
    console.log('Controller connected');
};

gamepad.onControllerDisconnect = (gamepad: Gamepad) => {
    console.log('Controller disconnected');
};

// Navigation events
gamepad.onBackButton = () => {
    console.log('Back button pressed');
};

gamepad.onContextSwitch = (newContext: any, oldContext: any) => {
    console.log('Context switched');
};
```

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
gamepad.onFocus = (element, index) => {
    console.log(`Focused element ${index}: ${element.tagName}`);
};

// If navigation is too sensitive: increase deadzone
// If navigation is unresponsive: decrease deadzone
```

## 🎯 Navigation Controls

| Controller | Navigate | Select | Back | Menu Navigation | Scroll |
|------------|----------|--------|------|-----------------|---------|
| Xbox | D-pad / Left Stick | A | B | RB / LB | Right Stick |
| PlayStation | D-pad / Left Stick | X | Circle | R1 / L1 | Right Stick |
| Nintendo | D-pad / Left Stick | B | A | R / L | Right Stick |

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
gamepad.onSelect = (element) => {
    if (element.classList.contains('nav-item')) {
        // Handle menu navigation
        const href = element.getAttribute('href');
        if (href) window.location.href = href;
    }
};
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

gamepadService.onButtonDown = (buttonIndex, gamepad) => {
  if (buttonIndex === 0) {
    // X/A/Cross pressed
    alert('Primary button pressed!');
  } else if (buttonIndex === 1) {
    // O/B/Circle pressed
    alert('Back button pressed!');
  } else {
    console.log('Button', buttonIndex, 'pressed');
  }
};

gamepadService.onButtonUp = (buttonIndex, gamepad) => {
  if (buttonIndex === 0) {
    console.log('Primary button released!');
  } else if (buttonIndex === 1) {
    console.log('Back button released!');
  } else {
    console.log('Button', buttonIndex, 'released');
  }
};

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
gamepadService.onControllerConnect = (gamepad) => {
    updateStatus('my-status', `🎮 Controller connected: ${gamepad.id}`, 'success');
};

gamepadService.onControllerDisconnect = (gamepad) => {
    updateStatus('my-status', '🎮 Controller disconnected', 'warning');
};
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