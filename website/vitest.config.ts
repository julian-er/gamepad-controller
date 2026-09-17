import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
    server: { fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] } },
    resolve: {
        alias: {
            'gamepad-ui-engine': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
        },
    },
    test: { environment: 'jsdom', include: ['tests/**/*.test.tsx'], globals: false, css: { include: [/\.scss\?raw/] } },
});
