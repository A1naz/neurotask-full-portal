import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'neurotask.ru',
      'www.neurotask.ru',
      'staging.neurotask.ru',
      'dev.neurotask.ru'
    ],
    cors: true,
    proxy: {
      // Проксирование API запросов к основному серверу
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 4173,
    host: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'neurotask.ru',
      'www.neurotask.ru',
      'staging.neurotask.ru',
      'dev.neurotask.ru'
    ]
  }
}) 