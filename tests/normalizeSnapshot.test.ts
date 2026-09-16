import { describe, expect, it } from 'vitest';
import { normalizeSnapshot } from '../src/input/normalizeSnapshot';

function validSnapshot() {
    return {
        index: 0,
        id: 'Host controller',
        buttons: [{ pressed: false, value: 0, touched: false }],
        axes: [0, -1, 1],
        connected: true,
        mapping: 'standard',
        timestamp: 1,
    };
}

describe('normalizeSnapshot', () => {
    it('returns an owned Gamepad copy for a valid native-like snapshot', () => {
        const nativeLikeButton = Object.create({ platform: 'native' }) as { pressed: boolean; value: number; touched: boolean };
        nativeLikeButton.pressed = true;
        nativeLikeButton.value = 1;
        nativeLikeButton.touched = true;
        const input = { ...validSnapshot(), buttons: [nativeLikeButton] };

        const result = normalizeSnapshot(input);

        expect(result).toMatchObject({ index: 0, id: 'Host controller', mapping: 'standard' });
        expect(result?.buttons[0]).toEqual({ pressed: true, value: 1, touched: true });
    });

    it('owns arrays and button records instead of retaining host event detail', () => {
        const input = validSnapshot();
        const result = normalizeSnapshot(input);
        input.axes[0] = 0.5;
        input.buttons[0]!.pressed = true;

        expect(result?.axes[0]).toBe(0);
        expect(result?.buttons[0]?.pressed).toBe(false);
        expect(result?.axes).not.toBe(input.axes);
        expect(result?.buttons).not.toBe(input.buttons);
    });

    it.each([
        { ...validSnapshot(), index: Number.MAX_SAFE_INTEGER + 1 },
        { ...validSnapshot(), buttons: [{ pressed: true, value: 1.1 }] },
        { ...validSnapshot(), buttons: [{ pressed: true, touched: 'yes' }] },
        { ...validSnapshot(), axes: [Number.NaN] },
        { ...validSnapshot(), axes: [-1.01] },
        { ...validSnapshot(), mapping: 'xinput' },
        { ...validSnapshot(), timestamp: -1 },
        { ...validSnapshot(), connected: 'true' },
    ])('rejects malformed snapshot data', (input) => {
        expect(normalizeSnapshot(input)).toBeNull();
    });

    it('rejects a throwing accessor without propagating it', () => {
        const input = validSnapshot();
        Object.defineProperty(input, 'id', { get: () => { throw new Error('untrusted getter'); } });

        expect(() => normalizeSnapshot(input)).not.toThrow();
        expect(normalizeSnapshot(input)).toBeNull();
    });
});
