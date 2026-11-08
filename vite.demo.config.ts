import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const demoRoot = fileURLToPath(new URL('./demo', import.meta.url));

export default defineConfig(({ command }) => ({
  root: demoRoot,
  base: command === 'build' ? '/react-richtext-editor/' : '/',
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
  },
}));
