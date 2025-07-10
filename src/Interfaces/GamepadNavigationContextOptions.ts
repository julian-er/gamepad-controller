// Options for GamepadNavigationContext

export interface GamepadNavigationContextOptions {
    navigationMode: 'spatial' | 'horizontal';
    containerSelector: string | null;
    focusedClass?: string;
    selectedClass?: string;
    useDataAttributes?: boolean;
    useGamepadIndex?: boolean; // Enable gamepad-index attribute for custom navigation order
    wrapNavigation?: boolean;
    autoDetectElements?: boolean;
} 