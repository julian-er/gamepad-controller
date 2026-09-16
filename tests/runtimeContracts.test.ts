import { describe, expect, it, vi } from 'vitest';
import { GamepadService } from '../src/service/GamepadService';
import type { PlatformAdapter, WindowEventListener } from '../src/platform/PlatformAdapter';
import { makeElementsVisible, pad } from './helpers';
import { ActionDispatcher } from '../src/actions/ActionDispatcher';
import type { GamepadEventState } from '../src/interfaces/GamepadEvents';

class RuntimePlatform implements PlatformAdapter {
    isBrowser = true;
    live: (Gamepad | null)[] = [];
    frames = 0;
    callback: FrameRequestCallback | null = null;
    listeners = new Map<string, Set<WindowEventListener>>();
    now = () => 1000;
    requestAnimationFrame = (callback: FrameRequestCallback) => { this.callback = callback; return ++this.frames; };
    cancelAnimationFrame = () => {};
    getGamepads = () => this.live;
    addWindowListener = (type: string, listener: WindowEventListener) => { let set = this.listeners.get(type); if (!set) this.listeners.set(type, set = new Set()); set.add(listener); };
    removeWindowListener = (type: string, listener: WindowEventListener) => this.listeners.get(type)?.delete(listener);
    assignLocation = () => {};
    historyBack = () => {};
    createMutationObserver = () => null;
    frame(): void { this.callback?.(this.now()); }
}

describe('runtime contracts', () => {
    it('reports a throwing default effect without sending completion', () => {
        const error = vi.fn(); const action = vi.fn();
        const state = { isRunning: true, generation: 1, inputEpoch: 0, onError: error, onAction: action } as GamepadEventState;
        const handled = ActionDispatcher.dispatch(state, 'back', pad({}), null, () => { throw new Error('history failed'); });
        expect(handled).toBe(false);
        expect(error).toHaveBeenCalledTimes(1);
        expect(action).not.toHaveBeenCalled();
    });

    it('does not start input when a synchronous focus listener destroys during init', () => {
        makeElementsVisible();
        const platform = new RuntimePlatform();
        const service = new GamepadService({ platform });
        const button = document.createElement('button'); document.body.append(button);
        service.on('focus', () => service.destroy());
        service.init();
        expect(platform.frames).toBe(0);
        button.remove();
    });

    it('does not restore selection styling after a click handler destroys the service', () => {
        makeElementsVisible();
        const platform = new RuntimePlatform();
        const service = new GamepadService({ platform, autoDetectElements: false });
        const button = document.createElement('button'); document.body.append(button);
        service.setElements([button]); service.init();
        button.addEventListener('click', () => service.destroy());
        platform.live = [pad({ pressed: [] })];
        // The first sample establishes button baseline, then the press is actionable.
        platform.frame();
        platform.live = [pad({ pressed: [0] })];
        platform.frame();
        expect(button.hasAttribute('data-gamepad-selected')).toBe(false);
        button.remove();
    });

    it('does not activate a different target when beforeaction moves focus', () => {
        makeElementsVisible();
        const platform = new RuntimePlatform();
        const service = new GamepadService({ platform, autoDetectElements: false });
        const first = document.createElement('button'); const second = document.createElement('button');
        document.body.append(first, second); service.setElements([first, second]); service.init();
        const firstClick = vi.fn(); const secondClick = vi.fn(); const complete = vi.fn();
        first.addEventListener('click', firstClick); second.addEventListener('click', secondClick);
        service.on('beforeaction', (event) => { if (event.type === 'select') service.navigateToIndex(1); });
        service.on('action', complete);
        platform.live = [pad({ pressed: [] })]; platform.frame();
        platform.live = [pad({ pressed: [0] })]; platform.frame();
        expect(firstClick).not.toHaveBeenCalled(); expect(secondClick).not.toHaveBeenCalled(); expect(complete).not.toHaveBeenCalled();
        service.destroy(); first.remove(); second.remove();
    });
});
