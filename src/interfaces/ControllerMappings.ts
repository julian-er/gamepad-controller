// Types and interfaces for controller mappings.

export type ControllerType = 'xbox' | 'playstation' | 'nintendo' | 'unknown';

export interface ControllerValidation {
    readonly minButtons: number;
    readonly minAxes: number;
    readonly idPatterns?: readonly RegExp[];
}

/** Left/right shoulder (L1/LB, R1/RB) button indices. */
export interface ShoulderIndices {
    readonly l1: number;
    readonly r1: number;
}

/** D-pad button indices. */
export interface DpadIndices {
    readonly up: number;
    readonly down: number;
    readonly left: number;
    readonly right: number;
}

/**
 * Per-controller button-index table. The single source of truth for which physical button each
 * abstract action maps to, replacing the previously hardcoded magic numbers in the mapping
 * helper functions (and accounting for e.g. Nintendo's swapped A/B at indices 0/1).
 */
export interface ButtonIndices {
    /** Primary action (A / Cross / Nintendo A). */
    readonly primary: number;
    /** Back / cancel (B / Circle / Nintendo B). */
    readonly back: number;
    readonly shoulder: ShoulderIndices;
    readonly dpad: DpadIndices;
}

export interface ControllerMapping {
    readonly buttons: readonly string[];
    readonly axes: readonly string[];
    readonly validation: ControllerValidation;
    readonly indices: ButtonIndices;
}

export interface ControllerMappings {
    readonly xbox: ControllerMapping;
    readonly playstation: ControllerMapping;
    readonly nintendo: ControllerMapping;
    readonly unknown: ControllerMapping;
}
