import { afterEach, describe, expect, it, vi } from 'vitest';
import { GamepadService } from '../src/service/GamepadService';
import type { GamepadServiceConfig } from '../src/interfaces/GamepadServiceOptions';

const invalidConfigs: Array<[string, unknown, RegExp]> = [
    ['boolean option', { enableNavigation: 'yes' }, /enableNavigation must be a boolean/],
    ['navigation enum', { navigationMode: 'diagonal' }, /navigationMode must be grid, spatial, or horizontal/],
    ['scroll enum', { scrollBehavior: 'instant' }, /scrollBehavior must be smooth or auto/],
    ['negative number', { debounceTime: -1 }, /debounceTime must be a finite number >= 0/],
    ['deadzone range', { deadzone: 1.1 }, /deadzone must be between 0 and 1/],
    ['invalid selector', { containerSelector: '[' }, /Invalid selector/],
    ['class token', { focusedClass: 'two tokens' }, /CSS class options must be one non-empty class token/],
];

describe('GamepadService configuration validation', () => {
    afterEach(() => vi.restoreAllMocks());

    it.each(invalidConfigs)('rejects an invalid %s before attaching resources', (_name, config, message) => {
        const addWindowListener = vi.spyOn(window, 'addEventListener');

        expect(() => new GamepadService(config as GamepadServiceConfig)).toThrow(message);
        expect(addWindowListener).not.toHaveBeenCalled();
    });

    it('validates the normalized grouped value rather than an overridden flat value', () => {
        expect(() => new GamepadService({
            enableNavigation: true,
            navigation: { enableNavigation: 'not-a-boolean' as unknown as boolean },
        })).toThrow(/enableNavigation must be a boolean/);
    });
});
