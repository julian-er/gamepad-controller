import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'GamepadController',
      // ESM-only: with "type": "module" a .js file is treated as ESM.
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [], // you can add external dependencies here
    },
  },
  plugins: [dts({
    insertTypesEntry: true,
    outDir: 'dist/types',
  })],
}); 