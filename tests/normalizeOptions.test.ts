import { describe, it, expect } from 'vitest';
import { normalizeOptions } from '../src/core/normalizeOptions';

describe('normalizeOptions', () => {
    it('returns an empty object for no input', () => {
        expect(normalizeOptions()).toEqual({});
    });

    it('passes flat options through unchanged', () => {
        const flat = { navigationMode: 'spatial' as const, deadzone: 0.2, debounceTime: 100 };
        expect(normalizeOptions(flat)).toEqual(flat);
    });

    it('flattens nested groups into flat fields', () => {
        const result = normalizeOptions({
            navigation: { navigationMode: 'grid', deadzone: 0.3 },
            styling: { focusedClass: 'f', scrollBehavior: 'auto' },
            input: { backButtonCooldown: 500 },
        });
        expect(result.navigationMode).toBe('grid');
        expect(result.deadzone).toBe(0.3);
        expect(result.focusedClass).toBe('f');
        expect(result.scrollBehavior).toBe('auto');
        expect(result.backButtonCooldown).toBe(500);
    });

    it('lets nested group values win over flat duplicates', () => {
        const result = normalizeOptions({
            navigationMode: 'spatial',
            navigation: { navigationMode: 'horizontal' },
        });
        expect(result.navigationMode).toBe('horizontal');
    });

    it('does not strip the group container keys from the result', () => {
        const result = normalizeOptions({ navigation: { deadzone: 0.5 } }) as Record<string, unknown>;
        expect(result.navigation).toBeUndefined();
        expect(result.deadzone).toBe(0.5);
    });

    it('a partial group never erases an existing flat field with undefined', () => {
        const result = normalizeOptions({
            deadzone: 0.1,
            navigation: { navigationMode: 'grid' }, // deadzone absent from the group
        });
        expect(result.deadzone).toBe(0.1);
        expect(result.navigationMode).toBe('grid');
    });
});
