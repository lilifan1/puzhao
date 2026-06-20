import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist'
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://www.dadaozjzhitojian.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/sina/ff/safe_api.php')
      }
    }
  },
  // 新增：显式定义环境变量，确保构建时生效
  define: {
    'import.meta.env.VITE_API_BASE': JSON.stringify(process.env.VITE_API_BASE || '/api')
  }
})