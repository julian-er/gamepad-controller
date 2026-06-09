// normalizeOptions.ts
// Collapses the public, backward-compatible GamepadServiceConfig (flat fields + optional
// nested groups) into the flat GamepadServiceOptions the runtime consumes. Nested group
// values take precedence over their flat equivalents.

import type { GamepadServiceConfig, GamepadServiceOptions } from '../interfaces/GamepadServiceOptions.js';

/**
 * Flattens a {@link GamepadServiceConfig} into the canonical flat {@link GamepadServiceOptions}.
 * Only keys explicitly present in a nested group override the flat value (so partial groups are
 * safe and never clobber a flat field with `undefined`).
 * @param config - The user-supplied configuration (flat and/or grouped)
 * @returns A flat options object with grouped values merged in (groups win)
 */
export function normalizeOptions(config: GamepadServiceConfig = {}): GamepadServiceOptions {
    // Start from the flat fields, then strip the group containers and the (non-serializable)
    // platform dependency off the copy so they never land in the flat runtime options.
    const { navigation, input, styling, status, scrolling, context, customEvents, platform, ...flat } = config;
    void platform;

    const groups = [navigation, input, styling, status, scrolling, context, customEvents];
    for (const group of groups) {
        if (!group) continue;
        for (const [key, value] of Object.entries(group)) {
            // Only defined keys override — a partial group can't erase a flat field.
            if (value !== undefined) {
                (flat as Record<string, unknown>)[key] = value;
            }
        }
    }

    return flat;
}
