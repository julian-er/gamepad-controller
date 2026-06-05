/**
 * Creates a debounced version of a function that delays invoking the function until after `wait` milliseconds
 * have elapsed since the last time it was invoked.
 *
 * @template T - Function type parameter
 * @param {T} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {T & { cancel: () => void }} The debounced function with an added cancel method
 *
 * @example
 * // Create a debounced version of a function
 * const debouncedFn = debounce(() => {
 *   // Function logic here
 * }, 250);
 *
 * // Call the debounced function
 * debouncedFn();
 *
 * // Cancel any pending debounced calls
 * debouncedFn.cancel();
 */
export function debounce<T extends (...args: never[]) => void>(func: T, wait: number): T & { cancel: () => void } {
    let timeout: ReturnType<typeof setTimeout>;

    const debouncedFunction = function executedFunction(this: unknown, ...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    } as T & { cancel: () => void };

    // Add cancel method to clear pending timeouts
    debouncedFunction.cancel = () => {
        clearTimeout(timeout);
    };

    return debouncedFunction;
}

/**
 * Creates a throttled version of a function that only invokes the function at most once per every `delay` milliseconds.
 * Useful for rate-limiting function calls during continuous events like scrolling or resizing.
 *
 * @template T - Function type parameter
 * @param {T} func - The function to throttle
 * @param {number} delay - The number of milliseconds to throttle invocations to
 * @returns {T} The throttled function
 *
 * @example
 * // Create a throttled version of a function
 * const throttledFn = throttle(() => {
 *   // Function logic here
 * }, 250);
 *
 * // Call the throttled function - will only execute once per 250ms
 * throttledFn();
 */
export function throttle<T extends (...args: never[]) => void>(func: T, delay: number): T {
    let lastCall = 0;
    return function (this: unknown, ...args: Parameters<T>) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func.apply(this, args);
        }
    } as T;
}

/**
 * Calculates the Euclidean distance between the centers of two DOM elements.
 *
 * @param {Element} el1 - The first DOM element
 * @param {Element} el2 - The second DOM element
 * @returns {number} The distance in pixels between the centers of the elements
 *
 * @example
 * // Get distance between two elements
 * const distance = getElementDistance(element1, element2);
 */
export function getElementDistance(el1: Element, el2: Element): number {
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();

    const x1 = rect1.left + rect1.width / 2;
    const y1 = rect1.top + rect1.height / 2;
    const x2 = rect2.left + rect2.width / 2;
    const y2 = rect2.top + rect2.height / 2;

    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Finds the nearest element in a specific direction with improved spatial logic.
 *
 * @param {Element} currentElement - The current DOM element
 * @param {Element[]} allElements - The array of all DOM elements
 * @param {string} direction - The direction to find the nearest element ('up', 'down', 'left', 'right')
 * @returns {Element | null} The nearest element or null if no elements are found
 *
 * @example
 * // Find nearest element in a specific direction
 * const nearest = findNearestInDirection(currentElement, allElements, 'up');
 */
export function findNearestInDirection(
    currentElement: Element,
    allElements: Element[],
    direction: string
): Element | null {
    const currentRect = currentElement.getBoundingClientRect();
    const currentX = currentRect.left + currentRect.width / 2;
    const currentY = currentRect.top + currentRect.height / 2;

    // Measure every element exactly once up front. Re-measuring inside a sort
    // comparator forces a layout reflow per comparison (O(n log n) reflows).
    interface Candidate {
        el: Element;
        cx: number;
        cy: number;
    }
    const candidates: Candidate[] = [];
    for (const el of allElements) {
        if (el === currentElement) continue;
        const rect = el.getBoundingClientRect();
        candidates.push({
            el,
            cx: rect.left + rect.width / 2,
            cy: rect.top + rect.height / 2,
        });
    }

    // Two elements count as "same row/column" when within this band (px).
    const ALIGNMENT_BAND = 50;
    // Minimum separation (px) required to consider a vertical move meaningful.
    const MIN_VERTICAL = 30;

    let filtered: Candidate[];
    switch (direction) {
        case 'up':
            filtered = candidates.filter((c) => currentY - c.cy > MIN_VERTICAL);
            filtered.sort((a, b) => {
                const aVert = currentY - a.cy;
                const bVert = currentY - b.cy;
                if (Math.abs(aVert - bVert) < ALIGNMENT_BAND) {
                    return Math.abs(currentX - a.cx) - Math.abs(currentX - b.cx);
                }
                return aVert - bVert;
            });
            break;

        case 'down':
            filtered = candidates.filter((c) => c.cy - currentY > MIN_VERTICAL);
            filtered.sort((a, b) => {
                const aVert = a.cy - currentY;
                const bVert = b.cy - currentY;
                if (Math.abs(aVert - bVert) < ALIGNMENT_BAND) {
                    return Math.abs(currentX - a.cx) - Math.abs(currentX - b.cx);
                }
                return aVert - bVert;
            });
            break;

        case 'left':
            filtered = candidates.filter((c) => c.cx < currentX);
            filtered.sort((a, b) => {
                const aVert = Math.abs(currentY - a.cy);
                const bVert = Math.abs(currentY - b.cy);
                if (Math.abs(aVert - bVert) < ALIGNMENT_BAND) {
                    return currentX - a.cx - (currentX - b.cx);
                }
                return aVert - bVert;
            });
            break;

        case 'right':
            filtered = candidates.filter((c) => c.cx > currentX);
            filtered.sort((a, b) => {
                const aVert = Math.abs(currentY - a.cy);
                const bVert = Math.abs(currentY - b.cy);
                if (Math.abs(aVert - bVert) < ALIGNMENT_BAND) {
                    return a.cx - currentX - (b.cx - currentX);
                }
                return aVert - bVert;
            });
            break;

        default:
            filtered = [];
    }

    return filtered.length > 0 ? filtered[0]!.el : null;
}
