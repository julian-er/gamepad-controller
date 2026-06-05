import {
    handleSelection,
    handleBackButton,
    handleShoulderNavigation,
    handleNavigation,
    updateStatus,
    updateGamepadStatus,
    handleScrolling,
} from './gamepadNavigation.js';
import { isValidGamepad, detectControllerType, applyDeadzone } from '../utils/controllerUtils.js';
import {
    getPrimaryActionButtonIndex,
    getBackButtonIndex,
    getShoulderIndices,
    getDpadIndices,
} from '../controllerMappings.js';
import { logger } from '../utils/logger.js';
import type { ControllerType } from '../Interfaces/ControllerMappings.js';
import type { NavigationState } from '../Interfaces/NavigationState.js';
import type { GamepadEventState, GamepadEvent, PadInputState } from '../Interfaces/GamepadEvents.js';
import type { GamepadServiceOptions } from '../Interfaces/GamepadServiceOptions.js';
import type { GamepadContextManager } from '../gamepadContextManager.js';

/** Default cooldown (ms) for back/shoulder edge-triggered actions. */
const DEFAULT_ACTION_COOLDOWN = 300;

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
        // Native browser gamepad API requires the Gamepad API to be present.
        if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
            logger.warn('Gamepad API not available in this environment; navigation will be inactive.');
            return;
        }
        // Setup native browser gamepad event listeners
        window.addEventListener('gamepadconnected', handleGamepadConnected as EventListener);
        window.addEventListener('gamepaddisconnected', handleGamepadDisconnected as EventListener);

        // Check for already connected gamepads
        detectExistingGamepads(state);
    }
}

/**
 * Sets up custom DOM event listeners for gamepad events (WinUI integration).
 * Listens to custom events instead of native browser gamepad APIs.
 *
 * Listener references are stored on `state.customListeners` so they can be removed
 * again in {@link removeEventListeners} — anonymous listeners would otherwise leak
 * across destroy()/re-init() cycles.
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

    logger.info(`Setting up custom event listeners: ${connectedEvent}, ${disconnectedEvent}, ${stateChangedEvent}`);

    const onConnected = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail && customEvent.detail.gamepad) {
            handleGamepadConnected(createMockGamepadEvent(customEvent.detail.gamepad));
        }
    };

    const onDisconnected = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail && customEvent.detail.gamepad) {
            handleGamepadDisconnected(createMockGamepadEvent(customEvent.detail.gamepad));
        }
    };

    const onStateChanged = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail && customEvent.detail.gamepad) {
            const gamepad = customEvent.detail.gamepad;
            if (isValidGamepad(gamepad)) {
                state.gamepads[gamepad.index || 0] = gamepad;
            }
        }
    };

    window.addEventListener(connectedEvent, onConnected);
    window.addEventListener(disconnectedEvent, onDisconnected);
    window.addEventListener(stateChangedEvent, onStateChanged);

    // Store references so removeEventListeners() can detach them.
    state.customListeners = {
        connectedEvent,
        disconnectedEvent,
        stateChangedEvent,
        onConnected,
        onDisconnected,
        onStateChanged,
    };

    logger.info('Custom event listeners initialized for WinUI integration');
}

/**
 * Lightweight internal event interface used by the gamepad handlers. The handlers
 * only ever read `event.gamepad`, so we no longer fabricate a full 25-property
 * `GamepadEvent` mock.
 */
function createMockGamepadEvent(gamepad: Gamepad): GamepadEvent {
    return { gamepad } as GamepadEvent;
}

/**
 * Detects and initializes gamepads that are already connected when the page loads
 * @param state - The current gamepad event state object to update with detected gamepads
 */
export function detectExistingGamepads(state: GamepadEventState) {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return;
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i];
        if (gamepad && isValidGamepad(gamepad)) {
            logger.info(`Detected already connected gamepad: ${gamepad.id}`);

            state.gamepads[gamepad.index] = gamepad;
            state.currentControllerType = detectControllerType(gamepad);

            updateGamepadStatus(state.statusElementId, state.gamepads);

            if (state.onControllerConnect) {
                state.onControllerConnect(gamepad);
            }

            break; // Handle the first one
        }
    }
}

/**
 * Removes all event listeners registered by {@link setupEventListeners}, covering
 * both the native and custom-event modes.
 * @param state - The current gamepad event state object (holds custom listener refs)
 * @param handleGamepadConnected - The native connected handler to detach
 * @param handleGamepadDisconnected - The native disconnected handler to detach
 */
export function removeEventListeners(
    state: GamepadEventState,
    handleGamepadConnected: (event: GamepadEvent) => void,
    handleGamepadDisconnected: (event: GamepadEvent) => void
) {
    // Native listeners
    window.removeEventListener('gamepadconnected', handleGamepadConnected as EventListener);
    window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected as EventListener);

    // Custom-event listeners (if custom mode was used)
    const custom = state.customListeners;
    if (custom) {
        window.removeEventListener(custom.connectedEvent, custom.onConnected);
        window.removeEventListener(custom.disconnectedEvent, custom.onDisconnected);
        window.removeEventListener(custom.stateChangedEvent, custom.onStateChanged);
        state.customListeners = null;
    }
}

/**
 * Handles a gamepad connected event by validating the gamepad, updating state, and triggering callbacks
 * @param state - The current gamepad event state object
 * @param event - The gamepad connected event containing the gamepad that was connected
 */
export function handleGamepadConnected(state: GamepadEventState, event: GamepadEvent) {
    const gamepad = event.gamepad;

    if (isValidGamepad(gamepad)) {
        state.gamepads[gamepad.index] = gamepad;
        state.currentControllerType = detectControllerType(gamepad);

        logger.info(`Gamepad connected: ${gamepad.id} (${state.currentControllerType})`);

        updateGamepadStatus(state.statusElementId, state.gamepads);

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
        delete state.padInputStates[gamepad.index];
        logger.info(`Gamepad disconnected: ${gamepad.id}`);

        // Reflect any controllers that are still connected (or the waiting state).
        updateGamepadStatus(state.statusElementId, state.gamepads);

        if (state.onControllerDisconnect) {
            state.onControllerDisconnect(gamepad);
        }
    }
}

/**
 * Starts the game loop for gamepad event handling
 * @param state - The current gamepad event state object
 * @param gameLoopImpl - The game loop function to execute each frame
 */
export function startGameLoop(state: GamepadEventState, gameLoopImpl: () => void) {
    // Stop any existing game loop first
    stopGameLoop(state);

    state.isRunning = true;
    gameLoopImpl();
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
 * Drops gamepads (and their per-pad state) that are no longer present in the live set.
 * Guards against missed `gamepaddisconnected` events leaving stale entries that would
 * skew {@link getConnectedControllerTypes}.
 * @param eventState - The shared gamepad event state to prune
 * @param liveIndices - Set of gamepad indices seen this frame
 * @returns `true` if any entry was removed
 */
function pruneDisconnectedPads(eventState: GamepadEventState, liveIndices: Set<number>): boolean {
    let removed = false;
    for (const key of Object.keys(eventState.gamepads)) {
        if (!liveIndices.has(Number(key))) {
            delete eventState.gamepads[key];
            delete eventState.padInputStates[Number(key)];
            removed = true;
        }
    }
    return removed;
}

/**
 * Returns the per-gamepad input state for `gp`, creating and seeding it on first use.
 * Each connected controller gets its own edge/cooldown record so that several pads can
 * be processed in the same frame without clobbering one another's state.
 * @param eventState - The shared gamepad event state
 * @param gp - The gamepad whose per-pad state is needed
 */
function getPadState(eventState: GamepadEventState, gp: Gamepad): PadInputState {
    if (!eventState.padInputStates) eventState.padInputStates = {};
    let pad = eventState.padInputStates[gp.index];
    if (!pad) {
        pad = {
            lastButtonPress: 0,
            lastAxisMove: 0,
            lastBackButtonState: false,
            lastBackTime: 0,
            lastR1State: false,
            lastL1State: false,
            lastShoulderTime: 0,
            lastScrollTime: 0,
            // Seed from the current frame so a button already held at connect time
            // doesn't fire a spurious down-edge.
            lastButtonStates: gp.buttons.map((b) => b.pressed),
        };
        eventState.padInputStates[gp.index] = pad;
    }
    return pad;
}

/**
 * Processes a single gamepad's input for one frame. This is the single source of
 * truth for input handling shared by both the native polling loop and the
 * custom-event loop — the only difference between those modes is where `gp` comes
 * from (live poll vs. event snapshot), not how it is interpreted.
 *
 * All edge-detection flags and cooldown timestamps are kept per-gamepad (keyed by
 * `gp.index` on {@link GamepadEventState.padInputStates}), so multiple controllers can
 * drive the same shared navigation cursor without interfering with each other. Button
 * mapping uses each pad's own detected type (important for Nintendo's swapped A/B).
 *
 * @param gp - The gamepad to read this frame
 * @param eventState - Mutable event state (per-pad timers, shared callbacks)
 * @param navState - Navigation state (focused element, options)
 * @param currentTimestamp - `performance.now()` for the current frame
 * @param contextManager - Optional context manager for dual-context mode
 * @param updateFocusCallback - Optional callback invoked after focus changes
 */
export function processGamepad(
    gp: Gamepad,
    eventState: GamepadEventState,
    navState: NavigationState,
    currentTimestamp: number,
    contextManager?: GamepadContextManager,
    updateFocusCallback?: () => void
): void {
    const options = navState.options;
    const debounceTime = options.debounceTime ?? 0;
    const pad = getPadState(eventState, gp);

    // Tracks whether this pad produced any input this frame (drives "most-recently-active").
    let hadInput = false;

    // --- Generic per-button edge detection (onButtonDown / onButtonUp) ---
    const prevStates = pad.lastButtonStates;
    for (let i = 0; i < gp.buttons.length; i++) {
        const prev = prevStates[i] || false;
        const curr = gp.buttons[i]?.pressed ?? false;
        if (curr) hadInput = true;
        if (curr && !prev && typeof eventState.onButtonDown === 'function') {
            eventState.onButtonDown(i, gp);
        }
        if (!curr && prev && typeof eventState.onButtonUp === 'function') {
            eventState.onButtonUp(i, gp);
        }
        prevStates[i] = curr;
    }

    // --- Controller type detection (per pad; each pad maps by its own type) ---
    const controllerType = detectControllerType(gp) as ControllerType;

    // --- Primary action button (A / X / Cross) ---
    const primaryButtonIndex = getPrimaryActionButtonIndex(controllerType);
    if (gp.buttons[primaryButtonIndex]?.pressed) {
        if (currentTimestamp - pad.lastButtonPress > debounceTime) {
            handleSelection(navState, contextManager);
            pad.lastButtonPress = currentTimestamp;
        }
    }

    // --- Back button (B / Circle) ---
    if (options.enableBackButton) {
        const backCooldown = options.backButtonCooldown ?? DEFAULT_ACTION_COOLDOWN;
        const backIndex = getBackButtonIndex(controllerType);
        const backPressed = gp.buttons[backIndex]?.pressed ?? false;
        if (backPressed && !pad.lastBackButtonState) {
            if (currentTimestamp - pad.lastBackTime > backCooldown) {
                handleBackButton(eventState.onBackButton);
                pad.lastBackTime = currentTimestamp;
            }
        }
        pad.lastBackButtonState = backPressed;
    }

    // --- Shoulder buttons (R1 / L1) ---
    if (options.enableShoulderNavigation) {
        const shoulderCooldown = options.shoulderCooldown ?? DEFAULT_ACTION_COOLDOWN;
        const { l1, r1 } = getShoulderIndices(controllerType);
        const r1Pressed = gp.buttons[r1]?.pressed ?? false;
        const l1Pressed = gp.buttons[l1]?.pressed ?? false;

        const r1Edge = r1Pressed && !pad.lastR1State;
        const l1Edge = l1Pressed && !pad.lastL1State;
        if (r1Edge || l1Edge) {
            if (currentTimestamp - pad.lastShoulderTime > shoulderCooldown) {
                // r1 takes priority if both edges fire on the same frame.
                const button = r1Edge ? 'R1' : 'L1';
                // Correct argument order: (state, button, contextManager, onNavigationMenuOpen).
                handleShoulderNavigation(navState, button, contextManager, eventState.onNavigationMenuOpen);
                pad.lastShoulderTime = currentTimestamp;
            }
        }

        pad.lastR1State = r1Pressed;
        pad.lastL1State = l1Pressed;
    }

    // --- Directional navigation: D-pad takes priority, left stick is the fallback ---
    if (currentTimestamp - pad.lastAxisMove > debounceTime) {
        const dpad = getDpadIndices(controllerType);
        let direction: 'up' | 'down' | 'left' | 'right' | null = null;

        if (gp.buttons[dpad.up]?.pressed) direction = 'up';
        else if (gp.buttons[dpad.down]?.pressed) direction = 'down';
        else if (gp.buttons[dpad.left]?.pressed) direction = 'left';
        else if (gp.buttons[dpad.right]?.pressed) direction = 'right';

        if (!direction) {
            const leftStickX = applyDeadzone(gp.axes[0] ?? 0, options.deadzone);
            const leftStickY = applyDeadzone(gp.axes[1] ?? 0, options.deadzone);
            if (Math.abs(leftStickX) > 0 || Math.abs(leftStickY) > 0) {
                direction =
                    Math.abs(leftStickX) > Math.abs(leftStickY)
                        ? leftStickX > 0
                            ? 'right'
                            : 'left'
                        : leftStickY > 0
                          ? 'down'
                          : 'up';
            }
        }

        if (direction) {
            handleNavigation(navState, direction, contextManager, updateFocusCallback);
            pad.lastAxisMove = currentTimestamp;
            hadInput = true;
        }
    }

    // --- Right stick scrolling ---
    if (options.enableRightStickScroll) {
        const rightStickX = applyDeadzone(gp.axes[2] ?? 0, options.deadzone);
        const rightStickY = applyDeadzone(gp.axes[3] ?? 0, options.deadzone);

        if (Math.abs(rightStickX) > 0 || Math.abs(rightStickY) > 0) {
            hadInput = true;
            if (currentTimestamp - pad.lastScrollTime > (options.scrollDebounceTime ?? 50)) {
                handleScrolling(rightStickX, rightStickY, options.scrollSpeed ?? 1, options.containerSelector);
                pad.lastScrollTime = currentTimestamp;
            }
        }
    }

    // --- Most-recently-active controller (drives status label / getControllerType) ---
    if (hadInput && controllerType !== eventState.currentControllerType) {
        eventState.currentControllerType = controllerType;
        updateStatus(navState, eventState.gamepads, eventState.currentControllerType);
    }
}

/**
 * Creates the native game loop, which polls `navigator.getGamepads()` each frame
 * and delegates input handling to the shared {@link processGamepad}.
 * @param eventState - The current gamepad event state
 * @param navState - The current navigation state
 * @param contextManager - Optional context manager for dual context navigation mode
 * @param updateFocusCallback - Optional callback function to run after focus is updated
 * @returns A function that implements the game loop logic
 */
export function gameLoop(
    eventState: GamepadEventState,
    navState: NavigationState,
    contextManager?: GamepadContextManager,
    updateFocusCallback?: () => void
): () => void {
    return function gameLoopImpl(): void {
        if (!eventState.isRunning) {
            eventState.animationFrameId = null;
            return;
        }

        const currentTimestamp = performance.now();
        const connectedGamepads = navigator.getGamepads();

        // Process EVERY valid controller so that any connected pad can drive the shared
        // navigation cursor (couch / hand-off model). Per-pad state in processGamepad keeps
        // them from clobbering each other. A frozen "ghost" duplicate entry (common with
        // Bluetooth DualShock/DualSense) reports all-buttons-unpressed, so it's a harmless
        // no-op rather than swallowing input the way "process only the first pad" did.
        const seen = new Set<number>();
        for (const gp of connectedGamepads) {
            if (!gp || !isValidGamepad(gp)) continue;
            eventState.gamepads[gp.index] = gp;
            seen.add(gp.index);
            processGamepad(gp, eventState, navState, currentTimestamp, contextManager, updateFocusCallback);
        }

        // Prune slots that vanished from getGamepads() (e.g. a missed disconnect event) so
        // the connected-types list and per-pad state stay accurate.
        if (pruneDisconnectedPads(eventState, seen)) {
            updateStatus(navState, eventState.gamepads, eventState.currentControllerType);
        }

        eventState.animationFrameId = requestAnimationFrame(gameLoopImpl);
    };
}

/**
 * Creates the custom-events game loop. Instead of polling the browser, it reads
 * the latest gamepad snapshots stored on `eventState.gamepads` (populated by the
 * `statechanged` custom event) and delegates to the shared {@link processGamepad}.
 * @param eventState - The current gamepad event state
 * @param navState - The current navigation state
 * @param contextManager - Optional context manager for dual context navigation mode
 * @param updateFocusCallback - Optional callback function to run after focus is updated
 * @returns A function that implements the custom events game loop logic
 */
export function createCustomEventGameLoop(
    eventState: GamepadEventState,
    navState: NavigationState,
    contextManager?: GamepadContextManager,
    updateFocusCallback?: () => void
): () => void {
    return function customEventGameLoopImpl(): void {
        if (!eventState.isRunning) {
            eventState.animationFrameId = null;
            return;
        }

        const currentTimestamp = performance.now();

        // Process every valid gamepad snapshot so multiple host-fed controllers all drive
        // the shared cursor, consistent with the native loop. Per-pad state keeps them apart.
        for (const gamepadIndex in eventState.gamepads) {
            const gp = eventState.gamepads[gamepadIndex];
            if (gp && isValidGamepad(gp)) {
                processGamepad(gp, eventState, navState, currentTimestamp, contextManager, updateFocusCallback);
            }
        }

        eventState.animationFrameId = requestAnimationFrame(customEventGameLoopImpl);
    };
}
