<template>
  <div class="full-search-container">
    <div class="nav-bar">
      <button @click="goHome" class="home-btn">🏠 首页</button>
      <span class="title">全文搜索</span>
      <button @click="goBack" class="back-btn">← 返回</button>
    </div>
    <iframe 
      ref="iframeRef"
      :src="iframeSrc" 
      class="full-search-iframe"
      frameborder="0"
      allow="fullscreen; autoplay; encrypted-media"
    ></iframe>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const iframeRef = ref(null)
const keyword = ref(route.query.q || '')

// 监听路由参数变化
watch(
  () => route.query.q,
  (newQ) => {
    if (newQ) {
      keyword.value = newQ
      sessionStorage.setItem('fullSearchKeyword', newQ)
    }
  }
)

onMounted(() => {
  const savedKeyword = sessionStorage.getItem('fullSearchKeyword')
  const urlKeyword = route.query.q
  
  if (urlKeyword) {
    keyword.value = urlKeyword
    sessionStorage.setItem('fullSearchKeyword', urlKeyword)
  } else if (savedKeyword) {
    // 如果有保存的关键词，但没有 URL 参数，更新 URL
    keyword.value = savedKeyword
    router.replace(`/fullsearch?q=${encodeURIComponent(savedKeyword)}`)
  } else {
    // 没有关键词，显示空页面
    keyword.value = ''
  }
})

const iframeSrc = computed(() => {
  const q = keyword.value || ''
  return `https://xuexi.pzyuanman.space/sina/ff/plugin.php?id=twpx_xunsearch&q=${encodeURIComponent(q)}&s=relevance&syn=yes&mod=forum&searchsubmit=yes`
})

const goHome = () => {
  sessionStorage.removeItem('fullSearchKeyword')
  router.push('/')
}

const goBack = () => {
  // 如果有关键词，回到迅搜页面并保留关键词
  if (keyword.value) {
    router.push(`/fullsearch?q=${encodeURIComponent(keyword.value)}`)
  } else {
    // 如果没有关键词，回到迅搜页面（空状态）
    router.push('/fullsearch')
  }
}

// 刷新 iframe（保留当前关键词）
const refreshIframe = () => {
  if (iframeRef.value && keyword.value) {
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
.title {
  font-size: 16px;
  font-weight: 500;
  color: #7a5d2e;
  flex: 1;
  text-align: center;
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
.full-search-iframe {
  flex: 1;
  width: 100%;
  border: none;
}
</style>