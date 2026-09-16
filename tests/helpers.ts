// Shared test helpers — fake gamepads, navigator/rAF stubbing, and DOM element factories.
// Extracted so the individual suites don't each re-implement the same jsdom scaffolding.

import { vi } from 'vitest';

/** Builds a standard 17-button / 4-axis Gamepad, with the given button indices pressed. */
export function pad(opts: {
    id?: string;
    index?: number;
    pressed?: number[];
    buttons?: number;
    axes?: number[];
    mapping?: GamepadMappingType;
}): Gamepad {
    const pressed = opts.pressed ?? [];
    return {
        id: opts.id ?? 'Generic',
        index: opts.index ?? 0,
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

/** Realistic controller id strings (vendor/product ids embedded as the runtime expects). */
export const CONTROLLER_IDS = {
    xbox: 'HID-compliant game controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)',
    playstation: 'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)',
    headset: 'Microsoft Modern USB Headset (Vendor: 045e Product: 0837)',
} as const;

/**
 * Installs a `navigator.getGamepads` stub backed by a mutable array, plus a manually-stepped
 * `requestAnimationFrame`. Returns helpers to drive frames and swap the live pad set.
 * Call inside `beforeEach`; pair with `vi.restoreAllMocks()` in `afterEach`.
 */
export function installGamepadHarness() {
    const state: { live: (Gamepad | null)[]; rafCb: FrameRequestCallback | null } = { live: [], rafCb: null };

    Object.defineProperty(navigator, 'getGamepads', {
        value: () => state.live,
        configurable: true,
        writable: true,
    });
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
        state.rafCb = cb;
        return 1 as unknown as number;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockReturnValue(undefined);

    return {
        /** Replace the set of pads returned by navigator.getGamepads(). */
        setLive(pads: (Gamepad | null)[]): void {
            state.live = pads;
        },
        /** Run one rAF tick (the game loop's queued callback). */
        frame(): void {
            state.rafCb?.(performance.now());
        },
    };
}

/**
 * Makes jsdom report elements as laid-out/visible. jsdom lays everything out at 0x0 and
 * returns `null` for offsetParent, which the service treats as "not navigable".
 */
export function makeElementsVisible(): void {
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
        configurable: true,
        get() {
            return document.body;
        },
    });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
        const index = Array.from(document.querySelectorAll('*')).indexOf(this);
        const left = Math.max(0, index) * 20;
        return { x: left, y: 0, left, top: 0, right: left + 10, bottom: 10, width: 10, height: 10, toJSON() {} } as DOMRect;
    });
}

/** A minimal Element stub with a fixed bounding box — for pure geometry tests. */
export function boxEl(left: number, top: number, width = 10, height = 10): Element {
    return {
        getBoundingClientRect: () => ({
            left,
            top,
            width,
            height,
            right: left + width,
            bottom: top + height,
            x: left,
            y: top,
            toJSON() {},
        }),
    } as unknown as Element;
}
