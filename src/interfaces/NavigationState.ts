import type { GridDimensions } from './GridDimensions.js';
import type { GamepadServiceOptions } from './GamepadServiceOptions.js';

export interface NavigationState {
    focusedElementIndex: number;
    elements: Element[];
    gridDimensions: GridDimensions;
    options: GamepadServiceOptions;
    onFocus: ((element: Element, index: number) => void) | null;
    onSelect: ((element: Element, index: number) => void) | null;
    /** Runtime eligibility check supplied by the DOM owner; never trust stale candidates. */
    isElementEligible?: (element: Element) => boolean;
    /** Service lifecycle guard for effects that synchronously invoke consumer handlers. */
    isRuntimeActive?: () => boolean;
    runtimeGeneration?: () => number;
}
