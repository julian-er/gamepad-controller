import { describe, expect, it } from 'vitest';
import {
    controllerPreview,
    controllerPreviewFromSnapshot,
    identifyController,
    NativePreviewSelector,
    resolvePreviewVisualStyle,
} from '../src/demos/controller-preview';

function gamepad({
    index,
    id = `Pad ${index}`,
    mapping = 'standard',
    values = {},
    axes = [0, 0, 0, 0],
    timestamp = 1,
}: {
    index: number;
    id?: string;
    mapping?: GamepadMappingType;
    values?: Record<number, number>;
    axes?: number[];
    timestamp?: number;
}) {
    return {
        index,
        id,
        mapping,
        connected: true,
        timestamp,
        buttons: Array.from({ length: 17 }, (_, buttonIndex) => ({
            pressed: (values[buttonIndex] ?? 0) > 0,
            touched: (values[buttonIndex] ?? 0) > 0,
            value: values[buttonIndex] ?? 0,
        })),
        axes,
    } as Gamepad;
}

describe('native preview selection', () => {
    it('starts with the lowest index, retains it while idle, and switches on input above the axis threshold', () => {
        const selector = new NativePreviewSelector();
        expect(selector.update([gamepad({ index: 2 }), null, gamepad({ index: 0 })]).index).toBe(0);
        expect(selector.update([gamepad({ index: 0, timestamp: 2 }), gamepad({ index: 2, axes: [0.15, 0, 0, 0], timestamp: 2 })]).index).toBe(0);
        const selected = selector.update([
            gamepad({ index: 0, timestamp: 3 }),
            gamepad({ index: 2, axes: [0.16, 0.25, 0.5, 1], timestamp: 3 }),
        ]);
        expect(selected.index).toBe(2);
        expect(selected.axes).toEqual([0.16, 0.25, 0.5, 1]);
        expect(selected.buttons[1]).toEqual({ pressed: false, value: 0 });
    });

    it('uses the lowest simultaneous candidate and never combines duplicate-id devices', () => {
        const selector = new NativePreviewSelector();
        selector.update([
            gamepad({ index: 0, id: 'Same controller' }),
            gamepad({ index: 1, id: 'Same controller' }),
            gamepad({ index: 2, id: 'Same controller' }),
        ]);
        const selected = selector.update([
            gamepad({ index: 0, id: 'Same controller', timestamp: 2 }),
            gamepad({ index: 1, id: 'Same controller', values: { 6: 0.25 }, axes: [1, 0, 0, 0], timestamp: 2 }),
            gamepad({ index: 2, id: 'Same controller', values: { 7: 1 }, axes: [0, 1, 0, 0], timestamp: 2 }),
        ]);
        expect(selected.index).toBe(1);
        expect(selected.buttons[6]).toEqual({ pressed: true, value: 0.25 });
        expect(selected.buttons[7]).toEqual({ pressed: false, value: 0 });
        expect(selected.axes).toEqual([1, 0, 0, 0]);
    });

    it('keeps the displayed lowest index when it and another pad act simultaneously', () => {
        const selector = new NativePreviewSelector();
        selector.update([gamepad({ index: 0 }), gamepad({ index: 2 })]);
        const selected = selector.update([
            gamepad({ index: 0, values: { 0: 1 }, timestamp: 2 }),
            gamepad({ index: 2, values: { 1: 1 }, timestamp: 2 }),
        ]);
        expect(selected.index).toBe(0);
        expect(selected.buttons[0]?.value).toBe(1);
        expect(selected.buttons[1]?.value).toBe(0);
    });

    it('baselines a newly connected held pad before allowing it to take presentation', () => {
        const selector = new NativePreviewSelector();
        selector.update([gamepad({ index: 0 })]);
        expect(
            selector.update([gamepad({ index: 0, timestamp: 2 }), gamepad({ index: 1, values: { 0: 1 } })]).index
        ).toBe(0);
        expect(
            selector.update([
                gamepad({ index: 0, timestamp: 3 }),
                gamepad({ index: 1, values: { 0: 1 }, timestamp: 2 }),
            ]).index
        ).toBe(0);
        expect(
            selector.update([
                gamepad({ index: 0, timestamp: 4 }),
                gamepad({ index: 1, values: { 0: 0.5 }, timestamp: 3 }),
            ]).index
        ).toBe(1);
    });

    it('selects the lowest remaining device after disconnect and neutralizes invalid values on index reuse', () => {
        const selector = new NativePreviewSelector();
        selector.update([gamepad({ index: 0 }), gamepad({ index: 3 })]);
        expect(selector.update([null, gamepad({ index: 3, timestamp: 2 })]).index).toBe(3);
        const replacement = gamepad({ index: 3, id: 'Replacement', values: { 0: Number.NaN }, axes: [Number.NaN, 2, -2, 0] });
        const selected = selector.update([replacement]);
        expect(selected.id).toBe('Replacement');
        expect(selected.buttons[0]).toEqual({ pressed: false, value: 0 });
        expect(selected.axes).toEqual([0, 1, -1, 0]);
        expect(selector.update([]).connected).toBe(false);
    });
});

describe('controller identity and visual selection', () => {
    it('only assigns model hints from explicit identifiers', () => {
        expect(identifyController('Xbox Wireless Controller')).toEqual({ family: 'xbox', modelHint: 'xbox' });
        expect(identifyController('DualSense Wireless Controller')).toEqual({
            family: 'playstation',
            modelHint: 'dualsense',
        });
        expect(identifyController('Sony Interactive Entertainment controller')).toEqual({
            family: 'playstation',
            modelHint: null,
        });
        expect(identifyController('054c/0ce6 standard gamepad')).toEqual({ family: 'generic', modelHint: null });
    });

    it('keeps unknown and nonstandard devices generic unless the user chooses a visual override', () => {
        const unknown = controllerPreview('native', gamepad({ index: 0, id: 'Vendor device', mapping: '' }));
        expect(resolvePreviewVisualStyle(unknown, 'auto')).toBe('generic');
        expect(resolvePreviewVisualStyle(unknown, 'ps5')).toBe('generic');
        const nonstandardXbox = controllerPreview(
            'native',
            gamepad({ index: 0, id: 'Xbox Wireless Controller', mapping: '' })
        );
        expect(nonstandardXbox.modelHint).toBe('xbox');
        expect(resolvePreviewVisualStyle(nonstandardXbox, 'auto')).toBe('generic');
    });
});

describe('custom-event preview snapshots', () => {
    it('copies valid complete state and rejects malformed state without throwing', () => {
        const source = gamepad({ index: 4, values: { 6: 0.5 }, axes: [0.25, 0.5, 0.75, 1] });
        const preview = controllerPreviewFromSnapshot('simulation', source)!;
        source.buttons[6]!.value = 1;
        source.axes[0] = 1;
        expect(preview.index).toBe(4);
        expect(preview.buttons[6]).toEqual({ pressed: true, value: 0.5 });
        expect(preview.axes).toEqual([0.25, 0.5, 0.75, 1]);
        expect(
            controllerPreviewFromSnapshot('simulation', {
                ...source,
                buttons: [{ pressed: true, value: Number.NaN }],
            })
        ).toBeNull();
        expect(controllerPreviewFromSnapshot('simulation', new Proxy({}, { get: () => { throw new Error('no'); } }))).toBeNull();
    });
});
