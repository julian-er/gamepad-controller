# Gamepad Controller

A TypeScript library for advanced gamepad navigation and UI control in web applications. Supports dual context navigation, custom mapping, and is compatible with Xbox, PlayStation, Nintendo, and generic controllers.

## 🎮 Features

- **Dual Context Navigation**: Separate navigation for menu and content areas
- **Multiple Navigation Modes**: Grid-based and spatial navigation
- **Controller Support**: Xbox, PlayStation, Nintendo, and generic gamepads
- **TypeScript Support**: Full type declarations and IntelliSense
- **Modern Architecture**: Modular, tree-shakable codebase
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

### Running Examples

```sh
# Go to examples directory
cd examples

# Install dependencies and local package
npm install
npm install ../gamepad-controller-1.0.0.tgz

# Start development server
npm run dev

# Open browser to
# http://localhost:5173/pages/home-page/index.html
```

### Available Example Pages

- **Home Page**: Main navigation and feature overview
- **Simple Example**: Basic grid navigation with cards
- **Menu Example**: Dual context navigation demo
- **Debug Page**: Controller input debugging and testing
- **Style Isolation**: CSS styling examples

## 🚀 Integration Guide

### For New Projects

1. **Install the Package**:
   ```sh
   npm install /path/to/gamepad-controller-1.0.0.tgz
   ```

2. **Basic Setup**:
   ```ts
   import { initGamepadForPage } from 'gamepad-controller';
   
   document.addEventListener('DOMContentLoaded', () => {
       const gamepad = initGamepadForPage({
           focusedClass: 'focused',
           enableBackButton: true
       });
   });
   ```

3. **Add Navigation Styles**:
   ```ts
   import { addNavigationStyles } from 'gamepad-controller';
   addNavigationStyles();
   ```

### For Existing Projects

1. **Identify Navigation Areas**: Determine which elements should be navigable
2. **Choose Navigation Mode**: Grid for structured layouts, spatial for flexible layouts
3. **Add CSS Classes**: Style focused and selected states
4. **Test with Controller**: Verify navigation flow and behavior
5. **Customize as Needed**: Adjust options and event handlers

### Advanced Integration

```ts
import { GamepadService } from 'gamepad-controller';

// Custom service with full configuration
const gamepad = new GamepadService({
    containerSelector: '.app-container',
    navigationMode: 'spatial',
    enableDualContext: true,
    menuContextSelector: '.sidebar',
    contentContextSelector: '.main-content',
    debounceTime: 100,
    deadzone: 0.15
});

// Initialize with custom setup
gamepad.init();

// Add custom event handlers
gamepad.onFocus = (element) => {
    // Custom focus logic
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};
```

## 🔧 Troubleshooting

### Common Issues

**Controller Not Detected**:
- Ensure controller is connected before page load
- Check browser gamepad support
- Try different USB ports or wireless re-pairing

**Navigation Not Working**:
- Verify elements have proper CSS selectors
- Check if `autoDetectElements` is enabled
- Ensure container selector is correct

**Styling Issues**:
- Confirm CSS classes are defined
- Check if `autoAddStyles` is enabled
- Verify CSS specificity and conflicts

### Debug Mode

```ts
const gamepad = initGamepadForPage({
    // Enable detailed logging
    debugMode: true
});

// Check detected elements
console.log('Navigable elements:', gamepad.getNavigableElements());

// Monitor gamepad state
gamepad.onGamepadUpdate = (state) => {
    console.log('Gamepad state:', state);
};
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📚 Additional Resources

- [Examples Directory](./examples/) - Live examples and demos
- [API Documentation](./docs/) - Detailed API reference
- [Migration Guide](./MIGRATION.md) - Upgrading between versions
- [Changelog](./CHANGELOG.md) - Version history and changes

---

**Note**: This is a library for integration into your own projects, not a standalone application. The examples directory provides reference implementations and testing environments.