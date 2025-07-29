import { navigateGrid, navigateSpatial, handleSelection, handleBackButton, handleShoulderNavigation, updateStatus, handleScrolling } from './gamepadNavigation.js';
import { isValidGamepad, detectControllerType, applyDeadzone } from '../utils/controllerUtils.js';
import { getPrimaryActionButtonIndex, getDpadIndices } from '../controllerMappings.js';
import { updateStatusElement } from '../utils/domUtils.js';
import type { ControllerType } from '../Interfaces/ControllerMappings.js';
import type { NavigationState } from '../Interfaces/NavigationState.js';
import { GamepadEventState, GamepadEvent } from '../Interfaces/GamepadEvents.js';
import type { GamepadServiceOptions } from '../Interfaces/GamepadServiceOptions.js';


/**
 * Sets up event listeners for gamepad connection events and detects existing gamepads.
 * Supports both native browser APIs and custom DOM events based on configuration.
 * @param state - The current gamepad event state object
 * @param handleGamepadConnected - The callback function for gamepad connected events
 * @param handleGamepadDisconnected - The callback function for gamepad disconnected events
 * @param options - Optional configuration for custom events mode
 */
export function setupEventListeners(
    state: GamepadEventState, 
    handleGamepadConnected: (event: GamepadEvent) => void,
    handleGamepadDisconnected: (event: GamepadEvent) => void,
    options?: GamepadServiceOptions
) {
    if (options?.useCustomEvents) {
        // Setup custom event listeners for WinUI integration
        setupCustomEventListeners(state, handleGamepadConnected, handleGamepadDisconnected, options);
    } else {
        // Setup native browser gamepad event listeners
        window.addEventListener('gamepadconnected', handleGamepadConnected);
        window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

        // Check for already connected gamepads
        detectExistingGamepads(state);
    }
}

/**
 * Sets up custom DOM event listeners for gamepad events (WinUI integration).
 * Listens to custom events instead of native browser gamepad APIs.
 * @param state - The current gamepad event state object
 * @param handleGamepadConnected - The callback function for gamepad connected events
 * @param handleGamepadDisconnected - The callback function for gamepad disconnected events
 * @param options - Configuration containing custom event names
 */
export function setupCustomEventListeners(
    state: GamepadEventState,
    handleGamepadConnected: (event: GamepadEvent) => void,
    handleGamepadDisconnected: (event: GamepadEvent) => void,
    options: GamepadServiceOptions
) {
    const connectedEvent = options.customConnectedEvent || 'hubgamepadconnected';
    const disconnectedEvent = options.customDisconnectedEvent || 'hubgamepaddisconnected';
    const stateChangedEvent = options.customStateChangedEvent || 'hubgamepadstatechanged';

    console.info(`[🎮 🕹️ Gamepad Controller] - Setting up custom event listeners: ${connectedEvent}, ${disconnectedEvent}, ${stateChangedEvent}`);

    // Listen for custom gamepad connected events
    window.addEventListener(connectedEvent, (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail && customEvent.detail.gamepad) {
            const mockGamepadEvent = createMockGamepadEvent(customEvent.detail.gamepad);
            handleGamepadConnected(mockGamepadEvent);
        }
    });

    // Listen for custom gamepad disconnected events
    window.addEventListener(disconnectedEvent, (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail && customEvent.detail.gamepad) {
            const mockGamepadEvent = createMockGamepadEvent(customEvent.detail.gamepad);
            handleGamepadDisconnected(mockGamepadEvent);
        }
    });

    // Listen for custom gamepad state changed events
    window.addEventListener(stateChangedEvent, (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail && customEvent.detail.gamepad) {
            // Update the gamepad state directly
            const gamepad = customEvent.detail.gamepad;
            if (isValidGamepad(gamepad)) {
                state.gamepads[gamepad.index || 0] = gamepad;
            }
        }
    });

    console.info('[🎮 🕹️ Gamepad Controller] - Custom event listeners initialized for WinUI integration');
}

/**
 * Creates a mock GamepadEvent object from a custom gamepad object.
 * This ensures compatibility with existing event handlers.
 * @param gamepad - The gamepad object from the custom event
 * @returns A mock GamepadEvent object
 */
function createMockGamepadEvent(gamepad: Gamepad): GamepadEvent {
    return {
        gamepad: gamepad,
        type: 'gamepadconnected', // Default type, actual type doesn't matter for our handlers
        bubbles: false,
        cancelable: false,
        composed: false,
        currentTarget: window,
        defaultPrevented: false,
        eventPhase: 0,
        isTrusted: true,
        target: window,
        timeStamp: Date.now(),
        preventDefault: () => {},
        stopImmediatePropagation: () => {},
        stopPropagation: () => {},
        composedPath: () => [window],
        initEvent: () => {},
        NONE: 0,
        CAPTURING_PHASE: 1,
        AT_TARGET: 2,
        BUBBLING_PHASE: 3,
        cancelBubble: false,
        returnValue: true,
        srcElement: window
    } as unknown as GamepadEvent;
}

/**
 * Detects and initializes gamepads that are already connected when the page loads
 * @param state - The current gamepad event state object to update with detected gamepads
 */
export function detectExistingGamepads(state: GamepadEventState) {
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i];
        if (gamepad && isValidGamepad(gamepad)) {
            console.info(`[🎮 🕹️ Gamepad Controller] - Detected already connected gamepad: ${gamepad.id}`);

            // Add to state
            state.gamepads[gamepad.index] = gamepad;

            // Update controller type
            const detectedType = detectControllerType(gamepad);
            state.currentControllerType = detectedType;

            // Update status element if it exists
            if (state.statusElementId) {
                updateStatusElement(state.statusElementId, state.currentControllerType, true);
            }

            // Call connect callback
            if (state.onControllerConnect) {
                state.onControllerConnect(gamepad);
            }

            break; // Handle the first one
        }
    }
}

/**
 * Removes event listeners for gamepad connection events
 * @param handleGamepadConnected - The callback function for gamepad connected events
 * @param handleGamepadDisconnected - The callback function for gamepad disconnected events
 */
export function removeEventListeners(
    handleGamepadConnected: (event: GamepadEvent) => void,
    handleGamepadDisconnected: (event: GamepadEvent) => void
) {
    window.removeEventListener('gamepadconnected', handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
}

// Handle gamepad connected event
/**
 * Handles a gamepad connected event by validating the gamepad, updating state, and triggering callbacks
 * @param state - The current gamepad event state object
 * @param event - The gamepad connected event containing the gamepad that was connected
 */
export function handleGamepadConnected(state: GamepadEventState, event: GamepadEvent) {
    const gamepad = event.gamepad;

    if (isValidGamepad(gamepad)) {
        state.gamepads[gamepad.index] = gamepad;

        const detectedType = detectControllerType(gamepad);
        state.currentControllerType = detectedType;

        console.info(` [🎮 🕹️ Gamepad Controller] - Gamepad connected: ${gamepad.id} (${state.currentControllerType})`);

        // Update status element immediately if it exists
        if (state.statusElementId) {
            updateStatusElement(state.statusElementId, state.currentControllerType, true);
        }

        if (state.onControllerConnect) {
            state.onControllerConnect(gamepad);
        }
    }
}


/**
 * Handles a gamepad disconnected event by cleaning up state and triggering callbacks
 * @param state - The current gamepad event state object
 * @param event - The gamepad disconnected event containing the gamepad that was disconnected
 */
export function handleGamepadDisconnected(state: GamepadEventState, event: GamepadEvent) {
    const gamepad = event.gamepad;

    if (state.gamepads[gamepad.index]) {
        delete state.gamepads[gamepad.index];
        console.info(`[🎮 🕹️ Gamepad Controller] - Gamepad disconnected: ${event.gamepad.id}`);

        // Update status element to show disconnected state if it exists
        if (state.statusElementId) {
            updateStatusElement(state.statusElementId, 'unknown', false);
        }

        if (state.onControllerDisconnect) {
            state.onControllerDisconnect(gamepad);
        }
    }
}

/**
 * Handles navigation input and updates focus based on navigation mode and context
 * @param navState - The current navigation state object
 * @param direction - The direction to navigate ('up', 'down', 'left', 'right')
 * @param contextManager - Optional context manager for dual context navigation mode
 * @param updateFocusCallback - Optional callback function to run after focus is updated
 */
export function handleNavigation(
    navState: NavigationState,
    direction: string,
    contextManager?: any,
    updateFocusCallback?: () => void
) {
    if (navState.options.enableDualContext && contextManager) {
        // In dual context mode, use context manager for stick navigation
        contextManager.handleStickNavigation(direction);
    } else {
        // Single context mode
        if (navState.options.navigationMode === 'spatial') {
            navigateSpatial(navState, direction, updateFocusCallback || (() => {}));
        } else {
            navigateGrid(navState, direction, updateFocusCallback || (() => {}));
        }
    }
}


/**
 * Starts the game loop for gamepad event handling
 * @param state - The current gamepad event state object
 * @param gameLoop - The game loop function to execute each frame
 */
export function startGameLoop(state: GamepadEventState, gameLoop: () => void) {
    // Stop any existing game loop first
    stopGameLoop(state);

    state.isRunning = true;
    gameLoop();
}


/**
 * Stops the game loop and cleans up animation frames
 * @param state - The current gamepad event state object
 */
export function stopGameLoop(state: GamepadEventState) {
    state.isRunning = false;
    if (state.animationFrameId !== null) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
    }
}

/**
 * Creates and returns the main game loop function for gamepad event handling
 * @param eventState - The current gamepad event state containing button states and callbacks
 * @param navState - The current navigation state containing focused elements and options
 * @param contextManager - Optional context manager for dual context navigation mode
 * @param updateFocusCallback - Optional callback function to run after focus is updated
 * @returns A function that implements the game loop logic
 */
export function gameLoop(
    eventState: GamepadEventState, 
    navState: NavigationState,
    contextManager?: any,
    updateFocusCallback?: () => void
): () => void {
    /**
     * The main game loop implementation function that runs each animation frame
     * Handles gamepad input detection, button state tracking, and navigation
     * @returns {void}
     */
    return function gameLoopImpl(): void {
        // Check if loop should continue running
        if (!eventState.isRunning) {
            eventState.animationFrameId = null;
            return;
        }

        const currentTimestamp = performance.now();
        const connectedGamepads = navigator.getGamepads();

        for (const gp of connectedGamepads) {
            if (gp && isValidGamepad(gp)) {
                eventState.gamepads[gp.index] = gp;

                // --- Button event handling ---
                if (!eventState.lastButtonStates) eventState.lastButtonStates = {};
                if (!eventState.lastButtonStates[gp.index]) {
                    eventState.lastButtonStates[gp.index] = gp.buttons.map(b => b.pressed);
                }
                const prevStates = eventState.lastButtonStates[gp.index];
                for (let i = 0; i < gp.buttons.length; i++) {
                    const prev = prevStates[i] || false;
                    const curr = gp.buttons[i].pressed;
                    if (curr && !prev && typeof eventState.onButtonDown === 'function') {
                        eventState.onButtonDown(i, gp);
                    }
                    if (!curr && prev && typeof eventState.onButtonUp === 'function') {
                        eventState.onButtonUp(i, gp);
                    }
                    prevStates[i] = curr;
                }
                // Update controller type if changed
                const detectedType = detectControllerType(gp);
                if (detectedType !== eventState.currentControllerType) {
                    eventState.currentControllerType = detectedType;
                    updateStatus(navState, eventState.gamepads, eventState.currentControllerType);
                }

                // Handle primary action button (A/X/Cross)
                const primaryButtonIndex = getPrimaryActionButtonIndex(eventState.currentControllerType as ControllerType);
                if (gp.buttons[primaryButtonIndex] && gp.buttons[primaryButtonIndex].pressed) {
                    if (currentTimestamp - eventState.lastButtonPress > (navState.options.debounceTime ?? 0)) {
                        handleSelection(navState, contextManager);
                        eventState.lastButtonPress = currentTimestamp;
                    }
                }

                // Handle back button (B/Circle) - Button index 1
                if (navState.options.enableBackButton) {
                    const backPressed = gp.buttons[1]?.pressed || false;
                    if (backPressed && !eventState.lastBackButtonState) {
                        if (currentTimestamp - eventState.lastBackTime > 300) {
                            handleBackButton(eventState.onBackButton);
                            eventState.lastBackTime = currentTimestamp;
                        }
                    }
                    eventState.lastBackButtonState = backPressed;
                }

                // Handle shoulder buttons (R1/L1) - Button indices 5 and 4
                if (navState.options.enableShoulderNavigation) {
                    const r1Pressed = gp.buttons[5]?.pressed || false;
                    const l1Pressed = gp.buttons[4]?.pressed || false;

                    if (r1Pressed && !eventState.lastR1State) {
                        if (currentTimestamp - eventState.lastShoulderTime > 300) {
                            handleShoulderNavigation(navState, 'R1', contextManager, eventState.onNavigationMenuOpen);
                            eventState.lastShoulderTime = currentTimestamp;
                        }
                    }

                    if (l1Pressed && !eventState.lastL1State) {
                        if (currentTimestamp - eventState.lastShoulderTime > 300) {
                            handleShoulderNavigation(navState, 'L1', contextManager, eventState.onNavigationMenuOpen);
                            eventState.lastShoulderTime = currentTimestamp;
                        }
                    }

                    eventState.lastR1State = r1Pressed;
                    eventState.lastL1State = l1Pressed;
                }

                // Handle navigation inputs
                let moved = false;

                // Analog stick navigation
                const leftStickX = applyDeadzone(gp.axes[0], navState.options.deadzone);
                const leftStickY = applyDeadzone(gp.axes[1], navState.options.deadzone);

                if (Math.abs(leftStickX) > 0 || Math.abs(leftStickY) > 0) {
                    if (currentTimestamp - eventState.lastAxisMove > (navState.options.debounceTime ?? 0)) {
                        if (Math.abs(leftStickX) > Math.abs(leftStickY)) {
                            handleNavigation(navState, leftStickX > 0 ? 'right' : 'left', contextManager, updateFocusCallback);
                        } else {
                            handleNavigation(navState, leftStickY > 0 ? 'down' : 'up', contextManager, updateFocusCallback);
                        }
                        moved = true;
                        eventState.lastAxisMove = currentTimestamp;
                    }
                }

                // Right stick scrolling
                if (navState.options.enableRightStickScroll) {
                    const rightStickX = applyDeadzone(gp.axes[2] || 0, navState.options.deadzone);
                    const rightStickY = applyDeadzone(gp.axes[3] || 0, navState.options.deadzone);

                    if (Math.abs(rightStickX) > 0 || Math.abs(rightStickY) > 0) {
                        if (currentTimestamp - eventState.lastScrollTime > (navState.options.scrollDebounceTime ?? 50)) {
                            const scrollSpeed = navState.options.scrollSpeed ?? 1;

                            // Use the dedicated scrolling function
                            handleScrolling(rightStickX, rightStickY, scrollSpeed);

                            eventState.lastScrollTime = currentTimestamp;
                        }
                    }
                }

                // D-pad navigation
                const dpadIndices = getDpadIndices(eventState.currentControllerType as ControllerType);

                if (gp.buttons[dpadIndices.up] && gp.buttons[dpadIndices.up].pressed) {
                    if (currentTimestamp - eventState.lastButtonPress > (navState.options.debounceTime ?? 0)) {
                        handleNavigation(navState, 'up', contextManager, updateFocusCallback);
                        moved = true;
                        eventState.lastButtonPress = currentTimestamp;
                    }
                }

                if (gp.buttons[dpadIndices.down] && gp.buttons[dpadIndices.down].pressed) {
                    if (currentTimestamp - eventState.lastButtonPress > (navState.options.debounceTime ?? 0)) {
                        handleNavigation(navState, 'down', contextManager, updateFocusCallback);
                        moved = true;
                        eventState.lastButtonPress = currentTimestamp;
                    }
                }

                if (gp.buttons[dpadIndices.left] && gp.buttons[dpadIndices.left].pressed) {
                    if (currentTimestamp - eventState.lastButtonPress > (navState.options.debounceTime ?? 0)) {
                        handleNavigation(navState, 'left', contextManager, updateFocusCallback);
                        moved = true;
                        eventState.lastButtonPress = currentTimestamp;
                    }
                }

                if (gp.buttons[dpadIndices.right] && gp.buttons[dpadIndices.right].pressed) {
                    if (currentTimestamp - eventState.lastButtonPress > (navState.options.debounceTime ?? 0)) {
                        handleNavigation(navState, 'right', contextManager, updateFocusCallback);
                        moved = true;
                        eventState.lastButtonPress = currentTimestamp;
                    }
                }
            }
        }


        /**
         * Schedule the next animation frame and store its ID for cleanup
         * @type {number} The ID returned by requestAnimationFrame
         */
        eventState.animationFrameId = requestAnimationFrame(gameLoopImpl);
    };
}

/**
 * Creates a custom game loop implementation for custom events mode.
 * Instead of polling navigator.getGamepads(), relies on custom state change events.
 * @param eventState - The current gamepad event state containing button states and callbacks
 * @param navState - The current navigation state containing focused elements and options
 * @param contextManager - Optional context manager for dual context navigation mode
 * @param updateFocusCallback - Optional callback function to run after focus is updated
 * @returns A function that implements the custom events game loop logic
 */
export function createCustomEventGameLoop(
    eventState: GamepadEventState, 
    navState: NavigationState,
    contextManager?: any,
    updateFocusCallback?: () => void
): () => void {
    /**
     * Custom events game loop implementation that processes gamepad state from custom events.
     * @returns {void}
     */
    return function customEventGameLoopImpl(): void {
        // Check if loop should continue running
        if (!eventState.isRunning) {
            eventState.animationFrameId = null;
            return;
        }

        const currentTimestamp = performance.now();
        
        // Process gamepads from custom events (stored in eventState.gamepads)
        for (const gamepadIndex in eventState.gamepads) {
            const gp = eventState.gamepads[gamepadIndex];
            if (gp && isValidGamepad(gp)) {
                // --- Button event handling ---
                if (!eventState.lastButtonStates) eventState.lastButtonStates = {};
                if (!eventState.lastButtonStates[gp.index]) {
                    eventState.lastButtonStates[gp.index] = gp.buttons.map(b => b.pressed);
                }
                const prevStates = eventState.lastButtonStates[gp.index];
                for (let i = 0; i < gp.buttons.length; i++) {
                    const prev = prevStates[i] || false;
                    const curr = gp.buttons[i].pressed;
                    if (curr && !prev && typeof eventState.onButtonDown === 'function') {
                        eventState.onButtonDown(i, gp);
                    }
                    if (!curr && prev && typeof eventState.onButtonUp === 'function') {
                        eventState.onButtonUp(i, gp);
                    }
                    prevStates[i] = curr;
                }

                // Update controller type if changed
                const detectedType = detectControllerType(gp);
                if (detectedType !== eventState.currentControllerType) {
                    eventState.currentControllerType = detectedType;
                    updateStatus(navState, eventState.gamepads, eventState.currentControllerType);
                }

                // Handle primary action button (A/X/Cross)
                const primaryButtonIndex = getPrimaryActionButtonIndex(eventState.currentControllerType as ControllerType);
                if (gp.buttons[primaryButtonIndex] && gp.buttons[primaryButtonIndex].pressed) {
                    if (currentTimestamp - eventState.lastButtonPress > (navState.options.debounceTime ?? 0)) {
                        handleSelection(navState, contextManager);
                        eventState.lastButtonPress = currentTimestamp;
                    }
                }

                // Handle back button (B/Circle) - Button index 1
                if (navState.options.enableBackButton) {
                    const backPressed = gp.buttons[1]?.pressed || false;
                    if (backPressed && !eventState.lastBackButtonState) {
                        if (currentTimestamp - eventState.lastBackTime > 300) {
                            handleBackButton(eventState.onBackButton);
                            eventState.lastBackTime = currentTimestamp;
                        }
                    }
                    eventState.lastBackButtonState = backPressed;
                }

                // Handle shoulder buttons (R1/L1) for navigation menu
                if (navState.options.enableShoulderNavigation) {
                    const r1Pressed = gp.buttons[5]?.pressed || false;
                    const l1Pressed = gp.buttons[4]?.pressed || false;

                    if ((r1Pressed && !eventState.lastR1State) || (l1Pressed && !eventState.lastL1State)) {
                        if (currentTimestamp - eventState.lastShoulderTime > 300) {
                            const button = r1Pressed ? 'R1' : 'L1';
                            handleShoulderNavigation(navState, contextManager, button);
                            eventState.lastShoulderTime = currentTimestamp;
                        }
                    }

                    eventState.lastR1State = r1Pressed;
                    eventState.lastL1State = l1Pressed;
                }

                // Handle D-pad and analog stick navigation
                const dpadIndices = getDpadIndices(eventState.currentControllerType as ControllerType);
                let navigationHandled = false;

                // D-pad navigation
                if (dpadIndices.up !== -1 && gp.buttons[dpadIndices.up]?.pressed) {
                    if (currentTimestamp - eventState.lastAxisMove > (navState.options.debounceTime ?? 0)) {
                        if (contextManager) {
                            navigationHandled = contextManager.handleStickNavigation('up');
                        } else {
                            if (navState.options.navigationMode === 'grid') {
                                navigateGrid(navState, 'up', updateFocusCallback || (() => {}));
                            } else {
                                navigateSpatial(navState, 'up', updateFocusCallback || (() => {}));
                            }
                            navigationHandled = true;
                        }
                        if (navigationHandled) {
                            eventState.lastAxisMove = currentTimestamp;
                        }
                    }
                } else if (dpadIndices.down !== -1 && gp.buttons[dpadIndices.down]?.pressed) {
                    if (currentTimestamp - eventState.lastAxisMove > (navState.options.debounceTime ?? 0)) {
                        if (contextManager) {
                            navigationHandled = contextManager.handleStickNavigation('down');
                        } else {
                            if (navState.options.navigationMode === 'grid') {
                                navigateGrid(navState, 'down', updateFocusCallback || (() => {}));
                            } else {
                                navigateSpatial(navState, 'down', updateFocusCallback || (() => {}));
                            }
                            navigationHandled = true;
                        }
                        if (navigationHandled) {
                            eventState.lastAxisMove = currentTimestamp;
                        }
                    }
                } else if (dpadIndices.left !== -1 && gp.buttons[dpadIndices.left]?.pressed) {
                    if (currentTimestamp - eventState.lastAxisMove > (navState.options.debounceTime ?? 0)) {
                        if (contextManager) {
                            navigationHandled = contextManager.handleStickNavigation('left');
                        } else {
                            if (navState.options.navigationMode === 'grid') {
                                navigateGrid(navState, 'left', updateFocusCallback || (() => {}));
                            } else {
                                navigateSpatial(navState, 'left', updateFocusCallback || (() => {}));
                            }
                            navigationHandled = true;
                        }
                        if (navigationHandled) {
                            eventState.lastAxisMove = currentTimestamp;
                        }
                    }
                } else if (dpadIndices.right !== -1 && gp.buttons[dpadIndices.right]?.pressed) {
                    if (currentTimestamp - eventState.lastAxisMove > (navState.options.debounceTime ?? 0)) {
                        if (contextManager) {
                            navigationHandled = contextManager.handleStickNavigation('right');
                        } else {
                            if (navState.options.navigationMode === 'grid') {
                                navigateGrid(navState, 'right', updateFocusCallback || (() => {}));
                            } else {
                                navigateSpatial(navState, 'right', updateFocusCallback || (() => {}));
                            }
                            navigationHandled = true;
                        }
                        if (navigationHandled) {
                            eventState.lastAxisMove = currentTimestamp;
                        }
                    }
                }

                // Left analog stick navigation (if D-pad didn't handle it)
                if (!navigationHandled) {
                    const leftStickX = applyDeadzone(gp.axes[0] || 0, navState.options.deadzone ?? 0.1);
                    const leftStickY = applyDeadzone(gp.axes[1] || 0, navState.options.deadzone ?? 0.1);

                    if (Math.abs(leftStickX) > 0 || Math.abs(leftStickY) > 0) {
                        if (currentTimestamp - eventState.lastAxisMove > (navState.options.debounceTime ?? 0)) {
                            let direction: string | null = null;

                            if (Math.abs(leftStickX) > Math.abs(leftStickY)) {
                                direction = leftStickX > 0 ? 'right' : 'left';
                            } else {
                                direction = leftStickY > 0 ? 'down' : 'up';
                            }

                            if (direction) {
                                if (contextManager) {
                                    navigationHandled = contextManager.handleStickNavigation(direction);
                                } else {
                                    if (navState.options.navigationMode === 'grid') {
                                        navigateGrid(navState, direction, updateFocusCallback || (() => {}));
                                    } else {
                                        navigateSpatial(navState, direction, updateFocusCallback || (() => {}));
                                    }
                                    navigationHandled = true;
                                }
                                if (navigationHandled) {
                                    eventState.lastAxisMove = currentTimestamp;
                                }
                            }
                        }
                    }
                }

                // Handle right stick scrolling if enabled
                if (navState.options.enableRightStickScroll) {
                    const rightStickX = applyDeadzone(gp.axes[2] || 0, navState.options.deadzone ?? 0.1);
                    const rightStickY = applyDeadzone(gp.axes[3] || 0, navState.options.deadzone ?? 0.1);

                    if (Math.abs(rightStickX) > 0 || Math.abs(rightStickY) > 0) {
                        if (currentTimestamp - eventState.lastScrollTime > (navState.options.scrollDebounceTime ?? 50)) {
                            handleScrolling(rightStickX, rightStickY, navState.options.scrollSpeed ?? 1);
                            eventState.lastScrollTime = currentTimestamp;
                        }
                    }
                }

                break; // Handle only the first valid gamepad
            }
        }

        // Schedule next frame
        eventState.animationFrameId = requestAnimationFrame(customEventGameLoopImpl);
    };
}