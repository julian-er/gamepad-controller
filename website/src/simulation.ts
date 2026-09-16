import type { Variant } from './components/molecules/Controller/Controller';
export function snapshot(variant: Variant, pressed: Iterable<number> = [], axes: readonly number[] = [0, 0, 0, 0]) {
    const down = new Set(pressed);
    if ([...down].some((index) => !Number.isInteger(index) || index < 0 || index > 16)) {
        throw new RangeError('Button indices must be integers within 0–16.');
    }
    if (axes.length !== 4 || Array.from(axes).some((axis) => !Number.isFinite(axis) || Math.abs(axis) > 1)) {
        throw new RangeError('Snapshots require four finite axes within -1–1.');
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
        buttons: Array.from({ length: 17 }, (_, i) => ({
            pressed: down.has(i),
            touched: down.has(i),
            value: down.has(i) ? 1 : 0,
        })),
        axes: [...axes],
        timestamp: performance.now(),
    };
}
export function sendSnapshot(
    variant: Variant,
    pressed: Iterable<number> = [],
    axes: readonly number[] = [0, 0, 0, 0],
    eventName = 'docs-gamepad-state'
) {
    window.dispatchEvent(new CustomEvent(eventName, { detail: { gamepad: snapshot(variant, pressed, axes) } }));
}
