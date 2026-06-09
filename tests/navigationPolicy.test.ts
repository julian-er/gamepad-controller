import { describe, it, expect, vi } from 'vitest';
import { NavigationPolicy } from '../src/core/NavigationPolicy';
import { TypedEmitter } from '../src/core/EventEmitter';
import type { GamepadServiceEventMap } from '../src/core/GamepadService';
import type { PlatformAdapter } from '../src/core/platform/PlatformAdapter';

function fakePlatform(overrides: Partial<PlatformAdapter> = {}): PlatformAdapter {
    return {
        isBrowser: true,
        now: () => 0,
        requestAnimationFrame: () => 1,
        cancelAnimationFrame: () => {},
        getGamepads: () => [],
        addWindowListener: () => {},
        removeWindowListener: () => {},
        assignLocation: vi.fn(),
        historyBack: vi.fn(),
        createMutationObserver: () => null,
        ...overrides,
    };
}

describe('NavigationPolicy', () => {
    describe('requestBack', () => {
        it('emits backbutton when a subscriber is registered (no history fallback)', () => {
            const emitter = new TypedEmitter<GamepadServiceEventMap>();
            const platform = fakePlatform();
            const onBack = vi.fn();
            emitter.on('backbutton', onBack);

            new NavigationPolicy(emitter, platform).requestBack();

            expect(onBack).toHaveBeenCalledTimes(1);
            expect(platform.historyBack).not.toHaveBeenCalled();
        });

        it('falls back to platform.historyBack() when nobody is subscribed', () => {
            const emitter = new TypedEmitter<GamepadServiceEventMap>();
            const platform = fakePlatform();

            new NavigationPolicy(emitter, platform).requestBack();

            expect(platform.historyBack).toHaveBeenCalledTimes(1);
        });

        it('does nothing outside a browser environment with no subscriber', () => {
            const emitter = new TypedEmitter<GamepadServiceEventMap>();
            const platform = fakePlatform({ isBrowser: false });

            new NavigationPolicy(emitter, platform).requestBack();

            expect(platform.historyBack).not.toHaveBeenCalled();
        });
    });

    describe('requestNavigation', () => {
        it('emits navigationrequest with href + element when subscribed (no location fallback)', () => {
            const emitter = new TypedEmitter<GamepadServiceEventMap>();
            const platform = fakePlatform();
            const onNav = vi.fn();
            const el = {} as Element;
            emitter.on('navigationrequest', onNav);

            new NavigationPolicy(emitter, platform).requestNavigation('/next', el);

            expect(onNav).toHaveBeenCalledWith('/next', el);
            expect(platform.assignLocation).not.toHaveBeenCalled();
        });

        it('falls back to platform.assignLocation() when nobody is subscribed', () => {
            const emitter = new TypedEmitter<GamepadServiceEventMap>();
            const platform = fakePlatform();

            new NavigationPolicy(emitter, platform).requestNavigation('/next', {} as Element);

            expect(platform.assignLocation).toHaveBeenCalledWith('/next');
        });
    });
});
