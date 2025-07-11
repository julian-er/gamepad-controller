// Options for GamepadNavigationContext

export interface GamepadNavigationContextOptions {
    navigationMode: 'spatial' | 'horizontal';
    containerSelector: string | null;
    focusedClass?: string;
    selectedClass?: string;
    useDataAttributes?: boolean;
    useGamepadIndex?: boolean; // Enable gamepad-index attribute for custom navigation order
    onlyViewport?: boolean; // Only include elements visible in viewport (default: false)
    wrapNavigation?: boolean;
    autoDetectElements?: boolean;
} 