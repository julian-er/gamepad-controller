// gamepadNavigation.ts
// Navigation logic for gamepad input handling

import { findNearestInDirection } from '../utils/navigationUtils.js';
import { addGamepadDataAttributes, removeGamepadDataAttributes, updateStatusElement } from '../utils/domUtils.js';
import { getConnectedControllerTypes } from '../utils/controllerUtils.js';
import { logger } from '../utils/logger.js';
import type { NavigationState } from '../interfaces/NavigationState.js';
import type { GamepadContextManager } from '../contexts/GamepadContextManager.js';
import type { Direction, ShoulderButton } from '../interfaces/NavigationTypes.js';

/** Human-readable display names for the controller types. */
const CONTROLLER_LABELS: Record<string, string> = {
    xbox: 'Xbox',
    playstation: 'PlayStation',
    nintendo: 'Nintendo',
    unknown: 'Unknown',
};

/**
 * Builds a display label listing every connected controller, e.g. `"Xbox + PlayStation"`.
 * @param types - De-duplicated controller types
 */
function formatControllerLabel(types: string[]): string {
    return types.map((t) => CONTROLLER_LABELS[t] ?? t).join(' + ');
}

/**
 * Refreshes the status element to reflect ALL currently-connected controllers
 * (e.g. "🎮 Xbox + PlayStation controller connected"), or the waiting state when none.
 * @param statusElementId - The id of the status element (no-op if null/empty)
 * @param gamepads - Object containing connected gamepads indexed by id
 */
export function updateGamepadStatus(statusElementId: string | null, gamepads: { [key: string]: Gamepad }): void {
    if (!statusElementId) return;
    const types = getConnectedControllerTypes(gamepads);
    const isConnected = types.length > 0;
    updateStatusElement(statusElementId, formatControllerLabel(types), isConnected);
}

// Update status display
/**
 * Updates the status display element with current gamepad connection information.
 * The label is derived from the live gamepad set.
 * @param state - The current navigation state object
 * @param gamepads - Object containing connected gamepads indexed by id
 */
export function updateStatus(state: NavigationState, gamepads: { [key: string]: Gamepad }) {
    updateGamepadStatus(state.options.statusElementId ?? null, gamepads);
}

/**
 * Navigates to a specific index in the navigation elements array
 * @param state - The current navigation state object
 * @param index - The index to navigate to
 * @param updateFocusCallback - Callback function to update the focused element
 * @returns boolean indicating if navigation was successful
 */
export function navigateToIndex(state: NavigationState, index: number, updateFocusCallback: () => void): boolean {
    if (index >= 0 && index < state.elements.length) {
        state.focusedElementIndex = index;
        updateFocusCallback();
        return true;
    }
    return false;
}

/**
 * Navigates in grid mode based on the specified direction
 * @param state - The current navigation state object
 * @param direction - The direction to navigate ('up', 'down', 'left', 'right')
 * @param updateFocusCallback - Callback function to update the focused element
 */
export function navigateGrid(state: NavigationState, direction: Direction, updateFocusCallback: () => void) {
    const { cols } = state.gridDimensions;
    let newIndex = state.focusedElementIndex;

    switch (direction) {
        case 'up':
            newIndex -= cols;
            if (newIndex < 0 && state.options.wrapNavigation) {
                newIndex = state.elements.length - 1;
            }
            break;
        case 'down':
            newIndex += cols;
            if (newIndex >= state.elements.length && state.options.wrapNavigation) {
                newIndex = 0;
            }
            break;
        case 'left':
            newIndex--;
            if (newIndex < 0 && state.options.wrapNavigation) {
                newIndex = state.elements.length - 1;
            }
            break;
        case 'right':
            newIndex++;
            if (newIndex >= state.elements.length && state.options.wrapNavigation) {
                newIndex = 0;
            }
            break;
    }

    // Clamp to bounds if wrap navigation is disabled
    if (!state.options.wrapNavigation) {
        newIndex = Math.max(0, Math.min(newIndex, state.elements.length - 1));
    }

    // Base indices are stable, but temporarily ineligible registrations must be skipped.
    const step = direction === 'up' ? -cols : direction === 'down' ? cols : direction === 'left' ? -1 : 1;
    const limit = state.elements.length;
    let attempts = 0;
    while (
        newIndex >= 0 &&
        newIndex < limit &&
        state.isElementEligible?.(state.elements[newIndex]!) === false &&
        attempts++ < limit
    ) {
        newIndex += step;
        if (state.options.wrapNavigation) newIndex = (newIndex + limit) % limit;
    }
    if (
        newIndex !== state.focusedElementIndex &&
        newIndex >= 0 &&
        newIndex < state.elements.length &&
        state.isElementEligible?.(state.elements[newIndex]!) !== false
    ) {
        state.focusedElementIndex = newIndex;
        updateFocusCallback();
    }
}

/**
 * Navigates in spatial mode based on the specified direction
 * @param state - The current navigation state object
 * @param direction - The direction to navigate ('up', 'down', 'left', 'right')
 * @param updateFocusCallback - Callback function to update the focused element
 */
export function navigateSpatial(state: NavigationState, direction: Direction, updateFocusCallback: () => void) {
    const currentElement = state.elements[state.focusedElementIndex];
    if (!currentElement) return;

    const candidates = state.elements.filter((element) => state.isElementEligible?.(element) !== false);
    let nearestElement = findNearestInDirection(currentElement, candidates, direction);
    if (!nearestElement && state.options.wrapNavigation) {
        const withoutCurrent = candidates.filter((element) => element !== currentElement);
        nearestElement = oppositeEdge(withoutCurrent, direction);
    }
    if (nearestElement) {
        const newIndex = state.elements.indexOf(nearestElement);
        if (newIndex !== -1) {
            state.focusedElementIndex = newIndex;
            updateFocusCallback();
        }
    }
}

/**
 * Routes a navigation input to the correct handler based on mode/context.
 * In dual-context mode it delegates to the context manager; otherwise it runs
 * single-context spatial or grid navigation.
 * @param navState - The current navigation state object
 * @param direction - The direction to navigate ('up', 'down', 'left', 'right')
 * @param contextManager - Optional context manager for dual context navigation mode
 * @param updateFocusCallback - Optional callback to run after focus is updated
 */
export function handleNavigation(
    navState: NavigationState,
    direction: Direction,
    contextManager?: GamepadContextManager,
    updateFocusCallback?: () => void
) {
    if (navState.options.enableDualContext && contextManager) {
        contextManager.handleStickNavigation(direction);
    } else if (navState.options.navigationMode === 'spatial') {
        navigateSpatial(navState, direction, updateFocusCallback || (() => {}));
    } else {
        navigateGrid(navState, direction, updateFocusCallback || (() => {}));
    }
}

/**
 * Handles selection of a focused element with enhanced navigation menu support
 * @param state - The current navigation state object
 * @param contextManager - Optional context manager for dual context navigation mode
 */
export function handleSelection(
    state: NavigationState,
    contextManager?: GamepadContextManager,
    onNavigationRequest?: ((href: string, element: Element) => void) | null,
    expectedTarget?: Element | null
): boolean {
    if (state.options.enableDualContext && contextManager) {
        // In dual context mode, use context manager
        if (expectedTarget && contextManager.getActiveContext()?.getCurrentElement() !== expectedTarget) return false;
        return contextManager.handleSelection(onNavigationRequest);
    } else {
        // Single context mode
        const focusedElement = state.elements[state.focusedElementIndex];
        if (
            !focusedElement ||
            (expectedTarget && focusedElement !== expectedTarget) ||
            navStateEligible(state, focusedElement) === false
        )
            return false;
        const runtimeGeneration = state.runtimeGeneration?.();

        // Handle navigation menu links specially
        const anchor = focusedElement as HTMLAnchorElement;
        if (focusedElement.classList.contains('nav-item') && anchor.href) {
            logger.debug(`🔗 Navigating to: ${anchor.href}`);
            if (onNavigationRequest) {
                onNavigationRequest(anchor.href, focusedElement);
            } else if (typeof window !== 'undefined') {
                window.location.href = anchor.href;
            }
            applySelection(state, focusedElement, runtimeGeneration);
            return true;
        }

        // Handle regular click events
        if (
            focusedElement &&
            'click' in focusedElement &&
            typeof (focusedElement as HTMLElement).click === 'function'
        ) {
            (focusedElement as HTMLElement).click();
            applySelection(state, focusedElement, runtimeGeneration);
            return true;
        }
        return false;
    }
}

/** Pick the opposite eligible edge when a spatial direction has no direct candidate. */
function oppositeEdge(elements: Element[], direction: Direction): Element | null {
    if (!elements.length) return null;
    const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
    const chooseLargest = direction === 'left' || direction === 'up';
    return elements.reduce((best, element) => {
        const rect = element.getBoundingClientRect();
        const bestRect = best.getBoundingClientRect();
        const value = axis === 'x' ? rect.left : rect.top;
        const bestValue = axis === 'x' ? bestRect.left : bestRect.top;
        return chooseLargest ? (value > bestValue ? element : best) : value < bestValue ? element : best;
    });
}

function applySelection(state: NavigationState, element: Element, generation?: number): void {
    if (
        state.isRuntimeActive?.() === false ||
        (generation !== undefined && state.runtimeGeneration?.() !== generation) ||
        state.isElementEligible?.(element) === false
    )
        return;
    if (state.options.useDataAttributes) {
        const selected = element.getAttribute('data-gamepad-selected') === 'true';
        if (selected) {
            removeGamepadDataAttributes(element);
            addGamepadDataAttributes(element, 'focused');
        } else addGamepadDataAttributes(element, 'selected');
    } else if (state.options.selectedClass) element.classList.toggle(state.options.selectedClass);
    state.onSelect?.(element, state.focusedElementIndex);
}

function navStateEligible(state: NavigationState, element: Element): boolean | undefined {
    return state.isElementEligible?.(element);
}

/**
 * Handles the back button functionality
 * @param onBackButton - Callback function to handle back button press
 */
export function handleBackButton(onBackButton: (() => void) | null) {
    logger.debug('🔙 Back button pressed - going back in history');

    if (onBackButton) {
        onBackButton();
    } else {
        window.history.back();
    }
}

/**
 * Handles shoulder button navigation (R1/L1)
 * @param state - The current navigation state object
 * @param button - The button pressed ('R1' or 'L1')
 * @param contextManager - Optional context manager for dual context navigation mode
 * @param onNavigationMenuOpen - Optional callback function to handle navigation menu open
 */
export function handleShoulderNavigation(
    state: NavigationState,
    button: ShoulderButton,
    contextManager?: GamepadContextManager,
    onNavigationMenuOpen?: ((button: string) => void) | null,
    onNavigationRequest?: ((href: string, element: Element) => void) | null
): boolean {
    if (state.options.enableDualContext && contextManager) {
        // In dual context mode, use context manager
        return contextManager.handleShoulderNavigation(button) !== false;
    } else {
        // Single context mode - navigate between pages
        const roots = Array.from(document.querySelectorAll(state.options.navigationMenuSelector || ''));
        const navItems: Element[] = [];
        for (const root of roots) {
            if (root.matches('.nav-item, a')) navItems.push(root);
            navItems.push(...Array.from(root.querySelectorAll('.nav-item, a')));
        }
        const eligibleNavItems = navItems.filter((element) => state.isElementEligible?.(element) !== false);
        const currentNavItem = state.elements[state.focusedElementIndex];

        if (eligibleNavItems.length > 1 && currentNavItem && state.isElementEligible?.(currentNavItem) !== false) {
            const currentIndex = eligibleNavItems.indexOf(currentNavItem);
            if (currentIndex !== -1) {
                const isNext = button === 'R1';
                logger.info(
                    isNext
                        ? 'Shoulder Navigation - ⏭️ R1 pressed - next section'
                        : 'Shoulder Navigation - ⏮️ L1 pressed - previous section'
                );
                const targetIndex = isNext
                    ? (currentIndex + 1) % eligibleNavItems.length
                    : currentIndex === 0
                      ? eligibleNavItems.length - 1
                      : currentIndex - 1;
                const targetItem = eligibleNavItems[targetIndex];

                if (
                    targetItem &&
                    state.isElementEligible?.(targetItem) !== false &&
                    'href' in targetItem &&
                    typeof (targetItem as HTMLAnchorElement).href === 'string' &&
                    (targetItem as HTMLAnchorElement).href
                ) {
                    const href = (targetItem as HTMLAnchorElement).href;
                    if (onNavigationRequest) {
                        onNavigationRequest(href, targetItem);
                    } else if (typeof window !== 'undefined') {
                        window.location.href = href;
                    }
                    if (onNavigationMenuOpen) onNavigationMenuOpen(button);
                    return true;
                }
            }
        }
    }

    return false;
}

/**
 * Handles scrolling with right stick - either window or container scrolling
 * @param rightStickX - The x-axis value of the right stick
 * @param rightStickY - The y-axis value of the right stick
 * @param scrollSpeed - The speed of the scroll (default is 1)
 * @param container - Optional container element to scroll within. If not provided, scrolls the window
 */
export function handleScrolling(
    rightStickX: number,
    rightStickY: number,
    scrollSpeed: number = 1,
    container?: string | null
): boolean {
    const scrollMultiplier = 10 * scrollSpeed; // Base scroll speed

    // Calculate scroll amounts
    const scrollX = rightStickX * scrollMultiplier;
    const scrollY = rightStickY * scrollMultiplier;

    // Perform the scroll - either on container or window
    if (container) {
        // Get the container element from the selector string
        const containerElement = document.querySelector(container) as HTMLElement;
        if (containerElement) {
            if (!canScroll(containerElement, scrollX, scrollY)) return false;
            // Scroll within the specified container
            containerElement.scrollBy(scrollX, scrollY);
        } else {
            // Fallback to window scroll if container not found
            logger.warn(`Container "${container}" not found, falling back to window scroll`);
            window.scrollBy(scrollX, scrollY);
        }
    } else {
        const root = document.documentElement;
        if (!canScroll(root, scrollX, scrollY, window.innerWidth, window.innerHeight)) return false;
        // Scroll the window (default behavior)
        window.scrollBy(scrollX, scrollY);
    }

    if (Math.abs(scrollX) > 1 || Math.abs(scrollY) > 1) {
        if (logger.enabled('debug')) {
            const target = container ? `container (${container})` : 'window';
            logger.debug(`🔄 Scrolling ${target}: X=${scrollX.toFixed(1)}, Y=${scrollY.toFixed(1)}`);
        }
    }
    return scrollX !== 0 || scrollY !== 0;
}

function canScroll(
    element: HTMLElement,
    x: number,
    y: number,
    viewportWidth = element.clientWidth,
    viewportHeight = element.clientHeight
): boolean {
    const canX = x < 0 ? element.scrollLeft > 0 : x > 0 && element.scrollLeft + viewportWidth < element.scrollWidth;
    const canY = y < 0 ? element.scrollTop > 0 : y > 0 && element.scrollTop + viewportHeight < element.scrollHeight;
    return canX || canY;
}
