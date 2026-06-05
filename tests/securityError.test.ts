import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GamepadService } from '../src/core/GamepadService';

// Verifies the runtime resilience guard: when navigator.getGamepads() is blocked by policy
// (throws SecurityError), the polling loop must survive, keep scheduling frames, and surface
// the error exactly once via the `gamepaderror` event.
describe('GamepadService — getGamepads() blocked by policy', () => {
    let rafCb: FrameRequestCallback | null = null;

    beforeEach(() => {
        rafCb = null;
        Object.defineProperty(navigator, 'getGamepads', {
            value: () => {
                throw new DOMException('blocked by permissions policy', 'SecurityError');
            },
            configurable: true,
            writable: true,
        });
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
            rafCb = cb;
            return 1 as unknown as number;
        });
        vi.spyOn(window, 'cancelAnimationFrame').mockReturnValue(undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    const frame = () => rafCb?.(performance.now());

    it('emits gamepaderror once and keeps the loop alive', () => {
        const onError = vi.fn();
        const svc = new GamepadService({ debounceTime: 0 });
        svc.on('gamepaderror', onError);

        // init() detects existing gamepads (guarded) and starts the loop.
        expect(() => svc.init()).not.toThrow();

        // Step several frames — each getGamepads() throws, but the loop must not crash and the
        // error is only surfaced a single time (not once per frame).
        expect(() => {
            frame();
            frame();
            frame();
        }).not.toThrow();

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);

        svc.destroy();
    });
});
