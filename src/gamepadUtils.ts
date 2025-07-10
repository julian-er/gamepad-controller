// gamepadUtils.ts
// Utility functions for gamepad handling

import { CONTROLLER_MAPPINGS } from './controllerMappings.js';
import type { GridDimensions } from './Interfaces/GridDimensions.js';

// Check if a gamepad object is valid
export function isValidGamepad(gamepad: any): boolean {
    return gamepad && 
           gamepad.buttons && 
           gamepad.axes && 
           gamepad.buttons.length > 0 && 
           gamepad.axes.length > 0;
}

// Detect controller type based on gamepad properties
export function detectControllerType(gamepad: any): string {
    if (!isValidGamepad(gamepad)) {
        return 'unknown';
    }

    const id = gamepad.id.toLowerCase();
    const buttons = gamepad.buttons.length;
    const axes = gamepad.axes.length;

    // Check Xbox controller
    if (CONTROLLER_MAPPINGS.xbox.validation.idPatterns && CONTROLLER_MAPPINGS.xbox.validation.idPatterns.some((pattern: RegExp) => pattern.test(id)) &&
        buttons >= CONTROLLER_MAPPINGS.xbox.validation.minButtons &&
        axes >= CONTROLLER_MAPPINGS.xbox.validation.minAxes) {
        return 'xbox';
    }

    // Check PlayStation controller
    if (CONTROLLER_MAPPINGS.playstation.validation.idPatterns && CONTROLLER_MAPPINGS.playstation.validation.idPatterns.some((pattern: RegExp) => pattern.test(id)) &&
        buttons >= CONTROLLER_MAPPINGS.playstation.validation.minButtons &&
        axes >= CONTROLLER_MAPPINGS.playstation.validation.minAxes) {
        return 'playstation';
    }

    // Check Nintendo controller
    if (CONTROLLER_MAPPINGS.nintendo.validation.idPatterns && CONTROLLER_MAPPINGS.nintendo.validation.idPatterns.some((pattern: RegExp) => pattern.test(id)) &&
        buttons >= CONTROLLER_MAPPINGS.nintendo.validation.minButtons &&
        axes >= CONTROLLER_MAPPINGS.nintendo.validation.minAxes) {
        return 'nintendo';
    }

    // Check if it meets minimum requirements for unknown controller
    if (buttons >= CONTROLLER_MAPPINGS.unknown.validation.minButtons &&
        axes >= CONTROLLER_MAPPINGS.unknown.validation.minAxes) {
        return 'unknown';
    }

    return 'unknown';
}

// Apply deadzone to analog stick values
export function applyDeadzone(value: number, deadzone: number = 0.1): number {
    return Math.abs(value) > deadzone ? value : 0;
}

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

// Get all focusable elements in the viewport
export function getFocusableElementsInViewport(containerSelector: string | null = null): Element[] {
    const container = containerSelector ? document.querySelector(containerSelector) : document.body;
    
    if (!container) return [];

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
        '.item'
    ];

    const elements = container.querySelectorAll(focusableSelectors.join(', '));
    
    return Array.from(elements).filter(element => {
        // Check if element is visible and in viewport
        const style = window.getComputedStyle(element);
        const isVisible = style.display !== 'none' && 
                         style.visibility !== 'hidden' && 
                         style.opacity !== '0';
        
        return isVisible && isElementInViewport(element);
    });
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

// Debounce function for input handling
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
    let timeout: ReturnType<typeof setTimeout>;
    return function executedFunction(this: any, ...args: any[]) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    } as T;
}

// Throttle function for continuous input
export function throttle<T extends (...args: any[]) => void>(func: T, delay: number): T {
    let lastCall = 0;
    return function(this: any, ...args: any[]) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func.apply(this, args);
        }
    } as T;
}

// Get distance between two elements (for nearest neighbor navigation)
export function getElementDistance(el1: Element, el2: Element): number {
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();
    
    const x1 = rect1.left + rect1.width / 2;
    const y1 = rect1.top + rect1.height / 2;
    const x2 = rect2.left + rect2.width / 2;
    const y2 = rect2.top + rect2.height / 2;
    
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Find nearest element in a specific direction
export function findNearestInDirection(currentElement: Element, allElements: Element[], direction: string): Element | null {
    const currentRect = currentElement.getBoundingClientRect();
    const currentX = currentRect.left + currentRect.width / 2;
    const currentY = currentRect.top + currentRect.height / 2;
    
    let candidates = allElements.filter((el: Element) => el !== currentElement);
    
    // Filter candidates based on direction
    switch (direction) {
        case 'up':
            candidates = candidates.filter((el: Element) => {
                const rect = el.getBoundingClientRect();
                return rect.bottom <= currentRect.top;
            });
            break;
        case 'down':
            candidates = candidates.filter((el: Element) => {
                const rect = el.getBoundingClientRect();
                return rect.top >= currentRect.bottom;
            });
            break;
        case 'left':
            candidates = candidates.filter((el: Element) => {
                const rect = el.getBoundingClientRect();
                return rect.right <= currentRect.left;
            });
            break;
        case 'right':
            candidates = candidates.filter((el: Element) => {
                const rect = el.getBoundingClientRect();
                return rect.left >= currentRect.right;
            });
            break;
    }
    
    if (candidates.length === 0) return null;
    
    // Find the nearest candidate
    let minDistance = Infinity;
    let nearest: Element | null = null;
    candidates.forEach((el: Element) => {
        const distance = getElementDistance(currentElement, el);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = el;
        }
    });
    
    return nearest;
}

// ========================
// UI UTILITY FUNCTIONS
// ========================

// Create or ensure status element exists
export function ensureStatusElement(statusElementId: string): HTMLElement {
    let statusElement = document.getElementById(statusElementId);
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = statusElementId;
        statusElement.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(statusElement);
    }
    return statusElement;
}

// COMPLETELY OPTIONAL: Add basic CSS styles for navigation
// This function is opt-in only and will NOT be called automatically
export function addNavigationStyles(options: any = {}): void {
    if (document.getElementById('gamepad-navigation-styles')) return;

    // Allow customization through options
    const config = {
        prefix: 'gamepad-', // CSS class prefix
        primaryColor: '#007bff',
        focusWidth: '2px',
        animationDuration: '0.2s',
        pulseAnimation: false, // Changed default to false
        scopeId: 'gamepad-navigation-styles', // Allow custom scope
        ...options
    };

    const style = document.createElement('style');
    style.id = config.scopeId;
    style.textContent = `
        /* Gamepad Navigation Styles - OPTIONAL and CUSTOMIZABLE */
        /* These styles are ONLY applied when explicitly requested */
        :root {
            --gamepad-primary-color: ${config.primaryColor};
            --gamepad-focus-width: ${config.focusWidth};
            --gamepad-animation-duration: ${config.animationDuration};
        }

        /* Very specific selectors to avoid conflicts */
        [data-gamepad-active="true"] .${config.prefix}focused {
            outline: var(--gamepad-focus-width) solid var(--gamepad-primary-color);
            outline-offset: 2px;
            transition: all var(--gamepad-animation-duration) ease;
        }

        [data-gamepad-active="true"] .${config.prefix}selected {
            background-color: var(--gamepad-primary-color);
            color: white;
        }

        /* Navigation menu specific styles - only when gamepad is active */
        [data-gamepad-active="true"] .nav-menu .${config.prefix}focused {
            background-color: rgba(0, 123, 255, 0.1);
            border-left: 4px solid var(--gamepad-primary-color);
            transform: translateX(5px);
        }

        [data-gamepad-active="true"] .nav-item.${config.prefix}focused {
            background: linear-gradient(90deg, var(--gamepad-primary-color), color-mix(in srgb, var(--gamepad-primary-color) 80%, black));
            color: white;
            transform: scale(1.02);
        }

        /* Context-specific styles with very specific selectors */
        [data-gamepad-active="true"][data-gamepad-context="grid"] .${config.prefix}focused {
            transform: scale(1.05);
            z-index: 10;
        }

        [data-gamepad-active="true"][data-gamepad-context="form"] .${config.prefix}focused {
            border-color: var(--gamepad-primary-color);
        }

        [data-gamepad-active="true"][data-gamepad-context="menu"] .${config.prefix}focused {
            background-color: rgba(0, 123, 255, 0.1);
            border-left: 4px solid var(--gamepad-primary-color);
            padding-left: 16px;
        }

        [data-gamepad-active="true"][data-gamepad-context="buttons"] .${config.prefix}focused {
            background-color: var(--gamepad-primary-color);
            border-color: var(--gamepad-primary-color);
            color: white;
        }

        ${config.pulseAnimation ? `
        /* Optional pulse animation */
        @keyframes gamepad-pulse {
            0% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.4); }
            50% { box-shadow: 0 0 0 8px rgba(0, 123, 255, 0.1); }
            100% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0); }
        }

        [data-gamepad-active="true"] .${config.prefix}focused[data-gamepad-pulse="true"] {
            animation: gamepad-pulse 2s infinite;
        }
        ` : ''}

        /* Minimal navigation menu styles - only when explicitly enabled */
        [data-gamepad-active="true"] .nav-menu {
            display: flex;
            gap: 1rem;
            margin: 1rem 0;
        }

        [data-gamepad-active="true"] .nav-item {
            padding: 1rem;
            border-radius: 8px;
            text-decoration: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: all 0.3s ease;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
    
    // Add the data attribute to enable styles
    document.body.setAttribute('data-gamepad-active', 'true');
}

// Alias for backward compatibility
export const addDefaultStyles = addNavigationStyles;

export default {
  addDefaultStyles,
  addNavigationStyles,
  // ... you can add other utilities here if needed
};

// Remove gamepad styles completely
export function removeNavigationStyles(scopeId = 'gamepad-navigation-styles') {
    const existingStyles = document.getElementById(scopeId);
    if (existingStyles) {
        existingStyles.remove();
    }
    document.body.removeAttribute('data-gamepad-active');
}

// Provide CSS content for external use (developers can include this in their own CSS)
export function getNavigationCSS(options = {}) {
    const config = {
        prefix: 'gamepad-',
        primaryColor: '#007bff',
        focusWidth: '2px',
        animationDuration: '0.2s',
        ...options
    };

    return `
/* Gamepad Navigation CSS - Include this in your stylesheet and customize as needed */
:root {
    --gamepad-primary-color: ${config.primaryColor};
    --gamepad-focus-width: ${config.focusWidth};
    --gamepad-animation-duration: ${config.animationDuration};
}

/* Basic gamepad focus styles - customize to match your app */
.${config.prefix}focused {
    /* Add your own focus styles here */
    outline: var(--gamepad-focus-width) solid var(--gamepad-primary-color);
    outline-offset: 2px;
    transition: all var(--gamepad-animation-duration) ease;
}

.${config.prefix}selected {
    /* Add your own selection styles here */
    background-color: var(--gamepad-primary-color);
    color: white;
}

/* You can also use data attributes for more specific styling */
[data-gamepad-focused="true"] {
    /* Your custom focus styles */
}

[data-gamepad-selected="true"] {
    /* Your custom selection styles */
}

/* Context-specific styling hooks */
[data-gamepad-context="grid"] [data-gamepad-focused="true"] {
    /* Grid-specific focus styles */
}

[data-gamepad-context="form"] [data-gamepad-focused="true"] {
    /* Form-specific focus styles */
}

[data-gamepad-context="menu"] [data-gamepad-focused="true"] {
    /* Menu-specific focus styles */
}
`;
}

// Create a downloadable CSS file with examples
export function createNavigationCSSFile(filename = 'gamepad-navigation.css', options = {}) {
    const cssContent = getNavigationCSS(options);
    const blob = new Blob([cssContent], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log(`🎨 Downloaded ${filename} with gamepad navigation styles`);
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

// ========================
// STYLE ISOLATION HELPERS
// ========================

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

// Get example CSS for different contexts
export function getExampleCSS() {
    return `
/* Example CSS for gamepad navigation - customize to match your app */

/* Option 1: Use CSS classes (traditional approach) */
.gamepad-focused {
    /* Your custom focus styles */
    outline: 2px solid #007bff;
    outline-offset: 2px;
}

.gamepad-selected {
    /* Your custom selection styles */
    background-color: #007bff;
    color: white;
}

/* Option 2: Use data attributes (recommended for better isolation) */
[data-gamepad-focused="true"] {
    /* Your custom focus styles */
    box-shadow: 0 0 0 2px #007bff;
}

[data-gamepad-selected="true"] {
    /* Your custom selection styles */
    background-color: #007bff;
    color: white;
}

/* Context-specific styles */
[data-gamepad-context="grid"] [data-gamepad-focused="true"] {
    transform: scale(1.05);
    z-index: 10;
}

[data-gamepad-context="form"] [data-gamepad-focused="true"] {
    border-color: #007bff;
    border-width: 2px;
}

[data-gamepad-context="menu"] [data-gamepad-focused="true"] {
    background-color: rgba(0, 123, 255, 0.1);
    border-left: 4px solid #007bff;
}

/* Respect existing focus styles */
.your-existing-focus-class[data-gamepad-focused="true"] {
    /* Enhance existing focus styles rather than override them */
    box-shadow: 0 0 0 2px #007bff, 0 0 0 4px rgba(0, 123, 255, 0.3);
}
`;
}

// Print CSS examples to console for easy copying
export function printCSSExamples() {
    console.log('🎨 CSS Examples for Gamepad Navigation:');
    console.log('=====================================');
    console.log(getExampleCSS());
    console.log('Copy and paste this CSS into your stylesheet and customize as needed!');
} 

// Stubs for compatibility with exampleMenuPage
export function getCurrentElement(): Element | null { return null; }
export function onFocus(cb: (element: Element, index: number) => void): void {}
export function onSelect(cb: (element: Element, index: number) => void): void {}
export function onControllerConnect(cb: (gamepad: any, controllerType: string) => void): void {} 