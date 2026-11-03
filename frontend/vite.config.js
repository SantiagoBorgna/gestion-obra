import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, las llamadas a /api se reenvían al backend local.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
});
