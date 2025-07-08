// gamepadServiceModel.js
// Core GamepadService class - the main business logic

import { CONTROLLER_MAPPINGS, getPrimaryActionButtonIndex, getDpadIndices, getButtonName, getAxisName } from './controllerMappings.js';
import { 
    isValidGamepad, 
    detectControllerType, 
    applyDeadzone, 
    getFocusableElementsInViewport, 
    calculateGridDimensions,
    findNearestInDirection,
    debounce,
    throttle,
    // UI utility functions
    ensureStatusElement,
    addNavigationStyles,
    updateStatusElement,
    // Style isolation helpers
    addGamepadDataAttributes,
    removeGamepadDataAttributes,
    setGamepadContext
} from './gamepadUtils.js';
import { GamepadContextManager } from './gamepadContextManager.js';

export class GamepadService {
    constructor(options = {}) {
        this.options = {
            debounceTime: 150,
            deadzone: 0.1,
            containerSelector: null,
            statusElementId: null,
            focusedClass: 'gamepad-focused',
            selectedClass: 'gamepad-selected',
            navigationMode: 'grid', // 'grid' or 'spatial'
            wrapNavigation: true,
            autoDetectElements: true,
            // Navigation-specific options
            enableNavigation: true,
            enableBackButton: true,
            enableShoulderNavigation: true,
            navigationMenuSelector: '.nav-menu, nav, .navigation',
            autoCreateStatusElement: true,
            autoAddStyles: false, // Changed default to false - styles are now opt-in
            // Style isolation options
            useDataAttributes: true, // Use data attributes instead of classes for better isolation
            gamepadContext: 'default', // Set context for styling hooks
            // Dual context options
            enableDualContext: false, // Enable dual context mode
            menuContextSelector: '.nav-menu, nav, .navigation',
            contentContextSelector: null,
            ...options
        };

        // Internal state
        this.gamepads = {};
        this.currentControllerType = 'unknown';
        this.isRunning = false;
        this.lastButtonPress = 0;
        this.lastAxisMove = 0;

        // Navigation state
        this.lastBackButtonState = false;
        this.lastBackTime = 0;
        this.lastR1State = false;
        this.lastL1State = false;
        this.lastShoulderTime = 0;

        // Context manager for dual context mode
        this.contextManager = new GamepadContextManager();
        this.legacyMode = !this.options.enableDualContext;

        // Legacy mode state (for backward compatibility)
        this.focusedElementIndex = 0;
        this.elements = [];
        this.gridDimensions = { rows: 0, cols: 0 };

        // Event callbacks
        this.onFocus = null;
        this.onSelect = null;
        this.onControllerConnect = null;
        this.onControllerDisconnect = null;
        this.onNavigationMenuOpen = null;
        this.onBackButton = null;
        this.onContextSwitch = null;

        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
        this.handleGamepadDisconnected = this.handleGamepadDisconnected.bind(this);
        this.handleResize = debounce(this.handleResize.bind(this), 100);
    }

    // Initialize the service
    init() {
        if (this.isRunning) return;
        
        this.setupEventListeners();
        
        if (this.options.enableDualContext) {
            this.setupDualContextMode();
        } else {
            this.detectElements();
            this.updateFocus();
        }
        
        // Auto-add styles if enabled (opt-in only)
        if (this.options.autoAddStyles) {
            addNavigationStyles();
        }
        
        // Auto-create status element if needed
        if (this.options.autoCreateStatusElement && this.options.statusElementId) {
            ensureStatusElement(this.options.statusElementId);
        }
        
        // Set gamepad context for styling hooks
        setGamepadContext(this.options.gamepadContext);
        
        this.startGameLoop();
        
        console.log(`GamepadService initialized with ${this.options.enableDualContext ? 'dual context' : 'legacy'} navigation support`);
    }

    // Setup dual context mode
    setupDualContextMode() {
        // Register menu context for R1/L1 navigation
        const menuContext = this.contextManager.registerContext('menu', {
            containerSelector: this.options.menuContextSelector,
            navigationMode: 'horizontal',
            focusedClass: this.options.focusedClass,
            selectedClass: this.options.selectedClass,
            useDataAttributes: this.options.useDataAttributes,
            wrapNavigation: this.options.wrapNavigation,
            autoDetectElements: true
        });

        // Register content context for stick navigation
        const contentContext = this.contextManager.registerContext('content', {
            containerSelector: this.options.contentContextSelector,
            navigationMode: 'spatial',
            focusedClass: this.options.focusedClass,
            selectedClass: this.options.selectedClass,
            useDataAttributes: this.options.useDataAttributes,
            wrapNavigation: this.options.wrapNavigation,
            autoDetectElements: true
        });

        // Set up context event handlers
        menuContext.onFocus = (element, index) => {
            if (this.onFocus) this.onFocus(element, index);
        };
        
        menuContext.onSelect = (element, index) => {
            if (this.onSelect) this.onSelect(element, index);
        };

        contentContext.onFocus = (element, index) => {
            if (this.onFocus) this.onFocus(element, index);
        };
        
        contentContext.onSelect = (element, index) => {
            if (this.onSelect) this.onSelect(element, index);
        };

        // Set up context switching callback
        this.contextManager.onContextSwitch = (newContext, oldContext) => {
            console.log(`Context switched from ${oldContext?.id || 'none'} to ${newContext.id}`);
            if (this.onContextSwitch) {
                this.onContextSwitch(newContext, oldContext);
            }
        };

        // Detect elements for both contexts
        menuContext.detectElements();
        contentContext.detectElements();

        // Start with content context active
        this.contextManager.setActiveContext('content');
        
        console.log('Dual context mode initialized - Menu: R1/L1, Content: Stick');
    }

    // Cleanup and stop the service
    destroy() {
        this.isRunning = false;
        this.removeEventListeners();
        
        if (this.options.enableDualContext) {
            this.contextManager.destroy();
        } else {
            this.clearFocus();
        }
        
        console.log('GamepadService destroyed');
    }

    // Set up event listeners
    setupEventListeners() {
        window.addEventListener('gamepadconnected', this.handleGamepadConnected);
        window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
        window.addEventListener('resize', this.handleResize);
    }

    // Remove event listeners
    removeEventListeners() {
        window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
        window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
        window.removeEventListener('resize', this.handleResize);
    }

    // Handle gamepad connected
    handleGamepadConnected(event) {
        const gamepad = event.gamepad;
        if (!isValidGamepad(gamepad)) {
            console.warn('Invalid gamepad connected:', gamepad.id);
            return;
        }

        this.currentControllerType = detectControllerType(gamepad);
        this.gamepads[gamepad.index] = gamepad;
        
        console.log(`Gamepad connected: ${gamepad.id} (${this.currentControllerType})`);
        this.updateStatus();
        
        if (this.onControllerConnect) {
            this.onControllerConnect(gamepad, this.currentControllerType);
        }
    }

    // Handle gamepad disconnected
    handleGamepadDisconnected(event) {
        console.log(`Gamepad disconnected: ${event.gamepad.id}`);
        delete this.gamepads[event.gamepad.index];
        
        if (Object.keys(this.gamepads).length === 0) {
            this.currentControllerType = 'unknown';
            this.updateStatus();
        }
        
        if (this.onControllerDisconnect) {
            this.onControllerDisconnect(event.gamepad);
        }
    }

    // Handle window resize
    handleResize() {
        if (this.options.enableDualContext) {
            this.contextManager.refresh();
        } else {
            this.detectElements();
            this.updateFocus();
        }
    }

    // Detect navigable elements with special handling for navigation menus
    detectElements() {
        if (!this.options.autoDetectElements) return;

        this.elements = getFocusableElementsInViewport(this.options.containerSelector);
        
        // Prioritize navigation menu items if they exist
        const navMenuItems = document.querySelectorAll(`${this.options.navigationMenuSelector} .nav-item, ${this.options.navigationMenuSelector} a, ${this.options.navigationMenuSelector} button`);
        if (navMenuItems.length > 0) {
            // Put navigation items first
            const navElements = Array.from(navMenuItems).filter(el => 
                el.offsetParent !== null && // visible
                !el.disabled
            );
            const otherElements = this.elements.filter(el => !navElements.includes(el));
            this.elements = [...navElements, ...otherElements];
        }
        
        // Calculate grid dimensions
        const container = this.options.containerSelector ? 
            document.querySelector(this.options.containerSelector) : 
            document.body;
        
        this.gridDimensions = calculateGridDimensions(this.elements, container);
        
        // Ensure focused index is within bounds
        if (this.focusedElementIndex >= this.elements.length) {
            this.focusedElementIndex = Math.max(0, this.elements.length - 1);
        }
        
        console.log(`Detected ${this.elements.length} navigable elements (${this.gridDimensions.rows}x${this.gridDimensions.cols})`);
    }

    // Set elements manually
    setElements(elements) {
        this.elements = Array.isArray(elements) ? elements : [];
        this.options.autoDetectElements = false;
        
        const container = this.options.containerSelector ? 
            document.querySelector(this.options.containerSelector) : 
            document.body;
        
        this.gridDimensions = calculateGridDimensions(this.elements, container);
        this.focusedElementIndex = 0;
        this.updateFocus();
    }

    // Update visual focus
    updateFocus() {
        // Remove focus from all elements
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

            if (this.onFocus) {
                this.onFocus(focusedElement, this.focusedElementIndex);
            }
        }
    }

    // Clear all focus
    clearFocus() {
        this.elements.forEach(element => {
            if (this.options.useDataAttributes) {
                removeGamepadDataAttributes(element);
            } else {
                element.classList.remove(this.options.focusedClass);
                element.classList.remove(this.options.selectedClass);
            }
        });
    }

    // Update status display
    updateStatus() {
        if (!this.options.statusElementId) return;
        
        const isConnected = Object.keys(this.gamepads).length > 0;
        updateStatusElement(this.options.statusElementId, this.currentControllerType, isConnected);
    }

    // Navigate to specific index
    navigateToIndex(index) {
        if (index >= 0 && index < this.elements.length) {
            this.focusedElementIndex = index;
            this.updateFocus();
            return true;
        }
        return false;
    }

    // Navigate in grid mode
    navigateGrid(direction) {
        const { rows, cols } = this.gridDimensions;
        const currentRow = Math.floor(this.focusedElementIndex / cols);
        const currentCol = this.focusedElementIndex % cols;
        
        let newIndex = this.focusedElementIndex;

        switch (direction) {
            case 'up':
                newIndex -= cols;
                if (newIndex < 0 && this.options.wrapNavigation) {
                    newIndex = this.elements.length - 1;
                }
                break;
            case 'down':
                newIndex += cols;
                if (newIndex >= this.elements.length && this.options.wrapNavigation) {
                    newIndex = 0;
                }
                break;
            case 'left':
                newIndex--;
                if (newIndex < 0 && this.options.wrapNavigation) {
                    newIndex = this.elements.length - 1;
                }
                break;
            case 'right':
                newIndex++;
                if (newIndex >= this.elements.length && this.options.wrapNavigation) {
                    newIndex = 0;
                }
                break;
        }

        // Clamp to bounds if wrap navigation is disabled
        if (!this.options.wrapNavigation) {
            newIndex = Math.max(0, Math.min(newIndex, this.elements.length - 1));
        }

        if (newIndex !== this.focusedElementIndex && newIndex >= 0 && newIndex < this.elements.length) {
            this.focusedElementIndex = newIndex;
            this.updateFocus();
        }
    }

    // Navigate in spatial mode
    navigateSpatial(direction) {
        const currentElement = this.elements[this.focusedElementIndex];
        if (!currentElement) return;

        const nearestElement = findNearestInDirection(currentElement, this.elements, direction);
        if (nearestElement) {
            const newIndex = this.elements.indexOf(nearestElement);
            if (newIndex !== -1) {
                this.focusedElementIndex = newIndex;
                this.updateFocus();
            }
        }
    }

    // Handle navigation input with enhanced functionality
    handleNavigation(direction) {
        if (this.options.enableDualContext) {
            // In dual context mode, use context manager for stick navigation
            this.contextManager.handleStickNavigation(direction);
        } else {
            // Legacy mode
            if (this.options.navigationMode === 'spatial') {
                this.navigateSpatial(direction);
            } else {
                this.navigateGrid(direction);
            }
        }
    }

    // Handle selection with enhanced navigation menu support
    handleSelection() {
        if (this.options.enableDualContext) {
            // In dual context mode, use context manager
            this.contextManager.handleSelection();
        } else {
            // Legacy mode
            const focusedElement = this.elements[this.focusedElementIndex];
            if (!focusedElement) return;

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
            
            // Fire callback first
            if (this.onSelect) {
                this.onSelect(focusedElement, this.focusedElementIndex);
            }

            // Handle navigation menu links specially
            if (focusedElement.classList.contains('nav-item') && focusedElement.href) {
                console.log(`🔗 Navigating to: ${focusedElement.href}`);
                window.location.href = focusedElement.href;
                return;
            }

            // Handle regular click events
            if (focusedElement.click && typeof focusedElement.click === 'function') {
                focusedElement.click();
            }
        }
    }

    // Handle back button functionality
    handleBackButton() {
        console.log('🔙 Back button pressed - going back in history');
        
        if (this.onBackButton) {
            this.onBackButton();
        } else {
            window.history.back();
        }
    }

    // Handle shoulder button navigation (R1/L1)
    handleShoulderNavigation(button) {
        if (this.options.enableDualContext) {
            // In dual context mode, use context manager
            this.contextManager.handleShoulderNavigation(button);
        } else {
            // Legacy mode - navigate between pages
            if (button === 'R1') {
                console.log('⏭️ R1 pressed - next section');
                
                const navItems = document.querySelectorAll(`${this.options.navigationMenuSelector} .nav-item, ${this.options.navigationMenuSelector} a`);
                const currentNavItem = this.elements[this.focusedElementIndex];
                
                if (navItems.length > 1 && currentNavItem) {
                    const currentIndex = Array.from(navItems).indexOf(currentNavItem);
                    if (currentIndex !== -1) {
                        const nextIndex = (currentIndex + 1) % navItems.length;
                        const nextItem = navItems[nextIndex];
                        
                        if (nextItem.href) {
                            window.location.href = nextItem.href;
                        }
                    }
                }
            } else if (button === 'L1') {
                console.log('⏮️ L1 pressed - previous section');
                
                const navItems = document.querySelectorAll(`${this.options.navigationMenuSelector} .nav-item, ${this.options.navigationMenuSelector} a`);
                const currentNavItem = this.elements[this.focusedElementIndex];
                
                if (navItems.length > 1 && currentNavItem) {
                    const currentIndex = Array.from(navItems).indexOf(currentNavItem);
                    if (currentIndex !== -1) {
                        const prevIndex = currentIndex === 0 ? navItems.length - 1 : currentIndex - 1;
                        const prevItem = navItems[prevIndex];
                        
                        if (prevItem.href) {
                            window.location.href = prevItem.href;
                        }
                    }
                }
            }
        }
        
        if (this.onNavigationMenuOpen) {
            this.onNavigationMenuOpen(button);
        }
    }

    // Start the game loop
    startGameLoop() {
        this.isRunning = true;
        this.gameLoop();
    }

    // Main game loop with enhanced navigation support
    gameLoop() {
        if (!this.isRunning) return;

        const currentTimestamp = performance.now();
        const connectedGamepads = navigator.getGamepads();

        for (const gp of connectedGamepads) {
            if (gp && isValidGamepad(gp)) {
                this.gamepads[gp.index] = gp;
                
                // Update controller type if changed
                const detectedType = detectControllerType(gp);
                if (detectedType !== this.currentControllerType) {
                    this.currentControllerType = detectedType;
                    this.updateStatus();
                }

                // Handle primary action button (A/X/Cross)
                const primaryButtonIndex = getPrimaryActionButtonIndex(this.currentControllerType);
                if (gp.buttons[primaryButtonIndex] && gp.buttons[primaryButtonIndex].pressed) {
                    if (currentTimestamp - this.lastButtonPress > this.options.debounceTime) {
                        this.handleSelection();
                        this.lastButtonPress = currentTimestamp;
                    }
                }

                // Handle back button (B/Circle) - Button index 1
                if (this.options.enableBackButton) {
                    const backPressed = gp.buttons[1]?.pressed || false;
                    if (backPressed && !this.lastBackButtonState) {
                        if (currentTimestamp - this.lastBackTime > 300) {
                            this.handleBackButton();
                            this.lastBackTime = currentTimestamp;
                        }
                    }
                    this.lastBackButtonState = backPressed;
                }

                // Handle shoulder buttons (R1/L1) - Button indices 5 and 4
                if (this.options.enableShoulderNavigation) {
                    const r1Pressed = gp.buttons[5]?.pressed || false;
                    const l1Pressed = gp.buttons[4]?.pressed || false;
                    
                    if (r1Pressed && !this.lastR1State) {
                        if (currentTimestamp - this.lastShoulderTime > 300) {
                            this.handleShoulderNavigation('R1');
                            this.lastShoulderTime = currentTimestamp;
                        }
                    }
                    
                    if (l1Pressed && !this.lastL1State) {
                        if (currentTimestamp - this.lastShoulderTime > 300) {
                            this.handleShoulderNavigation('L1');
                            this.lastShoulderTime = currentTimestamp;
                        }
                    }
                    
                    this.lastR1State = r1Pressed;
                    this.lastL1State = l1Pressed;
                }

                // Handle navigation inputs
                let moved = false;

                // Analog stick navigation
                const leftStickX = applyDeadzone(gp.axes[0], this.options.deadzone);
                const leftStickY = applyDeadzone(gp.axes[1], this.options.deadzone);

                if (Math.abs(leftStickX) > 0 || Math.abs(leftStickY) > 0) {
                    if (currentTimestamp - this.lastAxisMove > this.options.debounceTime) {
                        if (Math.abs(leftStickX) > Math.abs(leftStickY)) {
                            this.handleNavigation(leftStickX > 0 ? 'right' : 'left');
                        } else {
                            this.handleNavigation(leftStickY > 0 ? 'down' : 'up');
                        }
                        moved = true;
                        this.lastAxisMove = currentTimestamp;
                    }
                }

                // D-pad navigation
                const dpadIndices = getDpadIndices(this.currentControllerType);
                
                if (gp.buttons[dpadIndices.up] && gp.buttons[dpadIndices.up].pressed) {
                    if (currentTimestamp - this.lastButtonPress > this.options.debounceTime) {
                        this.handleNavigation('up');
                        moved = true;
                        this.lastButtonPress = currentTimestamp;
                    }
                }
                
                if (gp.buttons[dpadIndices.down] && gp.buttons[dpadIndices.down].pressed) {
                    if (currentTimestamp - this.lastButtonPress > this.options.debounceTime) {
                        this.handleNavigation('down');
                        moved = true;
                        this.lastButtonPress = currentTimestamp;
                    }
                }
                
                if (gp.buttons[dpadIndices.left] && gp.buttons[dpadIndices.left].pressed) {
                    if (currentTimestamp - this.lastButtonPress > this.options.debounceTime) {
                        this.handleNavigation('left');
                        moved = true;
                        this.lastButtonPress = currentTimestamp;
                    }
                }
                
                if (gp.buttons[dpadIndices.right] && gp.buttons[dpadIndices.right].pressed) {
                    if (currentTimestamp - this.lastButtonPress > this.options.debounceTime) {
                        this.handleNavigation('right');
                        moved = true;
                        this.lastButtonPress = currentTimestamp;
                    }
                }
            }
        }

        requestAnimationFrame(this.gameLoop);
    }

    // Public API methods
    getCurrentElement() {
        if (this.options.enableDualContext) {
            const activeContext = this.contextManager.getActiveContext();
            return activeContext ? activeContext.getCurrentElement() : null;
        } else {
            return this.elements[this.focusedElementIndex];
        }
    }

    getCurrentIndex() {
        if (this.options.enableDualContext) {
            const activeContext = this.contextManager.getActiveContext();
            return activeContext ? activeContext.getCurrentIndex() : -1;
        } else {
            return this.focusedElementIndex;
        }
    }

    getElements() {
        if (this.options.enableDualContext) {
            const activeContext = this.contextManager.getActiveContext();
            return activeContext ? activeContext.getElements() : [];
        } else {
            return this.elements;
        }
    }

    getControllerType() {
        return this.currentControllerType;
    }

    isControllerConnected() {
        return Object.keys(this.gamepads).length > 0;
    }

    refresh() {
        if (this.options.enableDualContext) {
            this.contextManager.refresh();
        } else {
            this.detectElements();
            this.updateFocus();
        }
    }

    // Dual context specific methods
    getContext(id) {
        return this.contextManager.getContext(id);
    }

    getActiveContext() {
        return this.contextManager.getActiveContext();
    }

    switchToContext(contextId) {
        return this.contextManager.setActiveContext(contextId);
    }

    getAllContexts() {
        return this.contextManager.getAllContexts();
    }
} 