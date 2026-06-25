<template>
  <div>
    <!-- 搜索栏 -->
    <div class="search-bar">
      <input 
        v-model="keyword" 
        @keyup.enter="doSearch" 
        placeholder="🔍 搜索帖子标题..."
        class="search-input"
        ref="searchInput"
      />
      
      <!-- ✅ 搜索范围选择（默认迅搜搜索） -->
      <select v-model="searchScope" class="search-select">
  <option value="full">🔍 全文搜索（迅搜）</option>
  <option value="title">📝 只搜标题</option>
</select>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AccordionMenu from '../components/AccordionMenu.vue'

const route = useRoute()
const router = useRouter()
const keyword = ref('')
const searchResults = ref([])
const searchInput = ref(null)
const currentPage = ref(1)
const totalPages = ref(0)
const totalResults = ref(0)
const searchScope = ref('full')  // ✅ 默认全文搜索

// ✅ 硬编码 API 地址
const API_BASE = 'https://www.dadaozjzhitojian.cloud/sina/ff/safe_api.php'

const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

const doSearch = async () => {
  const kw = keyword.value.trim()
  if (!kw) {
    searchResults.value = []
    router.replace('/')
    return
  }
  try {
    // ✅ 传递搜索范围参数
    const res = await fetch(`${API_BASE}?action=search&keyword=${encodeURIComponent(kw)}&page=${currentPage.value}&scope=${searchScope.value}`)
    const data = await res.json()
    if (data.code === 0) {
      searchResults.value = data.data
      totalResults.value = data.total || 0
      totalPages.value = data.total_pages || 0
      router.replace(`/?from=search&keyword=${encodeURIComponent(kw)}&page=${currentPage.value}&scope=${searchScope.value}`)
    } else {
      searchResults.value = []
    }
  } catch (error) {
    console.error('搜索失败:', error)
    searchResults.value = []
  }
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  doSearch()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const saveSearchState = () => {
  sessionStorage.setItem('searchKeyword', keyword.value)
  sessionStorage.setItem('searchResults', JSON.stringify(searchResults.value))
  sessionStorage.setItem('currentPage', String(currentPage.value))
  sessionStorage.setItem('searchScope', searchScope.value)
}

const clearSearch = () => {
  keyword.value = ''
  searchResults.value = []
  currentPage.value = 1
  totalPages.value = 0
  totalResults.value = 0
  sessionStorage.removeItem('searchKeyword')
  sessionStorage.removeItem('searchResults')
  sessionStorage.removeItem('currentPage')
  sessionStorage.removeItem('searchScope')
  router.replace('/')
}

const restoreSearchState = () => {
  const savedKeyword = sessionStorage.getItem('searchKeyword')
  const savedResults = sessionStorage.getItem('searchResults')
  const savedPage = sessionStorage.getItem('currentPage')
  const savedScope = sessionStorage.getItem('searchScope')
  
  if (route.query.from === 'search') {
    if (savedKeyword) keyword.value = savedKeyword
    if (savedPage) currentPage.value = parseInt(savedPage) || 1
    if (savedScope) searchScope.value = savedScope
    if (savedResults) {
      try {
        searchResults.value = JSON.parse(savedResults)
      } catch (e) {}
    }
    nextTick(() => {
      if (searchInput.value) searchInput.value.focus()
    })
  } else {
    if (!route.query.keyword) {
      sessionStorage.removeItem('searchKeyword')
      sessionStorage.removeItem('searchResults')
      sessionStorage.removeItem('currentPage')
      sessionStorage.removeItem('searchScope')
    }
  }
}

onMounted(() => {
  const urlKeyword = route.query.keyword
  if (urlKeyword) {
    keyword.value = decodeURIComponent(urlKeyword)
    currentPage.value = parseInt(route.query.page) || 1
    searchScope.value = route.query.scope || 'title'
    doSearch()
  } else {
    restoreSearchState()
  }
})
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 10px;
  margin: 20px auto;
  padding: 0 20px;
  max-width: 800px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}
.search-input {
  flex: 1;
  min-width: 180px;
  padding: 10px 16px;
  border: 2px solid #d8b898;
  border-radius: 8px;
  font-size: 16px;
  background: #fff;
  outline: none;
  transition: border-color 0.3s;
}
.search-input:focus {
  border-color: #42b983;
}
.search-select {
  padding: 10px 12px;
  border: 2px solid #d8b898;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  cursor: pointer;
  outline: none;
}
.search-select:focus {
  border-color: #42b983;
}
.search-btn {
  padding: 10px 28px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}
.search-btn:hover {
  background: #359b6d;
}
.clear-btn {
  padding: 10px 16px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
}
.clear-btn:hover {
  background: #c0392b;
}

.search-results {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px 20px;
}
.search-results h2 {
  color: #2c3e50;
  border-bottom: 2px solid #42b983;
  padding-bottom: 10px;
}
.search-results ul {
  list-style: none;
  padding: 0;
}
.search-results li {
  padding: 12px 15px;
  background: white;
  margin-bottom: 8px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  transition: 0.2s;
}
.search-results li:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}
.search-results a {
  text-decoration: none;
  color: #2c3e50;
  font-weight: 500;
}
.search-results a:hover {
  color: #42b983;
}
.search-results .author {
  color: #888;
  font-size: 14px;
}
.search-results .meta {
  color: #aaa;
  font-size: 12px;
  float: right;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding: 15px 0;
  border-top: 1px solid #eee;
}
.pagination button {
  padding: 8px 20px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.pagination button:hover:not(:disabled) {
  background: #359b6d;
}
.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pagination .page-info {
  font-size: 14px;
  color: #666;
}
</style>