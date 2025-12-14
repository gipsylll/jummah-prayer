import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Правильная настройка base для production
    base: process.env.VITE_BASE_PATH || '/'
  },
  // Правильная обработка путей в production
  base: process.env.VITE_BASE_PATH || '/'
})
