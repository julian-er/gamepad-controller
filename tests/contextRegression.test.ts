import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GamepadContextManager, GamepadNavigationContext } from '../src/contexts/GamepadContextManager';

function visibleBox(element: HTMLElement, left = 0): void {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        width: 40, height: 20, top: 0, left, right: left + 40, bottom: 20, x: left, y: 0, toJSON: () => ({}),
    } as DOMRect);
}

beforeEach(() => {
    document.body.innerHTML = '';
});

afterEach(() => vi.restoreAllMocks());

describe('GamepadNavigationContext parity', () => {
    it('clicks before the select notification and emits it once', () => {
        const button = document.createElement('button');
        visibleBox(button);
        document.body.append(button);
        const context = new GamepadNavigationContext('content', { navigationMode: 'spatial', autoDetectElements: false });
        context.elements = [button];
        const order: string[] = [];
        button.addEventListener('click', () => order.push('click'));
        context.on('select', () => order.push('select'));
        context.activate();

        expect(context.select()).toBe(true);
        expect(order).toEqual(['click', 'select']);
    });

    it('rejects an explicitly requested hidden target instead of focusing another target', () => {
        const first = document.createElement('button');
        const hidden = document.createElement('button');
        hidden.hidden = true;
        visibleBox(first, 0);
        visibleBox(hidden, 60);
        document.body.append(first, hidden);
        const context = new GamepadNavigationContext('content', { navigationMode: 'horizontal', autoDetectElements: false });
        context.elements = [first, hidden];
        context.activate();

        expect(context.navigateToIndex(1)).toBe(false);
        expect(context.getCurrentIndex()).toBe(0);
    });

    it('skips temporarily ineligible entries during horizontal navigation', () => {
        const first = document.createElement('button');
        const hidden = document.createElement('button');
        const last = document.createElement('button');
        hidden.hidden = true;
        [first, hidden, last].forEach((element, index) => { visibleBox(element, index * 60); document.body.append(element); });
        const context = new GamepadNavigationContext('menu', { navigationMode: 'horizontal', autoDetectElements: false, wrapNavigation: false });
        context.elements = [first, hidden, last];
        context.activate();

        expect(context.navigate('right')).toBe(true);
        expect(context.getCurrentElement()).toBe(last);
    });

    it('contains focus within an explicit scope', () => {
        const scope = document.createElement('section');
        const inside = document.createElement('button');
        const outside = document.createElement('button');
        visibleBox(inside);
        visibleBox(outside, 80);
        scope.append(inside);
        document.body.append(scope, outside);
        const context = new GamepadNavigationContext('content', { navigationMode: 'horizontal', autoDetectElements: false });
        context.elements = [inside, outside];
        context.setActiveScope(scope);
        context.activate();

        expect(context.navigateToIndex(1)).toBe(false);
        expect(context.getCurrentElement()).toBe(inside);
    });

    it('restores tabindex it owned when the manager is destroyed', () => {
        const target = document.createElement('div');
        visibleBox(target);
        document.body.append(target);
        const manager = new GamepadContextManager();
        const context = manager.registerContext('content', { navigationMode: 'spatial', autoDetectElements: false });
        context.elements = [target];
        manager.setActiveContext('content');
        expect(target.getAttribute('tabindex')).toBe('-1');

        manager.destroy();
        expect(target.hasAttribute('tabindex')).toBe(false);
    });

    it('does not continue a context switch after a focus listener destroys the manager', () => {
        const target = document.createElement('button');
        visibleBox(target);
        document.body.append(target);
        const manager = new GamepadContextManager();
        const context = manager.registerContext('content', { navigationMode: 'spatial', autoDetectElements: false });
        context.elements = [target];
        context.on('focus', () => manager.destroy());

        expect(manager.setActiveContext('content')).toBe(false);
        expect(manager.getActiveContext()).toBeNull();
    });
});
