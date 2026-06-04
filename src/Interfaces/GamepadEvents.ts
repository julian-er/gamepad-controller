// GamepadEvent interface for typed gamepad events
export interface GamepadEvent extends Event {
    gamepad: Gamepad;
}

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
    // Scrolling state tracking
    lastScrollTime: number;
    // Add animation frame ID for proper cleanup
    animationFrameId: number | null;
    // Add statusElementId for UI updates
    statusElementId: string | null;
    onControllerConnect: ((gamepad: Gamepad) => void) | null;
    onControllerDisconnect: ((gamepad: Gamepad) => void) | null;
    onNavigationMenuOpen: ((button: string) => void) | null;
    onBackButton: (() => void) | null;
    // New: generic button event handlers
    onButtonDown?: (buttonIndex: number, gamepad: Gamepad) => void;
    onButtonUp?: (buttonIndex: number, gamepad: Gamepad) => void;
    // Track last button states per gamepad
    lastButtonStates?: { [gamepadIndex: number]: boolean[] };
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
