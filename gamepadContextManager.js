// gamepadContextManager.js
// Context manager for handling multiple independent navigation contexts

import { 
    getFocusableElementsInViewport, 
    findNearestInDirection,
    addGamepadDataAttributes,
    removeGamepadDataAttributes,
    setGamepadContext
} from './gamepadUtils.js';

/**
 * Individual navigation context with its own state and focus tracking
 */
export class GamepadNavigationContext {
    constructor(id, options = {}) {
        this.id = id;
        this.options = {
            navigationMode: 'spatial', // 'spatial' or 'horizontal'
            containerSelector: null,
            focusedClass: 'gamepad-focused',
            selectedClass: 'gamepad-selected',
            useDataAttributes: true,
            wrapNavigation: true,
            autoDetectElements: true,
            ...options
        };

        // Context state
        this.elements = [];
        this.focusedElementIndex = 0;
        this.isActive = false;
        this.lastFocusedElement = null;

        // Event callbacks
        this.onFocus = null;
        this.onSelect = null;
        this.onActivate = null;
        this.onDeactivate = null;
    }

    /**
     * Detect navigable elements for this context
     */
    detectElements() {
        if (!this.options.autoDetectElements) return;

        if (this.options.containerSelector) {
            const container = document.querySelector(this.options.containerSelector);
            if (!container) {
                console.warn(`Container not found for context ${this.id}: ${this.options.containerSelector}`);
                this.elements = [];
                return;
            }
            
            // Get elements within the specific container
            const elements = container.querySelectorAll('a, button, input, select, textarea, [tabindex], .nav-item, .item');
            this.elements = Array.from(elements).filter(el => 
                el.offsetParent !== null && // visible
                !el.disabled &&
                !el.hasAttribute('disabled')
            );
        } else {
            this.elements = getFocusableElementsInViewport(null);
        }

        // Ensure focused index is within bounds
        if (this.focusedElementIndex >= this.elements.length) {
            this.focusedElementIndex = Math.max(0, this.elements.length - 1);
        }

        console.log(`Context ${this.id}: Detected ${this.elements.length} elements`);
    }

    /**
     * Activate this context and update focus
     */
    activate() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.updateFocus();
        
        if (this.onActivate) {
            this.onActivate(this);
        }
        
        console.log(`Context ${this.id} activated`);
    }

    /**
     * Deactivate this context and clear focus
     */
    deactivate() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.clearFocus();
        
        if (this.onDeactivate) {
            this.onDeactivate(this);
        }
        
        console.log(`Context ${this.id} deactivated`);
    }

    /**
     * Update focus styling for current element
     */
    updateFocus() {
        if (!this.isActive) return;

        // Remove focus from all elements in this context
        this.elements.forEach(element => {
            if (this.options.useDataAttributes) {
                removeGamepadDataAttributes(element);
            } else {
                element.classList.remove(this.options.focusedClass);
            }
        });

        // Add focus to current element
        if (this.elements[this.focusedElementIndex]) {
            const focusedElement = this.elements[this.focusedElementIndex];
            
            if (this.options.useDataAttributes) {
                addGamepadDataAttributes(focusedElement, 'focused');
            } else {
                focusedElement.classList.add(this.options.focusedClass);
            }
            
            // Scroll into view if needed
            focusedElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest', 
                inline: 'nearest' 
            });

            this.lastFocusedElement = focusedElement;

            if (this.onFocus) {
                this.onFocus(focusedElement, this.focusedElementIndex);
            }
        }
    }

    /**
     * Clear focus from all elements in this context
     */
    clearFocus() {
        this.elements.forEach(element => {
            if (this.options.useDataAttributes) {
                removeGamepadDataAttributes(element);
            } else {
                element.classList.remove(this.options.focusedClass);
                element.classList.remove(this.options.selectedClass);
            }
        });
        this.lastFocusedElement = null;
    }

    /**
     * Navigate in this context
     */
    navigate(direction) {
        if (!this.isActive || this.elements.length === 0) return false;

        if (this.options.navigationMode === 'horizontal') {
            return this.navigateHorizontal(direction);
        } else {
            return this.navigateSpatial(direction);
        }
    }

    /**
     * Navigate horizontally (for menus)
     */
    navigateHorizontal(direction) {
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
     * Navigate spatially (for general content)
     */
    navigateSpatial(direction) {
        const currentElement = this.elements[this.focusedElementIndex];
        if (!currentElement) return false;

        const nearestElement = findNearestInDirection(currentElement, this.elements, direction);
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
     * Handle selection in this context
     */
    select() {
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
            focusedElement.classList.toggle(this.options.selectedClass);
        }

        // Fire callback
        if (this.onSelect) {
            this.onSelect(focusedElement, this.focusedElementIndex);
        }

        // Handle navigation menu links
        if (focusedElement.classList.contains('nav-item') && focusedElement.href) {
            console.log(`🔗 Navigating to: ${focusedElement.href}`);
            window.location.href = focusedElement.href;
            return true;
        }

        // Handle regular click events
        if (focusedElement.click && typeof focusedElement.click === 'function') {
            focusedElement.click();
        }

        return true;
    }

    /**
     * Navigate to specific index
     */
    navigateToIndex(index) {
        if (!this.isActive || index < 0 || index >= this.elements.length) return false;
        
        this.focusedElementIndex = index;
        this.updateFocus();
        return true;
    }

    /**
     * Get current focused element
     */
    getCurrentElement() {
        return this.elements[this.focusedElementIndex] || null;
    }

    /**
     * Get current focused index
     */
    getCurrentIndex() {
        return this.focusedElementIndex;
    }

    /**
     * Get all elements in this context
     */
    getElements() {
        return [...this.elements];
    }

    /**
     * Check if context has elements
     */
    hasElements() {
        return this.elements.length > 0;
    }

    /**
     * Refresh context (re-detect elements and update focus)
     */
    refresh() {
        this.detectElements();
        if (this.isActive) {
            this.updateFocus();
        }
    }
}

/**
 * Manager for multiple independent navigation contexts
 */
export class GamepadContextManager {
    constructor() {
        this.contexts = new Map();
        this.activeContext = null;
        this.lastActiveContext = null;
        
        // Event callbacks
        this.onContextSwitch = null;
    }

    /**
     * Register a new navigation context
     */
    registerContext(id, options = {}) {
        const context = new GamepadNavigationContext(id, options);
        this.contexts.set(id, context);
        
        // Set up context event handlers
        context.onActivate = (ctx) => {
            this.setActiveContext(ctx.id);
        };
        
        context.onDeactivate = (ctx) => {
            if (this.activeContext === ctx) {
                this.activeContext = null;
            }
        };
        
        console.log(`Registered context: ${id}`);
        return context;
    }

    /**
     * Get a context by ID
     */
    getContext(id) {
        return this.contexts.get(id);
    }

    /**
     * Get all contexts
     */
    getAllContexts() {
        return Array.from(this.contexts.values());
    }

    /**
     * Set active context with mutual exclusion
     */
    setActiveContext(contextId) {
        const context = this.contexts.get(contextId);
        if (!context) {
            console.warn(`Context not found: ${contextId}`);
            return false;
        }

        // Deactivate current active context
        if (this.activeContext && this.activeContext !== context) {
            this.lastActiveContext = this.activeContext;
            this.activeContext.deactivate();
        }

        // Activate new context
        this.activeContext = context;
        context.activate();

        // Fire context switch callback
        if (this.onContextSwitch) {
            this.onContextSwitch(context, this.lastActiveContext);
        }

        return true;
    }

    /**
     * Get currently active context
     */
    getActiveContext() {
        return this.activeContext;
    }

    /**
     * Handle navigation input - routes to active context
     */
    handleNavigation(direction) {
        if (!this.activeContext) return false;
        return this.activeContext.navigate(direction);
    }

    /**
     * Handle selection input - routes to active context
     */
    handleSelection() {
        if (!this.activeContext) return false;
        return this.activeContext.select();
    }

    /**
     * Handle shoulder button navigation (context switching)
     */
    handleShoulderNavigation(button) {
        // Find menu/navigation context
        const menuContext = Array.from(this.contexts.values()).find(ctx => 
            ctx.options.navigationMode === 'horizontal' || 
            ctx.id.includes('menu') || 
            ctx.id.includes('nav')
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
     * Handle stick navigation (switches to main content context)
     */
    handleStickNavigation(direction) {
        // Find main content context
        const mainContext = Array.from(this.contexts.values()).find(ctx => 
            ctx.options.navigationMode === 'spatial' || 
            ctx.id.includes('main') || 
            ctx.id.includes('content')
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
     * Refresh all contexts
     */
    refresh() {
        this.contexts.forEach(context => {
            context.refresh();
        });
    }

    /**
     * Destroy all contexts
     */
    destroy() {
        this.contexts.forEach(context => {
            context.deactivate();
        });
        this.contexts.clear();
        this.activeContext = null;
        this.lastActiveContext = null;
    }
} 