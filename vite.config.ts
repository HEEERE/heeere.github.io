import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {defineConfig} from 'vitest/config';

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {version: string};

export default defineConfig({
  base: '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    watch: {
      // The editor/sandbox writes through temporary dot-directories; watching
      // them makes chokidar crash with EBUSY on Windows. Poll instead of using
      // native events and ignore everything temporary.
      usePolling: true,
      interval: 400,
      ignored: ['**/.*', '**/.*/**', '**/tmp/**', '**/dist/**', '**/node_modules/**'],
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 1800,
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        vault: resolve(process.cwd(), 'vault/index.html'),
      },
      output: {
        manualChunks: {
          'three-vendor': ['three'],
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
