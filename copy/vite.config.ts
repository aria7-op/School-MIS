import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),tailwindcss()],
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@theme': path.resolve(__dirname, './src/theme'),
      '@navigation': path.resolve(__dirname, './src/navigation'),
      '@auth': path.resolve(__dirname, './src/auth')
    }
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          utils: ['axios', 'date-fns', 'clsx']
        }
      }
    }
  },
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 3000,
    open: true,
    fs: {
      allow: [path.resolve(__dirname, '..')]
    }
  },
  preview: {
    fs: {
      allow: [path.resolve(__dirname, '..')]
    }
  }
}) 