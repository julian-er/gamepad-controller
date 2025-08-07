import type { GridDimensions } from './GridDimensions';
import type { GamepadServiceOptions } from './GamepadServiceOptions';

export interface NavigationState {
    focusedElementIndex: number;
    elements: Element[];
    gridDimensions: GridDimensions;
    options: GamepadServiceOptions;
    onFocus: ((element: Element, index: number) => void) | null;
    onSelect: ((element: Element, index: number) => void) | null;
} 