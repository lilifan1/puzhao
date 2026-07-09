<template>
  <div class="full-search-container">
    <div class="nav-bar">
      <button @click="goHome" class="home-btn">🏠 首页</button>
      <span class="title">全文搜索</span>
      <button @click="goBack" class="back-btn">← 返回</button>
    </div>
    <div v-if="!keyword" class="empty-tip">
      <p>🔍 请输入搜索关键词</p>
      <p class="sub-tip">在首页搜索框输入关键词后点击“全文”</p>
    </div>
    <iframe 
      v-else
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
  // 1. 从 sessionStorage 恢复关键词
  const savedKeyword = sessionStorage.getItem('fullSearchKeyword')
  if (savedKeyword && !route.query.q) {
    keyword.value = savedKeyword
    router.replace(`/fullsearch?q=${encodeURIComponent(savedKeyword)}`)
  }
  // 2. 从 URL 参数获取
  if (route.query.q) {
    keyword.value = route.query.q
    sessionStorage.setItem('fullSearchKeyword', route.query.q)
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
  const q = keyword.value || ''
  if (q) {
    router.push(`/fullsearch?q=${encodeURIComponent(q)}`)
  } else {
    router.push('/fullsearch')
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

/* ===== 空状态提示 ===== */
.empty-tip {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fef9e7;
  color: #7a5d2e;
}
.empty-tip p {
  font-size: 18px;
  margin: 6px 0;
}
.empty-tip .sub-tip {
  font-size: 14px;
  color: #a07d4a;
}
</style>