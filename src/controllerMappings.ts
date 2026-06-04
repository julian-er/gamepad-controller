import type { ControllerType, ControllerMappings } from './Interfaces/ControllerMappings.js';

export const CONTROLLER_MAPPINGS: ControllerMappings = {
    xbox: {
        buttons: [
            'A',
            'B',
            'X',
            'Y',
            'LB',
            'RB',
            'LT',
            'RT',
            'Back',
            'Start',
            'LS',
            'RS',
            'D-Up',
            'D-Down',
            'D-Left',
            'D-Right',
            'Xbox',
        ],
        axes: ['Left Stick X', 'Left Stick Y', 'Right Stick X', 'Right Stick Y'],
        validation: {
            minButtons: 16,
            minAxes: 4,
            idPatterns: [/xbox/i, /microsoft/i, /x-input/i],
        },
    },
    playstation: {
        buttons: [
            'Cross',
            'Circle',
            'Square',
            'Triangle',
            'L1',
            'R1',
            'L2',
            'R2',
            'Share',
            'Options',
            'L3',
            'R3',
            'D-Up',
            'D-Down',
            'D-Left',
            'D-Right',
            'PS',
        ],
        axes: ['Left Stick X', 'Left Stick Y', 'Right Stick X', 'Right Stick Y'],
        validation: {
            minButtons: 16,
            minAxes: 4,
            idPatterns: [/playstation/i, /dualsense/i, /dualshock/i, /ps3/i, /ps4/i, /ps5/i],
        },
    },
    nintendo: {
        buttons: [
            'B',
            'A',
            'Y',
            'X',
            'L',
            'R',
            'ZL',
            'ZR',
            'Minus',
            'Plus',
            'L3',
            'R3',
            'D-Up',
            'D-Down',
            'D-Left',
            'D-Right',
            'Home',
            'Capture',
        ],
        axes: ['Left Stick X', 'Left Stick Y', 'Right Stick X', 'Right Stick Y'],
        validation: {
            minButtons: 16,
            minAxes: 4,
            idPatterns: [/nintendo/i, /switch/i, /pro controller/i],
        },
    },
    unknown: {
        buttons: Array(17)
            .fill(0)
            .map((_, i) => `Button ${i}`),
        axes: Array(4)
            .fill(0)
            .map((_, i) => `Axis ${i}`),
        validation: {
            minButtons: 4,
            minAxes: 2,
        },
    },
};

/**
 * Gets the primary action button index based on controller type
 * @param controllerType - The type of controller ('xbox', 'playstation', 'nintendo', or 'unknown')
 * @returns The index of the primary action button
 */
export function getPrimaryActionButtonIndex(controllerType: ControllerType): number {
    switch (controllerType) {
        case 'xbox':
            return 0; // A button
        case 'playstation':
            return 0; // Cross button
        case 'nintendo':
            return 1; // A button (Nintendo A is at index 1)
        default:
            return 0; // Default to first button
    }
}

/**
 * Gets the back/cancel button index (B / Circle) based on controller type.
 * Nintendo's physical "B" sits at index 0 (its "A" is index 1), so it differs
 * from the Xbox/PlayStation standard mapping where B/Circle is index 1.
 * @param controllerType - The type of controller
 * @returns The index of the back/cancel button
 */
export function getBackButtonIndex(controllerType: ControllerType): number {
    return controllerType === 'nintendo' ? 0 : 1;
}

/**
 * Gets the left/right shoulder (L1/LB, R1/RB) button indices based on controller type.
 * These map to the standard-mapping indices 4 and 5 across supported controllers.
 * @param controllerType - The type of controller
 * @returns An object with the `l1` and `r1` button indices
 */
export function getShoulderIndices(controllerType: ControllerType): { l1: number; r1: number } {
    // Standard mapping: L1/LB = 4, R1/RB = 5 for all supported controllers.
    void controllerType;
    return { l1: 4, r1: 5 };
}

/**
 * Gets the D-pad button indices based on controller type
 * @param controllerType - The type of controller ('xbox', 'playstation', 'nintendo', or 'unknown')
 * @returns An object containing the indices for the D-pad buttons
 */
export function getDpadIndices(controllerType: ControllerType): {
    up: number;
    down: number;
    left: number;
    right: number;
} {
    // The standard gamepad mapping places the D-pad at indices 12-15 for all
    // supported controller types.
    void controllerType;
    return {
        up: 12,
        down: 13,
        left: 14,
        right: 15,
    };
}

/**
 * Gets the name of a button based on its index and controller type
 * @param index - The index of the button
 * @param controllerType - The type of controller ('xbox', 'playstation', 'nintendo', or 'unknown')
 * @returns The name of the button
 */
export function getButtonName(index: number, controllerType: ControllerType): string {
    const mapping = CONTROLLER_MAPPINGS[controllerType];
    return mapping.buttons[index] || `Button ${index}`;
}

/**
 * Gets the name of an axis based on its index and controller type
 * @param index - The index of the axis
 * @param controllerType - The type of controller ('xbox', 'playstation', 'nintendo', or 'unknown')
 * @returns The name of the axis
 */
export function getAxisName(index: number, controllerType: ControllerType): string {
    const mapping = CONTROLLER_MAPPINGS[controllerType];
    return mapping.axes[index] || `Axis ${index}`;
}
