// Tipos y interfaces para mapeos de controladores

export type ControllerType = 'xbox' | 'playstation' | 'nintendo' | 'unknown';

export interface ControllerValidation {
    minButtons: number;
    minAxes: number;
    idPatterns?: RegExp[];
}

export interface ControllerMapping {
    buttons: string[];
    axes: string[];
    validation: ControllerValidation;
}

export interface ControllerMappings {
    xbox: ControllerMapping;
    playstation: ControllerMapping;
    nintendo: ControllerMapping;
    unknown: ControllerMapping;
} 