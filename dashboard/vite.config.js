import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL: Relative paths for HA panel_custom
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined, // Single bundle for simplicity
      },
    },
  },
  server: {
    port: 5173,
    host: true, // Allow network access for testing
    proxy: {
      // Proxy Home Assistant API requests to avoid CORS
      '/api': {
        target: process.env.VITE_HA_URL || 'http://100.65.202.84:8123',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Add authorization header from env
            const token = process.env.VITE_HA_TOKEN;
            if (token) {
              proxyReq.setHeader('Authorization', `Bearer ${token}`);
            }
          });
        },
      },
    },
  },
})
