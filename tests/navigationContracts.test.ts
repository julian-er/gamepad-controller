import { describe, expect, it } from 'vitest';
import { navigateSpatial } from '../src/navigation/NavigationEngine';
import type { NavigationState } from '../src/interfaces/NavigationState';
import { boxEl } from './helpers';

function state(elements: Element[], focusedElementIndex: number, wrapNavigation: boolean): NavigationState {
    return {
        elements, focusedElementIndex, gridDimensions: { rows: 1, cols: elements.length },
        options: { navigationMode: 'spatial', wrapNavigation }, onFocus: null, onSelect: null,
    };
}

describe('spatial navigation contracts', () => {
    it('wraps each spatial edge to the opposite eligible edge', () => {
        const left = boxEl(0, 0); const middle = boxEl(50, 50); const right = boxEl(100, 100);
        const nav = state([left, middle, right], 0, true);
        navigateSpatial(nav, 'left', () => {}); expect(nav.focusedElementIndex).toBe(2);
        nav.focusedElementIndex = 2; navigateSpatial(nav, 'right', () => {}); expect(nav.focusedElementIndex).toBe(0);
        nav.focusedElementIndex = 0; navigateSpatial(nav, 'up', () => {}); expect(nav.focusedElementIndex).toBe(2);
        nav.focusedElementIndex = 2; navigateSpatial(nav, 'down', () => {}); expect(nav.focusedElementIndex).toBe(0);
    });

    it('does not wrap when disabled and excludes temporarily ineligible base entries', () => {
        const left = boxEl(0, 0); const hidden = boxEl(50, 0); const right = boxEl(100, 0);
        const nav = state([left, hidden, right], 0, false);
        nav.isElementEligible = (element) => element !== hidden;
        navigateSpatial(nav, 'left', () => {});
        expect(nav.focusedElementIndex).toBe(0);
        nav.options.wrapNavigation = true;
        navigateSpatial(nav, 'left', () => {});
        expect(nav.focusedElementIndex).toBe(2);
    });
});
