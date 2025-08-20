import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,       // permet d’utiliser test(), expect() sans import
    environment: 'jsdom', 
    setupFiles: './tests/setupTests.js'  // ton fichier de setup
  }
});
