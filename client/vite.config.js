import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
      // Include .jsx files
      include: "**/*.{jsx,js}"
    })
  ],
  
  // Path aliases for cleaner imports
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/pages': resolve(__dirname, './src/pages'), 
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/services': resolve(__dirname, './src/services'),
      '@/store': resolve(__dirname, './src/store'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/styles': resolve(__dirname, './src/styles'),
    },
  },

  // Server configuration (development only)
  server: {
    port: 3000,
    host: true, // Allow external connections
    open: true, // Auto-open browser
    cors: true,
    proxy: {
      // Proxy API calls during development only
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true, // Enable websocket proxy
      }
    }
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
    minify: 'terser',
    target: 'esnext',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', 'lucide-react', 'react-hot-toast'],
          socket: ['socket.io-client'],
          utils: ['axios', 'date-fns', 'zustand', 'clsx'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },

  // Preview configuration (for production preview)
  preview: {
    port: 3000,
    host: true,
    cors: true,
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom', 
      'react-router-dom',
      'framer-motion',
      'socket.io-client',
      'axios',
      'zustand',
      'clsx',
      'date-fns'
    ]
  },
})