import { describe, expect, it, vi } from 'vitest';
import { createCustomEventGameLoop } from '../src/core/gamepadEventHandler';
import { GamepadService } from '../src/service/GamepadService';
import type { PlatformAdapter, WindowEventListener } from '../src/platform/PlatformAdapter';
import type { GamepadEventState } from '../src/interfaces/GamepadEvents';
import type { NavigationState } from '../src/interfaces/NavigationState';
import { pad } from './helpers';

describe('input lifecycle regressions', () => {
    it('does not add another custom listener after disconnect then init', () => {
        const listeners = new Map<string, Set<WindowEventListener>>();
        const platform: PlatformAdapter = {
            isBrowser: true, now: () => 0, getGamepads: () => [], requestAnimationFrame: () => 1,
            cancelAnimationFrame: () => {}, assignLocation: () => {}, historyBack: () => {}, createMutationObserver: () => null,
            addWindowListener: (type, listener) => { let entries = listeners.get(type); if (!entries) listeners.set(type, entries = new Set()); entries.add(listener); },
            removeWindowListener: (type, listener) => listeners.get(type)?.delete(listener),
        };
        const service = new GamepadService({ platform, useCustomEvents: true, enableNavigation: false });
        service.init();
        const disconnect = listeners.get('hubgamepaddisconnected')!;
        for (const listener of disconnect) listener({ gamepad: pad({ index: 0 }) } as unknown as Event);
        service.init();

        expect(listeners.get('hubgamepadstatechanged')?.size).toBe(1);
        service.destroy();
    });

    it('does not consume queued host edges after a raw callback resets input', () => {
        const button = document.createElement('button');
        document.body.append(button);
        const state: GamepadEventState = {
            isRunning: true, generation: 1, inputEpoch: 0, gamepads: {}, currentControllerType: 'unknown', padInputStates: {},
            animationFrameId: null, statusElementId: null, onControllerConnect: null, onControllerDisconnect: null,
            onNavigationMenuOpen: null, onBackButton: null, onNavigationRequest: null,
            pendingSnapshots: [pad({ pressed: [] }), pad({ pressed: [0] }), pad({ pressed: [] })],
        };
        const nav: NavigationState = {
            focusedElementIndex: 0, elements: [button], gridDimensions: { rows: 1, cols: 1 },
            options: { enableNavigation: true, enableRightStickScroll: false, enableBackButton: false, enableShoulderNavigation: false },
            onFocus: null, onSelect: null,
        };
        const click = vi.fn(); button.addEventListener('click', click);
        state.onButtonDown = () => { state.inputEpoch = (state.inputEpoch ?? 0) + 1; state.pendingSnapshots = []; };
        const platform = { now: () => 1, requestAnimationFrame: vi.fn(() => 1), cancelAnimationFrame: vi.fn() };

        createCustomEventGameLoop(state, nav, platform as never)();

        expect(click).not.toHaveBeenCalled();
        expect(platform.requestAnimationFrame).toHaveBeenCalledTimes(1);
        button.remove();
    });
});
