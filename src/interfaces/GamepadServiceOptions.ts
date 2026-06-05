// Options for GamepadService

import type { LogLevel } from '../utils/logger.js';

export interface GamepadServiceOptions {
    debounceTime?: number;
    deadzone?: number;
    /**
     * Cooldown (ms) between back-button (B/Circle) activations.
     * @default 300
     */
    backButtonCooldown?: number;
    /**
     * Cooldown (ms) between shoulder-button (L1/R1) activations.
     * @default 300
     */
    shoulderCooldown?: number;
    /**
     * Verbosity of the library's internal logging. Defaults to `error` so the
     * package stays quiet inside host applications.
     * @default "error"
     */
    logLevel?: LogLevel;
    containerSelector?: string | null;
    // Status element options - both are optional
    statusElementId?: string | null; // Provide a specific element ID to show gamepad status
    autoCreateStatusElement?: boolean; // Create a default status element automatically
    focusedClass?: string;
    selectedClass?: string;
    navigationMode?: 'grid' | 'spatial' | 'horizontal';
    wrapNavigation?: boolean;
    autoDetectElements?: boolean;
    enableNavigation?: boolean;
    enableBackButton?: boolean;
    enableShoulderNavigation?: boolean;
    // Scrolling options
    enableRightStickScroll?: boolean; // Enable right stick for window scrolling
    scrollSpeed?: number; // Multiplier for scroll speed (default: 1)
    scrollDebounceTime?: number; // Debounce time for scrolling (default: 50ms)
    /**
     * Scroll behavior used when the focused element is brought into view on navigation.
     * Use `'auto'` (instant) to avoid animation churn during rapid navigation on dense UIs.
     * @default "smooth"
     */
    scrollBehavior?: 'smooth' | 'auto';
    navigationMenuSelector?: string;
    autoAddStyles?: boolean;
    useDataAttributes?: boolean;
    useGamepadIndex?: boolean; // Enable gamepad-index attribute for custom navigation order
    onlyViewport?: boolean; // Only include elements visible in viewport (default: false)
    gamepadContext?: string;
    enableDualContext?: boolean;
    menuContextSelector?: string;
    contentContextSelector?: string | null;

    // Custom Events Support (for WinUI integration)
    /**
     * Enable custom DOM events instead of native gamepad APIs.
     * When true, listens to custom events instead of navigator.getGamepads()
     * @default false
     */
    useCustomEvents?: boolean;

    /**
     * Name of the custom event dispatched when a gamepad connects.
     * Only used when useCustomEvents is true.
     * @default "hubgamepadconnected"
     */
    customConnectedEvent?: string;

    /**
     * Name of the custom event dispatched when a gamepad disconnects.
     * Only used when useCustomEvents is true.
     * @default "hubgamepaddisconnected"
     */
    customDisconnectedEvent?: string;

    /**
     * Name of the custom event dispatched with gamepad state updates.
     * Only used when useCustomEvents is true.
     * Event detail should contain: { gamepad: Gamepad }
     * @default "hubgamepadstatechanged"
     */
    customStateChangedEvent?: string;
}

// ---------------------------------------------------------------------------
// Grouped options (recommended) — a nested, discoverable shape over the flat
// options above. The flat fields remain fully supported for backward
// compatibility; `normalizeOptions` flattens any nested groups, with nested
// values taking precedence over their flat equivalents.
// ---------------------------------------------------------------------------

/** Movement & element-discovery behavior. */
export interface NavigationOptionsGroup {
    navigationMode?: 'grid' | 'spatial' | 'horizontal';
    wrapNavigation?: boolean;
    deadzone?: number;
    debounceTime?: number;
    autoDetectElements?: boolean;
    enableNavigation?: boolean;
    containerSelector?: string | null;
    onlyViewport?: boolean;
    useGamepadIndex?: boolean;
}

/** Button/action behavior (selection, back, shoulder). */
export interface InputOptionsGroup {
    enableBackButton?: boolean;
    backButtonCooldown?: number;
    enableShoulderNavigation?: boolean;
    shoulderCooldown?: number;
}

/** Focus/selection presentation. */
export interface StylingOptionsGroup {
    focusedClass?: string;
    selectedClass?: string;
    useDataAttributes?: boolean;
    autoAddStyles?: boolean;
    scrollBehavior?: 'smooth' | 'auto';
}

/** Status-indicator + logging. */
export interface StatusOptionsGroup {
    statusElementId?: string | null;
    autoCreateStatusElement?: boolean;
    navigationMenuSelector?: string;
    logLevel?: LogLevel;
}

/** Right-stick scrolling. */
export interface ScrollingOptionsGroup {
    enableRightStickScroll?: boolean;
    scrollSpeed?: number;
    scrollDebounceTime?: number;
}

/** Context / dual-context configuration. */
export interface ContextOptionsGroup {
    gamepadContext?: string;
    enableDualContext?: boolean;
    menuContextSelector?: string;
    contentContextSelector?: string | null;
}

/** Custom-event (WinUI/host integration) configuration. */
export interface CustomEventsOptionsGroup {
    useCustomEvents?: boolean;
    customConnectedEvent?: string;
    customDisconnectedEvent?: string;
    customStateChangedEvent?: string;
}

/**
 * Public configuration accepted by {@link GamepadService} and the factory helpers. Supports
 * both the flat options (all fields above, still supported) and the grouped shape below.
 * Where a value is supplied in both, the nested group wins. Use `normalizeOptions` to
 * collapse this into the flat {@link GamepadServiceOptions} the runtime consumes.
 */
export interface GamepadServiceConfig extends GamepadServiceOptions {
    navigation?: NavigationOptionsGroup;
    input?: InputOptionsGroup;
    styling?: StylingOptionsGroup;
    status?: StatusOptionsGroup;
    scrolling?: ScrollingOptionsGroup;
    context?: ContextOptionsGroup;
    customEvents?: CustomEventsOptionsGroup;
}
