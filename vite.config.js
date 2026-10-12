import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: {
    port: 5173,
    proxy: {
      // 开发时 /api → 本地 Spring Boot; 生产由 nginx 反代, 前端代码零改动
      '/api': { target: 'http://localhost:8080', changeOrigin: true }
    }
  }
})
