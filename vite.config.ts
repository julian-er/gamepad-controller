import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'GamepadController',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'cjs'],
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