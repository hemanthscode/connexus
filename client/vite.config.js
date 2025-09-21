import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 3000,
    host: true,
    open: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/hooks': resolve(__dirname, 'src/hooks'),
      '@/services': resolve(__dirname, 'src/services'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/store': resolve(__dirname, 'src/store'),
      '@/pages': resolve(__dirname, 'src/pages')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000
  }
})
