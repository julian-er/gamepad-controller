// focusView.ts
// Pure-ish DOM "view" operations for focus presentation, extracted from GamepadService so
// that the service can stay focused on orchestration (input loop, contexts, lifecycle) while
// the low-level classList / data-attribute / scrollIntoView mechanics live in one place.

import { addGamepadDataAttributes, removeGamepadDataAttributes } from '../utils/domUtils.js';

/** Subset of {@link GamepadServiceOptions} that controls focus presentation. */
export interface FocusStyleOptions {
    useDataAttributes?: boolean;
    focusedClass?: string;
    selectedClass?: string;
    /** Scroll behavior when bringing the focused element into view. @default "smooth" */
    scrollBehavior?: 'smooth' | 'auto';
}

/**
 * Removes the focused/selected styling (data-attributes or CSS classes) from every element.
 * @param elements - The elements to clear
 * @param options - Styling options (mode + class names)
 */
export function clearFocusStyling(elements: Element[], options: FocusStyleOptions): void {
    const focusedClass = options.focusedClass ?? '';
    const selectedClass = options.selectedClass ?? '';
    elements.forEach((element) => {
        if (options.useDataAttributes) {
            removeGamepadDataAttributes(element);
        } else {
            if (focusedClass) element.classList.remove(focusedClass);
            if (selectedClass) element.classList.remove(selectedClass);
        }
    });
}

/**
 * Applies the focused styling to a single element using the configured mechanism
 * (data-attributes by default, otherwise the `focusedClass`).
 * @param element - The element to mark as focused
 * @param options - Styling options (mode + class names)
 */
export function applyFocusStyling(element: Element, options: FocusStyleOptions): void {
    if (options.useDataAttributes) {
        addGamepadDataAttributes(element, 'focused');
    } else if (options.focusedClass) {
        element.classList.add(options.focusedClass);
    }
}

/**
 * Scrolls an element into view if the API is available. Behavior defaults to `'smooth'`
 * to preserve historical behavior; pass `'auto'` to avoid animation churn on rapid nav.
 * @param element - The element to reveal
 * @param behavior - Scroll behavior (defaults to `'smooth'`)
 */
export function scrollElementIntoView(element: Element, behavior: 'smooth' | 'auto' = 'smooth'): void {
    if (typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior, block: 'nearest', inline: 'nearest' });
    }
}
