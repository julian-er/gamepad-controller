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
    navigationMode?: 'grid' | 'spatial'; // Navigation algorithm
    wrapNavigation?: boolean;            // Wrap around edges
    autoDetectElements?: boolean;        // Auto-find navigable elements
    
    // Features
    enableNavigation?: boolean;          // Enable D-pad navigation
    enableBackButton?: boolean;          // Enable back button
    enableShoulderNavigation?: boolean;  // Enable R1/L1 navigation
    
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

## 🎯 Navigation Controls

| Controller | Navigate | Select | Back | Menu Navigation |
|------------|----------|--------|------|-----------------|
| Xbox | D-pad / Left Stick | A | B | RB / LB |
| PlayStation | D-pad / Left Stick | X | Circle | R1 / L1 |
| Nintendo | D-pad / Left Stick | B | A | R / L |

## 📋 Usage Examples

### Grid Navigation Example

```ts
import { gamepadService } from 'gamepad-controller';

const gamepad = gamepadService('.grid-container', {
    navigationMode: 'grid',
    focusedClass: 'focused',
    selectedClass: 'selected',
    wrapNavigation: true
});

// Add styling
gamepad.addNavigationStyles();
```

### Menu Navigation Example

```ts
import { initDualContextGamepad } from 'gamepad-controller';

const gamepad = initDualContextGamepad({
    menuContextSelector: '.main-nav',
    contentContextSelector: '.content-area',
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