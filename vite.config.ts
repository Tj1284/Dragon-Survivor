import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { target: 'es2020', assetsInlineLimit: 0, chunkSizeWarningLimit: 2000 },
  server: { port: 5173 },
  preview: { port: 4173, strictPort: true },
  test: { include: ['tests/**/*.test.ts'] },
});
