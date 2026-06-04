import { describe, it, expect, vi } from 'vitest';
import { getElementDistance, findNearestInDirection, debounce, throttle } from '../src/utils/navigationUtils';

/** Build a fake element whose getBoundingClientRect returns a fixed box. */
function boxEl(left: number, top: number, width = 10, height = 10): Element {
    const el = {
        getBoundingClientRect: () => ({
            left,
            top,
            width,
            height,
            right: left + width,
            bottom: top + height,
            x: left,
            y: top,
            toJSON: () => ({}),
        }),
    };
    return el as unknown as Element;
}

describe('getElementDistance', () => {
    it('computes Euclidean distance between element centers', () => {
        const a = boxEl(0, 0, 0, 0);
        const b = boxEl(3, 4, 0, 0);
        expect(getElementDistance(a, b)).toBeCloseTo(5);
    });
});

describe('findNearestInDirection', () => {
    const current = boxEl(100, 100);
    const above = boxEl(100, 0);
    const below = boxEl(100, 200);
    const left = boxEl(0, 100);
    const right = boxEl(200, 100);
    const all = [current, above, below, left, right];

    it('finds the nearest element up', () => {
        expect(findNearestInDirection(current, all, 'up')).toBe(above);
    });
    it('finds the nearest element down', () => {
        expect(findNearestInDirection(current, all, 'down')).toBe(below);
    });
    it('finds the nearest element left', () => {
        expect(findNearestInDirection(current, all, 'left')).toBe(left);
    });
    it('finds the nearest element right', () => {
        expect(findNearestInDirection(current, all, 'right')).toBe(right);
    });
    it('returns null when no candidate exists in a direction', () => {
        expect(findNearestInDirection(current, [current], 'up')).toBeNull();
    });
});

describe('debounce', () => {
    it('invokes only once after the wait window and can be cancelled', () => {
        vi.useFakeTimers();
        const fn = vi.fn();
        const d = debounce(fn, 100);
        d();
        d();
        d();
        vi.advanceTimersByTime(99);
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(fn).toHaveBeenCalledTimes(1);

        d();
        d.cancel();
        vi.advanceTimersByTime(200);
        expect(fn).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });
});

describe('throttle', () => {
    it('limits invocations to once per delay window', () => {
        let now = 100;
        vi.spyOn(Date, 'now').mockImplementation(() => now);
        const fn = vi.fn();
        const t = throttle(fn, 100);
        t(); // first call at/after a full window -> fires
        t(); // same window -> suppressed
        expect(fn).toHaveBeenCalledTimes(1);
        now = 250;
        t(); // new window -> fires
        expect(fn).toHaveBeenCalledTimes(2);
        vi.restoreAllMocks();
    });
});
