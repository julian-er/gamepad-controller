// Opciones para GamepadNavigationContext

export interface GamepadNavigationContextOptions {
    navigationMode: 'spatial' | 'horizontal';
    containerSelector: string | null;
    focusedClass?: string;
    selectedClass?: string;
    useDataAttributes?: boolean;
    wrapNavigation?: boolean;
    autoDetectElements?: boolean;
} 