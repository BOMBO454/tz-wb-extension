import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // card.wb.ru does not send ACAO for browser origins
      '/api/wb/card': {
        target: 'https://card.wb.ru',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/wb\/card/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://www.wildberries.ru')
            proxyReq.setHeader('Referer', 'https://www.wildberries.ru/')
          })
        },
      },
    },
  },
  preview: {
    proxy: {
      '/api/wb/card': {
        target: 'https://card.wb.ru',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/wb\/card/, ''),
      },
    },
  },
})
