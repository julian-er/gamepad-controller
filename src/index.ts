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
export { GamepadContextManager, GamepadNavigationContext } from './gamepadContextManager.js';

// --- Controller mapping helpers ---
export {
    CONTROLLER_MAPPINGS,
    getButtonName,
    getAxisName,
    getPrimaryActionButtonIndex,
    getBackButtonIndex,
    getShoulderIndices,
    getDpadIndices,
} from './controllerMappings.js';

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

// --- Public types ---
export type {
    GamepadServiceOptions,
    GamepadNavigationContextOptions,
    NavigationState,
    GridDimensions,
    GamepadContextManagerCallback,
} from './Interfaces/index.js';
export type {
    ControllerType,
    ControllerMapping,
    ControllerMappings,
    ControllerValidation,
} from './Interfaces/ControllerMappings.js';
export type { GamepadEvent } from './Interfaces/GamepadEvents.js';
