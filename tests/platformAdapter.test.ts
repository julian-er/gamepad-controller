import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GamepadService } from '../src/core/GamepadService';
import type { PlatformAdapter, WindowEventListener } from '../src/core/platform/PlatformAdapter';
import { makeElementsVisible, pad } from './helpers';

/**
 * A fully in-memory PlatformAdapter: no real window/navigator/raf. Lets the tests drive frames,
 * swap the live gamepad set, and observe the navigation/back fallbacks deterministically.
 */
class FakePlatformAdapter implements PlatformAdapter {
    isBrowser = true;
    live: (Gamepad | null)[] = [];
    assigned: string[] = [];
    backs = 0;
    private rafCb: FrameRequestCallback | null = null;
    private time = 1000;
    private listeners = new Map<string, Set<WindowEventListener>>();

    now(): number {
        return this.time;
    }
    advance(ms: number): void {
        this.time += ms;
    }
    requestAnimationFrame(cb: FrameRequestCallback): number {
        this.rafCb = cb;
        return 1;
    }
    cancelAnimationFrame(): void {
        this.rafCb = null;
    }
    /** Run the single queued frame callback (the game loop). */
    frame(): void {
        this.rafCb?.(this.now());
    }
    getGamepads(): (Gamepad | null)[] {
        return this.live;
    }
    addWindowListener(type: string, listener: WindowEventListener): void {
        if (!this.listeners.has(type)) this.listeners.set(type, new Set());
        this.listeners.get(type)!.add(listener);
    }
    removeWindowListener(type: string, listener: WindowEventListener): void {
        this.listeners.get(type)?.delete(listener);
    }
    assignLocation(href: string): void {
        this.assigned.push(href);
    }
    historyBack(): void {
        this.backs++;
    }
    createMutationObserver(): MutationObserver | null {
        return null;
    }
}

describe('PlatformAdapter seam', () => {
    beforeEach(() => {
        makeElementsVisible();
        document.body.innerHTML = `
            <button id="a">A</button>
            <button id="b">B</button>
            <button id="c">C</button>
        `;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('drives the input loop through the injected adapter (raf + getGamepads + now)', () => {
        const platform = new FakePlatformAdapter();
        const svc = new GamepadService({
            platform,
            navigationMode: 'grid',
            wrapNavigation: false,
            debounceTime: 0,
            useDataAttributes: true,
        });
        svc.init();

        expect(svc.getCurrentIndex()).toBe(0);

        // In jsdom every element reports rect 0,0 → a single 1×3 grid row. D-pad Right
        // (button 15, +1 within the row) deterministically advances the shared cursor 0 -> 1.
        platform.live = [pad({ index: 0, pressed: [15] })];
        platform.advance(100);
        platform.frame();

        expect(svc.getCurrentIndex()).toBe(1);
        svc.destroy();
    });

    it('falls back to platform.historyBack() when no backbutton subscriber is registered', () => {
        const platform = new FakePlatformAdapter();
        const svc = new GamepadService({ platform, debounceTime: 0, backButtonCooldown: 0 });
        svc.init();

        // Back button (index 1 on standard mapping) with no subscriber -> adapter fallback.
        platform.live = [pad({ index: 0, pressed: [1] })];
        platform.advance(100);
        platform.frame();

        expect(platform.backs).toBe(1);
        svc.destroy();
    });

    it('notifies backbutton subscribers and performs the adapter fallback', () => {
        const platform = new FakePlatformAdapter();
        const svc = new GamepadService({ platform, debounceTime: 0, backButtonCooldown: 0 });
        const onBack = vi.fn();
        svc.on('backbutton', onBack);
        svc.init();

        platform.live = [pad({ index: 0, pressed: [1] })];
        platform.advance(100);
        platform.frame();

        expect(onBack).toHaveBeenCalledTimes(1);
        expect(platform.backs).toBe(1);
        svc.destroy();
    });

    it('no-ops init() when the adapter reports a non-browser environment', () => {
        const platform = new FakePlatformAdapter();
        platform.isBrowser = false;
        const rafSpy = vi.spyOn(platform, 'requestAnimationFrame');

        const svc = new GamepadService({ platform });
        svc.init();

        expect(rafSpy).not.toHaveBeenCalled();
        expect(svc.isControllerConnected()).toBe(false);
        svc.destroy();
    });
});
