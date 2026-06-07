// GamepadEvent interface for typed gamepad events
export interface GamepadEvent extends Event {
    gamepad: Gamepad;
}

/**
 * Per-gamepad input tracking. Each connected controller keeps its own edge-detection
 * flags and cooldown timestamps so that processing several pads in the same frame can't
 * clobber one another (e.g. an idle pad resetting the active pad's back-button edge).
 * Keyed by `gamepad.index` on {@link GamepadEventState.padInputStates}.
 */
export interface PadInputState {
    /** Timestamp of the last primary-button (A/Cross/X) selection. */
    lastButtonPress: number;
    /** Timestamp of the last directional navigation move. */
    lastAxisMove: number;
    /** Whether the back button (B/Circle) was pressed on the previous frame. */
    lastBackButtonState: boolean;
    /** Timestamp of the last back-button activation (for cooldown). */
    lastBackTime: number;
    /** Whether R1 was pressed on the previous frame. */
    lastR1State: boolean;
    /** Whether L1 was pressed on the previous frame. */
    lastL1State: boolean;
    /** Timestamp of the last shoulder activation (for cooldown). */
    lastShoulderTime: number;
    /** Timestamp of the last right-stick scroll step. */
    lastScrollTime: number;
    /** Pressed state of every button on the previous frame (for onButtonDown/Up edges). */
    lastButtonStates: boolean[];
}

export interface GamepadEventState {
    isRunning: boolean;
    gamepads: { [key: string]: Gamepad };
    /** Type of the most-recently-active controller (for status / getControllerType back-compat). */
    currentControllerType: string;
    /** Per-gamepad input edge/cooldown state, keyed by gamepad.index. */
    padInputStates: { [gamepadIndex: number]: PadInputState };
    // Add animation frame ID for proper cleanup
    animationFrameId: number | null;
    // Add statusElementId for UI updates
    statusElementId: string | null;
    onControllerConnect: ((gamepad: Gamepad) => void) | null;
    onControllerDisconnect: ((gamepad: Gamepad) => void) | null;
    onNavigationMenuOpen: ((button: string) => void) | null;
    onBackButton: (() => void) | null;
    onNavigationRequest: ((href: string, element: Element) => void) | null;
    // New: generic button event handlers
    onButtonDown?: (buttonIndex: number, gamepad: Gamepad) => void;
    onButtonUp?: (buttonIndex: number, gamepad: Gamepad) => void;
    /**
     * Invoked when the Gamepad API is blocked at runtime (e.g. `navigator.getGamepads()`
     * throws `SecurityError` under `Permissions-Policy: gamepad`). Surfaced to consumers
     * via the `gamepaderror` service event.
     */
    onError?: (error: Error) => void;
    /**
     * Set once `navigator.getGamepads()` has thrown so the polling loop warns/emits a single
     * time instead of every frame. The rAF loop keeps running — policy may be granted later.
     */
    hasWarnedPolicyBlocked?: boolean;
    /** The rAF game-loop function; stored here so connect/disconnect handlers can restart it. */
    gameLoopFn?: (() => void) | null;
    // Custom-event mode: stored listener references so they can be removed on destroy().
    // Without these the window listeners leak across destroy()/re-init() cycles.
    customListeners?: {
        connectedEvent: string;
        disconnectedEvent: string;
        stateChangedEvent: string;
        onConnected: (event: Event) => void;
        onDisconnected: (event: Event) => void;
        onStateChanged: (event: Event) => void;
    } | null;
}
