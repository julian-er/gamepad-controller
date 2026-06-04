import { describe, it, expect } from 'vitest';
import { isValidGamepad, detectControllerType, applyDeadzone } from '../src/utils/controllerUtils';

function fakeGamepad(partial: Partial<Gamepad> & { id?: string }): Gamepad {
    return {
        id: partial.id ?? 'Generic',
        index: 0,
        connected: true,
        mapping: partial.mapping ?? 'standard',
        timestamp: 0,
        buttons: partial.buttons ?? Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
        axes: partial.axes ?? [0, 0, 0, 0],
        vibrationActuator: null,
    } as unknown as Gamepad;
}

function buttons(n: number) {
    return Array.from({ length: n }, () => ({ pressed: false, touched: false, value: 0 }));
}

describe('isValidGamepad', () => {
    it('returns a real boolean true for a valid gamepad', () => {
        const result = isValidGamepad(fakeGamepad({}));
        expect(result).toBe(true);
        expect(typeof result).toBe('boolean');
    });

    it('returns boolean false (not the falsy operand) for an invalid gamepad', () => {
        const result = isValidGamepad({ buttons: [], axes: [] } as unknown as Gamepad);
        expect(result).toBe(false);
        expect(typeof result).toBe('boolean');
    });

    it('returns false for null/undefined input', () => {
        expect(isValidGamepad(null as unknown as Gamepad)).toBe(false);
        expect(isValidGamepad(undefined as unknown as Gamepad)).toBe(false);
    });

    it('rejects non-controller HID devices reporting buttons but no axes (webcam/headset)', () => {
        // e.g. "Brio 300" webcam / "Microsoft USB Link" headset: 7 buttons, 0 axes, non-standard.
        const camera = fakeGamepad({ id: 'Brio 300', mapping: '' as GamepadMappingType, buttons: buttons(7), axes: [] });
        expect(isValidGamepad(camera)).toBe(false);
    });

    it('accepts a standard-mapped controller even with few inputs', () => {
        const pad = fakeGamepad({ id: 'Wireless Controller', mapping: 'standard', buttons: buttons(4), axes: [0, 0] });
        expect(isValidGamepad(pad)).toBe(true);
    });

    it('accepts a non-standard device that has enough real inputs (>=4 buttons, >=2 axes)', () => {
        const pad = fakeGamepad({ id: 'Generic Pad', mapping: '' as GamepadMappingType, buttons: buttons(12), axes: [0, 0, 0, 0] });
        expect(isValidGamepad(pad)).toBe(true);
    });
});

describe('detectControllerType', () => {
    it('detects Xbox by id', () => {
        expect(detectControllerType(fakeGamepad({ id: 'Xbox Wireless Controller' }))).toBe('xbox');
    });

    it('detects PlayStation by id', () => {
        expect(detectControllerType(fakeGamepad({ id: 'DualSense Wireless Controller' }))).toBe('playstation');
    });

    it('detects Nintendo by id', () => {
        expect(detectControllerType(fakeGamepad({ id: 'Pro Controller' }))).toBe('nintendo');
    });

    it('falls back to unknown for unrecognized ids', () => {
        expect(detectControllerType(fakeGamepad({ id: 'Some Random Pad' }))).toBe('unknown');
    });
});

describe('applyDeadzone', () => {
    it('zeroes values inside the deadzone', () => {
        expect(applyDeadzone(0.05, 0.1)).toBe(0);
        expect(applyDeadzone(-0.09, 0.1)).toBe(0);
    });

    it('passes through values outside the deadzone', () => {
        expect(applyDeadzone(0.5, 0.1)).toBe(0.5);
        expect(applyDeadzone(-0.8, 0.1)).toBe(-0.8);
    });
});
