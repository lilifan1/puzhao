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
      <button @click="doSearch" class="search-btn">搜索</button>
      <button v-if="searchResults.length > 0 || keyword" @click="clearSearch" class="clear-btn">× 清除</button>
    </div>
    
    <!-- 搜索结果 -->
    <div v-if="searchResults.length > 0" class="search-results">
      <h2>📋 搜索结果（{{ searchResults.length }} 条）</h2>
      <ul>
        <li v-for="post in searchResults" :key="post.tid">
          <router-link :to="`/post/${post.tid}?from=search&keyword=${encodeURIComponent(keyword)}`" @click="saveSearchState">
            {{ post.subject }}
          </router-link>
          <span class="author"> - {{ post.author }}</span>
          <span class="meta">{{ formatTime(post.dateline) }}</span>
        </li>
      </ul>
      
      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1">上一页</button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button @click="goToPage(currentPage + 1)" :disabled="currentPage >= totalPages">下一页</button>
      </div>
    </div>
    
    <!-- 手风琴菜单 -->
    <AccordionMenu v-else />
  </div>
</template>

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
    const res = await fetch(`${API_BASE}?action=search&keyword=${encodeURIComponent(kw)}&page=${currentPage.value}`)
    const data = await res.json()
    if (data.code === 0) {
      searchResults.value = data.data
      totalResults.value = data.total || 0
      totalPages.value = data.total_pages || 0
      router.replace(`/?from=search&keyword=${encodeURIComponent(kw)}&page=${currentPage.value}`)
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
  router.replace('/')
}

const restoreSearchState = () => {
  const savedKeyword = sessionStorage.getItem('searchKeyword')
  const savedResults = sessionStorage.getItem('searchResults')
  const savedPage = sessionStorage.getItem('currentPage')
  
  if (route.query.from === 'search') {
    if (savedKeyword) keyword.value = savedKeyword
    if (savedPage) currentPage.value = parseInt(savedPage) || 1
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
    }
  }
}

onMounted(() => {
  const urlKeyword = route.query.keyword
  if (urlKeyword) {
    keyword.value = decodeURIComponent(urlKeyword)
    currentPage.value = parseInt(route.query.page) || 1
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
  min-width: 200px;
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