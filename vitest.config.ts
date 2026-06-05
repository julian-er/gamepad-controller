import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // jsdom provides window/document for DOM-coupled lifecycle tests.
        // Pure-module tests (controllerUtils, navigationUtils, mappings) run fine here too.
        environment: 'jsdom',
        include: ['tests/**/*.test.ts'],
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: [
                // Type-only declarations and barrel re-exports carry no runtime branches.
                'src/interfaces/**',
                'src/index.ts',
                // Presentational CSS-string injection / example helpers — exercised via the
                // demo pages, not unit-tested.
                'src/utils/cssUtils.ts',
            ],
            // Starting gate — ratchet upward as coverage grows. Functions lag because the
            // `gamepadUtils` façade and some context-manager DOM paths are not yet unit-tested.
            thresholds: {
                lines: 70,
                functions: 60,
                branches: 70,
                statements: 70,
            },
        },
    },
});
