// Collapses the public, backward-compatible GamepadServiceConfig (flat fields + optional
// nested groups) into the flat GamepadServiceOptions the runtime consumes. Nested group
// values take precedence over their flat equivalents.

import type { GamepadServiceConfig, GamepadServiceOptions } from '../interfaces/GamepadServiceOptions.js';

/**
 * Flattens a {@link GamepadServiceConfig} into the canonical flat options shape.
 * Only defined nested values override a flat value, so a partial group cannot erase it.
 */
export function normalizeOptions(config: GamepadServiceConfig = {}): GamepadServiceOptions {
    const { navigation, input, styling, status, scrolling, context, customEvents, platform, ...flat } = config;
    void platform;

    for (const group of [navigation, input, styling, status, scrolling, context, customEvents]) {
        if (!group) continue;
        for (const [key, value] of Object.entries(group)) {
            if (value !== undefined) (flat as Record<string, unknown>)[key] = value;
        }
    }

    return flat;
}
