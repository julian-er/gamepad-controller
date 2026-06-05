// gamepad-controller — public API surface.
// Only the symbols re-exported here are part of the package's supported API.
// Internal modules (core/gamepadEventHandler, core/gamepadNavigation, utils/domUtils, …)
// are intentionally NOT re-exported.

// --- Core class & its event map ---
export { GamepadService } from './core/GamepadService.js';
export type { GamepadServiceEventMap } from './core/GamepadService.js';

// --- Factory helpers & façade ---
export {
    gamepadService,
    initGamepadForPage,
    initDualContextGamepad,
    initCustomEventGamepad,
    cleanupGamepadService,
    gamepadUtils,
} from './factory.js';

// --- Dual-context classes (returned by public GamepadService methods) ---
export { GamepadContextManager, GamepadNavigationContext } from './contexts/GamepadContextManager.js';

// --- Controller mapping helpers ---
export {
    CONTROLLER_MAPPINGS,
    getButtonName,
    getAxisName,
    getPrimaryActionButtonIndex,
    getBackButtonIndex,
    getShoulderIndices,
    getDpadIndices,
} from './mappings/controllerMappings.js';

// --- Optional styling utilities (also exposed via gamepadUtils) ---
export {
    addNavigationStyles,
    removeNavigationStyles,
    getNavigationCSS,
    getExampleCSS,
    printCSSExamples,
} from './utils/cssUtils.js';
export type { NavigationStyleOptions } from './utils/cssUtils.js';

// --- Leveled logger ---
export { logger, Logger, LOG_PREFIX } from './utils/logger.js';
export type { LogLevel } from './utils/logger.js';

// --- Options normalizer (flat + grouped → flat) ---
export { normalizeOptions } from './core/normalizeOptions.js';

// --- Public types ---
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
    GamepadNavigationContextOptions,
    NavigationState,
    GridDimensions,
    GamepadContextManagerCallback,
} from './interfaces/index.js';
export type {
    ControllerType,
    ControllerMapping,
    ControllerMappings,
    ControllerValidation,
} from './interfaces/ControllerMappings.js';
export type { GamepadEvent } from './interfaces/GamepadEvents.js';
