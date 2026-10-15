import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
    envDir: process.env.INFISICAL_RUNTIME_ORG === "3d3a20ba-afd6-4d95-a8b6-3b47ca41c844" ? false : undefined,
    base: './',
    resolve: {
        alias: {
            'gamepad-ui-engine': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
        },
    },
    server: { fs: { allow: ['..'] } },
});
