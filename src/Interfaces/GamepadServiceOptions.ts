// Options for GamepadService

export interface GamepadServiceOptions {
    debounceTime?: number;
    deadzone?: number;
    containerSelector?: string | null;
    statusElementId?: string | null;
    focusedClass?: string;
    selectedClass?: string;
    navigationMode?: 'grid' | 'spatial';
    wrapNavigation?: boolean;
    autoDetectElements?: boolean;
    enableNavigation?: boolean;
    enableBackButton?: boolean;
    enableShoulderNavigation?: boolean;
    navigationMenuSelector?: string;
    autoCreateStatusElement?: boolean;
    autoAddStyles?: boolean;
    useDataAttributes?: boolean;
    useGamepadIndex?: boolean; // Enable gamepad-index attribute for custom navigation order
    onlyViewport?: boolean; // Only include elements visible in viewport (default: false)
    gamepadContext?: string;
    enableDualContext?: boolean;
    menuContextSelector?: string;
    contentContextSelector?: string | null;
} 