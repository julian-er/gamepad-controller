// interfaces/index.ts
// Central export point for all TypeScript interfaces

// Main service options interface + grouped config shape
export type {
    GamepadServiceOptions,
    GamepadServiceConfig,
    NavigationOptionsGroup,
    InputOptionsGroup,
    StylingOptionsGroup,
    StatusOptionsGroup,
    ScrollingOptionsGroup,
    ContextOptionsGroup,
    CustomEventsOptionsGroup,
} from './GamepadServiceOptions';

// Navigation context options interface
export type { GamepadNavigationContextOptions } from './GamepadNavigationContextOptions';

// Navigation state interface
export type { NavigationState } from './NavigationState';

// Controller mapping types
export type { ControllerMappings } from './ControllerMappings';

// Grid dimensions type
export type { GridDimensions } from './GridDimensions';

// Callback types
export type { GamepadContextManagerCallback } from './GamepadContextManagerCallback';
