import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true, // Позволяет доступ извне (нужно для туннелей)
    allowedHosts: [
      '.tuna.am', // Разрешить все поддомены tuna.am
      'localhost',
      '127.0.0.1'
    ],
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
