/**
 * Adds basic CSS styles for gamepad navigation to the page.
 * Creates or updates a style element with configurable navigation styles.
 *
 * @param options - Configuration options for the navigation styles
 * @param options.scopeId - ID for the style element (default: 'gamepad-navigation-styles')
 * @param options.primaryColor - Primary color for focus/selection styles (default: '#007bff')
 * @param options.focusWidth - Width of focus outline (default: '2px')
 * @param options.animationDuration - Duration of transitions (default: '0.2s')
 */
export function addNavigationStyles(options: any = {}): void {
    // COMPLETELY OPTIONAL: Add basic CSS styles for navigation
    // This function is intentionally kept minimal to avoid forcing styles on users

    // Allow customization through options
    const config = {
        scopeId: 'gamepad-navigation-styles',
        primaryColor: '#007bff',
        focusWidth: '2px',
        animationDuration: '0.2s',
        ...options
    };

    // Remove existing styles if any
    const existingStyles = document.getElementById(config.scopeId);
    if (existingStyles) existingStyles.remove();

    const style = document.createElement('style');
    style.id = config.scopeId;
    style.textContent = `
/* Basic gamepad navigation styles - minimal and customizable */
:root {
    --gamepad-primary-color: ${config.primaryColor};
    --gamepad-focus-width: ${config.focusWidth};
    --gamepad-animation-duration: ${config.animationDuration};
}

.gamepad-focused {
    outline: var(--gamepad-focus-width) solid var(--gamepad-primary-color);
    outline-offset: 2px;
    transition: all var(--gamepad-animation-duration) ease;
}

.gamepad-selected {
    background-color: var(--gamepad-primary-color);
    color: white;
}

/* Data attribute styles (recommended for better isolation) */
[data-gamepad-focused="true"] {
    background-color: rgba(0, 123, 255, 0.1);
    border-left: 4px solid var(--gamepad-primary-color);
}

/* Enhanced selection for navigation menus */
.nav-item[data-gamepad-focused="true"] {
    background: linear-gradient(90deg, var(--gamepad-primary-color), color-mix(in srgb, var(--gamepad-primary-color) 80%, black));
    color: white;
    transform: translateX(5px);
}

/* Grid-specific styles */
[data-gamepad-context="grid"] [data-gamepad-focused="true"] {
    transform: scale(1.02);
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: var(--gamepad-primary-color);
}

/* Form-specific styles */
[data-gamepad-context="form"] [data-gamepad-focused="true"] {
    background-color: rgba(0, 123, 255, 0.1);
    border-left: 4px solid var(--gamepad-primary-color);
}

/* Button-specific styles */
button[data-gamepad-focused="true"] {
    background-color: var(--gamepad-primary-color);
    border-color: var(--gamepad-primary-color);
    color: white;
}

/* Smooth transitions for all interactive elements */
button, a, input, select, textarea, .nav-item, .menu-item, .item {
    transition: all 0.3s ease;
}

/* Mark gamepad as active on body for conditional styling */
body[data-gamepad-active="true"] {
    /* Add any global styles when gamepad is active */
}
`;

    document.head.appendChild(style);
    document.body.setAttribute('data-gamepad-active', 'true');

    // ... you can add other utilities here if needed
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