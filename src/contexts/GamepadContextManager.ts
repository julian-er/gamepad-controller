import {
    getFocusableElements,
    findNearestInDirection,
    addGamepadDataAttributes,
    removeGamepadDataAttributes,
} from '../utils/index.js';
import { logger } from '../utils/logger.js';
import { TypedEmitter } from '../core/EventEmitter.js';

import type { GamepadNavigationContextOptions } from '../interfaces/GamepadNavigationContextOptions.js';
import type { GamepadContextManagerCallback } from '../interfaces/GamepadContextManagerCallback.js';
import type { Direction, ShoulderButton } from '../interfaces/NavigationTypes.js';

/** Events emitted by a {@link GamepadNavigationContext}. */
interface GamepadNavigationContextEventMap {
    focus: (element: Element, index: number) => void;
    select: (element: Element, index: number) => void;
    activate: (ctx: GamepadNavigationContext) => void;
    deactivate: (ctx: GamepadNavigationContext) => void;
}

/**
 * Individual navigation context that maintains its own state and focus tracking.
 * Each context represents an independent navigation area with its own focusable elements.
 *
 * @example
 * ```ts
 * const context = new GamepadNavigationContext('menu', {
 *   containerSelector: '.menu',
 *   navigationMode: 'spatial'
 * });
 *
 * // Activate the context
 * context.activate();
 *
 * // Navigate elements
 * context.next();
 * context.previous();
 * ```
 */
export class GamepadNavigationContext {
    id: string;
    options: GamepadNavigationContextOptions;
    elements: Element[];
    focusedElementIndex: number;
    isActive: boolean;
    lastFocusedElement: Element | null;

    private _emitter = new TypedEmitter<GamepadNavigationContextEventMap>();

    constructor(
        id: string,
        options: GamepadNavigationContextOptions = { navigationMode: 'spatial', containerSelector: null }
    ) {
        this.id = id;
        this.options = {
            ...options,
            focusedClass: options.focusedClass ?? 'gamepad-focused',
            selectedClass: options.selectedClass ?? 'gamepad-selected',
            useDataAttributes: options.useDataAttributes ?? true,
            wrapNavigation: options.wrapNavigation ?? true,
            autoDetectElements: options.autoDetectElements ?? true,
            onlyViewport: options.onlyViewport ?? false,
        };

        // Context state
        this.elements = [];
        this.focusedElementIndex = 0;
        this.isActive = false;
        this.lastFocusedElement = null;
    }

    /**
     * Subscribe to a context event. Returns an unsubscribe function.
     * Multiple subscribers per event are supported.
     */
    on<K extends keyof GamepadNavigationContextEventMap>(
        event: K,
        listener: GamepadNavigationContextEventMap[K]
    ): () => void {
        return this._emitter.on(event, listener);
    }

    private _emit<K extends keyof GamepadNavigationContextEventMap>(
        event: K,
        ...args: Parameters<GamepadNavigationContextEventMap[K]>
    ): void {
        this._emitter.emit(event, ...args);
    }

    _clearListeners(): void {
        this._emitter.clear();
    }

    /**
     * Detects and stores navigable elements for this context based on configuration options.
     * Uses getFocusableElements() to find elements that can receive gamepad focus.
     * Updates the internal elements array and adjusts focused index if needed.
     * Logs debug information about detected elements.
     *
     * @remarks
     * - Only runs if autoDetectElements option is true
     * - Uses containerSelector to limit scope if provided
     * - Can filter by viewport visibility if onlyViewport is true
     * - Can use gamepad-index attributes if useGamepadIndex is true
     */
    detectElements(): void {
        if (!this.options.autoDetectElements) return;

        this.elements = getFocusableElements(
            this.options.containerSelector ?? null,
            this.options.useGamepadIndex ?? false,
            this.options.onlyViewport ?? false
        );

        if (this.focusedElementIndex >= this.elements.length) {
            this.focusedElementIndex = Math.max(0, this.elements.length - 1);
        }

        logger.info(`Context ${this.id}: Detected ${this.elements.length} elements`);
    }

    /**
     * Activate this context and update focus.
     *
     * @remarks
     * - Only activates if not already active
     * - Updates focus styling
     * - Fires onActivate callback if set
     * - Logs activation information
     */
    activate() {
        if (this.isActive) return;

        this.isActive = true;
        this.updateFocus();

        this._emit('activate', this);

        logger.info(`Context ${this.id} activated`);
    }

    /**
     * Deactivate this context and clear focus.
     *
     * @remarks
     * - Only deactivates if active
     * - Clears focus styling
     * - Fires onDeactivate callback if set
     * - Logs deactivation information
     */
    deactivate() {
        if (!this.isActive) return;

        this.isActive = false;
        this.clearFocus();

        this._emit('deactivate', this);

        logger.info(`Context ${this.id} deactivated`);
    }

    /**
     * Update focus styling for current element.
     *
     * @remarks
     * - Only runs if active
     * - Removes focus from all elements
     * - Adds focus to current element
     * - Scrolls focused element into view
     * - Fires onFocus callback if set
     */
    updateFocus() {
        if (!this.isActive) return;

        // Remove focus from all elements in this context
        this.elements.forEach((element) => {
            if (this.options.useDataAttributes) {
                removeGamepadDataAttributes(element);
            } else {
                element.classList.remove(this.options.focusedClass ?? '');
            }
        });

        // Add focus to current element
        const focusedElement = this.elements[this.focusedElementIndex];
        if (focusedElement) {
            if (this.options.useDataAttributes) {
                addGamepadDataAttributes(focusedElement, 'focused');
            } else {
                focusedElement.classList.add(this.options.focusedClass ?? '');
            }

            // Scroll into view if needed
            if (typeof focusedElement.scrollIntoView === 'function') {
                focusedElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest',
                });
            }

            this.lastFocusedElement = focusedElement;

            this._emit('focus', focusedElement, this.focusedElementIndex);
        }
    }

    /**
     * Clear focus from all elements in this context.
     *
     * @remarks
     * - Removes focus from all elements
     * - Clears last focused element reference
     */
    clearFocus() {
        this.elements.forEach((element) => {
            if (this.options.useDataAttributes) {
                removeGamepadDataAttributes(element);
            } else {
                element.classList.remove(this.options.focusedClass ?? '');
                element.classList.remove(this.options.selectedClass ?? '');
            }
        });
        this.lastFocusedElement = null;
    }

    /**
     * Navigate in this context.
     *
     * @remarks
     * - Only navigates if active and has elements
     * - Delegates to navigateHorizontal or navigateSpatial based on navigationMode
     */
    navigate(direction: Direction) {
        if (!this.isActive || this.elements.length === 0) return false;

        if (this.options.navigationMode === 'horizontal') {
            return this.navigateHorizontal(direction);
        } else {
            return this.navigateSpatial(direction);
        }
    }

    /**
     * Navigate horizontally (for menus).
     *
     * @remarks
     * - Handles left/right navigation
     * - Wraps navigation if wrapNavigation is true
     * - Returns false if direction is not left/right
     */
    navigateHorizontal(direction: Direction) {
        let newIndex = this.focusedElementIndex;

        if (direction === 'left') {
            newIndex--;
            if (newIndex < 0) {
                newIndex = this.options.wrapNavigation ? this.elements.length - 1 : 0;
            }
        } else if (direction === 'right') {
            newIndex++;
            if (newIndex >= this.elements.length) {
                newIndex = this.options.wrapNavigation ? 0 : this.elements.length - 1;
            }
        } else {
            return false; // Only left/right supported in horizontal mode
        }

        if (newIndex !== this.focusedElementIndex) {
            this.focusedElementIndex = newIndex;
            this.updateFocus();
            return true;
        }
        return false;
    }

    /**
     * Navigate spatially (for general content).
     *
     * @remarks
     * - Finds nearest element in specified direction
     * - Wraps navigation if wrapNavigation is true
     * - Returns false if no element found
     */
    navigateSpatial(direction: Direction) {
        const currentElement = this.elements[this.focusedElementIndex];
        if (!currentElement) return false;

        // Try primary direction first
        let nearestElement: Element | null = findNearestInDirection(currentElement, this.elements, direction);

        // If no element found, try simple wrapping (only for horizontal)
        if (!nearestElement && this.options.wrapNavigation) {
            if (direction === 'left') {
                // Go to last element
                nearestElement = this.elements[this.elements.length - 1] ?? null;
            } else if (direction === 'right') {
                // Go to first element
                nearestElement = this.elements[0] ?? null;
            }
            // Don't wrap for vertical navigation - it's confusing
        }

        if (nearestElement) {
            const newIndex = this.elements.indexOf(nearestElement);
            if (newIndex !== -1) {
                this.focusedElementIndex = newIndex;
                this.updateFocus();
                return true;
            }
        }

        return false;
    }

    /**
     * Handle selection in this context.
     *
     * @remarks
     * - Only handles selection if active
     * - Toggles selected state using data attributes or classes
     * - Fires onSelect callback if set
     * - Handles navigation menu links
     */
    select(onNavigationRequest?: ((href: string, element: Element) => void) | null) {
        if (!this.isActive) return false;

        const focusedElement = this.elements[this.focusedElementIndex];
        if (!focusedElement) return false;

        // Toggle selected state
        if (this.options.useDataAttributes) {
            const isSelected = focusedElement.getAttribute('data-gamepad-selected') === 'true';
            if (isSelected) {
                removeGamepadDataAttributes(focusedElement);
                addGamepadDataAttributes(focusedElement, 'focused'); // Keep focused state
            } else {
                addGamepadDataAttributes(focusedElement, 'selected');
            }
        } else {
            focusedElement.classList.toggle(this.options.selectedClass ?? '');
        }

        // Fire callback
        this._emit('select', focusedElement, this.focusedElementIndex);

        // Handle navigation menu links
        if (
            focusedElement.classList.contains('nav-item') &&
            'href' in focusedElement &&
            (focusedElement as HTMLAnchorElement).href
        ) {
            const href = (focusedElement as HTMLAnchorElement).href;
            logger.debug(`🔗 Navigating to: ${href}`);
            // Delegate navigation to the injected handler (the service routes this through
            // NavigationPolicy). A context used standalone without a handler performs no
            // navigation side-effect of its own.
            if (onNavigationRequest) {
                onNavigationRequest(href, focusedElement);
            }
            return true;
        }

        // Handle regular click events
        if ('click' in focusedElement && typeof (focusedElement as HTMLElement).click === 'function') {
            (focusedElement as HTMLElement).click();
        }

        return true;
    }

    /**
     * Navigate to specific index
     *
     * @remarks
     * - Only navigates if active and index is within bounds
     * - Updates focus styling
     * - Returns false if navigation fails
     */
    navigateToIndex(index: number) {
        if (!this.isActive || index < 0 || index >= this.elements.length) return false;

        this.focusedElementIndex = index;
        this.updateFocus();
        return true;
    }

    /**
     * Get current focused element
     *
     * @remarks
     * - Returns the currently focused element or null if none
     */
    getCurrentElement(): Element | null {
        return this.elements[this.focusedElementIndex] || null;
    }

    /**
     * Get current focused index
     *
     * @remarks
     * - Returns the index of the currently focused element
     */
    getCurrentIndex(): number {
        return this.focusedElementIndex;
    }

    /**
     * Get all elements in this context
     *
     * @remarks
     * - Returns a copy of the elements array
     */
    getElements(): Element[] {
        return [...this.elements];
    }

    /**
     * Check if context has elements
     *
     * @remarks
     * - Returns true if there are elements in the context
     */
    hasElements() {
        return this.elements.length > 0;
    }

    /**
     * Refresh context (re-detect elements and update focus)
     *
     * @remarks
     * - Re-detects elements
     * - Updates focus if active
     */
    refresh(): void {
        this.detectElements();
        if (this.isActive) {
            this.updateFocus();
        }
    }
}

/**
 * Manager class that handles multiple independent navigation contexts.
 * Allows registering, activating, and switching between different navigation contexts.
 * Each context maintains its own state and focus tracking.
 *
 * @example
 * ```ts
 * const manager = new GamepadContextManager();
 *
 * // Register a menu context
 * const menuContext = manager.registerContext('menu', {
 *   containerSelector: '.menu',
 *   navigationMode: 'spatial'
 * });
 *
 * // Register a content context
 * const contentContext = manager.registerContext('content', {
 *   containerSelector: '.content',
 *   navigationMode: 'spatial'
 * });
 *
 * // Switch between contexts
 * manager.setActiveContext('menu');
 * manager.setActiveContext('content');
 * ```
 */
export class GamepadContextManager {
    contexts: Map<string, GamepadNavigationContext>;
    activeContext: GamepadNavigationContext | null;
    lastActiveContext: GamepadNavigationContext | null;
    private _onContextSwitch: GamepadContextManagerCallback | null;

    constructor() {
        this.contexts = new Map();
        this.activeContext = null;
        this.lastActiveContext = null;
        this._onContextSwitch = null;
    }

    /** Register a callback that fires whenever the active context changes. */
    setContextSwitchCallback(fn: GamepadContextManagerCallback | null): void {
        this._onContextSwitch = fn;
    }

    /**
     * Registers a new navigation context with the GamepadContextManager.
     *
     * @remarks
     * - Creates a new GamepadNavigationContext instance
     * - Registers callbacks for activation/deactivation
     * - Logs registration information
     *
     * @param id - The ID of the context
     * @param options - The options for the context
     * @returns {GamepadNavigationContext} The registered context
     */
    registerContext(
        id: string,
        options: GamepadNavigationContextOptions = { navigationMode: 'spatial', containerSelector: null }
    ): GamepadNavigationContext {
        const opts = {
            ...options,
            containerSelector: typeof options.containerSelector === 'string' ? options.containerSelector : null,
        };
        const context = new GamepadNavigationContext(id, opts);
        this.contexts.set(id, context);
        context.on('activate', (ctx) => {
            this.setActiveContext(ctx.id);
        });
        context.on('deactivate', (ctx) => {
            if (this.activeContext === ctx) {
                this.activeContext = null;
            }
        });
        logger.info(`Registered context: ${id}`);
        return context;
    }

    /**
     * Retrieves a registered context by its ID.
     *
     * @remarks
     * - Returns the context if found, undefined otherwise
     *
     * @param id - The ID of the context to retrieve
     * @returns {GamepadNavigationContext | undefined} The context if found, undefined otherwise
     */
    getContext(id: string): GamepadNavigationContext | undefined {
        return this.contexts.get(id);
    }

    /**
     * Returns all registered contexts as an array.
     * @returns {GamepadNavigationContext[]} An array of all registered contexts
     */
    getAllContexts(): GamepadNavigationContext[] {
        return Array.from(this.contexts.values());
    }

    /**
     * Sets the active context by activating it and deactivating the previous active context.
     *
     * @remarks
     * - Activates the new context
     * - Deactivates the previous active context
     * - Fires onContextSwitch callback if set
     * - Returns true if the context was set successfully, false otherwise
     * @param contextId - The ID of the context to set as active
     * @returns {boolean} True if the context was set successfully, false otherwise
     */
    setActiveContext(contextId: string): boolean {
        const context = this.contexts.get(contextId);
        if (!context) {
            logger.warn(`Context not found: ${contextId}`);
            return false;
        }
        if (this.activeContext && this.activeContext !== context) {
            this.lastActiveContext = this.activeContext;
            this.activeContext.deactivate();
        }
        this.activeContext = context;
        context.activate();
        if (this._onContextSwitch) {
            this._onContextSwitch(context, this.lastActiveContext);
        }
        return true;
    }

    /**
     * Gets the currently active context.
     *
     * @remarks
     * - Returns the currently active context or null if none
     */
    getActiveContext(): GamepadNavigationContext | null {
        return this.activeContext;
    }

    /**
     * Handles navigation by activating the current context and delegating navigation within it.
     *
     * @remarks
     * - Only handles navigation if an active context exists
     * - Returns true if navigation was handled successfully, false otherwise
     *
     * @param direction - The direction of navigation ('up', 'down', 'left', 'right')
     * @returns {boolean} True if navigation was handled successfully, false otherwise
     */
    handleNavigation(direction: Direction): boolean {
        if (!this.activeContext) return false;
        return this.activeContext.navigate(direction);
    }

    /**
     * Handles selection by activating the current context and delegating selection within it.
     * @returns {boolean} True if selection was handled successfully, false otherwise
     */
    handleSelection(onNavigationRequest?: ((href: string, element: Element) => void) | null): boolean {
        if (!this.activeContext) return false;
        return this.activeContext.select(onNavigationRequest);
    }

    /**
     * Handles shoulder navigation by finding the menu/navigation context and delegating navigation within it.
     * @param button - The button pressed ('R1' or 'L1')
     * @returns {boolean} True if navigation was handled successfully, false otherwise
     */
    handleShoulderNavigation(button: ShoulderButton): boolean {
        // Find menu/navigation context — prefer explicit role, fall back to navigationMode.
        const menuContext = Array.from(this.contexts.values()).find(
            (ctx) => ctx.options.role === 'menu' || ctx.options.navigationMode === 'horizontal'
        );

        if (!menuContext) return false;

        // Switch to menu context if not already active
        if (this.activeContext !== menuContext) {
            this.setActiveContext(menuContext.id);
        }

        // Navigate within menu context
        const direction = button === 'R1' ? 'right' : 'left';
        return menuContext.navigate(direction);
    }

    /**
     * Handles navigation using analog stick input by finding and activating the main/content context
     * and delegating navigation within that context.
     * @param direction - The direction of navigation ('up', 'down', 'left', 'right')
     * @returns {boolean} True if navigation was handled successfully, false otherwise
     */
    handleStickNavigation(direction: Direction): boolean {
        // Find main content context — prefer explicit role, fall back to navigationMode.
        const mainContext = Array.from(this.contexts.values()).find(
            (ctx) => ctx.options.role === 'content' || ctx.options.navigationMode === 'spatial'
        );

        if (!mainContext) return this.handleNavigation(direction);

        // Switch to main context if not already active
        if (this.activeContext !== mainContext) {
            this.setActiveContext(mainContext.id);
        }

        // Navigate within main context
        return mainContext.navigate(direction);
    }

    /**
     * Refreshes all contexts by calling refresh() on each one.
     * This updates element detection and grid dimensions for each context.
     * Useful after DOM changes or window resizing.
     */
    refresh(): void {
        this.contexts.forEach((context) => context.refresh());
    }

    /**
     * Destroys the GamepadContextManager by cleaning up all contexts and references.
     * - Deactivates all contexts
     * - Clears all callback references and element references for each context
     * - Clears the contexts collection
     * - Nullifies active context references
     * - Removes context switch callback
     */
    destroy(): void {
        // Deactivate all contexts first
        this.contexts.forEach((context) => {
            context.deactivate();
            context._clearListeners();
            // Clear element references
            context.elements = [];
            context.lastFocusedElement = null;
        });

        // Clear all contexts
        this.contexts.clear();

        // Clear active context references
        this.activeContext = null;
        this.lastActiveContext = null;

        // Clear context switch callback
        this._onContextSwitch = null;

        logger.info('GamepadContextManager destroyed and cleaned up');
    }
}
