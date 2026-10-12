import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  // 读取 .env.[mode] (含本地覆盖项), 用于多环境并行开发
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
    },
    server: {
      // 默认保持原值 (5173); 可用 .env 里的 VITE_PORT 覆盖
      port: Number(env.VITE_PORT) || 5173,
      proxy: {
        // 开发时 /api → 本地 Spring Boot; 生产由 nginx 反代, 前端代码零改动
        '/api': {
          target: env.VITE_API_TARGET || 'http://localhost:8080',
          changeOrigin: true
        }
      }
    }
  }
})
