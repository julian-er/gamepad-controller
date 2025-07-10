// navigationUtils.ts
// Navigation-specific utility functions

// Debounce function for input handling
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
    let timeout: ReturnType<typeof setTimeout>;
    return function executedFunction(this: any, ...args: any[]) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    } as T;
}

// Throttle function for continuous input
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

// Get distance between two elements (for nearest neighbor navigation)
export function getElementDistance(el1: Element, el2: Element): number {
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();
    
    const x1 = rect1.left + rect1.width / 2;
    const y1 = rect1.top + rect1.height / 2;
    const x2 = rect2.left + rect2.width / 2;
    const y2 = rect2.top + rect2.height / 2;
    
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Find nearest element in a specific direction
export function findNearestInDirection(currentElement: Element, allElements: Element[], direction: string): Element | null {
    const currentRect = currentElement.getBoundingClientRect();
    const currentX = currentRect.left + currentRect.width / 2;
    const currentY = currentRect.top + currentRect.height / 2;
    
    let candidates = allElements.filter((el: Element) => el !== currentElement);
    
    // Filter candidates based on direction
    switch (direction) {
        case 'up':
            candidates = candidates.filter((el: Element) => {
                const rect = el.getBoundingClientRect();
                return rect.top + rect.height / 2 < currentY;
            });
            break;
        case 'down':
            candidates = candidates.filter((el: Element) => {
                const rect = el.getBoundingClientRect();
                return rect.top + rect.height / 2 > currentY;
            });
            break;
        case 'left':
            candidates = candidates.filter((el: Element) => {
                const rect = el.getBoundingClientRect();
                return rect.left + rect.width / 2 < currentX;
            });
            break;
        case 'right':
            candidates = candidates.filter((el: Element) => {
                const rect = el.getBoundingClientRect();
                return rect.left + rect.width / 2 > currentX;
            });
            break;
    }
    
    if (candidates.length === 0) return null;
    
    // Find the closest candidate
    let nearest = candidates[0];
    let shortestDistance = getElementDistance(currentElement, nearest);
    
    for (let i = 1; i < candidates.length; i++) {
        const distance = getElementDistance(currentElement, candidates[i]);
        if (distance < shortestDistance) {
            shortestDistance = distance;
            nearest = candidates[i];
        }
    }
    
    return nearest;
} 