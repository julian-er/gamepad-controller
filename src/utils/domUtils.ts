import type { GridDimensions } from '../interfaces/GridDimensions.js';
import { logger } from './logger.js';

/**
 * Default focusable selectors, joined once at module load instead of being re-allocated on
 * every {@link getFocusableElements} call (which runs on each refresh/resize).
 */
const FOCUSABLE_SELECTORS = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '.gamepad-focusable',
    '.nav-item',
    '.menu-item',
    '.item',
    '[onclick]', // Add elements with onclick
];
const FOCUSABLE_SELECTOR_STRING = FOCUSABLE_SELECTORS.join(', ');

// Check if element is in viewport
/**
 * Checks if an element is within the viewport, with optional margin
 * @param element - The DOM element to check
 * @param rootMargin - Optional margin to expand/contract the viewport bounds (default: 0)
 * @returns boolean indicating if element is in viewport
 */
export function isElementInViewport(element: Element, rootMargin: number = 0): boolean {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    return (
        rect.bottom > 0 - rootMargin &&
        rect.right > 0 - rootMargin &&
        rect.top < windowHeight + rootMargin &&
        rect.left < windowWidth + rootMargin
    );
}

/**
 * Memoizes the (relatively expensive) focusable-element scan. The scan walks the DOM and
 * calls `getComputedStyle` per candidate, so on dense UIs it is worth avoiding redundant
 * runs. The cache is intentionally conservative: it is keyed by the full lookup tuple and is
 * cleared via {@link invalidateFocusableElementsCache} on any state change that could alter
 * the result (resize, explicit refresh, manual element changes, teardown), so a stale list
 * is never returned.
 */
let focusableCache: { key: string; elements: Element[] } | null = null;

/**
 * Clears the {@link getFocusableElements} memo. Call after anything that can change which
 * elements are focusable or visible (resize, DOM refresh, manual `setElements`, destroy).
 */
export function invalidateFocusableElementsCache(): void {
    focusableCache = null;
}

/**
 * Gets all focusable elements within a container, with optional viewport filtering.
 * Results are memoized; see {@link invalidateFocusableElementsCache}.
 * @param containerSelector - The selector for the container element (default: document.body)
 * @param useGamepadIndex - Whether to filter elements based on gamepad-index attribute (default: false)
 * @param onlyViewport - Whether to filter elements based on viewport visibility (default: false)
 * @returns Array of focusable elements
 */
export function getFocusableElements(
    containerSelector: string | null = null,
    useGamepadIndex: boolean = false,
    onlyViewport: boolean = false
): Element[] {
    const cacheKey = `${containerSelector ?? ''}|${useGamepadIndex}|${onlyViewport}`;
    if (focusableCache && focusableCache.key === cacheKey) {
        // Return a copy so callers that mutate the array (e.g. filtering in place) can't
        // corrupt the cached list.
        return focusableCache.elements.slice();
    }

    const container = containerSelector ? document.querySelector(containerSelector) : document.body;

    if (!container) {
        logger.warn('getFocusableElements: Container not found', containerSelector);
        return [];
    }

    let elements: NodeListOf<Element>;

    // If gamepad-index is enabled, only look for elements with gamepad-index="true"
    if (useGamepadIndex) {
        elements = container.querySelectorAll('[gamepad-index="true"]');
    } else {
        elements = container.querySelectorAll(FOCUSABLE_SELECTOR_STRING);
    }

    const filteredElements = Array.from(elements).filter((element) => {
        // Check if element is visible
        const style = window.getComputedStyle(element);
        const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';

        // Only check viewport if onlyViewport is true
        const inViewport = onlyViewport ? isElementInViewport(element) : true;
        return isVisible && inViewport;
    });

    focusableCache = { key: cacheKey, elements: filteredElements.slice() };
    return filteredElements;
}

/**
 * Convenience function for viewport-only element detection
 * @param containerSelector - The selector for the container element (default: document.body)
 * @param useGamepadIndex - Whether to filter elements based on gamepad-index attribute (default: false)
 * @returns Array of focusable elements in viewport
 */
export function getFocusableElementsInViewport(
    containerSelector: string | null = null,
    useGamepadIndex: boolean = false
): Element[] {
    return getFocusableElements(containerSelector, useGamepadIndex, true);
}

/**
 * Calculates grid dimensions for elements in a container
 * @param elements - Array of DOM elements to calculate dimensions for
 * @param container - The container element to use for calculations
 * @returns GridDimensions object with rows and columns
 */
export function calculateGridDimensions(elements: Element[], container: Element): GridDimensions {
    if (!elements.length || !container) return { rows: 0, cols: 0 };

    // Try to detect CSS Grid first
    const computedStyle = window.getComputedStyle(container);
    const gridTemplateColumns = computedStyle.getPropertyValue('grid-template-columns');

    if (gridTemplateColumns && gridTemplateColumns !== 'none') {
        const columns = gridTemplateColumns.split(' ').filter((col) => col.trim() !== '');
        const cols = columns.length;
        const rows = Math.ceil(elements.length / cols);
        return { rows, cols };
    }

    // Fallback: analyze element positions
    const elementRects = elements.map((el) => el.getBoundingClientRect());

    // Group elements by approximate Y position (rows)
    const rowTolerance = 10; // pixels
    const rows: { y: number; elements: number[] }[] = [];

    elementRects.forEach((rect, index) => {
        const existingRow = rows.find((row) => Math.abs(row.y - rect.top) <= rowTolerance);
        if (existingRow) {
            existingRow.elements.push(index);
        } else {
            rows.push({ y: rect.top, elements: [index] });
        }
    });

    // Sort rows by Y position
    rows.sort((a, b) => a.y - b.y);

    // Calculate max columns
    const maxCols = Math.max(...rows.map((row) => row.elements.length));

    return { rows: rows.length, cols: maxCols };
}

/**
 * Ensures a status element exists in the DOM for displaying gamepad feedback.
 * If an element with the given ID already exists, returns that element.
 * Otherwise creates a new div element with default styles and appends it to the body.
 *
 * @param statusElementId - The ID to use for the status element
 * @returns The existing or newly created status element
 */
export function ensureStatusElement(statusElementId: string): HTMLElement {
    let statusElement = document.getElementById(statusElementId);
    let isNewElement = false;

    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = statusElementId;
        document.body.appendChild(statusElement);
        isNewElement = true;
    }

    // Only apply default styles if we created a new element
    // If the element already exists, respect the user's custom styles
    if (isNewElement) {
        // Mark this element as auto-created by the library
        statusElement.setAttribute('data-gamepad-auto-created', 'true');

        statusElement.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(255, 165, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
        `;

        // Set initial text only for new elements
        statusElement.textContent = '🎮 Waiting for gamepad connection...';
    }

    return statusElement;
}

/**
 * Updates the status element with controller connection information
 * @param statusElementId - The ID of the status element to update
 * @param controllerType - The type of controller that is connected ('xbox', 'playstation', 'nintendo', or 'unknown')
 * @param isConnected - Boolean indicating if a controller is currently connected
 */
export function updateStatusElement(statusElementId: string, controllerType: string, isConnected: boolean): void {
    const statusElement = document.getElementById(statusElementId);
    if (!statusElement) {
        // Element doesn't exist, which is fine if the user didn't want a status element
        return;
    }

    // Always update the content
    if (isConnected) {
        statusElement.textContent = `🎮 ${controllerType} controller connected`;
    } else {
        statusElement.textContent = '🎮 Waiting for gamepad connection...';
    }

    // Only apply styles to elements that were auto-created by the library
    const isAutoCreated = statusElement.hasAttribute('data-gamepad-auto-created');
    if (isAutoCreated) {
        // Update background color for auto-created elements
        statusElement.style.background = isConnected ? 'rgba(0, 128, 0, 0.8)' : 'rgba(255, 165, 0, 0.8)';
    }
}

// Add data attributes for styling hooks (instead of CSS classes)
export function addGamepadDataAttributes(element: Element, state: string): void {
    if (!element) return;

    // Remove previous states
    element.removeAttribute('data-gamepad-focused');
    element.removeAttribute('data-gamepad-selected');

    // Add new state
    if (state === 'focused') {
        element.setAttribute('data-gamepad-focused', 'true');
    } else if (state === 'selected') {
        element.setAttribute('data-gamepad-selected', 'true');
    }
}

/**
 * Removes all gamepad-related data attributes from an element
 * @param element - The DOM element to remove gamepad data attributes from
 */
export function removeGamepadDataAttributes(element: Element): void {
    if (!element) return;

    element.removeAttribute('data-gamepad-focused');
    element.removeAttribute('data-gamepad-selected');
}

/**
 * Sets a data attribute on the document body to indicate the current gamepad navigation context.
 * This allows for context-specific styling using CSS selectors.
 * @param context - The navigation context to set (e.g. 'grid', 'menu', 'default')
 */
export function setGamepadContext(context = 'default') {
    document.body.setAttribute('data-gamepad-context', context);
}
