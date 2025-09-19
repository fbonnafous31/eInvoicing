import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      react: fileURLToPath(new URL('./node_modules/react', import.meta.url)),
      'react-dom': fileURLToPath(new URL('./node_modules/react-dom', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setupTests.js',
    include: [
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov'],
      all: true,
      include: ['src/**/*.{js,ts,jsx,tsx}'],
      exclude: ['node_modules/', 'tests/'],
    },
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        runScripts: 'dangerously',
      },
    },
  },
});
