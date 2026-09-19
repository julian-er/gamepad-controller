import type { Variant } from './components/molecules/Controller/Controller';
export type SimulationButtonValues = Readonly<Record<number, number>> | ReadonlyMap<number, number>;

function buttonValue(values: SimulationButtonValues, index: number) {
    return typeof (values as ReadonlyMap<number, number>).get === 'function'
        ? (values as ReadonlyMap<number, number>).get(index)
        : (values as Readonly<Record<number, number>>)[index];
}

export function snapshot(
    variant: Variant,
    pressed: Iterable<number> = [],
    axes: readonly number[] = [0, 0, 0, 0],
    values: SimulationButtonValues = {}
) {
    const down = new Set(pressed);
    if ([...down].some((index) => !Number.isInteger(index) || index < 0 || index > 16)) {
        throw new RangeError('Button indices must be integers within 0–16.');
    }
    if (axes.length !== 4 || Array.from(axes).some((axis) => !Number.isFinite(axis) || Math.abs(axis) > 1)) {
        throw new RangeError('Snapshots require four finite axes within -1–1.');
    }
    const valueEntries =
        typeof (values as ReadonlyMap<number, number>).entries === 'function'
            ? (values as ReadonlyMap<number, number>).entries()
            : Object.entries(values);
    for (const [index, value] of valueEntries) {
        const numericIndex = Number(index);
        if (!Number.isInteger(numericIndex) || numericIndex < 0 || numericIndex > 16) {
            throw new RangeError('Button value indices must be integers within 0–16.');
        }
        if (!Number.isFinite(value) || value < 0 || value > 1) {
            throw new RangeError('Button values must be finite within 0–1.');
        }
    }
    return {
        index: 0,
        id:
            variant === 'playstation'
                ? 'DualSense simulation'
                : variant === 'xbox'
                  ? 'Xbox simulation'
                  : 'Generic arcade simulation',
        connected: true,
        mapping: 'standard',
        buttons: Array.from({ length: 17 }, (_, i) => {
            const value = buttonValue(values, i) ?? (down.has(i) ? 1 : 0);
            return { pressed: down.has(i), touched: value > 0, value };
        }),
        axes: [...axes],
        timestamp: performance.now(),
    };
}
export function sendSnapshot(
    variant: Variant,
    pressed: Iterable<number> = [],
    axes: readonly number[] = [0, 0, 0, 0],
    eventName = 'docs-gamepad-state',
    values: SimulationButtonValues = {}
) {
    window.dispatchEvent(new CustomEvent(eventName, { detail: { gamepad: snapshot(variant, pressed, axes, values) } }));
}
