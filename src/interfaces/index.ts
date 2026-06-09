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
} from './GamepadServiceOptions.js';

// Navigation context options interface
export type { GamepadNavigationContextOptions } from './GamepadNavigationContextOptions.js';

// Navigation state interface
export type { NavigationState } from './NavigationState.js';

// Controller mapping types
export type { ControllerMappings } from './ControllerMappings.js';

// Grid dimensions type
export type { GridDimensions } from './GridDimensions.js';

// Callback types
export type { GamepadContextManagerCallback } from './GamepadContextManagerCallback.js';

// Navigation literal types
export type { Direction, ShoulderButton } from './NavigationTypes.js';
