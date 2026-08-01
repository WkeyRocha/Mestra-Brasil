import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        'mestra-brasil': resolve(import.meta.dirname, 'mestra-brasil.html'),
      },
    },
  },
});
