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
    useGamepadIndex?: boolean;          // Enable gamepad-index attribute ordering
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

### Custom Navigation Order

Use `gamepad-index` attributes to control navigation order (similar to `tabindex`):

```html
<!-- Enable gamepad-index in service options -->
<script>
const gamepad = initGamepadForPage({
    useGamepadIndex: true
});
</script>

<!-- HTML with custom navigation order -->
<div class="menu">
    <button gamepad-index="1">First</button>
    <button gamepad-index="3">Third</button>
    <button gamepad-index="2">Second</button>
    <!-- Elements without gamepad-index appear after indexed ones -->
    <button>Fourth (no index)</button>
</div>
```

**Navigation Order Features:**
- Elements with `gamepad-index` are navigated in numerical order
- Elements without `gamepad-index` follow after indexed elements
- Invalid index values are treated as unindexed
- Works with both spatial and grid navigation modes
- Supports negative values for prioritization

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

### Custom Navigation Order Example

```ts
import { gamepadService } from 'gamepad-controller';

const gamepad = gamepadService('.form-container', {
    useGamepadIndex: true,
    navigationMode: 'spatial'
});
```

```html
<!-- Form with custom navigation order -->
<form class="form-container">
    <input gamepad-index="1" type="text" placeholder="First Name" />
    <input gamepad-index="2" type="text" placeholder="Last Name" />
    <input gamepad-index="3" type="email" placeholder="Email" />
    <button gamepad-index="5" type="submit">Submit</button>
    <button gamepad-index="4" type="button">Cancel</button>
    <!-- This input will be navigated last (no gamepad-index) -->
    <input type="text" placeholder="Optional Notes" />
</form>
```

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