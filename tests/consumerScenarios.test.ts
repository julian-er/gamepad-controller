import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    cleanupGamepadService,
    gamepadService,
    gamepadUtils,
    initCustomEventGamepad,
    initDualContextGamepad,
} from '../src/factory';
import { makeElementsVisible } from './helpers';

beforeEach(() => {
    document.body.innerHTML = '';
    makeElementsVisible();
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [] });
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1 as unknown as number);
    vi.spyOn(window, 'cancelAnimationFrame').mockReturnValue(undefined);
});

afterEach(() => {
    cleanupGamepadService();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
});

describe('consumer factory scenarios', () => {
    it('owns one page instance and exposes safe façade queries before and after cleanup', () => {
        expect(gamepadUtils.getInstance()).toBeNull();
        expect(gamepadUtils.getCurrentIndex()).toBe(-1);
        expect(gamepadUtils.getElements()).toEqual([]);
        expect(gamepadUtils.navigateToIndex(0)).toBe(false);
        expect(gamepadUtils.navigateToElement(document.createElement('button'))).toBe(false);
        expect(gamepadUtils.getNavigationInfo()).toBeNull();

        document.body.innerHTML = '<section id="app"><button>one</button><button>two</button></section>';
        const first = gamepadService('#app', { autoCreateStatusElement: false, useDataAttributes: false });
        const targets = gamepadUtils.getElements();
        expect(gamepadUtils.getInstance()).toBe(first);
        expect(targets).toHaveLength(2);
        expect(gamepadUtils.navigateToElement(targets[1]!)).toBe(true);
        expect(gamepadUtils.getCurrentElement()).toBe(targets[1]);
        expect(gamepadUtils.getNavigationInfo()).toMatchObject({ totalElements: 2, navigationEnabled: true });

        // A new factory call destroys the old service and replaces the shared instance.
        const replacement = gamepadService('#app', { autoCreateStatusElement: false });
        expect(replacement).not.toBe(first);
        expect(gamepadUtils.getInstance()).toBe(replacement);
        gamepadUtils.cleanup();
        expect(gamepadUtils.getInstance()).toBeNull();
        expect(gamepadUtils.isConnected()).toBe(false);
    });

    it('supports explicit navigation while automatic navigation is disabled', () => {
        document.body.innerHTML = '<section id="app"><button>one</button><button>two</button></section>';
        const service = gamepadService('#app', {
            enableNavigation: false,
            autoCreateStatusElement: false,
        });
        service.setElements(Array.from(document.querySelectorAll('#app button')));

        expect(service.options.enableNavigation).toBe(false);
        expect(gamepadUtils.navigateToIndex(1)).toBe(true);
        expect(gamepadUtils.getCurrentIndex()).toBe(1);
    });

    it('configures the public custom-event factory and accepts a snapshot-only connection', () => {
        const service = initCustomEventGamepad({ autoCreateStatusElement: false });
        const connect = vi.fn();
        service.on('controllerconnect', connect);

        window.dispatchEvent(new CustomEvent('hubgamepadstatechanged', {
            detail: { gamepad: {
                index: 0, id: 'host', buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
                axes: [0, 0, 0, 0], mapping: 'standard', timestamp: 1,
            } },
        }));

        expect(service.options.useCustomEvents).toBe(true);
        expect(service.options.customStateChangedEvent).toBe('hubgamepadstatechanged');
        expect(connect).toHaveBeenCalledTimes(1);
        service.resetInput();
        expect(service.isControllerConnected()).toBe(false);
    });

    it('drives menu/content contexts through shoulder and stick public workflows', () => {
        document.body.innerHTML = `
          <nav class="nav-menu"><a class="nav-item" href="/first">first</a><a class="nav-item" href="/second">second</a></nav>
          <main class="content"><button>alpha</button><button>beta</button></main>`;
        const service = initDualContextGamepad({
            menuContextSelector: '.nav-menu',
            contentContextSelector: '.content',
            autoCreateStatusElement: false,
            debounceTime: 0,
        });
        const manager = service.contextManager;
        const menu = gamepadUtils.getMenuContext();
        const content = gamepadUtils.getContentContext();

        expect(gamepadUtils.isDualContextEnabled()).toBe(true);
        expect(menu?.getElements()).toHaveLength(2);
        expect(content?.getElements()).toHaveLength(2);
        expect(manager.handleShoulderNavigation('R1')).toBe(true);
        expect(manager.getActiveContext()).toBe(menu);
        expect(manager.handleStickNavigation('right')).toBe(true);
        expect(manager.getActiveContext()).toBe(content);
        expect(gamepadUtils.switchToContext('missing')).toBe(false);
        expect(gamepadUtils.switchToMenu()).toBe(true);
        expect(gamepadUtils.switchToContent()).toBe(true);
    });

    it('keeps dual contexts inside an explicit scope and clears it for later navigation', () => {
        document.body.innerHTML = `
          <nav class="nav-menu"><button>menu</button></nav>
          <main class="content"><section id="scope"><button>inside</button></section><button id="outside">outside</button></main>`;
        const service = initDualContextGamepad({
            menuContextSelector: '.nav-menu', contentContextSelector: '.content', autoCreateStatusElement: false,
        });
        const scope = document.querySelector('#scope')!;
        const outside = document.querySelector('#outside')!;
        service.setActiveScope(scope);
        expect(service.getContext('content')?.navigateToIndex(1)).toBe(false);
        service.clearActiveScope();
        expect(service.getContext('content')?.getElements()).toContain(outside);
    });
});
