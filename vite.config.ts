import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    basicSsl() // Generates self-signed certificates for HTTPS
  ],
  server: {
    https: true,
    host: true, // Listen on all addresses (allows mobile access via IP)
    port: 8082,
    open: false, // Don't auto-open browser
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  optimizeDeps: {
    include: []
  }
});
