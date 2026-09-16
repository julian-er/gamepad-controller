// gamepad-controller — public API surface.
// Only the symbols re-exported here are part of the package's supported API.
// Internal modules (core/gamepadEventHandler, core/gamepadNavigation, utils/domUtils, …)
// are intentionally NOT re-exported.

// --- Core class & its event map ---
export { GamepadService } from './service/GamepadService.js';
export type { GamepadServiceEventMap } from './service/GamepadService.js';

// --- Platform seam (injectable via GamepadServiceConfig.platform) ---
export { BrowserPlatformAdapter, defaultPlatformAdapter } from './platform/PlatformAdapter.js';
export type { PlatformAdapter, WindowEventListener } from './platform/PlatformAdapter.js';

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
export { logger, Logger } from './utils/logger.js';
export type { LogLevel } from './utils/logger.js';

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
    GamepadActionEvent,
    GamepadNavigationContextOptions,
    NavigationState,
    GridDimensions,
    GamepadContextManagerCallback,
    Direction,
    ShoulderButton,
} from './interfaces/index.js';
export type {
    ControllerType,
    ControllerMapping,
    ControllerMappings,
    ControllerValidation,
    ButtonIndices,
    ShoulderIndices,
    DpadIndices,
} from './interfaces/ControllerMappings.js';
export type { GamepadEvent } from './interfaces/GamepadEvents.js';
