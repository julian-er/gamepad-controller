import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // jsdom provides window/document for DOM-coupled lifecycle tests.
        // Pure-module tests (controllerUtils, navigationUtils, mappings) run fine here too.
        environment: 'jsdom',
        include: ['tests/**/*.test.ts'],
        globals: true,
    },
});
