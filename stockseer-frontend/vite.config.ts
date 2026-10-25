import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, frontendRoot, 'VITE_');
  const API_BASE_URL = env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  return {
    define: {
      'process.env': {},
    },
    resolve: {
      alias: {
        '@': path.resolve(frontendRoot, './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: API_BASE_URL,
          changeOrigin: true,
        },
      },
      cors: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },

  };
});
