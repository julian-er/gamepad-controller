// gamepadNavigation.ts
// Navigation logic for gamepad input handling

import { findNearestInDirection } from '../utils/navigationUtils.js';
import { addGamepadDataAttributes, removeGamepadDataAttributes, updateStatusElement } from '../utils/domUtils.js';
import type { GamepadServiceOptions } from '../Interfaces/GamepadServiceOptions.js';
import type { GridDimensions } from '../Interfaces/GridDimensions.js';
import type { NavigationState } from '../Interfaces/NavigationState';



// Update status display
/**
 * Updates the status display element with current gamepad connection information
 * @param state - The current navigation state object
 * @param gamepads - Object containing connected gamepads indexed by id
 * @param currentControllerType - The type of controller currently connected ('xbox', 'playstation', 'nintendo', or 'unknown')
 */
export function updateStatus(state: NavigationState, gamepads: { [key: string]: Gamepad }, currentControllerType: string) {
    if (!state.options.statusElementId) return;
    
    const isConnected = Object.keys(gamepads).length > 0;
    updateStatusElement((state.options.statusElementId ?? ''), currentControllerType, isConnected);
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
    const { rows, cols } = state.gridDimensions;
    const currentRow = Math.floor(state.focusedElementIndex / cols);
    const currentCol = state.focusedElementIndex % cols;
    
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
 * Handles selection of a focused element with enhanced navigation menu support
 * @param state - The current navigation state object
 * @param contextManager - Optional context manager for dual context navigation mode
 */
export function handleSelection(state: NavigationState, contextManager?: any) {
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
            console.debug(`[🎮 🕹️ Gamepad Controller] - 🔗 Navigating to: ${(focusedElement as HTMLAnchorElement).href}`);
            window.location.href = (focusedElement as HTMLAnchorElement).href;
            return;
        }

        // Handle regular click events
        if (focusedElement && 'click' in focusedElement && typeof (focusedElement as HTMLElement).click === 'function') {
            (focusedElement as HTMLElement).click();
        }
    }
}

/**
 * Handles the back button functionality
 * @param onBackButton - Callback function to handle back button press
 */
export function handleBackButton(onBackButton: (() => void) | null) {
    console.debug('[🎮 🕹️ Gamepad Controller] - 🔙 Back button pressed - going back in history');
    
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
    contextManager?: any,
    onNavigationMenuOpen?: ((button: string) => void) | null
) {
    if (state.options.enableDualContext && contextManager) {
        // In dual context mode, use context manager
        contextManager.handleShoulderNavigation(button);
    } else {
        // Single context mode - navigate between pages
        if (button === 'R1') {
            console.info('[🎮 🕹️ Gamepad Controller] - Shoulder Navigation - ⏭️ R1 pressed - next section');
            
            const navItems = document.querySelectorAll(`${state.options.navigationMenuSelector || ""} .nav-item, ${state.options.navigationMenuSelector || ""} a`);
            const currentNavItem = state.elements[state.focusedElementIndex];
            
            if (navItems.length > 1 && currentNavItem) {
                const currentIndex = Array.from(navItems).indexOf(currentNavItem);
                if (currentIndex !== -1) {
                    const nextIndex = (currentIndex + 1) % navItems.length;
                    const nextItem = navItems[nextIndex];
                    
                    if (nextItem && 'href' in nextItem && typeof (nextItem as HTMLAnchorElement).href === 'string' && (nextItem as HTMLAnchorElement).href) {
                        window.location.href = (nextItem as HTMLAnchorElement).href;
                    }
                }
            }
        } else if (button === 'L1') {
            console.info('[🎮 🕹️ Gamepad Controller] - Shoulder Navigation - ⏮️ L1 pressed - previous section');
            
            const navItems = document.querySelectorAll(`${state.options.navigationMenuSelector || ""} .nav-item, ${state.options.navigationMenuSelector || ""} a`);
            const currentNavItem = state.elements[state.focusedElementIndex];
            
            if (navItems.length > 1 && currentNavItem) {
                const currentIndex = Array.from(navItems).indexOf(currentNavItem);
                if (currentIndex !== -1) {
                    const prevIndex = currentIndex === 0 ? navItems.length - 1 : currentIndex - 1;
                    const prevItem = navItems[prevIndex];
                    
                    if (prevItem && 'href' in prevItem && typeof (prevItem as HTMLAnchorElement).href === 'string' && (prevItem as HTMLAnchorElement).href) {
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
 * Handles window scrolling with right stick
 * @param rightStickX - The x-axis value of the right stick
 * @param rightStickY - The y-axis value of the right stick
 * @param scrollSpeed - The speed of the scroll (default is 1)
 */
export function handleScrolling(rightStickX: number, rightStickY: number, scrollSpeed: number = 1) {
    const scrollMultiplier = 10 * scrollSpeed; // Base scroll speed
    
    // Calculate scroll amounts
    const scrollX = rightStickX * scrollMultiplier;
    const scrollY = rightStickY * scrollMultiplier;
    
    // Perform the scroll
    window.scrollBy(scrollX, scrollY);
    
    // Log for debugging (can be removed in production)
    if (Math.abs(scrollX) > 1 || Math.abs(scrollY) > 1) {
        console.debug(`[🎮 🕹️ Gamepad Controller] - 🔄 Scrolling: X=${scrollX.toFixed(1)}, Y=${scrollY.toFixed(1)}`);
    }
} 