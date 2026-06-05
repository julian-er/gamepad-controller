// gamepadNavigation.ts
// Navigation logic for gamepad input handling

import { findNearestInDirection } from '../utils/navigationUtils.js';
import { addGamepadDataAttributes, removeGamepadDataAttributes, updateStatusElement } from '../utils/domUtils.js';
import { getConnectedControllerTypes } from '../utils/controllerUtils.js';
import { logger } from '../utils/logger.js';
import type { NavigationState } from '../Interfaces/NavigationState.js';
import type { GamepadContextManager } from '../gamepadContextManager.js';

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
 * Lists every connected controller; the `currentControllerType` argument is retained
 * for call-site compatibility but the label is derived from the live gamepad set.
 * @param state - The current navigation state object
 * @param gamepads - Object containing connected gamepads indexed by id
 * @param _currentControllerType - (unused) the most-recently-active controller type
 */
export function updateStatus(
    state: NavigationState,
    gamepads: { [key: string]: Gamepad },
    _currentControllerType?: string
) {
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
export function navigateGrid(state: NavigationState, direction: string, updateFocusCallback: () => void) {
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

    if (newIndex !== state.focusedElementIndex && newIndex >= 0 && newIndex < state.elements.length) {
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
export function navigateSpatial(state: NavigationState, direction: string, updateFocusCallback: () => void) {
    const currentElement = state.elements[state.focusedElementIndex];
    if (!currentElement) return;

    const nearestElement = findNearestInDirection(currentElement, state.elements, direction);
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
    direction: string,
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
export function handleSelection(state: NavigationState, contextManager?: GamepadContextManager) {
    if (state.options.enableDualContext && contextManager) {
        // In dual context mode, use context manager
        contextManager.handleSelection();
    } else {
        // Single context mode
        const focusedElement = state.elements[state.focusedElementIndex];
        if (!focusedElement) return;

        // Toggle selected state
        if (state.options.useDataAttributes) {
            const isSelected = focusedElement.getAttribute('data-gamepad-selected') === 'true';
            if (isSelected) {
                removeGamepadDataAttributes(focusedElement);
                addGamepadDataAttributes(focusedElement, 'focused'); // Keep focused state
            } else {
                addGamepadDataAttributes(focusedElement, 'selected');
            }
        } else {
            focusedElement.classList.toggle(state.options.selectedClass ?? '');
        }

        // Fire callback first
        if (state.onSelect) {
            state.onSelect(focusedElement, state.focusedElementIndex);
        }

        // Handle navigation menu links specially
        if (focusedElement.classList.contains('nav-item') && (focusedElement as HTMLAnchorElement).href) {
            logger.debug(`🔗 Navigating to: ${(focusedElement as HTMLAnchorElement).href}`);
            window.location.href = (focusedElement as HTMLAnchorElement).href;
            return;
        }

        // Handle regular click events
        if (
            focusedElement &&
            'click' in focusedElement &&
            typeof (focusedElement as HTMLElement).click === 'function'
        ) {
            (focusedElement as HTMLElement).click();
        }
    }
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
    button: string,
    contextManager?: GamepadContextManager,
    onNavigationMenuOpen?: ((button: string) => void) | null
) {
    if (state.options.enableDualContext && contextManager) {
        // In dual context mode, use context manager
        contextManager.handleShoulderNavigation(button);
    } else {
        // Single context mode - navigate between pages
        if (button === 'R1') {
            logger.info('Shoulder Navigation - ⏭️ R1 pressed - next section');

            const navItems = document.querySelectorAll(
                `${state.options.navigationMenuSelector || ''} .nav-item, ${state.options.navigationMenuSelector || ''} a`
            );
            const currentNavItem = state.elements[state.focusedElementIndex];

            if (navItems.length > 1 && currentNavItem) {
                const currentIndex = Array.from(navItems).indexOf(currentNavItem);
                if (currentIndex !== -1) {
                    const nextIndex = (currentIndex + 1) % navItems.length;
                    const nextItem = navItems[nextIndex];

                    if (
                        nextItem &&
                        'href' in nextItem &&
                        typeof (nextItem as HTMLAnchorElement).href === 'string' &&
                        (nextItem as HTMLAnchorElement).href
                    ) {
                        window.location.href = (nextItem as HTMLAnchorElement).href;
                    }
                }
            }
        } else if (button === 'L1') {
            logger.info('Shoulder Navigation - ⏮️ L1 pressed - previous section');

            const navItems = document.querySelectorAll(
                `${state.options.navigationMenuSelector || ''} .nav-item, ${state.options.navigationMenuSelector || ''} a`
            );
            const currentNavItem = state.elements[state.focusedElementIndex];

            if (navItems.length > 1 && currentNavItem) {
                const currentIndex = Array.from(navItems).indexOf(currentNavItem);
                if (currentIndex !== -1) {
                    const prevIndex = currentIndex === 0 ? navItems.length - 1 : currentIndex - 1;
                    const prevItem = navItems[prevIndex];

                    if (
                        prevItem &&
                        'href' in prevItem &&
                        typeof (prevItem as HTMLAnchorElement).href === 'string' &&
                        (prevItem as HTMLAnchorElement).href
                    ) {
                        window.location.href = (prevItem as HTMLAnchorElement).href;
                    }
                }
            }
        }
    }

    if (onNavigationMenuOpen) {
        onNavigationMenuOpen(button);
    }
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
) {
    const scrollMultiplier = 10 * scrollSpeed; // Base scroll speed

    // Calculate scroll amounts
    const scrollX = rightStickX * scrollMultiplier;
    const scrollY = rightStickY * scrollMultiplier;

    // Perform the scroll - either on container or window
    if (container) {
        // Get the container element from the selector string
        const containerElement = document.querySelector(container) as HTMLElement;
        if (containerElement) {
            // Scroll within the specified container
            containerElement.scrollBy(scrollX, scrollY);
        } else {
            // Fallback to window scroll if container not found
            logger.warn(`Container "${container}" not found, falling back to window scroll`);
            window.scrollBy(scrollX, scrollY);
        }
    } else {
        // Scroll the window (default behavior)
        window.scrollBy(scrollX, scrollY);
    }

    if (Math.abs(scrollX) > 1 || Math.abs(scrollY) > 1) {
        if (logger.enabled('debug')) {
            const target = container ? `container (${container})` : 'window';
            logger.debug(`🔄 Scrolling ${target}: X=${scrollX.toFixed(1)}, Y=${scrollY.toFixed(1)}`);
        }
    }
}
