// FocusRenderer.ts
// Owns single-context navigation state and focus presentation: element discovery, grid-size
// computation, focused-index bookkeeping, and applying/clearing focus styling. Extracted from
// GamepadService so the orchestrator no longer mixes DOM focus mechanics with lifecycle and
// input concerns. In dual-context mode focus is owned by the context manager, so updateFocus()
// short-circuits (preserving the original behavior).

import { calculateGridDimensions, getFocusableElements } from '../utils/domUtils.js';
import { applyFocusStyling, clearFocusStyling, scrollElementIntoView } from './FocusView.js';
import { navigateToIndex as navigateToIndexImpl } from '../navigation/NavigationEngine.js';
import { invalidateFocusableElementsCache } from '../utils/domUtils.js';
import { logger } from '../utils/logger.js';
import type { GamepadServiceOptions } from '../interfaces/GamepadServiceOptions.js';
import type { NavigationState } from '../interfaces/NavigationState.js';
import { ElementRegistry } from '../navigation/ElementRegistry.js';
import { activeNativeModal, isEligibleElement } from '../dom/eligibility.js';

export class FocusRenderer {
    /** The single-context navigation state. Shared (by reference) with the input loop. */
    readonly state: NavigationState;
    /** Caller-owned ordering. References survive temporary detach/hide until replacement/destroy. */
    private registry = new ElementRegistry();
    private activeScope: Element | null = null;
    private scopeStack: Array<{ scope: Element | null; previous: Element | null }> = [];
    private nativeModal: Element | null = null;
    private nativeModalPrevious: Element | null = null;
    private restoreNativeModalFocus = false;
    private nativeModalStack: Array<{ modal: Element; previous: Element | null }> = [];
    private ownedTabindex = new Map<HTMLElement, string | null>();

    constructor(private readonly options: GamepadServiceOptions) {
        this.state = {
            focusedElementIndex: 0,
            elements: [],
            gridDimensions: { rows: 0, cols: 0 },
            options,
            onFocus: null,
            onSelect: null,
            isElementEligible: (element) => this.isEligible(element),
            isRuntimeActive: undefined,
            runtimeGeneration: undefined,
        };
    }

    /**
     * Detects and filters focusable elements for gamepad navigation, then computes grid
     * dimensions and clamps the focused index.
     */
    detectElements(): void {
        const modal = activeNativeModal();
        if (modal !== this.nativeModal) {
            if (modal) {
                const existing = this.nativeModalStack.findIndex((frame) => frame.modal === modal);
                if (existing >= 0) {
                    const closed = this.nativeModalStack[this.nativeModalStack.length - 1];
                    this.nativeModalStack.splice(existing + 1);
                    this.nativeModalPrevious = closed?.previous ?? null;
                    this.restoreNativeModalFocus = this.nativeModalPrevious !== null;
                } else {
                    this.nativeModalStack.push({ modal, previous: this.getCurrentElement() });
                }
            } else {
                this.nativeModalPrevious = this.nativeModalStack[0]?.previous ?? null;
                this.nativeModalStack = [];
                this.restoreNativeModalFocus = this.nativeModalPrevious !== null;
            }
            this.nativeModal = modal;
        }
        const manual = this.registry.get();
        if (manual) {
            // Keep base positions stable. Eligibility is deliberately evaluated when focus or
            // an action is attempted, never by removing caller registrations.
            this.applyElements(manual);
            return;
        }
        if (this.options.autoDetectElements === false) {
            this.applyElements([]);
            return;
        }
        this.applyElements(
            getFocusableElements(
                this.options.containerSelector,
                this.options.useGamepadIndex ?? false,
                this.options.onlyViewport ?? false
            ).filter((element) => this.isEligible(element))
        );
    }

    private applyElements(elements: Element[]): void {
        const previous = this.getCurrentElement();
        this.state.elements = elements;

        if (this.restoreNativeModalFocus) {
            const restore = this.nativeModalPrevious;
            const restored = restore && this.isEligible(restore) ? this.state.elements.indexOf(restore) : -1;
            if (restored >= 0) this.state.focusedElementIndex = restored;
            this.restoreNativeModalFocus = false;
            this.nativeModalPrevious = null;
        }

        const container = this.options.containerSelector
            ? document.querySelector(this.options.containerSelector)
            : document.body;

        this.state.gridDimensions = calculateGridDimensions(this.state.elements, container ?? document.body);

        const retained = previous ? this.state.elements.indexOf(previous) : -1;
        if (retained >= 0) {
            this.state.focusedElementIndex = retained;
        } else if (this.state.focusedElementIndex >= this.state.elements.length) {
            this.state.focusedElementIndex = Math.max(0, this.state.elements.length - 1);
        }

        logger.info(
            `Detected ${this.state.elements.length} navigable elements (${this.state.gridDimensions.rows}x${this.state.gridDimensions.cols})`
        );
    }

    private isEligible(element: Element): boolean {
        const modal = activeNativeModal();
        return (
            (!this.activeScope || this.activeScope.contains(element)) && isEligibleElement(element, this.options, modal)
        );
    }

    /** Replace the navigable element set manually, bypassing the focusable scan. */
    setElements(elements: Element[]): void {
        // Manual element control bypasses the scan; drop the memo so a later detectElements()
        // doesn't resurrect a now-irrelevant cached list.
        invalidateFocusableElementsCache();
        this.registry.set(elements);
        this.applyElements(this.registry.get()!);

        this.state.focusedElementIndex = 0;
        if (this.options.enableNavigation) this.updateFocus();
    }

    /**
     * Updates focus styling for the currently focused element (single-context mode).
     * In dual-context mode focus is owned by the context manager, so this is a no-op.
     */
    updateFocus(claimNativeFocus = false): void {
        if (this.options.enableDualContext) return;

        // Clear focused styling everywhere (without touching the selected marker — historical
        // behavior of updateFocus only cleared the focused state). Full clearing of both markers
        // is reserved for clearFocus()/destroy().
        this.state.elements.forEach((element) => {
            if (this.options.useDataAttributes) {
                element.removeAttribute('data-gamepad-focused');
            } else if (this.options.focusedClass) {
                element.classList.remove(this.options.focusedClass);
            }
        });

        let focusedElement = this.state.elements[this.state.focusedElementIndex];
        if (focusedElement && !this.isEligible(focusedElement)) {
            const fallback = this.state.elements.findIndex((element) => this.isEligible(element));
            this.state.focusedElementIndex = fallback;
            focusedElement = fallback >= 0 ? this.state.elements[fallback] : undefined;
        }
        if (focusedElement) {
            applyFocusStyling(focusedElement, this.options);
            // Native keyboard focus follows gamepad focus. preventScroll keeps repeated input
            // from fighting the configured scroll behavior.
            // Do not take keyboard focus during passive DOM refreshes. Gamepad-driven moves
            // still use this method; only focus when no unrelated native focus is active.
            if (
                focusedElement instanceof HTMLElement &&
                (claimNativeFocus ||
                    !document.activeElement ||
                    document.activeElement === document.body ||
                    this.state.elements.includes(document.activeElement))
            ) {
                if (!focusedElement.matches('a[href],button,input,select,textarea,[tabindex]')) {
                    this.ownedTabindex.set(focusedElement, focusedElement.getAttribute('tabindex'));
                    focusedElement.setAttribute('tabindex', '-1');
                }
                focusedElement.focus({ preventScroll: true });
            }
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
        const element = this.state.elements[index];
        if (!element || !this.isEligible(element)) return false;
        return navigateToIndexImpl(this.state, index, () => this.updateFocus(true));
    }

    getCurrentElement(): Element | null {
        return this.state.elements[this.state.focusedElementIndex] ?? null;
    }

    getCurrentIndex(): number {
        return this.state.focusedElementIndex;
    }

    /** Synchronize native keyboard focus without writing focus, styling, or scroll state. */
    syncNativeFocus(element: Element): boolean {
        const index = this.state.elements.indexOf(element);
        if (index < 0 || !this.isEligible(element)) return false;
        this.state.focusedElementIndex = index;
        return true;
    }

    getElements(): Element[] {
        return (this.registry.get() ?? this.state.elements).slice();
    }

    /** Used by service destruction; manual references must not leak across init cycles. */
    clearElements(): void {
        this.registry.clear();
        this.state.elements = [];
        this.state.focusedElementIndex = 0;
        this.activeScope = null;
        this.scopeStack = [];
        this.nativeModal = null;
        this.nativeModalPrevious = null;
        this.restoreNativeModalFocus = false;
        this.nativeModalStack = [];
        for (const [element, original] of this.ownedTabindex) {
            if (original === null) element.removeAttribute('tabindex');
            else element.setAttribute('tabindex', original);
        }
        this.ownedTabindex.clear();
    }

    setActiveScope(scope: Element | null): void {
        if (scope && scope !== this.activeScope)
            this.scopeStack.push({ scope: this.activeScope, previous: this.getCurrentElement() });
        this.activeScope = scope;
        if (this.options.enableNavigation) this.updateFocus();
    }

    clearActiveScope(): void {
        const prior = this.scopeStack.pop();
        this.activeScope = prior?.scope ?? null;
        if (prior?.previous && this.isEligible(prior.previous)) {
            const index = this.state.elements.indexOf(prior.previous);
            if (index >= 0) this.state.focusedElementIndex = index;
        }
        if (this.options.enableNavigation) this.updateFocus();
    }

    getActiveScope(): Element | null {
        return this.activeScope;
    }
}
