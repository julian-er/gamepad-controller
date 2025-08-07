import { GamepadService } from './core/GamepadService.js';
import { addNavigationStyles, removeNavigationStyles, printCSSExamples } from './utils/cssUtils.js';
import type { GamepadServiceOptions } from './Interfaces/GamepadServiceOptions.js';

// Global instance
let gamepadInstance: GamepadService | null = null;

/**
 * Main gamepad service function for initializing gamepad navigation.
 * This is the primary API for the gamepad controller library.
 *
 * @param {string | null | undefined} containerSelector - Optional selector to limit navigation scope
 * @param {GamepadServiceOptions} options - Optional configuration options to override defaults
 * @returns {GamepadService} The initialized GamepadService instance
 *
 * @example
 * // Basic usage - auto-detect all focusable elements
 * const gamepad = gamepadService();
 *
 * // Container-specific navigation
 * const gamepad = gamepadService('.my-container');
 *
 * // Custom configuration
 * const gamepad = gamepadService('.app', {
 *   navigationMode: 'spatial',
 *   focusedClass: 'app-focused',
 *   enableDualContext: true
 * });
 *
 * // Dual context navigation
 * const gamepad = gamepadService(null, {
 *   enableDualContext: true,
 *   menuContextSelector: '.nav-menu',
 *   contentContextSelector: '.content'
 * });
 */
export function gamepadService(containerSelector: string | null | undefined = null, options: GamepadServiceOptions = {}): GamepadService {
    // Destroy existing instance if any to prevent memory leaks
    if (gamepadInstance) {
        console.info('[🎮 🕹️ Gamepad Controller] - 🧹 Cleaning up previous gamepad instance...');
        gamepadInstance.destroy();
        gamepadInstance = null;
    }

    // Enhanced default options with navigation enabled
    const defaultOptions: GamepadServiceOptions = {
        containerSelector: containerSelector,
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
        navigationMenuSelector: '.nav-menu, nav, .navigation',
        autoCreateStatusElement: true,
        autoAddStyles: false,
        // Style isolation options
        useDataAttributes: true,
        useGamepadIndex: false,
        gamepadContext: 'default',
        // Dual context options (disabled by default)
        enableDualContext: false,
        menuContextSelector: '.nav-menu, nav, .navigation',
        contentContextSelector: null,
        debounceTime: 150,
        deadzone: 0.1,
        ...options
    };

    // Create new instance
    gamepadInstance = new GamepadService(defaultOptions);
    gamepadInstance.init();

    return gamepadInstance;
}

/**
 * Super simple one-line initialization for any page. Sets up gamepad navigation with sensible defaults
 * and pre-configured event handlers for immediate use.
 *
 * @param {GamepadServiceOptions} options - Optional configuration options to override defaults
 * @returns {GamepadService} The initialized GamepadService instance with common event handlers
 *
 * @example
 * // Basic usage - works immediately with no configuration
 * const gamepad = initGamepadForPage();
 *
 * // With custom options
 * const gamepad = initGamepadForPage({
 *   focusedClass: 'custom-focus',
 *   enableDualContext: true
 * });
 */
export function initGamepadForPage(options: GamepadServiceOptions = {}): GamepadService {
    console.info('[🎮 🕹️ Gamepad Controller] - Initializing gamepad navigation for page...');

    const instance = gamepadService(null, {
        navigationMode: 'spatial',
        focusedClass: 'gamepad-focused',
        selectedClass: 'gamepad-selected',
        enableNavigation: true,
        enableBackButton: true,
        enableShoulderNavigation: true,
        autoCreateStatusElement: true,
        autoAddStyles: false,
        useGamepadIndex: false,
        ...options
    });

    // Set up common event handlers automatically
    instance.onFocus = (element: Element, index: number) => {
        const title = (element instanceof HTMLElement) ? (element as HTMLElement).dataset?.title : undefined;
        console.debug(`[🎮 🕹️ Gamepad Controller] - 🎯 Focused: ${element.textContent || title || element.tagName}`);
    };

    instance.onSelect = (element: Element, index: number) => {
        const title = (element instanceof HTMLElement) ? (element as HTMLElement).dataset?.title : undefined;
        console.debug(`[🎮 🕹️ Gamepad Controller] - ✅ Selected: ${element.textContent || title || element.tagName}`);
        // Auto-handle navigation menu links
        if (element.classList.contains('nav-item') && 'href' in element && (element as HTMLAnchorElement).href) {
            console.debug(`[🎮 🕹️ Gamepad Controller] - 🔗 Navigating to: ${(element as HTMLAnchorElement).href}`);
        }
    };

    instance.onControllerConnect = (gamepad: Gamepad) => {
        console.debug(`[🎮 🕹️ Gamepad Controller] - 🎮 Controller connected`);
    };

    instance.onControllerDisconnect = (gamepad: Gamepad) => {
        console.debug('[🎮 🕹️ Gamepad Controller] - 🎮 Controller disconnected');
    };

    instance.onBackButton = () => {
        console.debug('[🎮 🕹️ Gamepad Controller] - 🔙 Back button pressed');
    };

    instance.onNavigationMenuOpen = (button: string) => {
        console.debug(`[🎮 🕹️ Gamepad Controller] - 📱 Navigation menu: ${button} pressed`);
    };

    console.info('[🎮 🕹️ Gamepad Controller] - ✅ Gamepad navigation initialized with full functionality');
    console.info('[🎮 🕹️ Gamepad Controller] - 📖 Controls: D-pad/Analog stick to navigate • A/X to select • B/Circle to go back • R1/L1 for page navigation');
    console.info('[🎮 🕹️ Gamepad Controller] - 🎨 Note: No styles applied by default. Use data attributes or CSS classes to style navigation.');
    console.info('[🎮 🕹️ Gamepad Controller] - 💡 Quick styling: gamepadUtils.addStyles() or gamepadUtils.printCSSExamples()');

    return instance;
}

/**
 * Initializes dual context gamepad navigation with separate navigation for menu and content.
 * Provides context-aware event handlers and logging for dual context mode.
 *
 * @param {GamepadServiceOptions} options - Optional configuration options to override defaults
 * @returns {GamepadService} The initialized GamepadService instance with dual context support
 *
 * @example
 * // Basic dual context usage
 * const gamepad = initDualContextGamepad();
 *
 * // With custom selectors
 * const gamepad = initDualContextGamepad({
 *   menuContextSelector: '.nav-menu',
 *   contentContextSelector: '.content-container'
 * });
 */
export function initDualContextGamepad(options: GamepadServiceOptions = {}): GamepadService {
    console.info('[🎮 🕹️ Gamepad Controller] - 🎮 Initializing dual context gamepad navigation...');
    
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
        useGamepadIndex: false,
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

    // Set up context-aware event handlers
    gamepadInstance.onFocus = (element: Element, index: number) => {
        const context = gamepadInstance?.getActiveContext();
        const title = (element instanceof HTMLElement) ? (element as HTMLElement).dataset?.title : undefined;
        console.debug(`[🎮 🕹️ Gamepad Controller] - 🎯 Focused (${context?.id}): ${element.textContent || title || element.tagName}`);
    };

    gamepadInstance.onSelect = (element: Element, index: number) => {
        const context = gamepadInstance?.getActiveContext();
        const title = (element instanceof HTMLElement) ? (element as HTMLElement).dataset?.title : undefined;
        console.debug(`[🎮 🕹️ Gamepad Controller] - ✅ Selected (${context?.id}): ${element.textContent || title || element.tagName}`);
        // Auto-handle navigation menu links
        if (element.classList.contains('nav-item') && 'href' in element && (element as HTMLAnchorElement).href) {
            console.debug(`[🎮 🕹️ Gamepad Controller] - 🔗 Navigating to: ${(element as HTMLAnchorElement).href}`);
        }
    };

    gamepadInstance.onControllerConnect = (gamepad: Gamepad) => {
        console.debug(`[🎮 🕹️ Gamepad Controller] - 🎮 Controller connected`);
    };

    gamepadInstance.onControllerDisconnect = (gamepad: Gamepad) => {
        console.debug('[🎮 🕹️ Gamepad Controller] - 🎮 Controller disconnected');
    };

    gamepadInstance.onBackButton = () => {
        console.debug('[🎮 🕹️ Gamepad Controller] - 🔙 Back button pressed');
        // Default back button behavior
        if (window.history.length > 1) {
            window.history.back();
        } else {
            console.debug('[🎮 🕹️ Gamepad Controller] - 🔙 No history to go back to');
        }
    };

    gamepadInstance.onContextSwitch = (newContext: any, oldContext: any) => {
        console.debug(`[🎮 🕹️ Gamepad Controller] - 🔄 Context switched from ${oldContext?.id || 'none'} to ${newContext.id}`);
    };

    console.info('[🎮 🕹️ Gamepad Controller] - ✅ Dual context gamepad navigation initialized!');
    console.info('[🎮 🕹️ Gamepad Controller] - 📖 Controls: Left stick to navigate content • R1/L1 to navigate menu • A/X to select • B/Circle to go back');
    console.info('[🎮 🕹️ Gamepad Controller] - 🎨 Note: No styles applied by default. Use data attributes or CSS classes to style navigation.');
    console.info('[🎮 🕹️ Gamepad Controller] - 💡 Quick styling: gamepadUtils.addStyles() or gamepadUtils.printCSSExamples()');

    return gamepadInstance;
}

/**
 * Utility functions for common gamepad operations.
 * These provide convenient access to the current gamepad instance.
 */
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

    // CSS Styling utilities
    addStyles: (options: GamepadServiceOptions = {}) => {
        addNavigationStyles(options);
    },

    removeStyles: () => {
        removeNavigationStyles();
    },

    printCSSExamples: () => {
        printCSSExamples();
    },

    // Cleanup utility
    cleanup: () => {
        cleanupGamepadService();
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
    }
};

/**
 * Global cleanup utility function.
 * 
 * @example
 * // Clean up gamepad instance
 * cleanupGamepadService();
 */
export function cleanupGamepadService(): void {
    if (gamepadInstance) {
        console.info('[🎮 🕹️ Gamepad Controller] - 🧹 Cleaning up global gamepad instance...');
        gamepadInstance.destroy();
        gamepadInstance = null;
    }
}