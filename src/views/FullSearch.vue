<template>
  <div class="full-search-container">
    <div class="nav-bar">
      <button @click="goBack" class="back-btn">← 返回</button>
      <span class="title">全文搜索</span>
      <button @click="goHome" class="home-btn">🏠 首页</button>
    </div>
    <iframe 
      ref="iframeRef"
      :src="iframeSrc" 
      class="full-search-iframe"
      frameborder="0"
    ></iframe>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const iframeRef = ref(null)
const keyword = ref(route.query.q || '')

onMounted(() => {
  const savedKeyword = sessionStorage.getItem('fullSearchKeyword')
  if (savedKeyword && !keyword.value) {
    keyword.value = savedKeyword
  }
  if (route.query.q) {
    sessionStorage.setItem('fullSearchKeyword', route.query.q)
    keyword.value = route.query.q
  }
})

const iframeSrc = computed(() => {
  const q = keyword.value || ''
  return `https://xuexi.pzyuanman.space/sina/ff/plugin.php?id=twpx_xunsearch&q=${encodeURIComponent(q)}&s=relevance&syn=yes&mod=forum&searchsubmit=yes`
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 回到首页
const goHome = () => {
  router.push('/')
}

const refreshIframe = () => {
  if (iframeRef.value) {
    iframeRef.value.src = iframeSrc.value
  }
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
  flex-shrink: 0;
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
  flex: 1;
}
.home-btn {
  padding: 6px 16px;
  background: #f1c40f;
  color: #fff;
  border: 1px solid #d4ac0d;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}
.home-btn:hover {
  background: #d4ac0d;
}
.full-search-iframe {
  flex: 1;
  width: 100%;
  border: none;
}
</style>