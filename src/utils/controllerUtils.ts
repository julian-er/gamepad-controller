import { CONTROLLER_MAPPINGS } from '../controllerMappings.js';

/** Minimum buttons a non-standard device must report to be treated as a game controller. */
const MIN_CONTROLLER_BUTTONS = 4;
/** Minimum axes (one stick = 2) a non-standard device must report to be treated as a controller. */
const MIN_CONTROLLER_AXES = 2;

/**
 * Determines whether a `Gamepad` from `navigator.getGamepads()` is an actual game
 * controller rather than some other HID device the browser surfaces as a gamepad
 * (webcams, headsets, USB dongles, some keyboards often appear with buttons but no sticks).
 *
 * Rules:
 * 1. A `mapping === 'standard'` device is always accepted — the browser has matched it
 *    to the Standard Gamepad layout, so it is a real controller.
 * 2. Any other device must report enough real inputs to plausibly be a controller:
 *    at least {@link MIN_CONTROLLER_BUTTONS} buttons AND {@link MIN_CONTROLLER_AXES} axes.
 *    This rejects 0-axis HID devices (e.g. a webcam or headset reporting 7 buttons, 0 axes).
 *
 * @param gamepad - The Gamepad object to validate
 * @returns `true` if the gamepad looks like a usable game controller
 */
export function isValidGamepad(gamepad: Gamepad): boolean {
    if (!gamepad || !gamepad.buttons || !gamepad.axes) return false;
    // Standard-mapped devices are real game controllers.
    if (gamepad.mapping === 'standard') return true;
    // Otherwise require enough inputs to plausibly be a controller.
    return gamepad.buttons.length >= MIN_CONTROLLER_BUTTONS && gamepad.axes.length >= MIN_CONTROLLER_AXES;
}

/**
 * Detects the type of controller based on gamepad properties and mappings
 * @param gamepad - The Gamepad object to detect the controller type for
 * @returns string indicating the detected controller type ('xbox', 'playstation', 'nintendo', or 'unknown')
 */
export function detectControllerType(gamepad: Gamepad): string {
    if (!isValidGamepad(gamepad)) {
        return 'unknown';
    }

    const id = gamepad.id.toLowerCase();
    const buttons = gamepad.buttons.length;
    const axes = gamepad.axes.length;

    // Check Xbox controller
    if (
        CONTROLLER_MAPPINGS.xbox.validation.idPatterns &&
        CONTROLLER_MAPPINGS.xbox.validation.idPatterns.some((pattern: RegExp) => pattern.test(id)) &&
        buttons >= CONTROLLER_MAPPINGS.xbox.validation.minButtons &&
        axes >= CONTROLLER_MAPPINGS.xbox.validation.minAxes
    ) {
        return 'xbox';
    }

    // Check PlayStation controller
    if (
        CONTROLLER_MAPPINGS.playstation.validation.idPatterns &&
        CONTROLLER_MAPPINGS.playstation.validation.idPatterns.some((pattern: RegExp) => pattern.test(id)) &&
        buttons >= CONTROLLER_MAPPINGS.playstation.validation.minButtons &&
        axes >= CONTROLLER_MAPPINGS.playstation.validation.minAxes
    ) {
        return 'playstation';
    }

    // Check Nintendo controller
    if (
        CONTROLLER_MAPPINGS.nintendo.validation.idPatterns &&
        CONTROLLER_MAPPINGS.nintendo.validation.idPatterns.some((pattern: RegExp) => pattern.test(id)) &&
        buttons >= CONTROLLER_MAPPINGS.nintendo.validation.minButtons &&
        axes >= CONTROLLER_MAPPINGS.nintendo.validation.minAxes
    ) {
        return 'nintendo';
    }

    // Check if it meets minimum requirements for unknown controller
    if (
        buttons >= CONTROLLER_MAPPINGS.unknown.validation.minButtons &&
        axes >= CONTROLLER_MAPPINGS.unknown.validation.minAxes
    ) {
        return 'unknown';
    }

    return 'unknown';
}

/**
 * Applies a deadzone to an analog stick value to filter out small unintentional movements
 * @param value - The raw analog stick value (between -1 and 1)
 * @param deadzone - The minimum absolute value required to register movement (default: 0.1)
 * @returns The filtered analog stick value, 0 if within deadzone or original value if outside
 */
export function applyDeadzone(value: number, deadzone: number = 0.1): number {
    return Math.abs(value) > deadzone ? value : 0;
}
