// Options for GamepadService

export interface GamepadServiceOptions {
    debounceTime?: number;
    deadzone?: number;
    containerSelector?: string | null;
    // Status element options - both are optional
    statusElementId?: string | null; // Provide a specific element ID to show gamepad status
    autoCreateStatusElement?: boolean; // Create a default status element automatically
    focusedClass?: string;
    selectedClass?: string;
    navigationMode?: 'grid' | 'spatial';
    wrapNavigation?: boolean;
    autoDetectElements?: boolean;
    enableNavigation?: boolean;
    enableBackButton?: boolean;
    enableShoulderNavigation?: boolean;
    navigationMenuSelector?: string;
    autoAddStyles?: boolean;
    useDataAttributes?: boolean;
    useGamepadIndex?: boolean; // Enable gamepad-index attribute for custom navigation order
    onlyViewport?: boolean; // Only include elements visible in viewport (default: false)
    gamepadContext?: string;
    enableDualContext?: boolean;
    menuContextSelector?: string;
    contentContextSelector?: string | null;
} 