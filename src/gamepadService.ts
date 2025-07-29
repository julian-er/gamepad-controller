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
 * Initializes the GamepadService to listen for custom DOM events instead of native gamepad APIs.
 * This is designed for WinUI integration where native gamepad APIs are not available.
 * 
 * @param {GamepadServiceOptions} options - Configuration options for custom events integration
 * @returns {GamepadService} The initialized GamepadService instance configured for custom events
 * 
 * @example
 * // Basic custom events usage with default event names
 * const gamepad = initCustomEventGamepad();
 * 
 * // Custom event names for specific integration
 * const gamepad = initCustomEventGamepad({
 *   customConnectedEvent: 'myapp-gamepad-connected',
 *   customDisconnectedEvent: 'myapp-gamepad-disconnected',
 *   customStateChangedEvent: 'myapp-gamepad-state-changed'
 * });
 * 
 * // Custom events with dual context navigation
 * const gamepad = initCustomEventGamepad({
 *   enableDualContext: true,
 *   menuContextSelector: '.navigation-menu',
 *   contentContextSelector: '.main-content'
 * });
 */
export function initCustomEventGamepad(options: GamepadServiceOptions = {}): GamepadService {
    console.info('[🎮 🕹️ Gamepad Controller] - 🎮 Initializing custom event gamepad navigation for WinUI integration...');
    
    // Merge with custom events defaults
    const customEventDefaults: GamepadServiceOptions = {
        // Enable custom events mode
        useCustomEvents: true,
        
        // Default custom event names for WinUI/Hub integration
        customConnectedEvent: 'hubgamepadconnected',
        customDisconnectedEvent: 'hubgamepaddisconnected', 
        customStateChangedEvent: 'hubgamepadstatechanged',
        
        // Common gamepad options
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
        
        // Default to single context (can be overridden)
        enableDualContext: false,
        menuContextSelector: '.nav-menu, nav, .navigation',
        contentContextSelector: null,
        
        ...options
    };

    // Create new instance with custom events configuration
    gamepadInstance = new GamepadService(customEventDefaults);
    gamepadInstance.init();

    // Set up event handlers with custom events context
    gamepadInstance.onFocus = (element: Element, index: number) => {
        const context = gamepadInstance?.getActiveContext();
        const title = (element instanceof HTMLElement) ? (element as HTMLElement).dataset?.title : undefined;
        const contextInfo = context ? ` (${context.id})` : '';
        console.debug(`[🎮 🕹️ Gamepad Controller] - 🎯 Focused${contextInfo}: ${element.textContent || title || element.tagName}`);
    };

    gamepadInstance.onSelect = (element: Element, index: number) => {
        const context = gamepadInstance?.getActiveContext();
        const title = (element instanceof HTMLElement) ? (element as HTMLElement).dataset?.title : undefined;
        const contextInfo = context ? ` (${context.id})` : '';
        console.debug(`[🎮 🕹️ Gamepad Controller] - ✅ Selected${contextInfo}: ${element.textContent || title || element.tagName}`);
        
        // Auto-handle navigation menu links
        if (element.classList.contains('nav-item') && 'href' in element && (element as HTMLAnchorElement).href) {
            console.debug(`[🎮 🕹️ Gamepad Controller] - 🔗 Navigating to: ${(element as HTMLAnchorElement).href}`);
        }
    };

    gamepadInstance.onControllerConnect = (gamepad: Gamepad) => {
        console.debug('[🎮 🕹️ Gamepad Controller] - 🎮 Custom event: Controller connected via WinUI integration');
    };

    gamepadInstance.onControllerDisconnect = (gamepad: Gamepad) => {
        console.debug('[🎮 🕹️ Gamepad Controller] - 🎮 Custom event: Controller disconnected via WinUI integration');
    };

    gamepadInstance.onBackButton = () => {
        console.debug('[🎮 🕹️ Gamepad Controller] - 🔙 Back button pressed (custom events)');
        // Default back button behavior
        if (window.history.length > 1) {
            window.history.back();
        } else {
            console.debug('[🎮 🕹️ Gamepad Controller] - 🔙 No history to go back to');
        }
    };

    // Set up context switch handler for dual context mode
    if (customEventDefaults.enableDualContext) {
        gamepadInstance.onContextSwitch = (newContext: any, oldContext: any) => {
            console.debug(`[🎮 🕹️ Gamepad Controller] - 🔄 Context switched from ${oldContext?.id || 'none'} to ${newContext.id} (custom events)`);
        };
    }

    console.info('[🎮 🕹️ Gamepad Controller] - ✅ Custom event gamepad navigation initialized for WinUI integration!');
    console.info('[🎮 🕹️ Gamepad Controller] - 📖 Listening for custom events:', {
        connected: customEventDefaults.customConnectedEvent,
        disconnected: customEventDefaults.customDisconnectedEvent,
        stateChanged: customEventDefaults.customStateChangedEvent
    });

    return gamepadInstance;
}

/**
 * Utility functions for common gamepad operations.
 * These provide convenient access to the current gamepad instance and its state.
 * All functions are safe to call even when no gamepad instance is active.
 */
export const gamepadUtils = {
    /**
     * Gets the current GamepadService instance.
     * @returns {GamepadService | null} The active GamepadService instance or null if none exists
     * 
     * @example
     * const instance = gamepadUtils.getInstance();
     * if (instance) {
     *   console.log('Gamepad service is active');
     * }
     */
    getInstance: () => gamepadInstance,

    /**
     * Checks if a gamepad controller is currently connected and detected.
     * @returns {boolean} True if a gamepad is connected, false otherwise
     * 
     * @example
     * if (gamepadUtils.isConnected()) {
     *   console.log('Gamepad is ready for navigation');
     * }
     */
    isConnected: () => gamepadInstance && gamepadInstance.isControllerConnected(),

    /**
     * Gets the currently focused/highlighted element in the navigation system.
     * @returns {Element | null} The currently focused element or null if none
     * 
     * @example
     * const focusedElement = gamepadUtils.getCurrentElement();
     * if (focusedElement) {
     *   console.log('Currently focused:', focusedElement.textContent);
     * }
     */
    getCurrentElement: () => gamepadInstance ? gamepadInstance.getCurrentElement() : null,

    /**
     * Gets the index of the currently focused element in the navigation array.
     * @returns {number} The current element index, or -1 if no gamepad instance exists
     * 
     * @example
     * const currentIndex = gamepadUtils.getCurrentIndex();
     * console.log(`Currently focused element index: ${currentIndex}`);
     */
    getCurrentIndex: () => gamepadInstance ? gamepadInstance.getCurrentIndex() : -1,

    /**
     * Gets all navigable elements detected by the gamepad system.
     * @returns {Element[]} Array of all navigable elements, empty array if no instance
     * 
     * @example
     * const elements = gamepadUtils.getElements();
     * console.log(`Found ${elements.length} navigable elements`);
     */
    getElements: () => gamepadInstance ? gamepadInstance.getElements() : [],

    /**
     * Programmatically navigates to a specific element by reference.
     * The element must be in the current navigation array.
     * @param {Element} element - The element to navigate to
     * @returns {boolean} True if navigation was successful, false otherwise
     * 
     * @example
     * const targetButton = document.querySelector('#my-button');
     * if (gamepadUtils.navigateToElement(targetButton)) {
     *   console.log('Successfully navigated to button');
     * }
     */
    navigateToElement: (element: Element) => {
        if (!gamepadInstance) return false;
        const elements = gamepadInstance.getElements();
        const index = elements.indexOf(element);
        if (index !== -1) {
            return gamepadInstance.navigateToIndex(index);
        }
        return false;
    },

    /**
     * Programmatically navigates to a specific element by its index in the navigation array.
     * @param {number} index - The zero-based index of the element to navigate to
     * @returns {boolean} True if navigation was successful, false otherwise
     * 
     * @example
     * // Navigate to the first element
     * if (gamepadUtils.navigateToIndex(0)) {
     *   console.log('Navigated to first element');
     * }
     */
    navigateToIndex: (index: number) => {
        if (gamepadInstance) {
            return gamepadInstance.navigateToIndex(index);
        }
        return false;
    },

    /**
     * Refreshes the navigation system by re-detecting elements and updating focus.
     * Useful after DOM changes, new elements added, or layout modifications.
     * @returns {void}
     * 
     * @example
     * // After adding new buttons to the page
     * document.body.appendChild(newButton);
     * gamepadUtils.refresh(); // Re-detect all navigable elements
     */
    refresh: () => {
        if (gamepadInstance) {
            gamepadInstance.refresh();
        }
    },

    /**
     * Adds default CSS styles for gamepad navigation focus and selection states.
     * @param {GamepadServiceOptions} options - Optional styling configuration
     * @returns {void}
     * 
     * @example
     * // Add default styles
     * gamepadUtils.addStyles();
     * 
     * // Add styles with custom configuration
     * gamepadUtils.addStyles({
     *   focusedClass: 'my-focus-class',
     *   selectedClass: 'my-selected-class'
     * });
     */
    addStyles: (options: GamepadServiceOptions = {}) => {
        addNavigationStyles(options);
    },

    /**
     * Removes all gamepad navigation CSS styles from the page.
     * @returns {void}
     * 
     * @example
     * gamepadUtils.removeStyles(); // Clean up all navigation styles
     */
    removeStyles: () => {
        removeNavigationStyles();
    },

    /**
     * Prints example CSS styles to the browser console for gamepad navigation.
     * Helpful for developers to see what CSS classes and styles are available.
     * @returns {void}
     * 
     * @example
     * gamepadUtils.printCSSExamples(); // Check console for CSS examples
     */
    printCSSExamples: () => {
        printCSSExamples();
    },

    /**
     * Cleans up and destroys the current gamepad service instance.
     * Removes all event listeners and clears references.
     * @returns {void}
     * 
     * @example
     * gamepadUtils.cleanup(); // Clean shutdown of gamepad service
     */
    cleanup: () => {
        cleanupGamepadService();
    },

    /**
     * Gets comprehensive information about the current navigation state.
     * @returns {object | null} Navigation info object or null if no instance exists
     * 
     * @example
     * const info = gamepadUtils.getNavigationInfo();
     * if (info) {
     *   console.log(`Connected: ${info.isConnected}`);
     *   console.log(`Controller: ${info.controllerType}`);
     *   console.log(`Elements: ${info.totalElements}`);
     *   console.log(`Current: ${info.currentIndex}`);
     * }
     */
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

    /**
     * Checks if dual context navigation mode is currently enabled.
     * @returns {boolean} True if dual context is enabled, false otherwise
     * 
     * @example
     * if (gamepadUtils.isDualContextEnabled()) {
     *   console.log('Dual context navigation is active');
     * }
     */
    isDualContextEnabled: () => {
        return gamepadInstance && gamepadInstance.options.enableDualContext;
    },

    /**
     * Gets the currently active navigation context in dual context mode.
     * @returns {object | null} The active context object or null
     * 
     * @example
     * const activeContext = gamepadUtils.getActiveContext();
     * if (activeContext) {
     *   console.log(`Active context: ${activeContext.id}`);
     * }
     */
    getActiveContext: () => {
        return gamepadInstance ? gamepadInstance.getActiveContext() : null;
    },

    /**
     * Gets a specific navigation context by its ID.
     * @param {string} contextId - The ID of the context to retrieve
     * @returns {object | null} The context object or null if not found
     * 
     * @example
     * const menuContext = gamepadUtils.getContext('menu');
     * if (menuContext) {
     *   console.log('Menu context found');
     * }
     */
    getContext: (contextId: string) => {
        return gamepadInstance ? gamepadInstance.getContext(contextId) : null;
    },

    /**
     * Switches to a specific navigation context by its ID.
     * @param {string} contextId - The ID of the context to switch to
     * @returns {boolean} True if context switch was successful, false otherwise
     * 
     * @example
     * if (gamepadUtils.switchToContext('menu')) {
     *   console.log('Switched to menu context');
     * }
     */
    switchToContext: (contextId: string) => {
        return gamepadInstance ? gamepadInstance.switchToContext(contextId) : false;
    },

    /**
     * Gets all available navigation contexts.
     * @returns {object[]} Array of all navigation context objects
     * 
     * @example
     * const contexts = gamepadUtils.getAllContexts();
     * contexts.forEach(ctx => console.log(`Context: ${ctx.id}`));
     */
    getAllContexts: () => {
        return gamepadInstance ? gamepadInstance.getAllContexts() : [];
    },

    /**
     * Gets the menu navigation context (if it exists).
     * @returns {object | null} The menu context object or null
     * 
     * @example
     * const menuContext = gamepadUtils.getMenuContext();
     * if (menuContext) {
     *   console.log(`Menu has ${menuContext.elements.length} items`);
     * }
     */
    getMenuContext: () => {
        return gamepadInstance ? gamepadInstance.getContext('menu') : null;
    },

    /**
     * Gets the content navigation context (if it exists).
     * @returns {object | null} The content context object or null
     * 
     * @example
     * const contentContext = gamepadUtils.getContentContext();
     * if (contentContext) {
     *   console.log('Content context is available');
     * }
     */
    getContentContext: () => {
        return gamepadInstance ? gamepadInstance.getContext('content') : null;
    },

    /**
     * Switches navigation focus to the menu context.
     * @returns {boolean} True if switch was successful, false otherwise
     * 
     * @example
     * if (gamepadUtils.switchToMenu()) {
     *   console.log('Now navigating in menu');
     * }
     */
    switchToMenu: () => {
        return gamepadInstance ? gamepadInstance.switchToContext('menu') : false;
    },

    /**
     * Switches navigation focus to the content context.
     * @returns {boolean} True if switch was successful, false otherwise
     * 
     * @example
     * if (gamepadUtils.switchToContent()) {
     *   console.log('Now navigating in content');
     * }
     */
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