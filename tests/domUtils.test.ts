import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    getFocusableElements,
    getFocusableElementsInViewport,
    invalidateFocusableElementsCache,
    calculateGridDimensions,
    isElementInViewport,
    ensureStatusElement,
    updateStatusElement,
    setGamepadContext,
} from '../src/utils/domUtils';

describe('getFocusableElements', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        invalidateFocusableElementsCache();
    });
    afterEach(() => {
        vi.restoreAllMocks();
        invalidateFocusableElementsCache();
    });

    it('finds standard focusable elements and skips disabled ones', () => {
        document.body.innerHTML = `
            <button id="b1">one</button>
            <button id="b2" disabled>two</button>
            <a href="#x" id="a1">link</a>
            <div id="plain">nope</div>`;
        const els = getFocusableElements();
        const ids = els.map((e) => e.id);
        expect(ids).toContain('b1');
        expect(ids).toContain('a1');
        expect(ids).not.toContain('b2');
        expect(ids).not.toContain('plain');
    });

    it('returns [] and warns when the container selector matches nothing', () => {
        const els = getFocusableElements('#does-not-exist');
        expect(els).toEqual([]);
    });

    it('honors gamepad-index mode (only [gamepad-index="true"])', () => {
        document.body.innerHTML = `
            <button id="b1">one</button>
            <button id="b2" gamepad-index="true">two</button>`;
        const els = getFocusableElements(null, true);
        expect(els.map((e) => e.id)).toEqual(['b2']);
    });

    it('filters out elements hidden via display:none', () => {
        document.body.innerHTML = `<button id="b1">one</button><button id="b2">two</button>`;
        vi.spyOn(window, 'getComputedStyle').mockImplementation(
            (el: Element) =>
                ({
                    display: (el as HTMLElement).id === 'b2' ? 'none' : 'block',
                    visibility: 'visible',
                    opacity: '1',
                }) as CSSStyleDeclaration
        );
        const els = getFocusableElements();
        expect(els.map((e) => e.id)).toEqual(['b1']);
    });

    it('memoizes results until invalidated', () => {
        document.body.innerHTML = `<button id="b1">one</button>`;
        const first = getFocusableElements();
        expect(first).toHaveLength(1);

        // Add a button WITHOUT invalidating — the memo should still report the old count.
        document.body.insertAdjacentHTML('beforeend', '<button id="b2">two</button>');
        expect(getFocusableElements()).toHaveLength(1);

        // After invalidation it re-scans and picks up the new element.
        invalidateFocusableElementsCache();
        expect(getFocusableElements()).toHaveLength(2);
    });

    it('returns a fresh array copy from the cache (callers can mutate safely)', () => {
        document.body.innerHTML = `<button id="b1">one</button>`;
        const a = getFocusableElements();
        a.pop();
        expect(getFocusableElements()).toHaveLength(1);
    });

    it('getFocusableElementsInViewport delegates with onlyViewport=true', () => {
        document.body.innerHTML = `<button id="b1">one</button>`;
        // jsdom lays everything out at 0x0 so the viewport filter excludes everything; we only
        // assert the convenience wrapper runs the viewport path and returns an array.
        expect(Array.isArray(getFocusableElementsInViewport())).toBe(true);
    });
});

describe('isElementInViewport', () => {
    it('treats an element overlapping the viewport as visible', () => {
        const el = {
            getBoundingClientRect: () => ({ top: 10, left: 10, right: 20, bottom: 20 }),
        } as Element;
        expect(isElementInViewport(el)).toBe(true);
    });

    it('treats an element fully above the viewport as not visible', () => {
        const el = {
            getBoundingClientRect: () => ({ top: -100, left: 10, right: 20, bottom: -50 }),
        } as Element;
        expect(isElementInViewport(el)).toBe(false);
    });
});

describe('calculateGridDimensions', () => {
    it('returns 0x0 for no elements', () => {
        expect(calculateGridDimensions([], document.body)).toEqual({ rows: 0, cols: 0 });
    });

    it('derives columns from CSS grid-template-columns when present', () => {
        const container = document.createElement('div');
        vi.spyOn(window, 'getComputedStyle').mockReturnValue({
            getPropertyValue: (p: string) => (p === 'grid-template-columns' ? '1fr 1fr 1fr' : ''),
        } as unknown as CSSStyleDeclaration);
        const els = Array.from({ length: 6 }, () => document.createElement('div'));
        expect(calculateGridDimensions(els, container)).toEqual({ rows: 2, cols: 3 });
    });

    it('falls back to positional grouping by row when no CSS grid', () => {
        vi.spyOn(window, 'getComputedStyle').mockReturnValue({
            getPropertyValue: () => 'none',
        } as unknown as CSSStyleDeclaration);
        const make = (top: number) => ({ getBoundingClientRect: () => ({ top }) }) as Element;
        // Two rows of two (tops 0,0 and 100,100).
        const els = [make(0), make(0), make(100), make(100)];
        expect(calculateGridDimensions(els, document.body)).toEqual({ rows: 2, cols: 2 });
    });
});

describe('status element helpers', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('ensureStatusElement creates a marked element once and reuses it', () => {
        const a = ensureStatusElement('gp-status');
        expect(a.getAttribute('data-gamepad-auto-created')).toBe('true');
        const b = ensureStatusElement('gp-status');
        expect(b).toBe(a);
    });

    it('updateStatusElement reflects connection state for auto-created elements', () => {
        ensureStatusElement('gp-status');
        updateStatusElement('gp-status', 'xbox', true);
        const el = document.getElementById('gp-status')!;
        expect(el.textContent).toContain('xbox');
        updateStatusElement('gp-status', 'xbox', false);
        expect(el.textContent).toContain('Waiting');
    });

    it('setGamepadContext tags the body', () => {
        setGamepadContext('menu');
        expect(document.body.getAttribute('data-gamepad-context')).toBe('menu');
    });
});
