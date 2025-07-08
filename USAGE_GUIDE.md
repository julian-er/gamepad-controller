# Gamepad Navigation Service - Complete Usage Guide

## 🚀 Quick Start (Zero Configuration)

The fastest way to add gamepad navigation to any page:

```javascript
import { initGamepadForPage } from './gamepadService.js';

// One line = full gamepad support with zero style conflicts
initGamepadForPage();
```

**What you get instantly:**
- 🎯 D-pad/Analog stick navigation
- ✅ A/X/Cross button selection
- 🔙 B/Circle button for back navigation
- ⏭️ R1/L1 buttons for page navigation
- 🛡️ Zero style conflicts with your app
- 📊 Optional status display

## 📦 Installation & Setup

### Prerequisites

⚠️ **Important**: Uses ES6 modules - requires a local server (not `file://`)

**VS Code Users (Recommended):**
1. Install "Live Server" extension
2. Right-click any HTML file → "Open with Live Server"

**Command Line Options:**
```bash
# Node.js
npx http-server

# Python (if you have it)
python3 -m http.server 8000

# PHP
php -S localhost:8000
```

### File Structure

Download/copy these files to your project:
```
your-project/
├── gamepadService.js         # Main service (import this)
├── gamepadServiceModel.js    # Core service class
├── gamepadUtils.js           # Utility functions
├── controllerMappings.js     # Controller mappings
└── your-html-files...
```

## 🔧 Integration Methods

### Method 1: Drop-in Integration (Recommended)

Add to any existing HTML page:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Existing App</title>
    <!-- Your existing CSS -->
    <link rel="stylesheet" href="my-styles.css">
</head>
<body>
    <!-- Your existing HTML -->
    <div class="my-app">
        <button>Button 1</button>
        <button>Button 2</button>
        <div class="my-content">
            <!-- Your content -->
        </div>
    </div>

    <!-- Add gamepad support in one line -->
    <script type="module">
        import { initGamepadForPage } from './gamepadService.js';
        initGamepadForPage();
    </script>
</body>
</html>
```

### Method 2: Custom Configuration

```javascript
import { initGamepadNavigation } from './gamepadService.js';

const gamepad = initGamepadNavigation({
    // Navigation behavior
    navigationMode: 'spatial',        // 'spatial' or 'grid'
    containerSelector: '.my-app',     // Limit to specific container
    
    // Style isolation (no conflicts)
    useDataAttributes: true,          // Use data attributes (recommended)
    autoAddStyles: false,             // Don't inject CSS (default)
    
    // Visual feedback
    focusedClass: 'my-focused',       // Custom CSS class
    selectedClass: 'my-selected',     // Custom CSS class
    
    // Features
    enableBackButton: true,           // B/Circle button
    enableShoulderNavigation: true,   // R1/L1 navigation
    
    // Context for styling
    gamepadContext: 'buttons'         // 'grid', 'menu', 'form', 'buttons'
});

// Event handlers
gamepad.onFocus = (element, index) => {
    console.log('Focused:', element.textContent);
};

gamepad.onSelect = (element, index) => {
    console.log('Selected:', element.textContent);
    // Your custom selection logic
};
```

### Method 3: Presets for Common Use Cases

```javascript
import { presets } from './gamepadService.js';

// Menu navigation
presets.menu('.navigation');

// Grid/card layouts
presets.grid('.card-container');

// Forms
presets.form('#my-form');

// Button groups
presets.buttons('.button-group');

// Full page (same as initGamepadForPage)
presets.fullPage();

// Dual context navigation
presets.dualContext('.nav-menu', '.content-area');
```

### Method 4: Dual Context Navigation (Advanced)

Create separate navigation contexts for different UI regions with mutual exclusion:

```javascript
import { initDualContextGamepad } from './gamepadService.js';

const gamepad = initDualContextGamepad({
    // Menu context (R1/L1 navigation)
    menuContextSelector: '.nav-menu',
    
    // Content context (left stick navigation)
    contentContextSelector: '.main-content', // or null for everything except menu
    
    // Styling
    focusedClass: 'gamepad-focused',
    selectedClass: 'gamepad-selected',
    useDataAttributes: false,
    
    // Features
    enableBackButton: true,
    enableShoulderNavigation: true
});

// Context switching events
gamepad.onContextSwitch = (newContext, oldContext) => {
    console.log(`Switched from ${oldContext?.id} to ${newContext.id}`);
    
    // Update UI based on active context
    if (newContext.id === 'menu') {
        document.body.classList.add('menu-active');
    } else {
        document.body.classList.add('content-active');
    }
};
```

**How Dual Context Works:**
- **Menu Context**: R1/L1 buttons navigate horizontally through menu items
- **Content Context**: Left stick navigates spatially through content elements
- **Mutual Exclusion**: Only one context is active at a time
- **Automatic Switching**: Using stick switches to content, R1/L1 switches to menu
- **X Button**: Only affects the currently active context

**Use Cases:**
- Top navigation menu + main content area
- Sidebar navigation + content panels
- Tab navigation + tab content
- Header menu + page content

```javascript
// Access contexts programmatically
const menuContext = gamepad.getContext('menu');
const contentContext = gamepad.getContext('content');
const activeContext = gamepad.getActiveContext();

// Switch contexts manually
gamepad.switchToContext('menu');
gamepad.switchToContext('content');

// Get context information
const info = gamepadUtils.getDualContextInfo();
console.log(info.activeContext); // 'menu' or 'content'
```

## 🎨 Styling Without Conflicts

### Default: No Visual Changes

```javascript
// By default, navigation works but no styles are added
initGamepadForPage();
// Your app looks exactly the same!
```

### Option 1: Data Attributes (Recommended)

```css
/* Add to your existing CSS */
[data-gamepad-focused="true"] {
    outline: 2px solid #007bff;
    outline-offset: 2px;
}

[data-gamepad-selected="true"] {
    background-color: #007bff;
    color: white;
}
```

```javascript
// Enable data attributes
initGamepadForPage({
    useDataAttributes: true
});
```

### Option 2: CSS Classes

```css
/* Add to your existing CSS */
.gamepad-focused {
    outline: 2px solid #007bff;
    outline-offset: 2px;
}

.gamepad-selected {
    background-color: #007bff;
    color: white;
}
```

```javascript
// Use CSS classes
initGamepadForPage({
    useDataAttributes: false,
    focusedClass: 'gamepad-focused',
    selectedClass: 'gamepad-selected'
});
```

### Option 3: Context-Specific Styling

```css
/* Different styles for different contexts */
[data-gamepad-context="grid"] [data-gamepad-focused="true"] {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

[data-gamepad-context="menu"] [data-gamepad-focused="true"] {
    background-color: rgba(0, 123, 255, 0.1);
    border-left: 4px solid #007bff;
}

[data-gamepad-context="form"] [data-gamepad-focused="true"] {
    border-color: #007bff;
    border-width: 2px;
}
```

```javascript
// Set context
initGamepadForPage({
    gamepadContext: 'grid' // or 'menu', 'form', 'buttons'
});
```

### Option 4: Respecting Existing Styles

```css
/* Your existing focus styles */
.my-button:focus {
    outline: 2px solid #28a745;
    outline-offset: 2px;
}

/* Enhance (don't override) with gamepad */
.my-button[data-gamepad-focused="true"] {
    outline: 2px solid #28a745;
    box-shadow: 0 0 0 4px rgba(40, 167, 69, 0.3);
}
```

## 🔧 Framework Integration

### React Integration

```jsx
// GamepadNavigationWrapper.jsx
import { useEffect, useRef } from 'react';

export function GamepadNavigationWrapper({ children, options = {} }) {
    const gamepadRef = useRef(null);
    
    useEffect(() => {
        // Initialize gamepad service
        import('./gamepadService.js').then(({ initGamepadNavigation }) => {
            gamepadRef.current = initGamepadNavigation({
                useDataAttributes: true,
                autoAddStyles: false,
                ...options
            });
            
            // Custom event handlers
            gamepadRef.current.onFocus = (element, index) => {
                console.log('React gamepad focused:', element);
            };
            
            gamepadRef.current.onSelect = (element, index) => {
                // Trigger React onClick
                element.click();
            };
        });
        
        return () => {
            if (gamepadRef.current) {
                gamepadRef.current.destroy();
            }
        };
    }, []);
    
    return <div className="gamepad-enabled">{children}</div>;
}

// Usage in your React app
function MyComponent() {
    const items = ['Item 1', 'Item 2', 'Item 3'];
    
    return (
        <GamepadNavigationWrapper>
            <div className="my-container">
                {items.map((item, index) => (
                    <button 
                        key={index}
                        onClick={() => handleClick(item)}
                    >
                        {item}
                    </button>
                ))}
            </div>
        </GamepadNavigationWrapper>
    );
}
```

### React Hook

```jsx
// useGamepadNavigation.js
import { useEffect, useRef } from 'react';

export function useGamepadNavigation(options = {}) {
    const gamepadRef = useRef(null);
    
    useEffect(() => {
        import('./gamepadService.js').then(({ initGamepadNavigation }) => {
            gamepadRef.current = initGamepadNavigation({
                useDataAttributes: true,
                autoAddStyles: false,
                ...options
            });
        });
        
        return () => {
            if (gamepadRef.current) {
                gamepadRef.current.destroy();
            }
        };
    }, []);
    
    const refresh = () => {
        if (gamepadRef.current) {
            gamepadRef.current.refresh();
        }
    };
    
    return { refresh, gamepadService: gamepadRef.current };
}

// Usage
function MyComponent() {
    const { refresh } = useGamepadNavigation();
    
    useEffect(() => {
        // Refresh when data changes
        refresh();
    }, [data]);
    
    return <div>My component</div>;
}
```

### Angular Integration

```typescript
// gamepad-navigation.service.ts
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class GamepadNavigationService {
    private gamepadService: any;
    
    async initialize(options: any = {}) {
        if (this.gamepadService) {
            this.gamepadService.destroy();
        }
        
        const { initGamepadNavigation } = await import('./gamepadService.js');
        
        this.gamepadService = initGamepadNavigation({
            useDataAttributes: true,
            autoAddStyles: false,
            ...options
        });
        
        return this.gamepadService;
    }
    
    refresh() {
        if (this.gamepadService) {
            this.gamepadService.refresh();
        }
    }
    
    destroy() {
        if (this.gamepadService) {
            this.gamepadService.destroy();
        }
    }
}

// gamepad-navigation.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { GamepadNavigationService } from './gamepad-navigation.service';

@Component({
    selector: 'app-gamepad-navigation',
    template: `
        <div class="navigation-container">
            <button 
                *ngFor="let item of items; let i = index"
                (click)="onItemClick(item)"
            >
                {{ item.label }}
            </button>
        </div>
    `,
    styles: [`
        button[data-gamepad-focused="true"] {
            outline: 2px solid #007bff;
            outline-offset: 2px;
        }
    `]
})
export class GamepadNavigationComponent implements OnInit, OnDestroy {
    items = [
        { label: 'Item 1' },
        { label: 'Item 2' },
        { label: 'Item 3' }
    ];
    
    constructor(private gamepadService: GamepadNavigationService) {}
    
    async ngOnInit() {
        const gamepad = await this.gamepadService.initialize({
            containerSelector: '.navigation-container'
        });
        
        gamepad.onSelect = (element: HTMLElement) => {
            element.click();
        };
    }
    
    ngOnDestroy() {
        this.gamepadService.destroy();
    }
    
    onItemClick(item: any) {
        console.log('Clicked:', item);
    }
}
```

### Vue.js Integration

```vue
<!-- GamepadNavigation.vue -->
<template>
    <div class="gamepad-container">
        <button 
            v-for="(item, index) in items" 
            :key="index"
            @click="handleClick(item)"
        >
            {{ item.label }}
        </button>
    </div>
</template>

<script>
export default {
    name: 'GamepadNavigation',
    props: {
        items: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            gamepadService: null
        };
    },
    async mounted() {
        const { initGamepadNavigation } = await import('./gamepadService.js');
        
        this.gamepadService = initGamepadNavigation({
            containerSelector: '.gamepad-container',
            useDataAttributes: true,
            autoAddStyles: false
        });
        
        this.gamepadService.onSelect = (element) => {
            element.click();
        };
    },
    beforeUnmount() {
        if (this.gamepadService) {
            this.gamepadService.destroy();
        }
    },
    watch: {
        items: {
            handler() {
                this.$nextTick(() => {
                    if (this.gamepadService) {
                        this.gamepadService.refresh();
                    }
                });
            },
            deep: true
        }
    },
    methods: {
        handleClick(item) {
            console.log('Vue item clicked:', item);
        }
    }
};
</script>

<style scoped>
button[data-gamepad-focused="true"] {
    outline: 2px solid #42b883;
    outline-offset: 2px;
}
</style>
```

## 🎮 Controls Reference

| Button | Default Action | Customizable |
|--------|----------------|--------------|
| **D-pad** | Navigate elements | ✅ |
| **Left Stick** | Navigate elements | ✅ |
| **A / Cross** | Select element | ✅ |
| **B / Circle** | Go back | ✅ |
| **R1** | Next page | ✅ |
| **L1** | Previous page | ✅ |

## 🔧 Advanced Configuration

### Complete Options Reference

```javascript
const gamepad = initGamepadNavigation({
    // Navigation
    navigationMode: 'spatial',              // 'spatial' or 'grid'
    containerSelector: null,                // Limit to container
    wrapNavigation: true,                   // Wrap around edges
    
    // Style isolation
    useDataAttributes: true,                // Use data attributes
    autoAddStyles: false,                   // Don't inject CSS
    focusedClass: 'gamepad-focused',        // CSS class for focus
    selectedClass: 'gamepad-selected',      // CSS class for selection
    gamepadContext: 'default',              // Style context
    
    // Features
    enableNavigation: true,                 // Enable navigation
    enableBackButton: true,                 // B/Circle button
    enableShoulderNavigation: true,         // R1/L1 buttons
    
    // Timing
    debounceTime: 150,                      // Button debounce (ms)
    deadzone: 0.1,                          // Stick deadzone
    
    // UI
    statusElementId: 'gamepad-status',      // Status element ID
    autoCreateStatusElement: true,          // Create status element
    navigationMenuSelector: '.nav-menu'     // Navigation menu selector
});
```

### Event Handlers

```javascript
// Focus events
gamepad.onFocus = (element, index) => {
    console.log('Focused:', element);
};

// Selection events
gamepad.onSelect = (element, index) => {
    console.log('Selected:', element);
    // Custom selection logic
};

// Controller events
gamepad.onControllerConnect = (gamepad, type) => {
    console.log('Controller connected:', type);
};

gamepad.onControllerDisconnect = (gamepad) => {
    console.log('Controller disconnected');
};

// Navigation events
gamepad.onBackButton = () => {
    console.log('Back button pressed');
    // Custom back logic
};

gamepad.onNavigationMenuOpen = (button) => {
    console.log('Navigation button pressed:', button);
    // Custom navigation logic
};
```

### Dynamic Management

```javascript
// Refresh navigation after DOM changes
gamepad.refresh();

// Navigate to specific element
gamepad.navigateToIndex(2);

// Get current state
const currentElement = gamepad.getCurrentElement();
const currentIndex = gamepad.getCurrentIndex();
const isConnected = gamepad.isControllerConnected();

// Cleanup
gamepad.destroy();
```

## 🎨 Styling Utilities

### Print CSS Examples

```javascript
import { gamepadUtils } from './gamepadService.js';

// Print ready-to-use CSS examples
gamepadUtils.printCSSExamples();
```

### Add/Remove Optional Styles

```javascript
// Add optional built-in styles
gamepadUtils.addStyles({
    primaryColor: '#007bff',
    focusWidth: '2px'
});

// Remove all gamepad styles
gamepadUtils.removeStyles();
```

### Context Management

```javascript
import { setGamepadContext } from './gamepadUtils.js';

// Set context for styling
setGamepadContext('grid');     // Grid layouts
setGamepadContext('menu');     // Navigation menus
setGamepadContext('form');     // Forms
setGamepadContext('buttons');  // Button groups
```

### Dual Context Utilities

```javascript
import { gamepadUtils } from './gamepadService.js';

// Check if dual context is enabled
const isDualContext = gamepadUtils.isDualContextEnabled();

// Get current active context
const activeContext = gamepadUtils.getActiveContext();
console.log(activeContext.id); // 'menu' or 'content'

// Get specific contexts
const menuContext = gamepadUtils.getMenuContext();
const contentContext = gamepadUtils.getContentContext();

// Switch contexts programmatically
gamepadUtils.switchToMenu();
gamepadUtils.switchToContent();
gamepadUtils.switchToContext('menu');

// Get comprehensive dual context info
const info = gamepadUtils.getDualContextInfo();
console.log(info);
/*
{
    isEnabled: true,
    activeContext: 'menu',
    menuContext: {
        id: 'menu',
        elements: 4,
        currentIndex: 1,
        currentElement: <a class="nav-item">...</a>
    },
    contentContext: {
        id: 'content',
        elements: 12,
        currentIndex: 5,
        currentElement: <div class="item">...</div>
    }
}
*/

// Context switching events
gamepadUtils.onContextSwitch((newContext, oldContext) => {
    console.log(`Context switched from ${oldContext?.id} to ${newContext.id}`);
    
    // Update UI based on context
    document.body.className = `${newContext.id}-context-active`;
});
```

## 📱 SPA Integration

### React Router

```jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function App() {
    const location = useLocation();
    
    useEffect(() => {
        // Refresh navigation on route changes
        import('./gamepadService.js').then(({ gamepadUtils }) => {
            gamepadUtils.refresh();
        });
    }, [location]);
    
    return <div>App content</div>;
}
```

### Angular Router

```typescript
import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
    selector: 'app-root',
    template: '<router-outlet></router-outlet>'
})
export class AppComponent {
    constructor(private router: Router) {
        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                // Refresh navigation on route changes
                import('./gamepadService.js').then(({ gamepadUtils }) => {
                    gamepadUtils.refresh();
                });
            }
        });
    }
}
```

## 🔍 Debugging & Testing

### Debug Tools

Visit `debug-test.html` for comprehensive debugging:
- Controller connection status
- Element detection
- Button mapping
- Navigation testing
- Style management

### Console Logging

```javascript
// Enable detailed logging
initGamepadForPage({
    debug: true
});

// Manual debug info
import { gamepadUtils } from './gamepadService.js';
const info = gamepadUtils.getNavigationInfo();
console.log('Debug info:', info);
```

### Common Issues

| Issue | Solution |
|-------|----------|
| **Controller not detected** | Press any button to wake controller |
| **Navigation not working** | Check if elements are focusable |
| **Styles not applying** | Ensure data attributes are enabled |
| **SPA routing issues** | Call `refresh()` after route changes |
| **Module errors** | Use local server, not `file://` |

## 🌟 Best Practices

### 1. Style Isolation
```javascript
// ✅ Good: No style conflicts
initGamepadForPage({
    useDataAttributes: true,
    autoAddStyles: false
});

// ❌ Avoid: Potential conflicts
initGamepadForPage({
    useDataAttributes: false,
    autoAddStyles: true
});
```

### 2. Framework Integration
```javascript
// ✅ Good: Proper cleanup
useEffect(() => {
    const gamepad = initGamepadNavigation();
    return () => gamepad.destroy();
}, []);

// ❌ Avoid: Memory leaks
useEffect(() => {
    initGamepadNavigation();
    // No cleanup!
}, []);
```

### 3. Performance
```javascript
// ✅ Good: Limit scope
initGamepadNavigation({
    containerSelector: '.my-specific-container'
});

// ❌ Avoid: Whole document
initGamepadNavigation({
    containerSelector: null // Searches entire document
});
```

## 📚 Examples

Check out the included examples:
- **`index.html`** - Basic demo
- **`example-menu.html`** - Menu navigation
- **`example-simple.html`** - Simple setup
- **`example-style-isolation.html`** - Style isolation demo
- **`debug-test.html`** - Debug tools

## 🏆 Success Stories

Perfect for:
- 🎮 Gaming interfaces
- 📺 TV/streaming apps
- ♿ Accessibility navigation
- 🏢 Kiosk applications
- 🎛️ Dashboard controls
- 🎯 Any app needing gamepad support

---

**Ready to get started?** Choose your integration method and add gamepad support in minutes! 🎮✨
