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
  }
})