// factory.ts
// Convenience factory functions + the `gamepadUtils` façade.
//
// These helpers manage a single shared `GamepadService` instance for the common
// "one navigation controller per page" case. For multiple independent controllers,
// instantiate `new GamepadService(options)` directly — the class is not a singleton.

import { GamepadService } from './core/GamepadService.js';
import {
    addNavigationStyles,
    removeNavigationStyles,
    printCSSExamples,
    type NavigationStyleOptions,
} from './utils/cssUtils.js';
import { logger } from './utils/logger.js';
import type { GamepadServiceOptions } from './Interfaces/GamepadServiceOptions.js';

// Shared instance used by the factory helpers below.
let gamepadInstance: GamepadService | null = null;

/**
 * Main gamepad service function for initializing gamepad navigation.
 * This is the primary API for the gamepad controller library.
 *
 * @param containerSelector - Optional selector to limit navigation scope
 * @param options - Optional configuration options to override defaults
 * @returns The initialized GamepadService instance
 *
 * @example
 * // Basic usage - auto-detect all focusable elements
 * const gamepad = gamepadService();
 *
 * // Container-specific navigation with custom configuration
 * const gamepad = gamepadService('.app', {
 *   navigationMode: 'spatial',
 *   enableDualContext: true,
 * });
 */
export function gamepadService(
    containerSelector: string | null | undefined = null,
    options: GamepadServiceOptions = {}
): GamepadService {
    // Destroy existing instance if any to prevent memory leaks
    if (gamepadInstance) {
        logger.info('🧹 Cleaning up previous gamepad instance...');
        gamepadInstance.destroy();
        gamepadInstance = null;
    }

    const defaultOptions: GamepadServiceOptions = {
        containerSelector: containerSelector ?? null,
        statusElementId: 'gamepad-status',
        focusedClass: 'gamepad-focused',
        selectedClass: 'gamepad-selected',
        navigationMode: 'spatial',
        wrapNavigation: true,
        autoDetectElements: true,
        enableNavigation: true,
        enableBackButton: true,
        enableShoulderNavigation: true,
        navigationMenuSelector: '.nav-menu, nav, .navigation',
        autoCreateStatusElement: true,
        autoAddStyles: false,
        useDataAttributes: true,
        useGamepadIndex: false,
        gamepadContext: 'default',
        enableDualContext: false,
        menuContextSelector: '.nav-menu, nav, .navigation',
        contentContextSelector: null,
        debounceTime: 150,
        deadzone: 0.1,
        ...options,
    };

    gamepadInstance = new GamepadService(defaultOptions);
    gamepadInstance.init();

    return gamepadInstance;
}

/**
 * Super simple one-line initialization for any page with sensible defaults.
 *
 * @param options - Optional configuration options to override defaults
 * @returns The initialized GamepadService instance
 *
 * @example
 * const gamepad = initGamepadForPage();
 * gamepad.on('focus', (el) => console.log('focused', el));
 */
export function initGamepadForPage(options: GamepadServiceOptions = {}): GamepadService {
    logger.info('Initializing gamepad navigation for page...');

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
        ...options,
    });

    logger.info('✅ Gamepad navigation initialized with full functionality');
    logger.info(
        '📖 Controls: D-pad/Analog stick to navigate • A/X to select • B/Circle to go back • R1/L1 for page navigation'
    );

    return instance;
}

/**
 * Initializes dual-context gamepad navigation with separate navigation for menu and content.
 *
 * @param options - Optional configuration options to override defaults
 * @returns The initialized GamepadService instance with dual-context support
 *
 * @example
 * const gamepad = initDualContextGamepad({
 *   menuContextSelector: '.nav-menu',
 *   contentContextSelector: '.content-container',
 * });
 */
export function initDualContextGamepad(options: GamepadServiceOptions = {}): GamepadService {
    logger.info('🎮 Initializing dual context gamepad navigation...');

    const instance = gamepadService(null, {
        enableDualContext: true,
        menuContextSelector: '.nav-menu, nav, .navigation',
        contentContextSelector: null,
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
        ...options,
    });

    logger.info('✅ Dual context gamepad navigation initialized!');
    logger.info(
        '📖 Controls: Left stick to navigate content • R1/L1 to navigate menu • A/X to select • B/Circle to go back'
    );

    return instance;
}

/**
 * Initializes the GamepadService to listen for custom DOM events instead of native
 * gamepad APIs. Designed for WinUI / host integrations where native APIs are absent.
 *
 * @param options - Configuration options for custom events integration
 * @returns The initialized GamepadService instance configured for custom events
 *
 * @example
 * const gamepad = initCustomEventGamepad({
 *   customConnectedEvent: 'myapp-gamepad-connected',
 *   customStateChangedEvent: 'myapp-gamepad-state-changed',
 * });
 */
export function initCustomEventGamepad(options: GamepadServiceOptions = {}): GamepadService {
    logger.info('🎮 Initializing custom event gamepad navigation for host integration...');

    const instance = gamepadService(null, {
        useCustomEvents: true,
        customConnectedEvent: 'hubgamepadconnected',
        customDisconnectedEvent: 'hubgamepaddisconnected',
        customStateChangedEvent: 'hubgamepadstatechanged',
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
        enableDualContext: false,
        menuContextSelector: '.nav-menu, nav, .navigation',
        contentContextSelector: null,
        ...options,
    });

    logger.info('✅ Custom event gamepad navigation initialized!');

    return instance;
}

/**
 * Global cleanup utility — destroys the shared factory instance.
 *
 * @example
 * cleanupGamepadService();
 */
export function cleanupGamepadService(): void {
    if (gamepadInstance) {
        logger.info('🧹 Cleaning up global gamepad instance...');
        gamepadInstance.destroy();
        gamepadInstance = null;
    }
}

/**
 * Utility façade for common operations on the shared factory instance.
 * All methods are safe to call even when no instance is active.
 */
export const gamepadUtils = {
    /** Gets the current shared GamepadService instance (or null). */
    getInstance: (): GamepadService | null => gamepadInstance,

    /** Whether a gamepad is currently connected. */
    isConnected: (): boolean => !!gamepadInstance && gamepadInstance.isControllerConnected(),

    /** The currently focused element, or null. */
    getCurrentElement: (): Element | null => (gamepadInstance ? gamepadInstance.getCurrentElement() : null),

    /** The index of the currently focused element, or -1. */
    getCurrentIndex: (): number => (gamepadInstance ? gamepadInstance.getCurrentIndex() : -1),

    /** All navigable elements detected by the active instance. */
    getElements: (): Element[] => (gamepadInstance ? gamepadInstance.getElements() : []),

    /** Navigate to a specific element by reference. */
    navigateToElement: (element: Element): boolean => {
        if (!gamepadInstance) return false;
        const index = gamepadInstance.getElements().indexOf(element);
        return index !== -1 ? gamepadInstance.navigateToIndex(index) : false;
    },

    /** Navigate to a specific element by index. */
    navigateToIndex: (index: number): boolean => (gamepadInstance ? gamepadInstance.navigateToIndex(index) : false),

    /** Re-detect elements after DOM changes. */
    refresh: (): void => {
        gamepadInstance?.refresh();
    },

    /** Inject the optional default navigation styles. */
    addStyles: (options: NavigationStyleOptions = {}): void => {
        addNavigationStyles(options);
    },

    /** Remove the injected navigation styles. */
    removeStyles: (): void => {
        removeNavigationStyles();
    },

    /** Print example CSS to the console. */
    printCSSExamples: (): void => {
        printCSSExamples();
    },

    /** Destroy the shared instance. */
    cleanup: (): void => {
        cleanupGamepadService();
    },

    /** Snapshot of the current navigation state, or null. */
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
            shoulderNavigationEnabled: gamepadInstance.options.enableShoulderNavigation,
        };
    },

    /** Whether dual-context mode is enabled. */
    isDualContextEnabled: (): boolean => !!gamepadInstance && !!gamepadInstance.options.enableDualContext,

    /** The currently active context, or null. */
    getActiveContext: () => (gamepadInstance ? gamepadInstance.getActiveContext() : null),

    /** Get a context by id, or null. */
    getContext: (contextId: string) => (gamepadInstance ? gamepadInstance.getContext(contextId) : null),

    /** Switch to a context by id. */
    switchToContext: (contextId: string): boolean =>
        gamepadInstance ? gamepadInstance.switchToContext(contextId) : false,

    /** All registered contexts. */
    getAllContexts: () => (gamepadInstance ? gamepadInstance.getAllContexts() : []),

    /** The 'menu' context, or null. */
    getMenuContext: () => (gamepadInstance ? gamepadInstance.getContext('menu') : null),

    /** The 'content' context, or null. */
    getContentContext: () => (gamepadInstance ? gamepadInstance.getContext('content') : null),

    /** Switch focus to the 'menu' context. */
    switchToMenu: (): boolean => (gamepadInstance ? gamepadInstance.switchToContext('menu') : false),

    /** Switch focus to the 'content' context. */
    switchToContent: (): boolean => (gamepadInstance ? gamepadInstance.switchToContext('content') : false),
};
