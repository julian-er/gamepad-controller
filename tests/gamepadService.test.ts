import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GamepadService } from '../src/core/GamepadService';

describe('GamepadService lifecycle', () => {
    beforeEach(() => {
        // jsdom does not implement the Gamepad API — stub it so the native loop is safe.
        Object.defineProperty(navigator, 'getGamepads', {
            value: () => [],
            configurable: true,
            writable: true,
        });
        // Keep the rAF loop from actually scheduling work during the test.
        vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1 as unknown as number);
        vi.spyOn(window, 'cancelAnimationFrame').mockReturnValue(undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('registers and removes native listeners across init()/destroy()', () => {
        const add = vi.spyOn(window, 'addEventListener');
        const remove = vi.spyOn(window, 'removeEventListener');

        const service = new GamepadService();
        service.init();

        expect(add).toHaveBeenCalledWith('gamepadconnected', expect.any(Function));
        expect(add).toHaveBeenCalledWith('gamepaddisconnected', expect.any(Function));
        expect(add).toHaveBeenCalledWith('resize', expect.any(Function));

        service.destroy();

        expect(remove).toHaveBeenCalledWith('gamepadconnected', expect.any(Function));
        expect(remove).toHaveBeenCalledWith('gamepaddisconnected', expect.any(Function));
        expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('removes custom-event listeners on destroy() (no leak — TD-2)', () => {
        const remove = vi.spyOn(window, 'removeEventListener');

        const service = new GamepadService({
            useCustomEvents: true,
            customConnectedEvent: 'myapp-connected',
            customDisconnectedEvent: 'myapp-disconnected',
            customStateChangedEvent: 'myapp-statechanged',
        });
        service.init();
        service.destroy();

        expect(remove).toHaveBeenCalledWith('myapp-connected', expect.any(Function));
        expect(remove).toHaveBeenCalledWith('myapp-disconnected', expect.any(Function));
        expect(remove).toHaveBeenCalledWith('myapp-statechanged', expect.any(Function));
    });

    it('supports multiple independent focus subscribers via on()/off()', () => {
        const service = new GamepadService();
        const a = vi.fn();
        const b = vi.fn();

        const offA = service.on('focus', a);
        service.on('focus', b);

        // Drive a focus change through the public navigation path.
        const btn1 = document.createElement('button');
        const btn2 = document.createElement('button');
        document.body.append(btn1, btn2);
        service.setElements([btn1, btn2]);
        service.navigateToIndex(1);

        expect(a).toHaveBeenCalled();
        expect(b).toHaveBeenCalled();

        a.mockClear();
        b.mockClear();
        offA();
        service.navigateToIndex(0);

        expect(a).not.toHaveBeenCalled();
        expect(b).toHaveBeenCalled();

        service.destroy();
    });
});
