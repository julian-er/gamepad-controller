
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
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T & { cancel: () => void } {
    let timeout: ReturnType<typeof setTimeout>;

    const debouncedFunction = function executedFunction(this: any, ...args: any[]) {
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
export function throttle<T extends (...args: any[]) => void>(func: T, delay: number): T {
    let lastCall = 0;
    return function(this: any, ...args: any[]) {
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
export function findNearestInDirection(currentElement: Element, allElements: Element[], direction: string): Element | null {
    const currentRect = currentElement.getBoundingClientRect();
    const currentX = currentRect.left + currentRect.width / 2;
    const currentY = currentRect.top + currentRect.height / 2;
    
    let candidates = allElements.filter((el: Element) => el !== currentElement);
    
    // Improved directional filtering with better spatial logic
    switch (direction) {
        case 'up':
            candidates = candidates.filter((el: Element) => {
                const rect = el.getBoundingClientRect();
                const elY = rect.top + rect.height / 2;
                const verticalDistance = currentY - elY;
                const isSignificantlyAbove = verticalDistance > 30; // Must be at least 30px above
                if (!isSignificantlyAbove) {
                    console.debug(`[🎮 🕹️ Gamepad Controller] -  ❌ Filtered out: ${el.tagName} at Y=${elY.toFixed(0)} (distance=${verticalDistance.toFixed(0)}px, need >30px)`);
                }
                return isSignificantlyAbove; // Element must be significantly above current
            });
            // Sort by: closest vertically, then closest horizontally
            candidates.sort((a, b) => {
                const rectA = a.getBoundingClientRect();
                const rectB = b.getBoundingClientRect();
                const aY = rectA.top + rectA.height / 2;
                const bY = rectB.top + rectB.height / 2;
                const aX = rectA.left + rectA.width / 2;
                const bX = rectB.left + rectB.width / 2;

                const aVertDistance = currentY - aY;
                const bVertDistance = currentY - bY;
                const aHorDistance = Math.abs(currentX - aX);
                const bHorDistance = Math.abs(currentX - bX);

                // Prioritize smaller vertical distance, then horizontal
                if (Math.abs(aVertDistance - bVertDistance) < 50) {
                    return aHorDistance - bHorDistance;
                }
                return aVertDistance - bVertDistance;
            });
            break;

        case 'down':
            candidates = candidates.filter((el: Element) => {
                const rect = el.getBoundingClientRect();
                const elY = rect.top + rect.height / 2;
                const verticalDistance = elY - currentY;
                const isSignificantlyBelow = verticalDistance > 30; // Must be at least 30px below
                if (!isSignificantlyBelow) {
                    console.debug(`[🎮 🕹️ Gamepad Controller] -  ❌ Filtered out: ${el.tagName} at Y=${elY.toFixed(0)} (distance=${verticalDistance.toFixed(0)}px, need >30px)`);
                }
                return isSignificantlyBelow; // Element must be significantly below current
            });
            candidates.forEach((el, i) => {
                const rect = el.getBoundingClientRect();
                const elY = rect.top + rect.height / 2;
                console.debug(`[🎮 🕹️ Gamepad Controller] -     ${i + 1}. ${el.tagName} at Y=${elY.toFixed(0)} - "${el.textContent?.slice(0, 30)}"`);
            });

            candidates.sort((a, b) => {
                const rectA = a.getBoundingClientRect();
                const rectB = b.getBoundingClientRect();
                const aY = rectA.top + rectA.height / 2;
                const bY = rectB.top + rectB.height / 2;
                const aX = rectA.left + rectA.width / 2;
                const bX = rectB.left + rectB.width / 2;

                const aVertDistance = aY - currentY;
                const bVertDistance = bY - currentY;
                const aHorDistance = Math.abs(currentX - aX);
                const bHorDistance = Math.abs(currentX - bX);

                if (Math.abs(aVertDistance - bVertDistance) < 50) {
                    return aHorDistance - bHorDistance;
                }
                return aVertDistance - bVertDistance;
            });
            break;

        case 'left':
            candidates = candidates.filter((el: Element) => {
                const rect = el.getBoundingClientRect();
                const elX = rect.left + rect.width / 2;
                return elX < currentX; // Element is to the left
            });
            candidates.sort((a, b) => {
                const rectA = a.getBoundingClientRect();
                const rectB = b.getBoundingClientRect();
                const aX = rectA.left + rectA.width / 2;
                const bX = rectB.left + rectB.width / 2;
                const aY = rectA.top + rectA.height / 2;
                const bY = rectB.top + rectB.height / 2;

                const aHorDistance = currentX - aX;
                const bHorDistance = currentX - bX;
                const aVertDistance = Math.abs(currentY - aY);
                const bVertDistance = Math.abs(currentY - bY);

                // Prioritize same row, then closest horizontally
                if (Math.abs(aVertDistance - bVertDistance) < 50) {
                    return aHorDistance - bHorDistance;
                }
                return aVertDistance - bVertDistance;
            });
            break;

        case 'right':
            candidates = candidates.filter((el: Element) => {
                const rect = el.getBoundingClientRect();
                const elX = rect.left + rect.width / 2;
                return elX > currentX; // Element is to the right
            });
            candidates.sort((a, b) => {
                const rectA = a.getBoundingClientRect();
                const rectB = b.getBoundingClientRect();
                const aX = rectA.left + rectA.width / 2;
                const bX = rectB.left + rectB.width / 2;
                const aY = rectA.top + rectA.height / 2;
                const bY = rectB.top + rectB.height / 2;

                const aHorDistance = aX - currentX;
                const bHorDistance = bX - currentX;
                const aVertDistance = Math.abs(currentY - aY);
                const bVertDistance = Math.abs(currentY - bY);

                // Prioritize same row, then closest horizontally
                if (Math.abs(aVertDistance - bVertDistance) < 50) {
                    return aHorDistance - bHorDistance;
                }
                return aVertDistance - bVertDistance;
            });
            break;
    }

    // Return the best candidate (first after sorting)
    const result = candidates.length > 0 ? candidates[0] : null;
    if (result) {
        const resultRect = result.getBoundingClientRect();
    } else {
    }
    return result;
}