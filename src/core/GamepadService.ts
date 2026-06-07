// GamepadService.ts
// Main GamepadService class with dual-context support and a multi-subscriber event API.

import {
    gameLoop as createGameLoop,
    setupEventListeners,
    removeEventListeners,
    startGameLoop,
    stopGameLoop,
    handleGamepadConnected as handleConnected,
    handleGamepadDisconnected as handleDisconnected,
    createCustomEventGameLoop,
} from './gamepadEventHandler.js';
import { navigateToIndex } from './gamepadNavigation.js';
import {
    calculateGridDimensions,
    getFocusableElements,
    ensureStatusElement,
    setGamepadContext,
    invalidateFocusableElementsCache,
} from '../utils/domUtils.js';
import { applyFocusStyling, clearFocusStyling, scrollElementIntoView } from './focusView.js';
import { addNavigationStyles } from '../utils/cssUtils.js';
import { debounce } from '../utils/navigationUtils.js';
import { getConnectedControllerTypes } from '../utils/controllerUtils.js';
import { logger } from '../utils/logger.js';
import type { GamepadServiceOptions, GamepadServiceConfig } from '../interfaces/GamepadServiceOptions.js';
import { normalizeOptions } from './normalizeOptions.js';
import type { GamepadEventState, GamepadEvent } from '../interfaces/GamepadEvents.js';
import { GamepadContextManager, GamepadNavigationContext } from '../contexts/GamepadContextManager.js';
import type { NavigationState } from '../interfaces/NavigationState.js';

/**
 * Strongly-typed map of events emitted by {@link GamepadService}. Each consumer can
 * subscribe independently via {@link GamepadService.on} without clobbering others.
 */
export interface GamepadServiceEventMap {
    focus: (element: Element, index: number) => void;
    select: (element: Element, index: number) => void;
    controllerconnect: (gamepad: Gamepad) => void;
    controllerdisconnect: (gamepad: Gamepad) => void;
    backbutton: () => void;
    /**
     * Emitted when a navigation-menu link or shoulder-button page transition is triggered.
     * If no listener is registered the library falls back to `window.location.href` assignment,
     * which allows zero-config HTML pages to work while SPA frameworks can intercept cleanly.
     */
    navigationrequest: (href: string, element: Element) => void;
    navigationmenuopen: (button: string) => void;
    buttondown: (buttonIndex: number, gamepad: Gamepad) => void;
    buttonup: (buttonIndex: number, gamepad: Gamepad) => void;
    contextswitch: (newContext: GamepadNavigationContext, oldContext: GamepadNavigationContext | null) => void;
    /**
     * Emitted when the Gamepad API is blocked at runtime — e.g. `navigator.getGamepads()`
     * throws `SecurityError` under `Permissions-Policy: gamepad`. Fires once per block; the
     * polling loop keeps running in case access is granted later.
     */
    gamepaderror: (error: Error) => void;
}

type EventName = keyof GamepadServiceEventMap;

/**
 * GamepadService — gamepad navigation with single- and dual-context support.
 *
 * Subscribe to events with {@link on} (multiple subscribers are supported):
 * ```ts
 * const service = new GamepadService();
 * const off = service.on('focus', (el, i) => console.log('focused', i, el));
 * service.init();
 * // later
 * off();
 * ```
 */
export class GamepadService {
    readonly options: Readonly<GamepadServiceOptions>;
    contextManager: GamepadContextManager;

    // Private state
    private eventState: GamepadEventState;
    private navState: NavigationState;

    // Multi-subscriber event registry
    private listeners: Map<EventName, Set<(...args: never[]) => void>> = new Map();

    // Bound methods for proper cleanup
    private gameLoopFn: () => void;
    private handleGamepadConnected: (event: GamepadEvent) => void;
    private handleGamepadDisconnected: (event: GamepadEvent) => void;
    private handleResize: (() => void) & { cancel: () => void };
    // Invalidates the focusable-element memo when the observed DOM subtree changes, so the
    // cache can safely be read through on every detectElements() without going stale.
    private mutationObserver: MutationObserver | null = null;

    constructor(config: GamepadServiceConfig = {}) {
        // Accept both the flat options and the grouped shape; collapse to flat (groups win).
        const options = normalizeOptions(config);
        this.options = {
            debounceTime: 150,
            deadzone: 0.1,
            backButtonCooldown: 300,
            shoulderCooldown: 300,
            logLevel: 'error',
            containerSelector: null,
            statusElementId: null,
            focusedClass: 'gamepad-focused',
            selectedClass: 'gamepad-selected',
            navigationMode: 'grid', // 'grid' or 'spatial'
            wrapNavigation: true,
            autoDetectElements: true,
            enableNavigation: true,
            enableBackButton: true,
            enableShoulderNavigation: true,
            enableRightStickScroll: true,
            scrollSpeed: 1,
            scrollDebounceTime: 50,
            navigationMenuSelector: '.nav-menu, nav, .navigation',
            autoCreateStatusElement: false,
            autoAddStyles: false,
            useDataAttributes: true,
            gamepadContext: 'default',
            onlyViewport: false,
            enableDualContext: false,
            menuContextSelector: '.nav-menu, nav, .navigation',
            contentContextSelector: null,
            ...options,
        };

        if (this.options.logLevel) logger.setLevel(this.options.logLevel);

        // Initialize event state with animation frame tracking
        this.eventState = {
            isRunning: false,
            gamepads: {},
            currentControllerType: 'unknown',
            padInputStates: {},
            animationFrameId: null,
            statusElementId: this.options.statusElementId ?? null,
            onControllerConnect: null,
            onControllerDisconnect: null,
            onNavigationMenuOpen: null,
            onBackButton: null,
            onNavigationRequest: null,
            onButtonDown: undefined,
            onButtonUp: undefined,
            onError: undefined,
            customListeners: null,
        };

        // Initialize navigation state
        this.navState = {
            focusedElementIndex: 0,
            elements: [],
            gridDimensions: { rows: 0, cols: 0 },
            options: this.options,
            onFocus: null,
            onSelect: null,
        };

        // Wire the internal single-slot callbacks to the multi-subscriber emitter.
        this.navState.onFocus = (element, index) => this.emit('focus', element, index);
        this.navState.onSelect = (element, index) => this.emit('select', element, index);
        this.eventState.onControllerConnect = (gamepad) => this.emit('controllerconnect', gamepad);
        this.eventState.onControllerDisconnect = (gamepad) => this.emit('controllerdisconnect', gamepad);
        this.eventState.onNavigationMenuOpen = (button) => this.emit('navigationmenuopen', button);
        this.eventState.onButtonDown = (i, gamepad) => this.emit('buttondown', i, gamepad);
        this.eventState.onButtonUp = (i, gamepad) => this.emit('buttonup', i, gamepad);
        this.eventState.onError = (error) => this.emit('gamepaderror', error);
        this.eventState.onBackButton = () => {
            // Emit when subscribers exist, otherwise fall back to browser history.
            const set = this.listeners.get('backbutton');
            if (set && set.size > 0) {
                this.emit('backbutton');
            } else if (typeof window !== 'undefined') {
                window.history.back();
            }
        };
        this.eventState.onNavigationRequest = (href, element) => {
            // Emit when subscribers exist (e.g. SPA router), otherwise fall back to direct nav.
            const set = this.listeners.get('navigationrequest');
            if (set && set.size > 0) {
                this.emit('navigationrequest', href, element);
            } else if (typeof window !== 'undefined') {
                window.location.href = href;
            }
        };

        // Context manager for dual context mode
        this.contextManager = new GamepadContextManager();

        // Bind methods to ensure proper 'this' context and enable cleanup
        this.gameLoopFn = createGameLoop(
            this.eventState,
            this.navState,
            this.contextManager,
            this.updateFocus.bind(this)
        );
        this.handleGamepadConnected = (event: GamepadEvent) => {
            handleConnected(this.eventState, event);
            // Resume the loop when the first controller connects after a pause.
            if (!this.eventState.isRunning && this.eventState.gameLoopFn) {
                startGameLoop(this.eventState, this.eventState.gameLoopFn);
            }
        };
        this.handleGamepadDisconnected = (event: GamepadEvent) => {
            handleDisconnected(this.eventState, event);
            // Pause the loop when no controllers remain — saves ~60fps of idle CPU.
            if (Object.keys(this.eventState.gamepads).length === 0) {
                stopGameLoop(this.eventState);
            }
        };

        // Create debounced resize handler with cancel capability. A resize can change which
        // elements are in-viewport/visible, so drop the focusable memo before re-detecting.
        this.handleResize = debounce(() => {
            invalidateFocusableElementsCache();
            if (this.options.enableDualContext) {
                this.contextManager.refresh();
            } else {
                this.detectElements();
                this.updateFocus();
            }
        }, 100);
    }

    /**
     * Subscribe to a service event. Returns an unsubscribe function.
     * @param event - The event name
     * @param listener - The callback to invoke
     * @returns A function that removes this listener
     */
    on<K extends EventName>(event: K, listener: GamepadServiceEventMap[K]): () => void {
        let set = this.listeners.get(event);
        if (!set) {
            set = new Set();
            this.listeners.set(event, set);
        }
        set.add(listener as (...args: never[]) => void);
        return () => this.off(event, listener);
    }

    /**
     * Remove a previously-registered event listener.
     * @param event - The event name
     * @param listener - The callback to remove
     */
    off<K extends EventName>(event: K, listener: GamepadServiceEventMap[K]): void {
        this.listeners.get(event)?.delete(listener as (...args: never[]) => void);
    }

    private emit<K extends EventName>(event: K, ...args: Parameters<GamepadServiceEventMap[K]>): void {
        const set = this.listeners.get(event);
        if (!set) return;
        for (const listener of set) {
            (listener as (...a: Parameters<GamepadServiceEventMap[K]>) => void)(...args);
        }
    }

    /**
     * Initializes the GamepadService: event listeners, navigation elements, optional
     * styles/status indicator, and the input polling loop. Safe to call once; re-calls
     * while running are ignored.
     */
    init() {
        if (this.eventState.isRunning) return;

        if (typeof window === 'undefined' || typeof document === 'undefined') {
            logger.warn('GamepadService.init() called in a non-browser environment; skipping.');
            return;
        }

        setupEventListeners(this.eventState, this.handleGamepadConnected, this.handleGamepadDisconnected, this.options);
        window.addEventListener('resize', this.handleResize);
        this.observeDomMutations();

        if (this.options.enableDualContext) {
            this.setupDualContextMode();
        } else {
            this.detectElements();
            this.updateFocus();
        }

        if (this.options.autoAddStyles) {
            addNavigationStyles();
        }

        if (this.options.statusElementId) {
            ensureStatusElement(this.options.statusElementId);
        } else if (this.options.autoCreateStatusElement) {
            const defaultStatusId = 'gamepad-status';
            // Write back into options so later reads of this.options.statusElementId are consistent.
            (this.options as GamepadServiceOptions).statusElementId = defaultStatusId;
            this.eventState.statusElementId = defaultStatusId;
            ensureStatusElement(defaultStatusId);
        }

        setGamepadContext(this.options.gamepadContext);

        if (this.options.useCustomEvents) {
            const customGameLoopFn = createCustomEventGameLoop(
                this.eventState,
                this.navState,
                this.options.enableDualContext ? this.contextManager : undefined,
                this.updateFocus.bind(this)
            );
            this.eventState.gameLoopFn = customGameLoopFn;
            startGameLoop(this.eventState, customGameLoopFn);
            logger.info('Using custom events mode for WinUI integration');
        } else {
            this.eventState.gameLoopFn = this.gameLoopFn;
            startGameLoop(this.eventState, this.gameLoopFn);
        }

        const modeText = this.options.enableDualContext ? 'dual context' : 'single context';
        const eventText = this.options.useCustomEvents ? 'custom events' : 'native browser APIs';
        logger.info(`GamepadService initialized with ${modeText} navigation support using ${eventText}`);
    }

    /**
     * Observes the navigation container for DOM changes and drops the focusable-element memo
     * when the subtree mutates. This keeps {@link detectElements} cheap (read-through cache)
     * while guaranteeing it never returns a stale list after the app adds/removes elements.
     * @private
     */
    private observeDomMutations(): void {
        if (typeof MutationObserver === 'undefined') return;

        const target = this.options.containerSelector
            ? document.querySelector(this.options.containerSelector)
            : document.body;
        if (!target) return;

        this.mutationObserver = new MutationObserver(() => invalidateFocusableElementsCache());
        this.mutationObserver.observe(target, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled', 'hidden', 'tabindex', 'gamepad-index'],
        });
    }

    /**
     * Sets up dual-context navigation: a horizontal "menu" context (R1/L1) and a
     * spatial "content" context (stick). Both forward focus/select to the service
     * event emitter, and context switches are surfaced via the `contextswitch` event.
     * @private
     */
    setupDualContextMode() {
        const menuContext = this.contextManager.registerContext('menu', {
            containerSelector: this.options.menuContextSelector ?? null,
            navigationMode: 'horizontal',
            role: 'menu',
            focusedClass: this.options.focusedClass,
            selectedClass: this.options.selectedClass,
            useDataAttributes: this.options.useDataAttributes,
            useGamepadIndex: this.options.useGamepadIndex,
            onlyViewport: this.options.onlyViewport,
            wrapNavigation: this.options.wrapNavigation,
            autoDetectElements: true,
        });

        const contentContext = this.contextManager.registerContext('content', {
            containerSelector: this.options.contentContextSelector ?? null,
            navigationMode: 'spatial',
            role: 'content',
            focusedClass: this.options.focusedClass,
            selectedClass: this.options.selectedClass,
            useDataAttributes: this.options.useDataAttributes,
            useGamepadIndex: this.options.useGamepadIndex,
            onlyViewport: this.options.onlyViewport,
            wrapNavigation: this.options.wrapNavigation,
            autoDetectElements: true,
        });

        // Forward context focus/select to the service-level event emitter.
        menuContext.on('focus', (element, index) => this.emit('focus', element, index));
        menuContext.on('select', (element, index) => this.emit('select', element, index));
        contentContext.on('focus', (element, index) => this.emit('focus', element, index));
        contentContext.on('select', (element, index) => this.emit('select', element, index));

        this.contextManager.setContextSwitchCallback((newContext, oldContext) => {
            logger.info(`Context switched from ${oldContext?.id || 'none'} to ${newContext.id}`);
            this.emit('contextswitch', newContext, oldContext);
        });

        menuContext.detectElements();
        contentContext.detectElements();

        // Start with content context active
        this.contextManager.setActiveContext('content');

        logger.info('Dual context mode initialized - Menu: R1/L1, Content: Stick');
    }

    /**
     * Destroys the GamepadService instance and performs comprehensive cleanup:
     * stops the loop, removes native AND custom-event listeners, cancels pending
     * operations, clears focus/elements/callbacks, and destroys the context manager.
     */
    destroy(): void {
        logger.info('GamepadService: Starting cleanup...');

        stopGameLoop(this.eventState);

        // Removes both native and custom-event listeners (the latter via state.customListeners).
        removeEventListeners(this.eventState, this.handleGamepadConnected, this.handleGamepadDisconnected);
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', this.handleResize);
        }
        this.handleResize.cancel();
        this.mutationObserver?.disconnect();
        this.mutationObserver = null;

        this.clearFocus();
        invalidateFocusableElementsCache();
        this.eventState.gamepads = {};
        this.eventState.padInputStates = {};

        // Drop all external subscribers and internal callback wiring.
        this.listeners.clear();
        this.eventState.onControllerConnect = null;
        this.eventState.onControllerDisconnect = null;
        this.eventState.onNavigationMenuOpen = null;
        this.eventState.onBackButton = null;
        this.eventState.onButtonDown = undefined;
        this.eventState.onButtonUp = undefined;
        this.eventState.onError = undefined;
        this.navState.onFocus = null;
        this.navState.onSelect = null;
        this.navState.elements = [];

        this.contextManager.destroy();

        logger.info('GamepadService destroyed and cleaned up');
    }

    /**
     * Detects and filters focusable elements for gamepad navigation, then computes
     * grid dimensions and clamps the focused index.
     */
    detectElements() {
        this.navState.elements = getFocusableElements(
            this.options.containerSelector,
            this.options.useGamepadIndex ?? false,
            this.options.onlyViewport ?? false
        );

        // Filter out disabled / invisible elements
        this.navState.elements = this.navState.elements.filter(
            (el) =>
                (el instanceof HTMLElement ? el.offsetParent !== null : false) &&
                (!(el instanceof HTMLInputElement || el instanceof HTMLButtonElement) || !el.disabled) &&
                (el instanceof HTMLElement ? !el.hasAttribute('disabled') : false)
        );

        const container = this.options.containerSelector
            ? document.querySelector(this.options.containerSelector)
            : document.body;

        this.navState.gridDimensions = calculateGridDimensions(this.navState.elements, container ?? document.body);

        if (this.navState.focusedElementIndex >= this.navState.elements.length) {
            this.navState.focusedElementIndex = Math.max(0, this.navState.elements.length - 1);
        }

        logger.info(
            `Detected ${this.navState.elements.length} navigable elements (${this.navState.gridDimensions.rows}x${this.navState.gridDimensions.cols})`
        );
    }

    // Set elements manually
    setElements(elements: Element[]) {
        // Manual element control bypasses the scan; drop the memo so a later detectElements()
        // doesn't resurrect a now-irrelevant cached list.
        invalidateFocusableElementsCache();
        this.navState.elements = elements;

        const container = this.options.containerSelector
            ? document.querySelector(this.options.containerSelector)
            : document.body;

        this.navState.gridDimensions = calculateGridDimensions(this.navState.elements, container ?? document.body);

        this.navState.focusedElementIndex = 0;
        this.updateFocus();
    }

    /**
     * Updates focus styling for the currently focused element (single-context mode).
     * In dual-context mode focus is owned by the context manager.
     */
    updateFocus() {
        if (this.options.enableDualContext) return;

        // Clear focused styling everywhere (without touching the selected class — historical
        // behavior of updateFocus only cleared the focused state).
        this.navState.elements.forEach((element) => {
            if (this.options.useDataAttributes) {
                clearFocusStyling([element], this.options);
            } else if (this.options.focusedClass) {
                element.classList.remove(this.options.focusedClass);
            }
        });

        const focusedElement = this.navState.elements[this.navState.focusedElementIndex];
        if (focusedElement) {
            applyFocusStyling(focusedElement, this.options);
            scrollElementIntoView(focusedElement, this.options.scrollBehavior ?? 'smooth');

            if (this.navState.onFocus) {
                this.navState.onFocus(focusedElement, this.navState.focusedElementIndex);
            }
        }
    }

    // Clear focus from all elements
    clearFocus() {
        clearFocusStyling(this.navState.elements, this.options);
    }

    // Navigate to specific index
    navigateToIndex(index: number): boolean {
        return navigateToIndex(this.navState, index, this.updateFocus.bind(this));
    }

    // Public API methods
    getCurrentElement(): Element | null {
        if (this.options.enableDualContext) {
            const activeContext = this.contextManager.getActiveContext();
            return activeContext ? activeContext.getCurrentElement() : null;
        }
        return this.navState.elements[this.navState.focusedElementIndex] ?? null;
    }

    getCurrentIndex(): number {
        if (this.options.enableDualContext) {
            const activeContext = this.contextManager.getActiveContext();
            return activeContext ? activeContext.getCurrentIndex() : -1;
        }
        return this.navState.focusedElementIndex;
    }

    getElements(): Element[] {
        if (this.options.enableDualContext) {
            const activeContext = this.contextManager.getActiveContext();
            return activeContext ? activeContext.getElements() : [];
        }
        return this.navState.elements;
    }

    /**
     * The type of the most-recently-active controller (e.g. `'xbox'`). When several
     * controllers are connected this reflects the last one the user touched. Use
     * {@link getControllerTypes} to list every connected controller.
     */
    getControllerType(): string {
        return this.eventState.currentControllerType;
    }

    /**
     * The de-duplicated list of controller types currently connected, e.g.
     * `['xbox', 'playstation']`. Empty when no controller is connected.
     */
    getControllerTypes(): string[] {
        return getConnectedControllerTypes(this.eventState.gamepads);
    }

    isControllerConnected(): boolean {
        return Object.keys(this.eventState.gamepads).length > 0;
    }

    refresh() {
        // Explicit refresh implies the DOM may have changed — drop the focusable memo.
        invalidateFocusableElementsCache();
        if (this.options.enableDualContext) {
            this.contextManager.refresh();
        } else {
            this.detectElements();
            this.updateFocus();
        }
    }

    // Dual context specific methods
    getContext(id: string) {
        return this.contextManager.getContext(id ?? '');
    }

    getActiveContext() {
        return this.contextManager.getActiveContext();
    }

    switchToContext(contextId: string) {
        return this.contextManager.setActiveContext(contextId ?? '');
    }

    getAllContexts() {
        return this.contextManager.getAllContexts();
    }
}
