// Types and interfaces for controller mappings.

export type ControllerType = 'xbox' | 'playstation' | 'nintendo' | 'unknown';

export interface ControllerValidation {
    readonly minButtons: number;
    readonly minAxes: number;
    readonly idPatterns?: readonly RegExp[];
}

export interface ControllerMapping {
    readonly buttons: readonly string[];
    readonly axes: readonly string[];
    readonly validation: ControllerValidation;
}

export interface ControllerMappings {
    readonly xbox: ControllerMapping;
    readonly playstation: ControllerMapping;
    readonly nintendo: ControllerMapping;
    readonly unknown: ControllerMapping;
}
