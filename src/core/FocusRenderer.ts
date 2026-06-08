// FocusRenderer.ts
// Owns single-context navigation state and focus presentation: element discovery, grid-size
// computation, focused-index bookkeeping, and applying/clearing focus styling. Extracted from
// GamepadService so the orchestrator no longer mixes DOM focus mechanics with lifecycle and
// input concerns. In dual-context mode focus is owned by the context manager, so updateFocus()
// short-circuits (preserving the original behavior).

import { calculateGridDimensions, getFocusableElements } from '../utils/domUtils.js';
import { applyFocusStyling, clearFocusStyling, scrollElementIntoView } from './focusView.js';
import { navigateToIndex as navigateToIndexImpl } from './gamepadNavigation.js';
import { invalidateFocusableElementsCache } from '../utils/domUtils.js';
import { logger } from '../utils/logger.js';
import type { GamepadServiceOptions } from '../interfaces/GamepadServiceOptions.js';
import type { NavigationState } from '../interfaces/NavigationState.js';

export class FocusRenderer {
    /** The single-context navigation state. Shared (by reference) with the input loop. */
    readonly state: NavigationState;

    constructor(private readonly options: GamepadServiceOptions) {
        this.state = {
            focusedElementIndex: 0,
            elements: [],
            gridDimensions: { rows: 0, cols: 0 },
            options,
            onFocus: null,
            onSelect: null,
        };
    }

    /**
     * Detects and filters focusable elements for gamepad navigation, then computes grid
     * dimensions and clamps the focused index.
     */
    detectElements(): void {
        this.state.elements = getFocusableElements(
            this.options.containerSelector,
            this.options.useGamepadIndex ?? false,
            this.options.onlyViewport ?? false
        );

        // Filter out disabled / invisible elements
        this.state.elements = this.state.elements.filter(
            (el) =>
                (el instanceof HTMLElement ? el.offsetParent !== null : false) &&
                (!(el instanceof HTMLInputElement || el instanceof HTMLButtonElement) || !el.disabled) &&
                (el instanceof HTMLElement ? !el.hasAttribute('disabled') : false)
        );

        const container = this.options.containerSelector
            ? document.querySelector(this.options.containerSelector)
            : document.body;

        this.state.gridDimensions = calculateGridDimensions(this.state.elements, container ?? document.body);

        if (this.state.focusedElementIndex >= this.state.elements.length) {
            this.state.focusedElementIndex = Math.max(0, this.state.elements.length - 1);
        }

        logger.info(
            `Detected ${this.state.elements.length} navigable elements (${this.state.gridDimensions.rows}x${this.state.gridDimensions.cols})`
        );
    }

    /** Replace the navigable element set manually, bypassing the focusable scan. */
    setElements(elements: Element[]): void {
        // Manual element control bypasses the scan; drop the memo so a later detectElements()
        // doesn't resurrect a now-irrelevant cached list.
        invalidateFocusableElementsCache();
        this.state.elements = elements;

        const container = this.options.containerSelector
            ? document.querySelector(this.options.containerSelector)
            : document.body;

        this.state.gridDimensions = calculateGridDimensions(this.state.elements, container ?? document.body);

        this.state.focusedElementIndex = 0;
        this.updateFocus();
    }

    /**
     * Updates focus styling for the currently focused element (single-context mode).
     * In dual-context mode focus is owned by the context manager, so this is a no-op.
     */
    updateFocus(): void {
        if (this.options.enableDualContext) return;

        // Clear focused styling everywhere (without touching the selected class — historical
        // behavior of updateFocus only cleared the focused state).
        this.state.elements.forEach((element) => {
            if (this.options.useDataAttributes) {
                clearFocusStyling([element], this.options);
            } else if (this.options.focusedClass) {
                element.classList.remove(this.options.focusedClass);
            }
        });

        const focusedElement = this.state.elements[this.state.focusedElementIndex];
        if (focusedElement) {
            applyFocusStyling(focusedElement, this.options);
            scrollElementIntoView(focusedElement, this.options.scrollBehavior ?? 'smooth');

            if (this.state.onFocus) {
                this.state.onFocus(focusedElement, this.state.focusedElementIndex);
            }
        }
    }

    /** Clear focused/selected styling from every element. */
    clearFocus(): void {
        clearFocusStyling(this.state.elements, this.options);
    }

    /** Move focus to a specific index. Returns false when the index is out of range. */
    navigateToIndex(index: number): boolean {
        return navigateToIndexImpl(this.state, index, () => this.updateFocus());
    }

    getCurrentElement(): Element | null {
        return this.state.elements[this.state.focusedElementIndex] ?? null;
    }

    getCurrentIndex(): number {
        return this.state.focusedElementIndex;
    }

    getElements(): Element[] {
        return this.state.elements;
    }
}
