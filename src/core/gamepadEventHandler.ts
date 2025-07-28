import { navigateGrid, navigateSpatial, handleSelection, handleBackButton, handleShoulderNavigation, updateStatus, handleScrolling } from './gamepadNavigation.js';
import { isValidGamepad, detectControllerType, applyDeadzone } from '../utils/controllerUtils.js';
import { getPrimaryActionButtonIndex, getDpadIndices } from '../controllerMappings.js';
import { updateStatusElement } from '../utils/domUtils.js';
import type { ControllerType } from '../Interfaces/ControllerMappings.js';
import type { NavigationState } from '../Interfaces/NavigationState.js';
import { GamepadEventState, GamepadEvent } from '../Interfaces/GamepadEvents.js';



/**
 * Sets up event listeners for gamepad connection events and detects existing gamepads
 * @param state - The current gamepad event state object
 * @param handleGamepadConnected - The callback function for gamepad connected events
 * @param handleGamepadDisconnected - The callback function for gamepad disconnected events
 */
export function setupEventListeners(
    state: GamepadEventState, 
    handleGamepadConnected: (event: GamepadEvent) => void,
    handleGamepadDisconnected: (event: GamepadEvent) => void
) {
    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    // Check for already connected gamepads
    detectExistingGamepads(state);
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