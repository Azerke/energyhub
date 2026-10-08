import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'pwa-manifest-headers',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url?.startsWith('/manifest.json')) {
              res.setHeader('Content-Type', 'application/manifest+json');
              res.setHeader('Cache-Control', 'no-cache');
            } else if (req.url?.startsWith('/sw.js') || req.url?.startsWith('/dev-sw.js')) {
              res.setHeader('Content-Type', 'application/javascript');
              res.setHeader('Service-Worker-Allowed', '/');
              res.setHeader('Cache-Control', 'no-cache');
              if (req.url?.startsWith('/dev-sw.js')) {
                req.url = '/sw.js';
              }
            }
            next();
          });
        },
      },
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
