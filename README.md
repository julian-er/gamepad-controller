# Gamepad Navigation Service 🎮

A lightweight, framework-agnostic gamepad navigation system for web applications. Provides seamless controller support for any HTML interface without overriding existing styles.

## ✨ Features

### 🎮 Universal Controller Support
- **Xbox Controllers** (Xbox One, Xbox Series X/S, Xbox 360)
- **PlayStation Controllers** (DualShock 4, DualSense, PS3)
- **Nintendo Controllers** (Switch Pro Controller, Joy-Cons)
- **Generic Controllers** with automatic fallback

### 🛡️ Style Isolation
- **Zero Style Conflicts** - No automatic CSS injection
- **Data Attributes** - Clean styling hooks without class conflicts
- **Context-Aware** - Different styles for different UI contexts
- **Customizable** - Full control over visual feedback

### 🔧 Smart Navigation
- **Spatial Navigation** - Intelligent element detection
- **Grid Navigation** - Perfect for CSS Grid layouts
- **Menu Navigation** - Enhanced support for navigation menus
- **Form Navigation** - Optimized for form elements

### 🚀 Easy Integration
- **Plug-and-Play** - Works with any HTML/CSS/JS app
- **Framework Support** - React, Angular, Vue.js examples
- **SPA Compatible** - Works with single-page applications
- **No Dependencies** - Pure vanilla JavaScript

### 🔄 Dual Context Navigation
- **Separate Contexts** - Independent navigation for menu and content
- **Mutual Exclusion** - Only one context active at a time
- **Context Switching** - R1/L1 for menu, stick for content
- **Isolated State** - Each context maintains its own focus and selection

## 🔧 Quick Setup

### Prerequisites

⚠️ **Important**: This service uses ES6 modules and requires a local server (not `file://`).

**Option 1: VS Code Live Server (Recommended)**
1. Install the "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

**Option 2: Node.js Static Server**
```bash
npx http-server
# Visit: http://localhost:8080
```

**Option 3: Any Static Server**
```bash
# Examples:
python3 -m http.server 8000
php -S localhost:8000
ruby -run -e httpd . -p 8000
```

### Basic HTML Integration

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>My App with Gamepad Support</title>
    <style>
        /* Your existing styles remain unchanged */
        .my-button:focus {
            outline: 2px solid #007bff;
        }
        
        /* Optional: Add gamepad-specific styles */
        [data-gamepad-focused="true"] {
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.5);
        }
    </style>
</head>
<body>
    <div class="my-app">
        <button class="my-button">Button 1</button>
        <button class="my-button">Button 2</button>
        <button class="my-button">Button 3</button>
    </div>

    <script type="module">
        import { initGamepadForPage } from './gamepadService.js';
        
        // One-line setup - no style conflicts!
        initGamepadForPage();
    </script>
</body>
</html>
```

### Custom Integration

```javascript
import { initGamepadNavigation } from './gamepadService.js';

// Initialize with custom options
const gamepad = initGamepadNavigation({
    navigationMode: 'spatial',        // 'spatial' or 'grid'
    useDataAttributes: true,          // Use data attributes (recommended)
    autoAddStyles: false,             // Don't inject CSS (default)
    gamepadContext: 'buttons',        // Context for styling
    enableBackButton: true,           // B/Circle button support
    enableShoulderNavigation: true    // R1/L1 navigation
});

// Add event listeners
gamepad.onFocus = (element, index) => {
    console.log(`Focused on: ${element.textContent}`);
};

gamepad.onSelect = (element, index) => {
    console.log(`Selected: ${element.textContent}`);
    // Your custom logic here
};
```

### Dual Context Integration

```javascript
import { initDualContextGamepad } from './gamepadService.js';

// Initialize with dual context support
const gamepad = initDualContextGamepad({
    // Menu context (R1/L1 navigation)
    menuContextSelector: '.nav-menu',
    
    // Content context (stick navigation)
    contentContextSelector: '.main-content',
    
    // Styling options
    useDataAttributes: true,
    focusedClass: 'gamepad-focused',
    selectedClass: 'gamepad-selected'
});

// Handle context switching
gamepad.onContextSwitch = (newContext, oldContext) => {
    console.log(`Context switched from ${oldContext?.id} to ${newContext.id}`);
    
    // Update UI based on active context
    document.body.className = `${newContext.id}-context-active`;
};
```

**How it works:**
- **Left Stick**: Navigates content area elements spatially
- **R1/L1 Buttons**: Navigate menu items horizontally
- **Automatic Switching**: Using stick activates content context, R1/L1 activates menu context
- **Mutual Exclusion**: Only one context is active at a time
- **X Button**: Only affects the currently active context

## 📖 Integration Guides

### React Integration

```jsx
import { useEffect, useRef } from 'react';

function GamepadEnabledComponent({ items }) {
    const gamepadRef = useRef(null);
    
    useEffect(() => {
        // Initialize gamepad service
        import('./gamepadService.js').then(({ initGamepadNavigation }) => {
            gamepadRef.current = initGamepadNavigation({
                containerSelector: '.my-container',
                navigationMode: 'spatial',
                useDataAttributes: true,
                autoAddStyles: false // Keep your existing styles
            });
            
            // Set up event handlers
            gamepadRef.current.onFocus = (element, index) => {
                console.log('Gamepad focused:', element);
            };
            
            gamepadRef.current.onSelect = (element, index) => {
                // Trigger React onClick handler
                element.click();
            };
        });
        
        // Cleanup
        return () => {
            if (gamepadRef.current) {
                gamepadRef.current.destroy();
            }
        };
    }, []);
    
    // Refresh navigation when items change
    useEffect(() => {
        if (gamepadRef.current) {
            gamepadRef.current.refresh();
        }
    }, [items]);
    
    return (
        <div className="my-container">
            {items.map((item, index) => (
                <button 
                    key={index} 
                    className="my-button"
                    onClick={() => handleClick(item)}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}

// CSS for React component
const styles = `
    .my-button[data-gamepad-focused="true"] {
        box-shadow: 0 0 0 3px #007bff;
        transform: scale(1.05);
    }
`;
```

### Angular Integration

```typescript
// gamepad.component.ts
import { Component, OnInit, OnDestroy, Input } from '@angular/core';

@Component({
    selector: 'app-gamepad-navigation',
    template: `
        <div class="navigation-container">
            <button 
                *ngFor="let item of items; let i = index"
                class="nav-button"
                (click)="onItemClick(item)"
            >
                {{ item.label }}
            </button>
        </div>
    `,
    styles: [`
        .nav-button[data-gamepad-focused="true"] {
            box-shadow: 0 0 0 3px #007bff;
            transform: scale(1.05);
        }
    `]
})
export class GamepadNavigationComponent implements OnInit, OnDestroy {
    @Input() items: any[] = [];
    
    private gamepadService: any;
    
    async ngOnInit() {
        // Dynamic import to load gamepad service
        const { initGamepadNavigation } = await import('./gamepadService.js');
        
        this.gamepadService = initGamepadNavigation({
            containerSelector: '.navigation-container',
            navigationMode: 'spatial',
            useDataAttributes: true,
            autoAddStyles: false
        });
        
        // Set up event handlers
        this.gamepadService.onFocus = (element: HTMLElement, index: number) => {
            console.log('Gamepad focused:', element);
        };
        
        this.gamepadService.onSelect = (element: HTMLElement, index: number) => {
            // Trigger Angular click handler
            element.click();
        };
    }
    
    ngOnDestroy() {
        if (this.gamepadService) {
            this.gamepadService.destroy();
        }
    }
    
    onItemClick(item: any) {
        console.log('Item clicked:', item);
        // Your click handling logic
    }
}
```

### Vue.js Integration

```vue
<template>
    <div class="vue-gamepad-container">
        <button 
            v-for="(item, index) in items" 
            :key="index"
            class="vue-button"
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
            default: () => []
        }
    },
    data() {
        return {
            gamepadService: null
        };
    },
    async mounted() {
        // Initialize gamepad service
        const { initGamepadNavigation } = await import('./gamepadService.js');
        
        this.gamepadService = initGamepadNavigation({
            containerSelector: '.vue-gamepad-container',
            navigationMode: 'spatial',
            useDataAttributes: true,
            autoAddStyles: false
        });
        
        // Event handlers
        this.gamepadService.onFocus = (element, index) => {
            console.log('Vue gamepad focused:', element);
        };
        
        this.gamepadService.onSelect = (element, index) => {
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
                // Refresh when items change
                if (this.gamepadService) {
                    this.$nextTick(() => {
                        this.gamepadService.refresh();
                    });
                }
            },
            deep: true
        }
    },
    methods: {
        handleClick(item) {
            console.log('Vue item clicked:', item);
            // Your click handling logic
        }
    }
};
</script>

<style scoped>
.vue-button[data-gamepad-focused="true"] {
    box-shadow: 0 0 0 3px #42b883;
    transform: scale(1.05);
}
</style>
```

## 🎨 Styling Guide

### No Style Conflicts (Default)

```javascript
// By default, the service adds NO styles
const gamepad = initGamepadForPage();
// Navigation works, but no visual changes
```

### Using Data Attributes (Recommended)

```css
/* Style using data attributes for better isolation */
[data-gamepad-focused="true"] {
    /* Your custom focus styles */
    outline: 2px solid #007bff;
    outline-offset: 2px;
}

[data-gamepad-selected="true"] {
    /* Your custom selection styles */
    background-color: #007bff;
    color: white;
}

/* Context-specific styles */
[data-gamepad-context="grid"] [data-gamepad-focused="true"] {
    transform: scale(1.05);
}

[data-gamepad-context="menu"] [data-gamepad-focused="true"] {
    background-color: rgba(0, 123, 255, 0.1);
    border-left: 4px solid #007bff;
}
```

### Respecting Existing Styles

```css
/* Your existing focus styles */
.my-button:focus {
    outline: 2px solid #28a745;
}

/* Enhance with gamepad focus (don't override) */
.my-button[data-gamepad-focused="true"] {
    outline: 2px solid #28a745;
    box-shadow: 0 0 0 4px rgba(40, 167, 69, 0.3);
}
```

### Optional Built-in Styles

```javascript
// Only if you want the built-in styles
const gamepad = initGamepadForPage({
    autoAddStyles: true,  // Opt-in to built-in styles
    useDataAttributes: true
});

// Or add them later
import { gamepadUtils } from './gamepadService.js';
gamepadUtils.addStyles({
    primaryColor: '#007bff',
    focusWidth: '2px'
});
```

## 🎮 Controls

| Input | Action |
|-------|--------|
| **D-pad / Left Stick** | Navigate elements |
| **A / Cross / A** | Select element |
| **B / Circle** | Go back (if enabled) |
| **R1 / L1** | Navigate pages (if enabled) |

## 🔧 API Reference

### Main Functions

```javascript
import { 
    initGamepadForPage,      // One-line setup
    initGamepadNavigation,   // Custom setup
    gamepadService,          // Quick setup
    gamepadUtils             // Utility functions
} from './gamepadService.js';

// One-line initialization
initGamepadForPage();

// Custom initialization
const gamepad = initGamepadNavigation({
    navigationMode: 'spatial',
    useDataAttributes: true,
    autoAddStyles: false,
    gamepadContext: 'default'
});

// Utility functions
gamepadUtils.addStyles();           // Add optional styles
gamepadUtils.removeStyles();        // Remove styles
gamepadUtils.printCSSExamples();    // Print CSS examples
gamepadUtils.refresh();             // Refresh navigation
```

### Event Handlers

```javascript
gamepad.onFocus = (element, index) => {
    // Element gained focus
};

gamepad.onSelect = (element, index) => {
    // Element was selected
};

gamepad.onControllerConnect = (gamepad, type) => {
    // Controller connected
};

gamepad.onControllerDisconnect = (gamepad) => {
    // Controller disconnected
};

gamepad.onBackButton = () => {
    // Back button pressed
};
```

## 📁 File Structure

```
gamepad-navigation/
├── gamepadService.js           # Main service (convenience wrapper)
├── gamepadServiceModel.js      # Core GamepadService class
├── gamepadUtils.js             # Utility functions
├── controllerMappings.js       # Controller mappings
├── index.html                  # Demo page
├── example-menu.html           # Menu navigation demo
├── example-simple.html         # Simple setup demo
├── example-style-isolation.html # Style isolation demo
├── debug-test.html             # Debug tools
├── style.css                   # Demo styles
├── README.md                   # This file
└── USAGE_GUIDE.md              # Detailed usage guide
```

## 🔍 Testing & Debugging

### Debug Tools

Visit `debug-test.html` for comprehensive debugging tools:
- Controller connection status
- Element detection
- Navigation testing
- Style management
- Console logging

### Print CSS Examples

```javascript
import { gamepadUtils } from './gamepadService.js';
gamepadUtils.printCSSExamples();
// Prints ready-to-use CSS examples to console
```

### Common Issues

1. **Module loading errors**: Ensure you're using a local server
2. **Navigation not working**: Check if elements are focusable
3. **Style conflicts**: Use data attributes instead of CSS classes
4. **SPA routing**: Refresh navigation after route changes

## 🌟 Examples

- **`index.html`** - Basic demo with navigation menu
- **`example-menu.html`** - Menu navigation example
- **`example-simple.html`** - Simple setup example
- **`example-style-isolation.html`** - Style isolation demo
- **`debug-test.html`** - Debug and testing tools

## 📱 Browser Support

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support
- **Edge**: ✅ Full support
- **Mobile**: ⚠️ Limited (gamepad support varies)

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional controller support
- Framework-specific optimizations
- Accessibility enhancements
- Performance optimizations

## 📄 License

MIT License - feel free to use in any project!

---

**Perfect for:** Gaming UIs, TV interfaces, accessibility navigation, dashboard controls, kiosk applications, and any web app that needs gamepad support! 🎮✨
