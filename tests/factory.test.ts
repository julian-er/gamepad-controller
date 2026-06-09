import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { gamepadService, cleanupGamepadService, initGamepadForPage } from '../src/factory';
import { GamepadService } from '../src/core/GamepadService';

describe('factory — shared instance lifecycle', () => {
    beforeEach(() => {
        Object.defineProperty(navigator, 'getGamepads', {
            value: () => [],
            configurable: true,
            writable: true,
        });
        vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1 as unknown as number);
        vi.spyOn(window, 'cancelAnimationFrame').mockReturnValue(undefined);
    });

    afterEach(() => {
        cleanupGamepadService();
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('returns an initialized GamepadService', () => {
        const svc = gamepadService();
        expect(svc).toBeInstanceOf(GamepadService);
    });

    it('destroys the previous instance when called again (no leak)', () => {
        const first = gamepadService();
        const destroySpy = vi.spyOn(first, 'destroy');
        const second = gamepadService();
        expect(destroySpy).toHaveBeenCalled();
        expect(second).not.toBe(first);
    });

    it('cleanupGamepadService destroys and clears the shared instance', () => {
        const svc = gamepadService();
        const destroySpy = vi.spyOn(svc, 'destroy');
        cleanupGamepadService();
        expect(destroySpy).toHaveBeenCalled();
        // A second cleanup is a harmless no-op.
        expect(() => cleanupGamepadService()).not.toThrow();
    });

    it('passes grouped options through the factory to the service (groups win)', () => {
        const svc = gamepadService(null, {
            navigationMode: 'grid',
            navigation: { navigationMode: 'spatial' },
        });
        expect(svc.options.navigationMode).toBe('spatial');
    });

    it('initGamepadForPage produces a working instance', () => {
        const svc = initGamepadForPage();
        expect(svc).toBeInstanceOf(GamepadService);
        expect(svc.options.navigationMode).toBe('spatial');
    });
});
