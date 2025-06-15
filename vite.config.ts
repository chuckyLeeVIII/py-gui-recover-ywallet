import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use the Buffer polyfill when bundling for the browser
const alias = {
  buffer: 'buffer/',
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias,
  },
  // Use relative paths so the build works when opened from the local filesystem
  base: './',
});
