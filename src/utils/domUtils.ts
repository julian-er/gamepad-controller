// domUtils.ts
// DOM manipulation and element handling utilities

import type { GridDimensions } from '../Interfaces/GridDimensions.js';

// Check if element is in viewport
export function isElementInViewport(element: Element, rootMargin: number = 0): boolean {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
        rect.top >= -rootMargin &&
        rect.left >= -rootMargin &&
        rect.bottom <= windowHeight + rootMargin &&
        rect.right <= windowWidth + rootMargin
    );
}

// Get all focusable elements in the viewport with optional gamepad-index filtering
export function getFocusableElementsInViewport(
    containerSelector: string | null = null, 
    useGamepadIndex: boolean = false
): Element[] {
    const container = containerSelector ? document.querySelector(containerSelector) : document.body;
    
    if (!container) {
        console.warn('getFocusableElementsInViewport: Container not found', containerSelector);
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
        console.log('🎯 Gamepad-Index filtering ENABLED - Looking for elements with gamepad-index="true"');
        elements = container.querySelectorAll('[gamepad-index="true"]');
        console.log(`🔍 Found ${elements.length} elements with gamepad-index="true"`);
    } else {
        console.log('❌ Gamepad-Index filtering DISABLED - Using all focusable elements');
        elements = container.querySelectorAll(focusableSelectors.join(', '));
        console.log(`🔍 Found ${elements.length} normally focusable elements`);
    }
    
    const filteredElements = Array.from(elements).filter(element => {
        // Check if element is visible and in viewport
        const style = window.getComputedStyle(element);
        const isVisible = style.display !== 'none' && 
                         style.visibility !== 'hidden' && 
                         style.opacity !== '0';
        
        const inViewport = isElementInViewport(element);
        const shouldInclude = isVisible && inViewport;
        
        if (!shouldInclude) {
            console.log(`❌ Filtered out element: ${element.tagName} (visible: ${isVisible}, inViewport: ${inViewport})`);
        }
        
        return shouldInclude;
    });

    console.log(`✅ Final result: ${filteredElements.length} navigable elements`);
    
    return filteredElements;
}

// Calculate grid dimensions for elements
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

// Ensure a status element exists for gamepad feedback
export function ensureStatusElement(statusElementId: string): HTMLElement {
    let statusElement = document.getElementById(statusElementId);
    
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = statusElementId;
        statusElement.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
        `;
        statusElement.textContent = '🎮 Waiting for gamepad connection...';
        document.body.appendChild(statusElement);
    }
    
    return statusElement;
}

// Update status element with controller information
export function updateStatusElement(statusElementId: string, controllerType: string, isConnected: boolean): void {
    const statusElement = document.getElementById(statusElementId);
    if (!statusElement) return;

    if (isConnected) {
        statusElement.textContent = `🎮 ${controllerType} controller connected`;
        statusElement.style.background = 'rgba(0, 128, 0, 0.8)';
    } else {
        statusElement.textContent = '🎮 Waiting for gamepad connection...';
        statusElement.style.background = 'rgba(255, 165, 0, 0.8)';
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

// Remove all gamepad data attributes
export function removeGamepadDataAttributes(element: Element): void {
    if (!element) return;
    
    element.removeAttribute('data-gamepad-focused');
    element.removeAttribute('data-gamepad-selected');
}

// Set gamepad context for better styling hooks
export function setGamepadContext(context = 'default') {
    document.body.setAttribute('data-gamepad-context', context);
} 