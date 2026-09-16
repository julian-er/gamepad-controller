import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GamepadContextManager, GamepadNavigationContext } from '../src/contexts/GamepadContextManager';
import { makeElementsVisible } from './helpers';

describe('GamepadContextManager', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        makeElementsVisible();
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
            width: 40, height: 20, top: 0, left: 0, right: 40, bottom: 20, x: 0, y: 0, toJSON: () => ({}),
        } as DOMRect);
    });
    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('registers and retrieves contexts', () => {
        const cm = new GamepadContextManager();
        const ctx = cm.registerContext('menu', { navigationMode: 'horizontal', containerSelector: null });
        expect(ctx).toBeInstanceOf(GamepadNavigationContext);
        expect(cm.getContext('menu')).toBe(ctx);
        expect(cm.getAllContexts()).toContain(ctx);
    });

    it('activates a context and fires onContextSwitch with previous context', () => {
        const cm = new GamepadContextManager();
        cm.registerContext('menu', { navigationMode: 'horizontal', containerSelector: null });
        cm.registerContext('content', { navigationMode: 'spatial', containerSelector: null });

        const onSwitch = vi.fn();
        cm.setContextSwitchCallback(onSwitch);

        expect(cm.setActiveContext('content')).toBe(true);
        expect(cm.getActiveContext()?.id).toBe('content');
        expect(onSwitch).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'content' }), null);

        // Switching deactivates the old context and reports it as the previous one.
        expect(cm.setActiveContext('menu')).toBe(true);
        expect(cm.getActiveContext()?.id).toBe('menu');
        expect(onSwitch).toHaveBeenLastCalledWith(
            expect.objectContaining({ id: 'menu' }),
            expect.objectContaining({ id: 'content' })
        );
    });

    it('returns false when activating an unknown context', () => {
        const cm = new GamepadContextManager();
        expect(cm.setActiveContext('nope')).toBe(false);
        expect(cm.getActiveContext()).toBeNull();
    });

    it('handleNavigation is a no-op (false) with no active context', () => {
        const cm = new GamepadContextManager();
        expect(cm.handleNavigation('up')).toBe(false);
    });
});

describe('GamepadNavigationContext', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        makeElementsVisible();
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
            width: 40, height: 20, top: 0, left: 0, right: 40, bottom: 20, x: 0, y: 0, toJSON: () => ({}),
        } as DOMRect);
    });
    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('detects focusable elements within its container', () => {
        document.body.innerHTML = `
            <div id="c">
              <button>a</button>
              <button>b</button>
            </div>`;
        const ctx = new GamepadNavigationContext('content', {
            navigationMode: 'spatial',
            containerSelector: '#c',
        });
        ctx.detectElements();
        expect(ctx.elements.length).toBe(2);
    });

    it('toggles isActive across activate()/deactivate()', () => {
        const ctx = new GamepadNavigationContext('menu', { navigationMode: 'horizontal', containerSelector: null });
        expect(ctx.isActive).toBe(false);
        ctx.activate();
        expect(ctx.isActive).toBe(true);
        ctx.deactivate();
        expect(ctx.isActive).toBe(false);
    });
});
