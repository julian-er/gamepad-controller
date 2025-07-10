// GamepadService.ts
// Main GamepadService class - coordinates navigation, events, and state management

import { CONTROLLER_MAPPINGS, getPrimaryActionButtonIndex, getDpadIndices, getButtonName, getAxisName } from '../controllerMappings.js';
import {
    getFocusableElementsInViewport,
    calculateGridDimensions,
    ensureStatusElement,
    addGamepadDataAttributes,
    removeGamepadDataAttributes,
    setGamepadContext
} from '../utils/domUtils.js';
import { addNavigationStyles } from '../utils/cssUtils.js';
import { debounce } from '../utils/navigationUtils.js';
import { GamepadContextManager } from '../gamepadContextManager.js';
import { 
    setupEventListeners, 
    removeEventListeners, 
    handleGamepadConnected as handleConnected,
    handleGamepadDisconnected as handleDisconnected,
    startGameLoop,
    gameLoop as createGameLoop,
    type GamepadEventState 
} from './gamepadEventHandler.js';
import { 
    navigateToIndex, 
    updateStatus,
    type NavigationState 
} from './gamepadNavigation.js';

import type { GamepadServiceOptions } from '../Interfaces/GamepadServiceOptions.js';
import type { GamepadNavigationContextOptions } from '../Interfaces/GamepadNavigationContextOptions.js';
import type { ControllerType } from '../Interfaces/ControllerMappings.js';
import type { GridDimensions } from '../Interfaces/GridDimensions.js';

export class GamepadService {
    options: GamepadServiceOptions;
    contextManager: GamepadContextManager;
    legacyMode: boolean;
    
    // Event state
    private eventState: GamepadEventState;
    
    // Navigation state
    private navState: NavigationState;
    
    // Bound methods
    private gameLoopFn: () => void;
    private handleGamepadConnected: (event: GamepadEvent) => void;
    private handleGamepadDisconnected: (event: GamepadEvent) => void;
    private handleResize: () => void;

    constructor(options: GamepadServiceOptions = {}) {
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

        // Initialize event state
        this.eventState = {
            isRunning: false,
            gamepads: {},
            currentControllerType: 'unknown',
            lastButtonPress: 0,
            lastAxisMove: 0,
            lastBackButtonState: false,
            lastBackTime: 0,
            lastR1State: false,
            lastL1State: false,
            lastShoulderTime: 0,
            onControllerConnect: null,
            onControllerDisconnect: null,
            onNavigationMenuOpen: null,
            onBackButton: null
        };

        // Initialize navigation state
        this.navState = {
            focusedElementIndex: 0,
            elements: [],
            gridDimensions: { rows: 0, cols: 0 },
            options: this.options,
            onFocus: null,
            onSelect: null
        };

        // Context manager for dual context mode
        this.contextManager = new GamepadContextManager();
        this.legacyMode = !this.options.enableDualContext;

        // Bind methods
        this.gameLoopFn = createGameLoop(this.eventState, this.navState, this.contextManager, this.updateFocus.bind(this));
        this.handleGamepadConnected = (event: GamepadEvent) => handleConnected(this.eventState, event);
        this.handleGamepadDisconnected = (event: GamepadEvent) => handleDisconnected(this.eventState, event);
        this.handleResize = debounce(() => {
            if (this.options.enableDualContext) {
                this.contextManager.refresh();
            } else {
                this.detectElements();
                this.updateFocus();
            }
        }, 100);
    }

    // Initialize the service
    init() {
        if (this.eventState.isRunning) return;
        
        setupEventListeners(this.eventState, this.handleGamepadConnected, this.handleGamepadDisconnected);
        window.addEventListener('resize', this.handleResize);
        
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
        if (this.options.autoCreateStatusElement && (this.options.statusElementId !== null && this.options.statusElementId !== undefined)) {
            ensureStatusElement(this.options.statusElementId ?? '');
        }
        
        // Set gamepad context for styling hooks
        setGamepadContext(this.options.gamepadContext);
        
        startGameLoop(this.eventState, this.gameLoopFn);
        
        console.log(`GamepadService initialized with ${this.options.enableDualContext ? 'dual context' : 'legacy'} navigation support`);
    }

    // Setup dual context mode
    setupDualContextMode() {
        // Register menu context for R1/L1 navigation
        const menuContext = this.contextManager.registerContext('menu', {
            containerSelector: this.options.menuContextSelector ?? null,
            navigationMode: 'horizontal',
            focusedClass: this.options.focusedClass,
            selectedClass: this.options.selectedClass,
            useDataAttributes: this.options.useDataAttributes,
            wrapNavigation: this.options.wrapNavigation,
            autoDetectElements: true
        });

        // Register content context for stick navigation
        const contentContext = this.contextManager.registerContext('content', {
            containerSelector: this.options.contentContextSelector ?? null,
            navigationMode: 'spatial',
            focusedClass: this.options.focusedClass,
            selectedClass: this.options.selectedClass,
            useDataAttributes: this.options.useDataAttributes,
            wrapNavigation: this.options.wrapNavigation,
            autoDetectElements: true
        });

        // Set up context event handlers
        (menuContext as any).onFocus = (element: Element, index: number) => {
            if (this.navState.onFocus) this.navState.onFocus(element, index);
        };
        
        (menuContext as any).onSelect = (element: Element, index: number) => {
            if (this.navState.onSelect) this.navState.onSelect(element, index);
        };

        (contentContext as any).onFocus = (element: Element, index: number) => {
            if (this.navState.onFocus) this.navState.onFocus(element, index);
        };
        
        (contentContext as any).onSelect = (element: Element, index: number) => {
            if (this.navState.onSelect) this.navState.onSelect(element, index);
        };

        // Set up context switching callback
        (this.contextManager as any).onContextSwitch = (newContext: any, oldContext: any) => {
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

    // Destroy the service
    destroy() {
        this.eventState.isRunning = false;
        removeEventListeners(this.handleGamepadConnected, this.handleGamepadDisconnected);
        window.removeEventListener('resize', this.handleResize);
        
        this.clearFocus();
        this.eventState.gamepads = {};
        
        console.log('GamepadService destroyed');
    }

    // Detect elements for navigation
    detectElements() {
        this.navState.elements = getFocusableElementsInViewport(this.options.containerSelector);
        
        // Filter out disabled elements
        this.navState.elements = this.navState.elements.filter(el => 
            (el instanceof HTMLElement ? el.offsetParent !== null : false) && // visible
            (!(el instanceof HTMLInputElement || el instanceof HTMLButtonElement) || !el.disabled) &&
            (el instanceof HTMLElement ? !el.hasAttribute('disabled') : false)
        );

        // Calculate grid dimensions
        const container = this.options.containerSelector ? 
            document.querySelector(this.options.containerSelector) : document.body;
        
        this.navState.gridDimensions = calculateGridDimensions(this.navState.elements, container ?? document.body);

        // Ensure focused index is within bounds
        if (this.navState.focusedElementIndex >= this.navState.elements.length) {
            this.navState.focusedElementIndex = Math.max(0, this.navState.elements.length - 1);
        }

        console.log(`Detected ${this.navState.elements.length} navigable elements (${this.navState.gridDimensions.rows}x${this.navState.gridDimensions.cols})`);
    }

    // Set elements manually
    setElements(elements: Element[]) {
        this.navState.elements = elements;
        
        // Calculate grid dimensions
        const container = this.options.containerSelector ? 
            document.querySelector(this.options.containerSelector) : document.body;
        
        this.navState.gridDimensions = calculateGridDimensions(this.navState.elements, container ?? document.body);
        
        // Reset focus index
        this.navState.focusedElementIndex = 0;
        this.updateFocus();
    }

    // Update focus styling for current element
    updateFocus() {
        if (this.options.enableDualContext) return; // Handled by context manager

        // Remove focus from all elements
        this.navState.elements.forEach((element) => {
            if (this.options.useDataAttributes) {
                removeGamepadDataAttributes(element);
            } else {
                element.classList.remove(this.options.focusedClass ?? '');
            }
        });

        // Add focus to current element
        if (this.navState.elements[this.navState.focusedElementIndex]) {
            const focusedElement = this.navState.elements[this.navState.focusedElementIndex];

            if (this.options.useDataAttributes) {
                addGamepadDataAttributes(focusedElement, 'focused');
            } else {
                focusedElement.classList.add(this.options.focusedClass ?? '');
            }

            // Scroll into view if needed
            focusedElement.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
            });

            if (this.navState.onFocus) {
                this.navState.onFocus(focusedElement, this.navState.focusedElementIndex);
            }
        }
    }

    // Clear focus from all elements
    clearFocus() {
        this.navState.elements.forEach((element) => {
            if (this.options.useDataAttributes) {
                removeGamepadDataAttributes(element);
            } else {
                element.classList.remove(this.options.focusedClass ?? '');
                element.classList.remove(this.options.selectedClass ?? '');
            }
        });
    }

    // Navigate to specific index
    navigateToIndex(index: number): boolean {
        return navigateToIndex(this.navState, index, this.updateFocus.bind(this));
    }

    // Public API methods
    getCurrentElement(): Element | null {
        if (this.options.enableDualContext) {
            const activeContext = this.contextManager.getActiveContext();
            return activeContext ? activeContext.getCurrentElement() : null;
        } else {
            return (this.navState.elements && typeof this.navState.focusedElementIndex === 'number' && this.navState.elements[this.navState.focusedElementIndex]) ? this.navState.elements[this.navState.focusedElementIndex] : null;
        }
    }

    getCurrentIndex(): number {
        if (this.options.enableDualContext) {
            const activeContext = this.contextManager.getActiveContext();
            return activeContext ? activeContext.getCurrentIndex() : -1;
        } else {
            return this.navState.focusedElementIndex;
        }
    }

    getElements(): Element[] {
        if (this.options.enableDualContext) {
            const activeContext = this.contextManager.getActiveContext();
            return activeContext ? activeContext.getElements() : [];
        } else {
            return this.navState.elements;
        }
    }

    getControllerType(): string {
        return this.eventState.currentControllerType;
    }

    isControllerConnected(): boolean {
        return Object.keys(this.eventState.gamepads).length > 0;
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
    getContext(id: string) {
        return this.contextManager.getContext(id ?? '');
    }

    getActiveContext() {
        return this.contextManager.getActiveContext();
    }

    switchToContext(contextId: string) {
        return this.contextManager.setActiveContext(contextId ?? '');
    }

    getAllContexts() {
        return this.contextManager.getAllContexts();
    }

    // Event callback setters (public API)
    set onFocus(callback: ((element: Element, index: number) => void) | null) {
        this.navState.onFocus = callback;
    }

    get onFocus() {
        return this.navState.onFocus;
    }

    set onSelect(callback: ((element: Element, index: number) => void) | null) {
        this.navState.onSelect = callback;
    }

    get onSelect() {
        return this.navState.onSelect;
    }

    set onControllerConnect(callback: ((gamepad: Gamepad) => void) | null) {
        this.eventState.onControllerConnect = callback;
    }

    get onControllerConnect() {
        return this.eventState.onControllerConnect;
    }

    set onControllerDisconnect(callback: ((gamepad: Gamepad) => void) | null) {
        this.eventState.onControllerDisconnect = callback;
    }

    get onControllerDisconnect() {
        return this.eventState.onControllerDisconnect;
    }

    set onNavigationMenuOpen(callback: ((button: string) => void) | null) {
        this.eventState.onNavigationMenuOpen = callback;
    }

    get onNavigationMenuOpen() {
        return this.eventState.onNavigationMenuOpen;
    }

    set onBackButton(callback: (() => void) | null) {
        this.eventState.onBackButton = callback;
    }

    get onBackButton() {
        return this.eventState.onBackButton;
    }

    set onContextSwitch(callback: ((newContext: any, oldContext: any) => void) | null) {
        // This is stored directly on the instance since it's not part of event state
        this._onContextSwitch = callback;
    }

    get onContextSwitch() {
        return this._onContextSwitch;
    }

    private _onContextSwitch: ((newContext: any, oldContext: any) => void) | null = null;
} 