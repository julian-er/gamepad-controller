// controllerUtils.ts
// Controller validation and detection utilities

import { CONTROLLER_MAPPINGS } from '../controllerMappings.js';

// Check if a gamepad object is valid
export function isValidGamepad(gamepad: any): boolean {
    return gamepad && 
           gamepad.buttons && 
           gamepad.axes && 
           gamepad.buttons.length > 0 && 
           gamepad.axes.length > 0;
}

// Detect controller type based on gamepad properties
export function detectControllerType(gamepad: any): string {
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

// Apply deadzone to analog stick values
export function applyDeadzone(value: number, deadzone: number = 0.1): number {
    return Math.abs(value) > deadzone ? value : 0;
} 