import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Ana projedeki vite.config.js'in yalnız test bölümü (vitrinde derleme ve geliştirme sunucusu yok).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.js'],
    include: ['src/**/*.spec.{js,jsx}'],
    css: false,
  },
});
