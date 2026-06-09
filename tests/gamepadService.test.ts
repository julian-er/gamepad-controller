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

// ---------------------------------------------------------------------------
// End-to-end native loop: two controllers + a headset, manually stepped rAF.
// ---------------------------------------------------------------------------

function pad(opts: {
    id: string;
    index: number;
    pressed?: number[];
    buttons?: number;
    axes?: number[];
    mapping?: GamepadMappingType;
}): Gamepad {
    const pressed = opts.pressed ?? [];
    return {
        id: opts.id,
        index: opts.index,
        connected: true,
        mapping: opts.mapping ?? 'standard',
        timestamp: performance.now(),
        buttons: Array.from({ length: opts.buttons ?? 17 }, (_, i) => ({
            pressed: pressed.includes(i),
            touched: pressed.includes(i),
            value: pressed.includes(i) ? 1 : 0,
        })),
        axes: opts.axes ?? [0, 0, 0, 0],
        vibrationActuator: null,
    } as unknown as Gamepad;
}

const XBOX = 'HID-compliant game controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)';
const PS = 'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)';
const HEADSET = 'Microsoft Modern USB Headset (Vendor: 045e Product: 0837)';

describe('GamepadService native loop — two controllers + headset', () => {
    let rafCb: FrameRequestCallback | null = null;
    let live: (Gamepad | null)[] = [];

    beforeEach(() => {
        rafCb = null;
        live = [];
        Object.defineProperty(navigator, 'getGamepads', {
            value: () => live,
            configurable: true,
            writable: true,
        });
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
            rafCb = cb;
            return 1 as unknown as number;
        });
        vi.spyOn(window, 'cancelAnimationFrame').mockReturnValue(undefined);
        // jsdom lays everything out at 0x0; treat elements as visible so they're navigable.
        Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
            configurable: true,
            get() {
                return document.body;
            },
        });
        document.body.innerHTML = `
          <div class="container">
            <div class="card" tabindex="0">A</div>
            <div class="card" tabindex="0">B</div>
            <div class="card" tabindex="0">C</div>
          </div>`;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    const frame = () => rafCb?.(performance.now());

    it('lets BOTH the Xbox and PS pads move the shared cursor while both stay connected', () => {
        // Headset at index 0 (invalid), Xbox at 1, PS at 2.
        const headset = pad({ id: HEADSET, index: 0, buttons: 7, axes: [], mapping: '' as GamepadMappingType });
        live = [headset, pad({ id: XBOX, index: 1 }), pad({ id: PS, index: 2 })];

        const svc = new GamepadService({
            containerSelector: '.container',
            navigationMode: 'grid',
            wrapNavigation: false,
            useDataAttributes: false,
            debounceTime: 0,
        });
        svc.init();
        frame();

        expect(svc.getControllerTypes().sort()).toEqual(['playstation', 'xbox']);
        const start = svc.getCurrentIndex();

        // Xbox presses D-pad Right -> cursor advances by one.
        live = [headset, pad({ id: XBOX, index: 1, pressed: [15] }), pad({ id: PS, index: 2 })];
        frame();
        const afterXbox = svc.getCurrentIndex();
        expect(afterXbox).toBeGreaterThan(start);

        // Without disconnecting the Xbox, the PS pad also advances the SAME cursor.
        live = [headset, pad({ id: XBOX, index: 1 }), pad({ id: PS, index: 2, pressed: [15] })];
        frame();
        expect(svc.getCurrentIndex()).toBeGreaterThan(afterXbox);

        svc.destroy();
    });
});
