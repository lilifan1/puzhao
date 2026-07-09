<template>
  <div class="full-search-container">
    <div class="nav-bar">
      <button @click="goBack" class="back-btn">← 返回</button>
      <span class="title">全文搜索</span>
    </div>
    <iframe 
      :src="iframeSrc" 
      class="full-search-iframe"
      frameborder="0"
      @load="onIframeLoad"
    ></iframe>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const keyword = ref(route.query.q || '')

const iframeSrc = computed(() => {
  const q = keyword.value || ''
  return `https://xuexi.pzyuanman.space/sina/ff/plugin.php?id=twpx_xunsearch&q=${encodeURIComponent(q)}&s=relevance&syn=yes&mod=forum&searchsubmit=yes`
})

const goBack = () => {
  router.push('/')
}

const onIframeLoad = () => {
  // iframe 加载完成
}
</script>

<style scoped>
.full-search-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.nav-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fef9e7;
  border-bottom: 1px solid #f0e0b8;
}
.back-btn {
  padding: 6px 16px;
  background: #f7e8b0;
  color: #7a5d2e;
  border: 1px solid #e6c88a;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.back-btn:hover {
  background: #edcfa0;
}
.title {
  font-size: 16px;
  font-weight: 500;
  color: #7a5d2e;
}
.full-search-iframe {
  flex: 1;
  width: 100%;
  border: none;
}
</style>