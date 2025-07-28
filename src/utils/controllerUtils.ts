import { CONTROLLER_MAPPINGS } from '../controllerMappings.js';

/**
 * Checks if a gamepad object is valid by verifying it has the required properties and values
 * @param gamepad - The Gamepad object to validate
 * @returns boolean indicating if the gamepad is valid and has required properties
 */
export function isValidGamepad(gamepad: Gamepad): boolean {
    return gamepad &&
           gamepad.buttons &&
           gamepad.axes &&
           gamepad.buttons.length > 0 &&
           gamepad.axes.length > 0;
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
    if (CONTROLLER_MAPPINGS.xbox.validation.idPatterns && CONTROLLER_MAPPINGS.xbox.validation.idPatterns.some((pattern: RegExp) => pattern.test(id)) &&
        buttons >= CONTROLLER_MAPPINGS.xbox.validation.minButtons &&
        axes >= CONTROLLER_MAPPINGS.xbox.validation.minAxes) {
        return 'xbox';
    }

    // Check PlayStation controller
    if (CONTROLLER_MAPPINGS.playstation.validation.idPatterns && CONTROLLER_MAPPINGS.playstation.validation.idPatterns.some((pattern: RegExp) => pattern.test(id)) &&
        buttons >= CONTROLLER_MAPPINGS.playstation.validation.minButtons &&
        axes >= CONTROLLER_MAPPINGS.playstation.validation.minAxes) {
        return 'playstation';
    }

    // Check Nintendo controller
    if (CONTROLLER_MAPPINGS.nintendo.validation.idPatterns && CONTROLLER_MAPPINGS.nintendo.validation.idPatterns.some((pattern: RegExp) => pattern.test(id)) &&
        buttons >= CONTROLLER_MAPPINGS.nintendo.validation.minButtons &&
        axes >= CONTROLLER_MAPPINGS.nintendo.validation.minAxes) {
        return 'nintendo';
    }

    // Check if it meets minimum requirements for unknown controller
    if (buttons >= CONTROLLER_MAPPINGS.unknown.validation.minButtons &&
        axes >= CONTROLLER_MAPPINGS.unknown.validation.minAxes) {
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