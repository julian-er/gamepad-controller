// GamepadService.ts
// Public facade for gamepad navigation. Composes focused collaborators — the input pipeline
// (polling loop + connected pads), the focus renderer (single-context element discovery and
// focus presentation), the status reporter, and the navigation policy — and owns only the
// lifecycle orchestration (init/destroy), the dual-context wiring, and the public event API.

import { setGamepadContext, invalidateFocusableElementsCache } from '../utils/domUtils.js';
import { addNavigationStyles } from '../utils/cssUtils.js';
import { debounce } from '../utils/navigationUtils.js';
import { logger } from '../utils/logger.js';
import type { GamepadServiceOptions, GamepadServiceConfig } from '../interfaces/GamepadServiceOptions.js';
import { normalizeOptions } from './normalizeOptions.js';
import { GamepadContextManager, GamepadNavigationContext } from '../contexts/GamepadContextManager.js';
import { TypedEmitter } from './EventEmitter.js';
import { defaultPlatformAdapter, type PlatformAdapter, type WindowEventListener } from './platform/PlatformAdapter.js';
import { NavigationPolicy } from './NavigationPolicy.js';
import { FocusRenderer } from './FocusRenderer.js';
import { InputPipeline } from './InputPipeline.js';
import { StatusReporter } from './StatusReporter.js';

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

    // Multi-subscriber event registry.
    private emitter = new TypedEmitter<GamepadServiceEventMap>();

    // Injectable seam over browser globals (timing, gamepads, window events, navigation, observers).
    private platform: PlatformAdapter;

    // Focused collaborators.
    private navigationPolicy: NavigationPolicy;
    private focus: FocusRenderer;
    private input: InputPipeline;
    private status: StatusReporter;

    // Debounced resize handler with cancel capability (registered/removed in init/destroy).
    private handleResize: (() => void) & { cancel: () => void };
    // Invalidates the focusable-element memo when the observed DOM subtree changes, so the
    // cache can safely be read through on every detectElements() without going stale.
    private mutationObserver: MutationObserver | null = null;

    constructor(config: GamepadServiceConfig = {}) {
        // Resolve the platform seam first so collaborators can capture it.
        this.platform = config.platform ?? defaultPlatformAdapter;

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

        // Context manager for dual-context mode.
        this.contextManager = new GamepadContextManager();

        // Compose collaborators. FocusRenderer owns the single-context navigation state; the
        // InputPipeline drives that same state from the polling loop; StatusReporter manages the
        // status-element lifecycle bound to the input event state.
        this.focus = new FocusRenderer(this.options);
        this.input = new InputPipeline(
            this.focus.state,
            this.contextManager,
            this.platform,
            () => this.focus.updateFocus(),
            this.options.statusElementId ?? null
        );
        this.status = new StatusReporter(this.input.state);
        this.navigationPolicy = new NavigationPolicy(this.emitter, this.platform);

        // Bridge the collaborators' single-slot callbacks to the multi-subscriber emitter.
        this.focus.state.onFocus = (element, index) => this.emit('focus', element, index);
        this.focus.state.onSelect = (element, index) => this.emit('select', element, index);
        this.input.state.onControllerConnect = (gamepad) => this.emit('controllerconnect', gamepad);
        this.input.state.onControllerDisconnect = (gamepad) => this.emit('controllerdisconnect', gamepad);
        this.input.state.onNavigationMenuOpen = (button) => this.emit('navigationmenuopen', button);
        this.input.state.onButtonDown = (i, gamepad) => this.emit('buttondown', i, gamepad);
        this.input.state.onButtonUp = (i, gamepad) => this.emit('buttonup', i, gamepad);
        this.input.state.onError = (error) => this.emit('gamepaderror', error);
        this.input.state.onBackButton = () => this.navigationPolicy.requestBack();
        this.input.state.onNavigationRequest = (href, element) =>
            this.navigationPolicy.requestNavigation(href, element);

        // Create debounced resize handler. A resize can change which elements are
        // in-viewport/visible, so drop the focusable memo before re-detecting.
        this.handleResize = debounce(() => {
            invalidateFocusableElementsCache();
            if (this.options.enableDualContext) {
                this.contextManager.refresh();
            } else {
                this.focus.detectElements();
                this.focus.updateFocus();
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
        return this.emitter.on(event, listener);
    }

    /**
     * Remove a previously-registered event listener.
     * @param event - The event name
     * @param listener - The callback to remove
     */
    off<K extends EventName>(event: K, listener: GamepadServiceEventMap[K]): void {
        this.emitter.off(event, listener);
    }

    private emit<K extends EventName>(event: K, ...args: Parameters<GamepadServiceEventMap[K]>): void {
        this.emitter.emit(event, ...args);
    }

    /**
     * Initializes the GamepadService: event listeners, navigation elements, optional
     * styles/status indicator, and the input polling loop. Safe to call once; re-calls
     * while running are ignored.
     */
    init() {
        if (this.input.state.isRunning) return;

        if (!this.platform.isBrowser) {
            logger.warn('GamepadService.init() called in a non-browser environment; skipping.');
            return;
        }

        this.input.setupListeners(this.options);
        this.platform.addWindowListener('resize', this.handleResize as WindowEventListener);
        this.observeDomMutations();

        if (this.options.enableDualContext) {
            this.setupDualContextMode();
        } else {
            this.focus.detectElements();
            this.focus.updateFocus();
        }

        if (this.options.autoAddStyles) {
            addNavigationStyles();
        }

        this.status.setup(this.options as GamepadServiceOptions);

        setGamepadContext(this.options.gamepadContext);

        this.input.start(this.options);

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
        const target = this.options.containerSelector
            ? document.querySelector(this.options.containerSelector)
            : document.body;
        if (!target) return;

        this.mutationObserver = this.platform.createMutationObserver(() => invalidateFocusableElementsCache());
        if (!this.mutationObserver) return;
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

        this.input.stop();
        // Removes both native and custom-event listeners (the latter via state.customListeners).
        this.input.teardownListeners();

        if (this.platform.isBrowser) {
            this.platform.removeWindowListener('resize', this.handleResize as WindowEventListener);
        }
        this.handleResize.cancel();
        this.mutationObserver?.disconnect();
        this.mutationObserver = null;

        this.focus.clearFocus();
        invalidateFocusableElementsCache();
        this.input.clearState();

        // Drop all external subscribers and internal focus callback wiring.
        this.emitter.clear();
        this.focus.state.onFocus = null;
        this.focus.state.onSelect = null;
        this.focus.state.elements = [];

        this.contextManager.destroy();

        logger.info('GamepadService destroyed and cleaned up');
    }

    /**
     * Detects and filters focusable elements for gamepad navigation, then computes
     * grid dimensions and clamps the focused index.
     */
    detectElements() {
        this.focus.detectElements();
    }

    /** Set the navigable elements manually, bypassing auto-detection. */
    setElements(elements: Element[]) {
        this.focus.setElements(elements);
    }

    /**
     * Updates focus styling for the currently focused element (single-context mode).
     * In dual-context mode focus is owned by the context manager.
     */
    updateFocus() {
        this.focus.updateFocus();
    }

    /** Clear focus from all elements. */
    clearFocus() {
        this.focus.clearFocus();
    }

    /** Navigate to a specific index (single-context mode). */
    navigateToIndex(index: number): boolean {
        return this.focus.navigateToIndex(index);
    }

    // Public API methods
    getCurrentElement(): Element | null {
        if (this.options.enableDualContext) {
            const activeContext = this.contextManager.getActiveContext();
            return activeContext ? activeContext.getCurrentElement() : null;
        }
        return this.focus.getCurrentElement();
    }

    getCurrentIndex(): number {
        if (this.options.enableDualContext) {
            const activeContext = this.contextManager.getActiveContext();
            return activeContext ? activeContext.getCurrentIndex() : -1;
        }
        return this.focus.getCurrentIndex();
    }

    getElements(): Element[] {
        if (this.options.enableDualContext) {
            const activeContext = this.contextManager.getActiveContext();
            return activeContext ? activeContext.getElements() : [];
        }
        return this.focus.getElements();
    }

    /**
     * The type of the most-recently-active controller (e.g. `'xbox'`). When several
     * controllers are connected this reflects the last one the user touched. Use
     * {@link getControllerTypes} to list every connected controller.
     */
    getControllerType(): string {
        return this.input.getControllerType();
    }

    /**
     * The de-duplicated list of controller types currently connected, e.g.
     * `['xbox', 'playstation']`. Empty when no controller is connected.
     */
    getControllerTypes(): string[] {
        return this.input.getControllerTypes();
    }

    isControllerConnected(): boolean {
        return this.input.isControllerConnected();
    }

    refresh() {
        // Explicit refresh implies the DOM may have changed — drop the focusable memo.
        invalidateFocusableElementsCache();
        if (this.options.enableDualContext) {
            this.contextManager.refresh();
        } else {
            this.focus.detectElements();
            this.focus.updateFocus();
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
