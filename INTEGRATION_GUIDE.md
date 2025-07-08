# Gamepad Navigation - Integration Guide

## 🎯 For Developers Adding to Existing Projects

This guide shows how to integrate gamepad navigation into your existing web application without disrupting your current styles, functionality, or architecture.

## 📋 Prerequisites

- **Local Server Required**: ES6 modules need HTTP (not `file://`)
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **No Dependencies**: Pure vanilla JavaScript

## 🔧 File Setup

### 1. Download Files

Add these files to your project:

```
your-project/
├── assets/gamepad/              # Suggested location
│   ├── gamepadService.js        # Main service
│   ├── gamepadServiceModel.js   # Core service class
│   ├── gamepadUtils.js          # Utilities
│   └── controllerMappings.js    # Controller mappings
└── your-existing-files...
```

### 2. Import Method

```javascript
// ES6 Modules (recommended)
import { initGamepadForPage } from './assets/gamepad/gamepadService.js';

// Or dynamic import
const { initGamepadForPage } = await import('./assets/gamepad/gamepadService.js');
```

## 🚀 Integration Patterns

### Pattern 1: Minimal Integration (Zero Visual Changes)

**Perfect for:** Testing, gradual rollout, apps with strict design requirements

```javascript
// Add to your existing page
import { initGamepadForPage } from './gamepadService.js';

// Zero visual changes - navigation works invisibly
initGamepadForPage();
```

**What happens:**
- ✅ Navigation works with gamepad
- ✅ No style changes to your app
- ✅ No conflicts with existing CSS
- ✅ All your existing functionality preserved

### Pattern 2: Custom Styling Integration

**Perfect for:** Apps that want control over gamepad visual feedback

```javascript
// Initialize without built-in styles
import { initGamepadNavigation } from './gamepadService.js';

const gamepad = initGamepadNavigation({
    useDataAttributes: true,    // Use data attributes
    autoAddStyles: false,       // Don't inject CSS
    gamepadContext: 'buttons'   // Set context
});
```

```css
/* Add to your existing CSS */
[data-gamepad-focused="true"] {
    /* Your custom focus styles */
    outline: 2px solid var(--your-primary-color);
    outline-offset: 2px;
}

/* Respect existing styles */
.your-button:focus[data-gamepad-focused="true"] {
    /* Enhance existing focus, don't override */
    outline: 2px solid var(--your-primary-color);
    box-shadow: 0 0 0 4px var(--your-primary-color-alpha);
}
```

### Pattern 3: Framework-Specific Integration

**Perfect for:** React, Angular, Vue.js applications

See framework-specific sections below.

## 🎨 Style Integration Strategies

### Strategy 1: Data Attributes (Recommended)

```javascript
// Enable data attributes
initGamepadForPage({
    useDataAttributes: true
});
```

```css
/* Style using data attributes - no conflicts */
[data-gamepad-focused="true"] {
    /* Your styles */
}

/* Context-specific styling */
[data-gamepad-context="grid"] [data-gamepad-focused="true"] {
    transform: scale(1.05);
}
```

### Strategy 2: CSS Classes

```javascript
// Use custom CSS classes
initGamepadForPage({
    useDataAttributes: false,
    focusedClass: 'my-gamepad-focus',
    selectedClass: 'my-gamepad-selected'
});
```

```css
.my-gamepad-focus {
    /* Your focus styles */
}

.my-gamepad-selected {
    /* Your selection styles */
}
```

### Strategy 3: Hybrid Approach

```css
/* Use both your existing styles and gamepad enhancements */
.my-button:focus {
    /* Your existing focus styles */
    outline: 2px solid #007bff;
}

.my-button:focus[data-gamepad-focused="true"] {
    /* Additional gamepad-specific enhancement */
    box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.3);
}
```

## ⚛️ React Integration

### Option 1: Component Wrapper

```jsx
// GamepadWrapper.jsx
import { useEffect, useRef } from 'react';

export function GamepadWrapper({ 
    children, 
    options = {},
    onFocus = null,
    onSelect = null 
}) {
    const gamepadRef = useRef(null);
    
    useEffect(() => {
        const initGamepad = async () => {
            const { initGamepadNavigation } = await import('./gamepadService.js');
            
            gamepadRef.current = initGamepadNavigation({
                useDataAttributes: true,
                autoAddStyles: false,
                ...options
            });
            
            // Connect React handlers
            if (onFocus) {
                gamepadRef.current.onFocus = onFocus;
            }
            
            if (onSelect) {
                gamepadRef.current.onSelect = onSelect;
            }
        };
        
        initGamepad();
        
        return () => {
            if (gamepadRef.current) {
                gamepadRef.current.destroy();
            }
        };
    }, []);
    
    return (
        <div className="gamepad-enabled">
            {children}
        </div>
    );
}

// Usage in your existing React components
function MyExistingComponent() {
    const items = ['Item 1', 'Item 2', 'Item 3'];
    
    const handleGamepadFocus = (element, index) => {
        console.log('Gamepad focused:', element);
    };
    
    const handleGamepadSelect = (element, index) => {
        // Trigger React onClick
        element.click();
    };
    
    return (
        <GamepadWrapper 
            onFocus={handleGamepadFocus}
            onSelect={handleGamepadSelect}
        >
            <div className="my-existing-container">
                {items.map((item, index) => (
                    <button 
                        key={index}
                        onClick={() => handleClick(item)}
                        className="my-existing-button"
                    >
                        {item}
                    </button>
                ))}
            </div>
        </GamepadWrapper>
    );
}
```

### Option 2: React Hook

```jsx
// useGamepad.js
import { useEffect, useRef } from 'react';

export function useGamepad(options = {}) {
    const gamepadRef = useRef(null);
    
    useEffect(() => {
        const initGamepad = async () => {
            const { initGamepadNavigation } = await import('./gamepadService.js');
            
            gamepadRef.current = initGamepadNavigation({
                useDataAttributes: true,
                autoAddStyles: false,
                ...options
            });
        };
        
        initGamepad();
        
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
    
    const setEventHandlers = (handlers) => {
        if (gamepadRef.current) {
            Object.assign(gamepadRef.current, handlers);
        }
    };
    
    return {
        refresh,
        setEventHandlers,
        gamepadService: gamepadRef.current
    };
}

// Usage
function MyComponent() {
    const { refresh, setEventHandlers } = useGamepad();
    
    useEffect(() => {
        setEventHandlers({
            onFocus: (element, index) => {
                console.log('Focused:', element);
            },
            onSelect: (element, index) => {
                element.click();
            }
        });
    }, []);
    
    return <div>My component</div>;
}
```

### Option 3: React Context

```jsx
// GamepadContext.jsx
import { createContext, useContext, useEffect, useRef } from 'react';

const GamepadContext = createContext();

export function GamepadProvider({ children }) {
    const gamepadRef = useRef(null);
    
    useEffect(() => {
        const initGamepad = async () => {
            const { initGamepadNavigation } = await import('./gamepadService.js');
            
            gamepadRef.current = initGamepadNavigation({
                useDataAttributes: true,
                autoAddStyles: false
            });
        };
        
        initGamepad();
        
        return () => {
            if (gamepadRef.current) {
                gamepadRef.current.destroy();
            }
        };
    }, []);
    
    return (
        <GamepadContext.Provider value={gamepadRef.current}>
            {children}
        </GamepadContext.Provider>
    );
}

export function useGamepadContext() {
    return useContext(GamepadContext);
}

// Usage
function App() {
    return (
        <GamepadProvider>
            <MyExistingApp />
        </GamepadProvider>
    );
}

function MyComponent() {
    const gamepad = useGamepadContext();
    
    useEffect(() => {
        if (gamepad) {
            gamepad.onFocus = (element, index) => {
                console.log('Focused:', element);
            };
        }
    }, [gamepad]);
    
    return <div>My component</div>;
}
```

## 🅰️ Angular Integration

### Option 1: Service

```typescript
// gamepad-navigation.service.ts
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class GamepadNavigationService {
    private gamepadService: any = null;
    
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
    
    setEventHandlers(handlers: any) {
        if (this.gamepadService) {
            Object.assign(this.gamepadService, handlers);
        }
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
    
    getCurrentElement() {
        return this.gamepadService?.getCurrentElement();
    }
}
```

### Option 2: Directive

```typescript
// gamepad-navigation.directive.ts
import { Directive, ElementRef, OnInit, OnDestroy, Input } from '@angular/core';

@Directive({
    selector: '[gamepadNavigation]'
})
export class GamepadNavigationDirective implements OnInit, OnDestroy {
    @Input() gamepadOptions: any = {};
    
    private gamepadService: any;
    
    constructor(private elementRef: ElementRef) {}
    
    async ngOnInit() {
        const { initGamepadNavigation } = await import('./gamepadService.js');
        
        this.gamepadService = initGamepadNavigation({
            containerSelector: this.elementRef.nativeElement,
            useDataAttributes: true,
            autoAddStyles: false,
            ...this.gamepadOptions
        });
        
        // Set up event handlers
        this.gamepadService.onSelect = (element: HTMLElement) => {
            element.click();
        };
    }
    
    ngOnDestroy() {
        if (this.gamepadService) {
            this.gamepadService.destroy();
        }
    }
}

// Usage
@Component({
    template: `
        <div gamepadNavigation [gamepadOptions]="gamepadConfig">
            <button (click)="handleClick(1)">Button 1</button>
            <button (click)="handleClick(2)">Button 2</button>
        </div>
    `
})
export class MyComponent {
    gamepadConfig = {
        navigationMode: 'spatial',
        gamepadContext: 'buttons'
    };
    
    handleClick(value: number) {
        console.log('Button clicked:', value);
    }
}
```

### Option 3: Component

```typescript
// gamepad-navigation.component.ts
import { Component, OnInit, OnDestroy, Input, ContentChild, TemplateRef } from '@angular/core';

@Component({
    selector: 'app-gamepad-navigation',
    template: `
        <div class="gamepad-container">
            <ng-content></ng-content>
        </div>
    `,
    styles: [`
        .gamepad-container[data-gamepad-focused="true"] {
            outline: 2px solid #007bff;
        }
    `]
})
export class GamepadNavigationComponent implements OnInit, OnDestroy {
    @Input() options: any = {};
    
    private gamepadService: any;
    
    async ngOnInit() {
        const { initGamepadNavigation } = await import('./gamepadService.js');
        
        this.gamepadService = initGamepadNavigation({
            containerSelector: '.gamepad-container',
            useDataAttributes: true,
            autoAddStyles: false,
            ...this.options
        });
        
        this.gamepadService.onSelect = (element: HTMLElement) => {
            element.click();
        };
    }
    
    ngOnDestroy() {
        if (this.gamepadService) {
            this.gamepadService.destroy();
        }
    }
}

// Usage
@Component({
    template: `
        <app-gamepad-navigation [options]="gamepadOptions">
            <button (click)="handleClick(1)">Button 1</button>
            <button (click)="handleClick(2)">Button 2</button>
        </app-gamepad-navigation>
    `
})
export class MyComponent {
    gamepadOptions = {
        navigationMode: 'spatial'
    };
    
    handleClick(value: number) {
        console.log('Button clicked:', value);
    }
}
```

## 🟢 Vue.js Integration

### Option 1: Composable

```javascript
// useGamepad.js
import { ref, onMounted, onUnmounted } from 'vue';

export function useGamepad(options = {}) {
    const gamepadService = ref(null);
    
    onMounted(async () => {
        const { initGamepadNavigation } = await import('./gamepadService.js');
        
        gamepadService.value = initGamepadNavigation({
            useDataAttributes: true,
            autoAddStyles: false,
            ...options
        });
    });
    
    onUnmounted(() => {
        if (gamepadService.value) {
            gamepadService.value.destroy();
        }
    });
    
    const refresh = () => {
        if (gamepadService.value) {
            gamepadService.value.refresh();
        }
    };
    
    const setEventHandlers = (handlers) => {
        if (gamepadService.value) {
            Object.assign(gamepadService.value, handlers);
        }
    };
    
    return {
        gamepadService,
        refresh,
        setEventHandlers
    };
}

// Usage
<template>
    <div class="my-component">
        <button @click="handleClick(1)">Button 1</button>
        <button @click="handleClick(2)">Button 2</button>
    </div>
</template>

<script setup>
import { useGamepad } from './useGamepad.js';

const { setEventHandlers } = useGamepad();

setEventHandlers({
    onSelect: (element) => {
        element.click();
    }
});

const handleClick = (value) => {
    console.log('Button clicked:', value);
};
</script>
```

### Option 2: Component

```vue
<!-- GamepadNavigation.vue -->
<template>
    <div class="gamepad-wrapper">
        <slot></slot>
    </div>
</template>

<script>
export default {
    name: 'GamepadNavigation',
    props: {
        options: {
            type: Object,
            default: () => ({})
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
            containerSelector: '.gamepad-wrapper',
            useDataAttributes: true,
            autoAddStyles: false,
            ...this.options
        });
        
        this.gamepadService.onSelect = (element) => {
            element.click();
        };
    },
    beforeUnmount() {
        if (this.gamepadService) {
            this.gamepadService.destroy();
        }
    }
};
</script>

<style scoped>
.gamepad-wrapper [data-gamepad-focused="true"] {
    outline: 2px solid #42b883;
}
</style>
```

## 🎯 SPA Integration

### Handling Route Changes

```javascript
// React Router
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function App() {
    const location = useLocation();
    
    useEffect(() => {
        // Refresh gamepad navigation on route changes
        import('./gamepadService.js').then(({ gamepadUtils }) => {
            gamepadUtils.refresh();
        });
    }, [location.pathname]);
    
    return <div>App content</div>;
}
```

```typescript
// Angular Router
import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
    selector: 'app-root',
    template: '<router-outlet></router-outlet>'
})
export class AppComponent {
    constructor(private router: Router) {
        this.router.events.subscribe(async (event) => {
            if (event instanceof NavigationEnd) {
                const { gamepadUtils } = await import('./gamepadService.js');
                gamepadUtils.refresh();
            }
        });
    }
}
```

```javascript
// Vue Router
import { watch } from 'vue';
import { useRoute } from 'vue-router';

export default {
    setup() {
        const route = useRoute();
        
        watch(() => route.path, async () => {
            const { gamepadUtils } = await import('./gamepadService.js');
            gamepadUtils.refresh();
        });
    }
};
```

## 🔍 Testing Integration

### Unit Testing

```javascript
// Jest example
describe('Gamepad Integration', () => {
    let gamepadService;
    
    beforeEach(async () => {
        const { initGamepadNavigation } = await import('./gamepadService.js');
        gamepadService = initGamepadNavigation({
            autoAddStyles: false
        });
    });
    
    afterEach(() => {
        if (gamepadService) {
            gamepadService.destroy();
        }
    });
    
    test('should initialize without errors', () => {
        expect(gamepadService).toBeDefined();
        expect(gamepadService.isControllerConnected()).toBe(false);
    });
    
    test('should handle focus events', () => {
        const mockHandler = jest.fn();
        gamepadService.onFocus = mockHandler;
        
        // Simulate focus event
        gamepadService.handleNavigation('right');
        
        expect(mockHandler).toHaveBeenCalled();
    });
});
```

### E2E Testing

```javascript
// Cypress example
describe('Gamepad Navigation', () => {
    it('should navigate with keyboard as fallback', () => {
        cy.visit('/your-page');
        
        // Test keyboard navigation (gamepad fallback)
        cy.get('button').first().focus();
        cy.get('button').first().should('have.attr', 'data-gamepad-focused', 'true');
        
        // Test selection
        cy.get('button').first().type('{enter}');
        cy.get('button').first().should('have.attr', 'data-gamepad-selected', 'true');
    });
});
```

## 📊 Performance Considerations

### Lazy Loading

```javascript
// Load gamepad service only when needed
async function initGamepadWhenNeeded() {
    // Only load if gamepad is detected
    if (navigator.getGamepads().some(gp => gp && gp.connected)) {
        const { initGamepadForPage } = await import('./gamepadService.js');
        initGamepadForPage();
    }
}

// Check periodically
setInterval(initGamepadWhenNeeded, 1000);
```

### Memory Management

```javascript
// Proper cleanup in SPA
class GamepadManager {
    constructor() {
        this.gamepadService = null;
    }
    
    async init() {
        if (this.gamepadService) {
            this.gamepadService.destroy();
        }
        
        const { initGamepadNavigation } = await import('./gamepadService.js');
        this.gamepadService = initGamepadNavigation();
    }
    
    destroy() {
        if (this.gamepadService) {
            this.gamepadService.destroy();
            this.gamepadService = null;
        }
    }
}
```

## 🎨 Custom Styling Examples

### Material Design

```css
[data-gamepad-focused="true"] {
    outline: none;
    box-shadow: 0 0 0 2px #1976d2;
    border-radius: 4px;
}

[data-gamepad-selected="true"] {
    background-color: #1976d2;
    color: white;
}
```

### Bootstrap Integration

```css
.btn[data-gamepad-focused="true"] {
    outline: none;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.btn[data-gamepad-selected="true"] {
    background-color: #007bff;
    border-color: #007bff;
}
```

### Tailwind CSS

```css
[data-gamepad-focused="true"] {
    @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

[data-gamepad-selected="true"] {
    @apply bg-blue-500 text-white;
}
```

## 🔧 Advanced Customization

### Custom Controller Mapping

```javascript
// Add custom controller support
import { CONTROLLER_MAPPINGS } from './controllerMappings.js';

CONTROLLER_MAPPINGS.custom = {
    buttons: {
        0: 'A',
        1: 'B',
        // ... your custom mapping
    }
};
```

### Custom Navigation Logic

```javascript
const gamepad = initGamepadNavigation();

// Override default navigation
gamepad.handleNavigation = (direction) => {
    // Your custom navigation logic
    console.log('Custom navigation:', direction);
};
```

## 📱 Mobile Considerations

### Touch Fallback

```javascript
// Add touch support for mobile
const gamepad = initGamepadNavigation({
    enableTouchFallback: true // Custom option
});

// Handle touch events
gamepad.onTouchStart = (element) => {
    // Touch equivalent of gamepad focus
};
```

### Responsive Design

```css
@media (max-width: 768px) {
    [data-gamepad-focused="true"] {
        /* Mobile-specific focus styles */
        outline: 3px solid #007bff;
        outline-offset: 3px;
    }
}
```

## 🎯 Migration from Other Solutions

### From Existing Keyboard Navigation

```javascript
// Replace existing keyboard navigation
document.removeEventListener('keydown', oldKeyboardHandler);

// Add gamepad navigation
initGamepadForPage({
    onSelect: (element) => {
        // Use your existing click handlers
        element.click();
    }
});
```

### From Custom Gamepad Code

```javascript
// Replace custom gamepad implementation
if (window.customGamepadSystem) {
    window.customGamepadSystem.destroy();
}

// Initialize new system
const gamepad = initGamepadNavigation({
    // Map your old options to new API
    focusedClass: 'old-focus-class',
    selectedClass: 'old-selected-class'
});
```

## 🎉 Success Checklist

### ✅ Integration Complete When:

- [ ] Gamepad navigation works without visual disruption
- [ ] Existing click handlers work with gamepad selection
- [ ] No style conflicts with your existing CSS
- [ ] Navigation refreshes properly on content changes
- [ ] Controller connection/disconnection handled gracefully
- [ ] Works across all your application's routes/views
- [ ] Performance impact is minimal
- [ ] Accessibility is maintained/improved

### 🔍 Testing Checklist:

- [ ] Test with Xbox controller
- [ ] Test with PlayStation controller
- [ ] Test with different page layouts
- [ ] Test with dynamic content changes
- [ ] Test with SPA routing
- [ ] Test with existing keyboard navigation
- [ ] Test performance with large element lists
- [ ] Test style isolation with your CSS framework

---

**Ready to integrate?** Start with the minimal integration pattern and gradually add features as needed! 🎮✨ 