// controllerMappings.js
// Controller mappings for different gamepad types

export const CONTROLLER_MAPPINGS = {
    xbox: {
        buttons: [
            'A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT',
            'Back', 'Start', 'LS', 'RS', 'D-Up', 'D-Down',
            'D-Left', 'D-Right', 'Xbox'
        ],
        axes: [
            'Left Stick X', 'Left Stick Y',
            'Right Stick X', 'Right Stick Y'
        ],
        validation: {
            minButtons: 16,
            minAxes: 4,
            idPatterns: [
                /xbox/i,
                /microsoft/i,
                /x-input/i
            ]
        }
    },
    playstation: {
        buttons: [
            'Cross', 'Circle', 'Square', 'Triangle',
            'L1', 'R1', 'L2', 'R2',
            'Share', 'Options', 'L3', 'R3',
            'D-Up', 'D-Down', 'D-Left', 'D-Right',
            'PS'
        ],
        axes: [
            'Left Stick X', 'Left Stick Y',
            'Right Stick X', 'Right Stick Y'
        ],
        validation: {
            minButtons: 16,
            minAxes: 4,
            idPatterns: [
                /playstation/i,
                /dualsense/i,
                /dualshock/i,
                /ps3/i,
                /ps4/i,
                /ps5/i
            ]
        }
    },
    nintendo: {
        buttons: [
            'B', 'A', 'Y', 'X', 'L', 'R', 'ZL', 'ZR',
            'Minus', 'Plus', 'L3', 'R3',
            'D-Up', 'D-Down', 'D-Left', 'D-Right',
            'Home', 'Capture'
        ],
        axes: [
            'Left Stick X', 'Left Stick Y',
            'Right Stick X', 'Right Stick Y'
        ],
        validation: {
            minButtons: 16,
            minAxes: 4,
            idPatterns: [
                /nintendo/i,
                /switch/i,
                /pro controller/i
            ]
        }
    },
    unknown: {
        buttons: Array(17).fill(0).map((_, i) => `Button ${i}`),
        axes: Array(4).fill(0).map((_, i) => `Axis ${i}`),
        validation: {
            minButtons: 4,
            minAxes: 2
        }
    }
};

// Helper function to get the primary action button index based on controller type
export function getPrimaryActionButtonIndex(controllerType) {
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

// Helper function to get D-pad button indices based on controller type
export function getDpadIndices(controllerType) {
    // Most controllers have D-pad at indices 12-15
    return {
        up: 12,
        down: 13,
        left: 14,
        right: 15
    };
}

// Get button name for a specific controller type
export function getButtonName(index, controllerType) {
    const mapping = CONTROLLER_MAPPINGS[controllerType];
    return mapping.buttons[index] || `Button ${index}`;
}

// Get axis name for a specific controller type
export function getAxisName(index, controllerType) {
    const mapping = CONTROLLER_MAPPINGS[controllerType];
    return mapping.axes[index] || `Axis ${index}`;
} 