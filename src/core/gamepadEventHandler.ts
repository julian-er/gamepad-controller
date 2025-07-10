// gamepadEventHandler.ts
// Event handling and game loop for gamepad input

import { CONTROLLER_MAPPINGS, getPrimaryActionButtonIndex, getDpadIndices } from '../controllerMappings.js';
import { isValidGamepad, detectControllerType, applyDeadzone } from '../utils/controllerUtils.js';
import { handleSelection, handleBackButton, handleShoulderNavigation, updateStatus, navigateGrid, navigateSpatial } from './gamepadNavigation.js';
import type { GamepadServiceOptions } from '../Interfaces/GamepadServiceOptions.js';
import type { ControllerType } from '../Interfaces/ControllerMappings.js';
import type { NavigationState } from './gamepadNavigation.js';

export interface GamepadEventState {
    isRunning: boolean;
    gamepads: { [key: string]: Gamepad };
    currentControllerType: string;
    lastButtonPress: number;
    lastAxisMove: number;
    lastBackButtonState: boolean;
    lastBackTime: number;
    lastR1State: boolean;
    lastL1State: boolean;
    lastShoulderTime: number;
    onControllerConnect: ((gamepad: Gamepad) => void) | null;
    onControllerDisconnect: ((gamepad: Gamepad) => void) | null;
    onNavigationMenuOpen: ((button: string) => void) | null;
    onBackButton: (() => void) | null;
}

// Setup event listeners for gamepad connection
export function setupEventListeners(
    state: GamepadEventState, 
    handleGamepadConnected: (event: GamepadEvent) => void,
    handleGamepadDisconnected: (event: GamepadEvent) => void
) {
    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);
}

// Remove event listeners
export function removeEventListeners(
    handleGamepadConnected: (event: GamepadEvent) => void,
    handleGamepadDisconnected: (event: GamepadEvent) => void
) {
    window.removeEventListener('gamepadconnected', handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
}

// Handle gamepad connected event
export function handleGamepadConnected(state: GamepadEventState, event: GamepadEvent) {
    const gamepad = event.gamepad;
    
    if (isValidGamepad(gamepad)) {
        state.gamepads[gamepad.index] = gamepad;
        
        const detectedType = detectControllerType(gamepad);
        state.currentControllerType = detectedType;
        
        console.log(`Gamepad connected: ${gamepad.id} (${state.currentControllerType})`);
        
        if (state.onControllerConnect) {
            state.onControllerConnect(gamepad);
        }
    }
}

// Handle gamepad disconnected event
export function handleGamepadDisconnected(state: GamepadEventState, event: GamepadEvent) {
    const gamepad = event.gamepad;
    
    if (state.gamepads[gamepad.index]) {
        delete state.gamepads[gamepad.index];
        console.log(`Gamepad disconnected: ${event.gamepad.id}`);
        
        if (state.onControllerDisconnect) {
            state.onControllerDisconnect(gamepad);
        }
    }
}

// Handle navigation input with enhanced functionality
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
        // Legacy mode
        if (navState.options.navigationMode === 'spatial') {
            navigateSpatial(navState, direction, updateFocusCallback || (() => {}));
        } else {
            navigateGrid(navState, direction, updateFocusCallback || (() => {}));
        }
    }
}

// Start the game loop
export function startGameLoop(state: GamepadEventState, gameLoop: () => void) {
    state.isRunning = true;
    gameLoop();
}

// Main game loop with enhanced navigation support
export function gameLoop(
    eventState: GamepadEventState, 
    navState: NavigationState,
    contextManager?: any,
    updateFocusCallback?: () => void
): () => void {
    return function gameLoopImpl() {
        if (!eventState.isRunning) return;

        const currentTimestamp = performance.now();
        const connectedGamepads = navigator.getGamepads();

        for (const gp of connectedGamepads) {
            if (gp && isValidGamepad(gp)) {
                eventState.gamepads[gp.index] = gp;
                
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

        requestAnimationFrame(gameLoopImpl);
    };
} 