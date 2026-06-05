import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    navigateGrid,
    navigateToIndex,
    handleSelection,
    handleBackButton,
    handleScrolling,
    handleShoulderNavigation,
} from '../src/core/gamepadNavigation';
import type { NavigationState } from '../src/interfaces/NavigationState';
import type { GamepadServiceOptions } from '../src/interfaces/GamepadServiceOptions';

function navState(over: Partial<NavigationState> = {}): NavigationState {
    const options: GamepadServiceOptions = { wrapNavigation: true, navigationMode: 'grid', useDataAttributes: true };
    return {
        focusedElementIndex: 0,
        elements: [],
        gridDimensions: { rows: 1, cols: 1 },
        options,
        onFocus: null,
        onSelect: null,
        ...over,
    };
}

function buttons(n: number): Element[] {
    return Array.from({ length: n }, (_, i) => {
        const b = document.createElement('button');
        b.textContent = String(i);
        document.body.appendChild(b);
        return b;
    });
}

describe('navigateGrid', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('moves right within bounds', () => {
        const els = buttons(4);
        const state = navState({ elements: els, gridDimensions: { rows: 1, cols: 4 }, focusedElementIndex: 0 });
        const cb = vi.fn();
        navigateGrid(state, 'right', cb);
        expect(state.focusedElementIndex).toBe(1);
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it('wraps from the last element to the first when wrapNavigation is on', () => {
        const els = buttons(4);
        const state = navState({ elements: els, gridDimensions: { rows: 1, cols: 4 }, focusedElementIndex: 3 });
        navigateGrid(state, 'right', vi.fn());
        expect(state.focusedElementIndex).toBe(0);
    });

    it('clamps at the last element when wrapNavigation is off', () => {
        const els = buttons(4);
        const state = navState({
            elements: els,
            gridDimensions: { rows: 1, cols: 4 },
            focusedElementIndex: 3,
            options: { wrapNavigation: false, navigationMode: 'grid' },
        });
        navigateGrid(state, 'right', vi.fn());
        expect(state.focusedElementIndex).toBe(3);
    });
});

describe('navigateToIndex', () => {
    beforeEach(() => (document.body.innerHTML = ''));

    it('moves to a valid index and fires the callback', () => {
        const els = buttons(3);
        const state = navState({ elements: els });
        const cb = vi.fn();
        expect(navigateToIndex(state, 2, cb)).toBe(true);
        expect(state.focusedElementIndex).toBe(2);
        expect(cb).toHaveBeenCalled();
    });

    it('rejects an out-of-range index', () => {
        const els = buttons(3);
        const state = navState({ elements: els });
        expect(navigateToIndex(state, 5, vi.fn())).toBe(false);
        expect(state.focusedElementIndex).toBe(0);
    });
});

describe('handleSelection (single context)', () => {
    beforeEach(() => (document.body.innerHTML = ''));

    it('toggles the selected data-attribute and fires onSelect + click', () => {
        const els = buttons(2);
        const click = vi.spyOn(els[0] as HTMLElement, 'click');
        const onSelect = vi.fn();
        const state = navState({ elements: els, focusedElementIndex: 0, onSelect });

        handleSelection(state);
        expect((els[0] as HTMLElement).getAttribute('data-gamepad-selected')).toBe('true');
        expect(onSelect).toHaveBeenCalledWith(els[0], 0);
        expect(click).toHaveBeenCalled();

        // Selecting again toggles back to focused (deselected).
        handleSelection(state);
        expect((els[0] as HTMLElement).getAttribute('data-gamepad-selected')).toBeNull();
    });

    it('delegates to the context manager in dual-context mode', () => {
        const cm = { handleSelection: vi.fn() } as unknown as Parameters<typeof handleSelection>[1];
        const state = navState({ options: { enableDualContext: true } });
        handleSelection(state, cm);
        expect((cm as { handleSelection: ReturnType<typeof vi.fn> }).handleSelection).toHaveBeenCalled();
    });
});

describe('handleBackButton', () => {
    it('prefers the provided callback over history.back()', () => {
        const cb = vi.fn();
        const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
        handleBackButton(cb);
        expect(cb).toHaveBeenCalled();
        expect(back).not.toHaveBeenCalled();
        back.mockRestore();
    });

    it('falls back to history.back() when no callback is given', () => {
        const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
        handleBackButton(null);
        expect(back).toHaveBeenCalled();
        back.mockRestore();
    });
});

describe('handleScrolling', () => {
    afterEach(() => vi.restoreAllMocks());

    it('scrolls the window by stick * 10 * speed', () => {
        const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
        handleScrolling(0.5, -0.2, 2);
        expect(scrollBy).toHaveBeenCalledWith(0.5 * 20, -0.2 * 20);
    });

    it('scrolls a container when the selector matches', () => {
        const div = document.createElement('div');
        div.id = 'scroller';
        document.body.appendChild(div);
        // jsdom doesn't implement Element.scrollBy — install a stub before asserting.
        const scrollBy = vi.fn();
        (div as unknown as { scrollBy: typeof scrollBy }).scrollBy = scrollBy;
        handleScrolling(1, 0, 1, '#scroller');
        expect(scrollBy).toHaveBeenCalledWith(10, 0);
    });
});

describe('handleShoulderNavigation', () => {
    beforeEach(() => (document.body.innerHTML = ''));

    it('invokes onNavigationMenuOpen with the pressed button', () => {
        const onOpen = vi.fn();
        const state = navState({ options: { navigationMenuSelector: '.nav' } });
        handleShoulderNavigation(state, 'R1', undefined, onOpen);
        expect(onOpen).toHaveBeenCalledWith('R1');
    });

    it('delegates to the context manager in dual-context mode', () => {
        const cm = { handleShoulderNavigation: vi.fn() } as unknown as Parameters<typeof handleShoulderNavigation>[2];
        const state = navState({ options: { enableDualContext: true } });
        handleShoulderNavigation(state, 'L1', cm);
        expect((cm as { handleShoulderNavigation: ReturnType<typeof vi.fn> }).handleShoulderNavigation).toHaveBeenCalledWith(
            'L1'
        );
    });
});
