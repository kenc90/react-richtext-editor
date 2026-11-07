import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const demoRoot = fileURLToPath(new URL('./demo', import.meta.url));

export default defineConfig(({ command }) => ({
  root: demoRoot,
  base: command === 'build' ? '/react-wysiwyg/' : '/',
  build: {
    outDir: '..',
    emptyOutDir: false,
  },
}));
