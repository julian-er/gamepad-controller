import type { GridDimensions } from '../Interfaces/GridDimensions.js';

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
 * Gets all focusable elements within a container, with optional viewport filtering
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
    const container = containerSelector ? document.querySelector(containerSelector) : document.body;

    if (!container) {
        console.warn('getFocusableElements: Container not found', containerSelector);
        return [];
    }

    // Common focusable selectors
    const focusableSelectors = [
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
        '[onclick]' // Add elements with onclick
    ];

    let elements: NodeListOf<Element>;
    
    // If gamepad-index is enabled, only look for elements with gamepad-index="true"
    if (useGamepadIndex) {
        console.debug('[� 🕹️ Gamepad Controller] - 🎯 Gamepad-Index filtering ENABLED - Looking for elements with gamepad-index="true"');
        elements = container.querySelectorAll('[gamepad-index="true"]');
    } else {
        console.debug('[🎮 🕹️ Gamepad Controller] - ❌ Gamepad-Index filtering DISABLED - Using all focusable elements');
        elements = container.querySelectorAll(focusableSelectors.join(', '));
        console.debug(`[🎮 🕹️ Gamepad Controller] - 🔍 Found ${elements.length} normally focusable elements`);
    }
    
    console.debug(`[🎮 🕹️ Gamepad Controller] - 🔧 onlyViewport setting: ${onlyViewport}`);
    
    const filteredElements = Array.from(elements).filter(element => {
        // Check if element is visible
        const style = window.getComputedStyle(element);
        const isVisible = style.display !== 'none' && 
                         style.visibility !== 'hidden' && 
                         style.opacity !== '0';

        // Only check viewport if onlyViewport is true
        const inViewport = onlyViewport ? isElementInViewport(element) : true;
        const shouldInclude = isVisible && inViewport;
        
        // Detailed logging for debugging
        const rect = element.getBoundingClientRect();
        const elementTitle = element.querySelector('h3')?.textContent || element.tagName;
        
        console.debug(`[🎮 🕹️ Gamepad Controller] - 🔍 Element: ${elementTitle}`);
        console.debug(`[🎮 🕹️ Gamepad Controller] -    Visible: ${isVisible}`);
        console.debug(`[🎮 🕹️ Gamepad Controller] -    Position: top=${Math.round(rect.top)}px, bottom=${Math.round(rect.bottom)}px`);
        console.debug(`[🎮 🕹️ Gamepad Controller] -    Viewport check: ${onlyViewport ? `inViewport=${inViewport}` : 'skipped'}`);
        console.debug(`[🎮 🕹️ Gamepad Controller] -    Should include: ${shouldInclude}`);
        
        if (!shouldInclude) {
            const reason = !isVisible ? 'not visible' : 'not in viewport';
            console.debug(`[🎮 🕹️ Gamepad Controller] -   ❌ Filtered out element: ${elementTitle} (${reason})`);
        }
        
        return shouldInclude;
    });

    const viewportStatus = onlyViewport ? 'viewport-only' : 'all elements';
    console.debug(`[🎮 🕹️ Gamepad Controller] - ✅ Final result: ${filteredElements.length} navigable elements (${viewportStatus})`);
    
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
        const columns = gridTemplateColumns.split(' ').filter(col => col.trim() !== '');
        const cols = columns.length;
        const rows = Math.ceil(elements.length / cols);
        return { rows, cols };
    }

    // Fallback: analyze element positions
    const containerRect = container.getBoundingClientRect();
    const elementRects = elements.map(el => el.getBoundingClientRect());
    
    // Group elements by approximate Y position (rows)
    const rowTolerance = 10; // pixels
    const rows: { y: number; elements: number[] }[] = [];
    
    elementRects.forEach((rect, index) => {
        const rowIndex = rows.findIndex(row => 
            Math.abs(row.y - rect.top) <= rowTolerance
        );
        
        if (rowIndex === -1) {
            rows.push({ y: rect.top, elements: [index] });
        } else {
            rows[rowIndex].elements.push(index);
        }
    });
    
    // Sort rows by Y position
    rows.sort((a, b) => a.y - b.y);
    
    // Calculate max columns
    const maxCols = Math.max(...rows.map(row => row.elements.length));
    
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