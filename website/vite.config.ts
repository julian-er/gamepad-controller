import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
    base: './',
    resolve: {
        alias: {
            'gamepad-controller': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
        },
    },
    server: { fs: { allow: ['..'] } },
});
