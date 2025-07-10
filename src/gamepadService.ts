// gamepadService.js
// Convenience wrapper for easy gamepad navigation setup

import { GamepadService } from './gamepadServiceModel.js';
import type { GamepadServiceOptions } from './Interfaces/GamepadServiceOptions.js';

// Global instance
let gamepadInstance: GamepadService | null = null;

// Simple initialization function with navigation support
export function initGamepadNavigation(options: GamepadServiceOptions = {}): GamepadService {
    // Destroy existing instance if any
    if (gamepadInstance) {
        gamepadInstance.destroy();
    }

    // Enhanced default options with navigation enabled
    const defaultOptions: GamepadServiceOptions = {
        statusElementId: 'gamepad-status',
        focusedClass: 'gamepad-focused',
        selectedClass: 'gamepad-selected',
        navigationMode: 'spatial',
        wrapNavigation: true,
        autoDetectElements: true,
        // Navigation features enabled by default
        enableNavigation: true,
        enableBackButton: true,
        enableShoulderNavigation: true,
        autoCreateStatusElement: true,
        autoAddStyles: false, // Styles are now completely opt-in
        debounceTime: 150,
        deadzone: 0.1,
        ...options
    };

    // Create new instance
    gamepadInstance = new GamepadService(defaultOptions);
    gamepadInstance.init();
    
    return gamepadInstance;
}

// Quick setup function that automatically detects common patterns
export function gamepadService(containerSelector: string | null | undefined = null, options: GamepadServiceOptions = {}): GamepadService {
    const defaultOptions: GamepadServiceOptions = {
        containerSelector: containerSelector,
        statusElementId: 'gamepad-status',
        focusedClass: 'gamepad-focused',
        selectedClass: 'gamepad-selected',
        navigationMode: 'spatial', // Changed from 'grid' to 'spatial' for better nav menu support
        wrapNavigation: true,
        autoDetectElements: true,
        // Enhanced navigation options
        enableNavigation: true,
        enableBackButton: true,
        enableShoulderNavigation: true,
        autoCreateStatusElement: true,
        autoAddStyles: false, // Styles are now completely opt-in
        debounceTime: 150,
        deadzone: 0.1,
        ...options
    };

    return initGamepadNavigation(defaultOptions);
}

// Super simple one-line initialization for any page
export function initGamepadForPage(options: GamepadServiceOptions = {}): GamepadService {
    console.log('🎮 Initializing gamepad navigation for page...');
    
    const instance = gamepadService(null, {
        navigationMode: 'spatial',
        focusedClass: 'gamepad-focused',
        selectedClass: 'gamepad-selected',
        enableNavigation: true,
        enableBackButton: true,
        enableShoulderNavigation: true,
        autoCreateStatusElement: true,
        autoAddStyles: false, // Styles are now completely opt-in
        ...options
    });

    // Set up common event handlers automatically
    instance.onFocus = (element: Element, index: number) => {
        const title = (element instanceof HTMLElement) ? (element as HTMLElement).dataset?.title : undefined;
        console.log(`🎯 Focused: ${element.textContent || title || element.tagName}`);
    };

    instance.onSelect = (element: Element, index: number) => {
        const title = (element instanceof HTMLElement) ? (element as HTMLElement).dataset?.title : undefined;
        console.log(`✅ Selected: ${element.textContent || title || element.tagName}`);
        // Auto-handle navigation menu links
        if (element.classList.contains('nav-item') && 'href' in element && (element as HTMLAnchorElement).href) {
            console.log(`🔗 Navigating to: ${(element as HTMLAnchorElement).href}`);
            // Navigation is already handled in the GamepadService
        }
    };

    instance.onControllerConnect = (gamepad: Gamepad) => {
        console.log(`🎮 Controller connected`);
    };

    instance.onControllerDisconnect = (gamepad: Gamepad) => {
        console.log('🎮 Controller disconnected');
    };

    instance.onBackButton = () => {
        console.log('🔙 Back button pressed');
        // Default behavior (window.history.back()) is handled automatically
    };

    instance.onNavigationMenuOpen = (button: string) => {
        console.log(`📱 Navigation menu: ${button} pressed`);
        // Navigation between pages is handled automatically
    };

    console.log('✅ Gamepad navigation initialized with full functionality');
    console.log('📖 Controls: D-pad/Analog stick to navigate • A/X to select • B/Circle to go back • R1/L1 for page navigation');
    console.log('🎨 Note: No styles applied by default. Use data attributes or CSS classes to style navigation.');
    console.log('💡 Quick styling: gamepadUtils.addNavigationStyles() or gamepadUtils.printCSSExamples()');
    
    return instance;
}

// Dual context initialization - separate navigation for menu and content
export function initDualContextGamepad(options: GamepadServiceOptions = {}): GamepadService {
    console.log('🎮 Initializing dual context gamepad navigation...');
    
    const defaultOptions: GamepadServiceOptions = {
        // Enable dual context mode
        enableDualContext: true,
        
        // Menu context (R1/L1 navigation)
        menuContextSelector: '.nav-menu, nav, .navigation',
        
        // Content context (stick navigation)
        contentContextSelector: null, // null means everything not in menu
        
        // Common options
        focusedClass: 'gamepad-focused',
        selectedClass: 'gamepad-selected',
        useDataAttributes: false,
        statusElementId: 'gamepad-status',
        autoCreateStatusElement: true,
        autoAddStyles: false,
        enableNavigation: true,
        enableBackButton: true,
        enableShoulderNavigation: true,
        debounceTime: 150,
        deadzone: 0.1,
        ...options
    };

    // Create new instance with dual context
    gamepadInstance = new GamepadService(defaultOptions);
    gamepadInstance.init();

    // Set up common event handlers
    gamepadInstance.onFocus = (element: Element, index: number) => {
        const context = gamepadInstance?.getActiveContext();
        const title = (element instanceof HTMLElement) ? (element as HTMLElement).dataset?.title : undefined;
        console.log(`🎯 Focused (${context?.id}): ${element.textContent || title || element.tagName}`);
    };

    gamepadInstance.onSelect = (element: Element, index: number) => {
        const context = gamepadInstance?.getActiveContext();
        const title = (element instanceof HTMLElement) ? (element as HTMLElement).dataset?.title : undefined;
        console.log(`✅ Selected (${context?.id}): ${element.textContent || title || element.tagName}`);
        // Auto-handle navigation menu links
        if (element.classList.contains('nav-item') && 'href' in element && (element as HTMLAnchorElement).href) {
            console.log(`🔗 Navigating to: ${(element as HTMLAnchorElement).href}`);
        }
    };

    gamepadInstance.onControllerConnect = (gamepad: Gamepad) => {
        console.log(`🎮 Controller connected`);
    };

    gamepadInstance.onControllerDisconnect = (gamepad: Gamepad) => {
        console.log('🎮 Controller disconnected');
    };

    gamepadInstance.onBackButton = () => {
        console.log('🔙 Back button pressed');
    };

    gamepadInstance.onContextSwitch = (newContext: any, oldContext: any) => {
        console.log(`🔄 Context switched from ${oldContext?.id || 'none'} to ${newContext.id}`);
    };

    console.log('✅ Dual context gamepad navigation initialized!');
    console.log('📖 Controls: Left stick to navigate content • R1/L1 to navigate menu • A/X to select • B/Circle to go back');
    console.log('🎨 Note: No styles applied by default. Use data attributes or CSS classes to style navigation.');
    console.log('💡 Quick styling: gamepadUtils.addNavigationStyles() or gamepadUtils.printCSSExamples()');
    
    return gamepadInstance;
}

// Preset configurations for common use cases
export const presets = {
    // Simple menu navigation
    menu: (containerSelector: string = '.menu, .nav, nav, .nav-menu') => {
        return gamepadService(containerSelector, {
            navigationMode: 'spatial',
            focusedClass: 'menu-focused',
            selectedClass: 'menu-selected',
            enableShoulderNavigation: true
        });
    },

    // Grid-based navigation (cards, galleries, etc.)
    grid: (containerSelector: string = '.grid, .gallery, .cards') => {
        return gamepadService(containerSelector, {
            navigationMode: 'grid',
            focusedClass: 'grid-focused',
            selectedClass: 'grid-selected'
        });
    },

    // Form navigation
    form: (containerSelector: string = 'form') => {
        return gamepadService(containerSelector, {
            navigationMode: 'spatial',
            focusedClass: 'field-focused',
            selectedClass: 'field-selected',
            enableShoulderNavigation: false // Usually not needed for forms
        });
    },

    // Button navigation
    buttons: (containerSelector: string = '.buttons, .button-group') => {
        return gamepadService(containerSelector, {
            navigationMode: 'spatial',
            focusedClass: 'button-focused',
            selectedClass: 'button-selected'
        });
    },

    // Full page navigation (auto-detect everything)
    fullPage: () => {
        return initGamepadForPage({
            navigationMode: 'spatial',
            focusedClass: 'page-focused',
            selectedClass: 'page-selected'
        });
    },

    // Dual context navigation (menu + content)
    dualContext: (menuSelector: string = '.nav-menu, nav, .navigation', contentSelector: string | null = null) => {
        return initDualContextGamepad({
            menuContextSelector: menuSelector,
            contentContextSelector: contentSelector,
            focusedClass: 'gamepad-focused',
            selectedClass: 'gamepad-selected',
            useDataAttributes: false
        });
    }
};

// Simple utility functions for common operations
export const gamepadUtils = {
    // Get current gamepad service instance
    getInstance: () => gamepadInstance,

    // Check if gamepad is connected
    isConnected: () => gamepadInstance && gamepadInstance.isControllerConnected(),

    // Get current focused element
    getCurrentElement: () => gamepadInstance ? gamepadInstance.getCurrentElement() : null,

    // Get current index
    getCurrentIndex: () => gamepadInstance ? gamepadInstance.getCurrentIndex() : -1,

    // Get all elements
    getElements: () => gamepadInstance ? gamepadInstance.getElements() : [],

    // Navigate to specific element
    navigateToElement: (element: Element) => {
        if (!gamepadInstance) return false;
        const elements = gamepadInstance.getElements();
        const index = elements.indexOf(element);
        if (index !== -1) {
            return gamepadInstance.navigateToIndex(index);
        }
        return false;
    },

    // Navigate to specific index
    navigateToIndex: (index: number) => {
        if (gamepadInstance) {
            return gamepadInstance.navigateToIndex(index);
        }
        return false;
    },

    // Refresh navigation (useful after DOM changes)
    refresh: () => {
        if (gamepadInstance) {
            gamepadInstance.refresh();
        }
    },

    // Event handler setters
    onFocus: (callback: (element: Element, index: number) => void) => {
        if (gamepadInstance) {
            gamepadInstance.onFocus = callback;
        }
    },

    onSelect: (callback: (element: Element, index: number) => void) => {
        if (gamepadInstance) {
            gamepadInstance.onSelect = callback;
        }
    },

    onControllerConnect: (callback: (gamepad: Gamepad) => void) => {
        if (gamepadInstance) {
            gamepadInstance.onControllerConnect = callback;
        }
    },

    onControllerDisconnect: (callback: (gamepad: Gamepad) => void) => {
        if (gamepadInstance) {
            gamepadInstance.onControllerDisconnect = callback;
        }
    },

    onBackButton: (callback: () => void) => {
        if (gamepadInstance) {
            gamepadInstance.onBackButton = callback;
        }
    },

    onNavigationMenuOpen: (callback: (button: string) => void) => {
        if (gamepadInstance) {
            gamepadInstance.onNavigationMenuOpen = callback;
        }
    },

    // Configuration helpers
    enableBackButton: (enabled = true) => {
        if (gamepadInstance) {
            gamepadInstance.options.enableBackButton = enabled;
        }
    },

    enableShoulderNavigation: (enabled = true) => {
        if (gamepadInstance) {
            gamepadInstance.options.enableShoulderNavigation = enabled;
        }
    },

    // CSS Styling (imported from gamepadUtils)
    addStyles: (options: GamepadServiceOptions = {}) => {
        if (gamepadInstance) {
            import('./gamepadUtils.js').then(({ addNavigationStyles }) => {
                addNavigationStyles(options);
            });
        }
    },
    
    // Remove styles
    removeStyles: () => {
        import('./gamepadUtils.js').then(({ removeNavigationStyles }) => {
            removeNavigationStyles();
        });
    },
    
    // Print CSS examples to console
    printCSSExamples: () => {
        import('./gamepadUtils.js').then(({ printCSSExamples }) => {
            printCSSExamples();
        });
    },

    // Get navigation information
    getNavigationInfo: () => {
        if (!gamepadInstance) return null;
        
        return {
            isConnected: gamepadInstance.isControllerConnected(),
            controllerType: gamepadInstance.getControllerType(),
            currentElement: gamepadInstance.getCurrentElement(),
            currentIndex: gamepadInstance.getCurrentIndex(),
            totalElements: gamepadInstance.getElements().length,
            navigationEnabled: gamepadInstance.options.enableNavigation,
            backButtonEnabled: gamepadInstance.options.enableBackButton,
            shoulderNavigationEnabled: gamepadInstance.options.enableShoulderNavigation
        };
    },

    // Dual context utilities
    isDualContextEnabled: () => {
        return gamepadInstance && gamepadInstance.options.enableDualContext;
    },

    getActiveContext: () => {
        return gamepadInstance ? gamepadInstance.getActiveContext() : null;
    },

    getContext: (contextId: string) => {
        return gamepadInstance ? gamepadInstance.getContext(contextId) : null;
    },

    switchToContext: (contextId: string) => {
        return gamepadInstance ? gamepadInstance.switchToContext(contextId) : false;
    },

    getAllContexts: () => {
        return gamepadInstance ? gamepadInstance.getAllContexts() : [];
    },

    onContextSwitch: (callback: (newContext: any, oldContext: any) => void) => {
        if (gamepadInstance) {
            gamepadInstance.onContextSwitch = callback;
        }
    },

    // Context-specific utilities
    getMenuContext: () => {
        return gamepadInstance ? gamepadInstance.getContext('menu') : null;
    },

    getContentContext: () => {
        return gamepadInstance ? gamepadInstance.getContext('content') : null;
    },

    switchToMenu: () => {
        return gamepadInstance ? gamepadInstance.switchToContext('menu') : false;
    },

    switchToContent: () => {
        return gamepadInstance ? gamepadInstance.switchToContext('content') : false;
    },

    // Get dual context information
    getDualContextInfo: () => {
        if (!gamepadInstance || !gamepadInstance.options.enableDualContext) return null;
        
        const menuContext = gamepadInstance.getContext('menu');
        const contentContext = gamepadInstance.getContext('content');
        const activeContext = gamepadInstance.getActiveContext();
        
        return {
            isEnabled: true,
            activeContext: activeContext?.id || null,
            menuContext: menuContext ? {
                id: menuContext.id,
                elements: menuContext.getElements().length,
                currentIndex: menuContext.getCurrentIndex(),
                currentElement: menuContext.getCurrentElement()
            } : null,
            contentContext: contentContext ? {
                id: contentContext.id,
                elements: contentContext.getElements().length,
                currentIndex: contentContext.getCurrentIndex(),
                currentElement: contentContext.getCurrentElement()
            } : null
        };
    }
};

// Add Window interface declaration for global properties
declare global {
  interface Window {
    gamepadService?: typeof gamepadService;
    gamepadPresets?: typeof presets;
    gamepadUtils?: any;
    initGamepadForPage?: typeof initGamepadForPage;
    initDualContextGamepad?: typeof initDualContextGamepad;
  }
}

// Auto-initialize on DOM ready if data-gamepad attribute is present
document.addEventListener('DOMContentLoaded', () => {
    const autoInit = document.querySelector('[data-gamepad]');
    if (autoInit) {
        const preset = (autoInit as HTMLElement).dataset?.gamepad;
        const container = (autoInit as HTMLElement).dataset?.container;
        
        if (preset === 'auto' || preset === 'page') {
            // Use the new simple initialization
            initGamepadForPage();
        } else if (presets[preset as keyof typeof presets]) {
            presets[preset as keyof typeof presets](container);
        } else {
            gamepadService(container);
        }
        
        console.log(`🎮 Auto-initialized gamepad with preset: ${preset}`);
    }
});

// Export for global access
window.gamepadService = gamepadService;
window.gamepadPresets = presets;
window.gamepadUtils = gamepadUtils;
window.initGamepadForPage = initGamepadForPage;
window.initDualContextGamepad = initDualContextGamepad; 