import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa para poder servirla desde GitHub Pages o cualquier subcarpeta
export default defineConfig({
  base: './',
  plugins: [react()],
});
