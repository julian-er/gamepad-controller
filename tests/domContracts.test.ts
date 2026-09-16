import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FocusRenderer } from '../src/dom/FocusRenderer';
import { isEligibleElement } from '../src/dom/eligibility';
import { invalidateFocusableElementsCache } from '../src/utils/domUtils';
import { GamepadContextManager } from '../src/contexts/GamepadContextManager';
import { GamepadService } from '../src/service/GamepadService';

function options(overrides: Record<string, unknown> = {}) {
    return {
        navigationMode: 'spatial' as const,
        useDataAttributes: true,
        autoDetectElements: true,
        wrapNavigation: true,
        ...overrides,
    };
}

function box(element: HTMLElement, left = 0, width = 40, height = 20): void {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        width, height, top: 0, left, right: left + width, bottom: height, x: left, y: 0, toJSON: () => ({}),
    } as DOMRect);
}

function modalMock(): void {
    const original = Element.prototype.matches;
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function (selector: string) {
        if (selector === ':modal') return this instanceof HTMLElement && this.dataset.modal === 'true';
        return original.call(this, selector);
    });
}

beforeEach(() => {
    document.body.innerHTML = '';
    invalidateFocusableElementsCache();
});

afterEach(() => vi.restoreAllMocks());

describe('DOM eligibility contracts', () => {
    it('rejects detached, disabled, inert, hidden ancestor, collapsed, zero-size, and out-of-viewport targets', () => {
        const target = document.createElement('button');
        box(target);
        expect(isEligibleElement(target, {})).toBe(false);

        document.body.append(target);
        target.disabled = true;
        expect(isEligibleElement(target, {})).toBe(false);
        target.disabled = false;
        target.setAttribute('inert', '');
        expect(isEligibleElement(target, {})).toBe(false);
        target.removeAttribute('inert');

        const wrapper = document.createElement('div');
        wrapper.append(target);
        document.body.append(wrapper);
        wrapper.hidden = true;
        expect(isEligibleElement(target, {})).toBe(false);
        wrapper.hidden = false;
        vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => ({
            display: 'block', visibility: element === wrapper ? 'collapse' : 'visible', opacity: '1',
        }) as CSSStyleDeclaration);
        expect(isEligibleElement(target, {})).toBe(false);
        vi.restoreAllMocks();
        box(target, 0, 0, 20);
        expect(isEligibleElement(target, {})).toBe(false);
        box(target, -100, 40, 20);
        expect(isEligibleElement(target, { onlyViewport: true })).toBe(false);
    });

    it.each(['grid', 'spatial', 'horizontal'] as const)('keeps manual base references across temporary ineligibility in %s mode', (navigationMode) => {
        const first = document.createElement('button');
        const middle = document.createElement('button');
        const last = document.createElement('button');
        [first, middle, last].forEach((element, index) => { box(element, index * 50); document.body.append(element); });
        const renderer = new FocusRenderer(options({ navigationMode }));
        renderer.setElements([first, middle, last]);

        middle.hidden = true;
        expect(renderer.getElements()).toEqual([first, middle, last]);
        expect(renderer.navigateToIndex(1)).toBe(false);
        middle.remove();
        expect(renderer.getElements()).toEqual([first, middle, last]);
        document.body.append(middle);
        middle.hidden = false;
        expect(renderer.navigateToIndex(1)).toBe(true);
        expect(renderer.getCurrentIndex()).toBe(1);
    });

    it('does not auto-discover targets when autoDetectElements is false and none were registered', () => {
        const button = document.createElement('button');
        box(button);
        document.body.append(button);
        const renderer = new FocusRenderer(options({ autoDetectElements: false }));

        renderer.detectElements();
        expect(renderer.getElements()).toEqual([]);
    });

    it('discovers new automatic targets on refresh and owns temporary tabindex only while focused', () => {
        const first = document.createElement('div');
        box(first);
        document.body.append(first);
        const renderer = new FocusRenderer(options());
        renderer.setElements([first]);
        renderer.updateFocus(true);
        expect(document.activeElement).toBe(first);
        expect(first.getAttribute('tabindex')).toBe('-1');

        renderer.clearElements();
        expect(first.hasAttribute('tabindex')).toBe(false);

        const second = document.createElement('button');
        box(second, 60);
        document.body.append(second);
        invalidateFocusableElementsCache();
        renderer.detectElements();
        expect(renderer.getElements()).toContain(second);
    });

    it('intersects an explicit scope with a mocked native modal and restores nested native scope focus', () => {
        modalMock();
        const outer = document.createElement('dialog');
        outer.open = true;
        outer.dataset.modal = 'true';
        const explicit = document.createElement('section');
        const outerTarget = document.createElement('button');
        const excluded = document.createElement('button');
        explicit.append(outerTarget);
        outer.append(explicit, excluded);
        const inner = document.createElement('dialog');
        inner.open = true;
        inner.dataset.modal = 'true';
        const innerTarget = document.createElement('button');
        inner.append(innerTarget);
        [outerTarget, excluded, innerTarget].forEach((element, index) => box(element, index * 50));
        document.body.append(outer, inner);

        const renderer = new FocusRenderer(options());
        renderer.setElements([outerTarget, excluded, innerTarget]);
        renderer.setActiveScope(explicit);
        renderer.detectElements();
        expect(renderer.navigateToIndex(1)).toBe(false);
        expect(renderer.navigateToIndex(2)).toBe(false);
        expect(renderer.navigateToIndex(0)).toBe(false); // native inner modal intersects explicit outer scope

        inner.remove();
        renderer.detectElements();
        expect(renderer.navigateToIndex(0)).toBe(true);
        expect(renderer.getCurrentElement()).toBe(outerTarget);
    });
});

describe('dual-context lifecycle contracts', () => {
    it('does not emit select bookkeeping after a click handler destroys its manager', () => {
        const button = document.createElement('button');
        box(button);
        document.body.append(button);
        const manager = new GamepadContextManager();
        const context = manager.registerContext('content', { navigationMode: 'spatial', autoDetectElements: false });
        context.elements = [button];
        manager.setActiveContext('content');
        const select = vi.fn();
        context.on('select', select);
        button.addEventListener('click', () => manager.destroy());

        expect(context.select()).toBe(false);
        expect(select).not.toHaveBeenCalled();
        expect(manager.getActiveContext()).toBeNull();
    });
});

describe('native keyboard focus synchronization', () => {
    it('adopts externally focused eligible element as the service cursor', () => {
        vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1 as unknown as number);
        vi.spyOn(window, 'cancelAnimationFrame').mockReturnValue(undefined);
        Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [] });
        const first = document.createElement('button');
        const second = document.createElement('button');
        const third = document.createElement('button');
        [first, second, third].forEach((element, index) => { box(element, index * 50); document.body.append(element); });
        const service = new GamepadService({ autoDetectElements: false, navigationMode: 'horizontal' });
        service.setElements([first, second, third]);
        service.init();

        third.focus(); // Represents Tab or mouse focus originating outside gamepad input.
        expect(service.getCurrentElement()).toBe(third);
        expect(service.getCurrentIndex()).toBe(2);

        service.destroy();
    });
});
