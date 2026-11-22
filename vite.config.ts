import { defineConfig } from 'vite';
import playgamaBridge from '@playgama/bridge/vite';

export default defineConfig({
  base: './',
  // the Bridge script goes first in <head>; local mode ships it inside the archive (no external resources, 1.2.5)
  plugins: [playgamaBridge({ mode: 'local' })],
  build: { target: 'es2020', assetsInlineLimit: 0, chunkSizeWarningLimit: 2000 },
  server: { port: 5173 },
  preview: { port: 4173, strictPort: true },
  test: { include: ['tests/**/*.test.ts'] },
});
