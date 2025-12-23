import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    force: true
  },
  server: {
    host: '0.0.0.0'
  },
  define: {
    global: "window",
  },
resolve: {
    alias: {
      stream: 'stream-browserify',
      buffer: 'buffer',
      process: 'process/browser',
      events: 'events',
      util: 'util',
    },
  },
});
