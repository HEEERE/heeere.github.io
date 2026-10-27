import {defineConfig} from 'vite';
import {resolve} from 'node:path';

export default defineConfig({
  base: '/',
  publicDir: false,
  define: {__APP_VERSION__: JSON.stringify('1.0.1')},
  build: {
    outDir: 'android/build/web',
    target: 'es2020',
    rollupOptions: {input: {vault: resolve(process.cwd(), 'vault/index.html')}},
  },
});
