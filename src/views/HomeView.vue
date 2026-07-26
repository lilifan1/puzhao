<template>
  <div>
    <!-- 搜索栏 -->
    <div class="search-bar">
  <input 
    v-model="keyword" 
    @keyup.enter="doSearch" 
    @input="onSearchInput"
    @focus="onSearchFocus"
    placeholder="🔍 关键词空格隔开"
    class="search-input"
    ref="searchInput"
    autocomplete="off"
  />
  <button @click="doSearch" class="search-btn">搜索</button>
  <router-link 
  :to="`/fullsearch?q=${encodeURIComponent(keyword)}`" 
  class="full-search-link"
>
  📚全文
</router-link>
  <button v-if="searchResults.length > 0 || keyword" @click="clearSearch" class="clear-btn">× 清除</button>
</div>
    
    <!-- ===== 搜索建议下拉 ===== -->
    <div v-if="suggestions.length > 0" class="suggestions">
      <div v-if="isKeywordSuggestion" class="suggestion-tags">
        <span 
          v-for="item in suggestions" 
          :key="item"
          @click="selectSuggestion(item)"
          class="suggestion-tag"
        >
          {{ item }}
        </span>
      </div>
      <div v-else>
        <div 
          v-for="item in suggestions" 
          :key="item"
          @click="selectSuggestion(item)"
          class="suggestion-item"
        >
          <span class="suggestion-title">🕐 {{ item }}</span>
        </div>
      </div>
    </div>
    <!-- ===== 搜索建议结束 ===== -->
    
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

// ===== 搜索建议 =====
const suggestions = ref([])
const suggestionTimer = ref(null)
const isKeywordSuggestion = ref(false)

// ===== 预置热门关键词（15个） =====
const hotKeywords = [
  '放生', '小房子', '经文', '功课', '许愿', 
  '佛台', '礼佛', '忏悔', '念经',
  '吃素', '戒杀', '度人', '共修', '法会',
  '梦到', '看图腾', '自修', '组合', '超度'
]

const API_BASE = 'https://www.dadaozjzhitojian.cloud/sina/ff/safe_api.php'

const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

// ===== 输入时触发搜索建议 =====
const onSearchInput = () => {
  const kw = keyword.value.trim()
  if (!kw) {
    suggestions.value = []
    return
  }
  isKeywordSuggestion.value = false
  clearTimeout(suggestionTimer.value)
  suggestionTimer.value = setTimeout(() => {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
    const matchedHistory = history.filter(item => item.includes(kw))
    const matchedHot = hotKeywords.filter(item => item.includes(kw))
    const allMatched = [...matchedHistory, ...matchedHot]
    const unique = allMatched.filter((item, index) => allMatched.indexOf(item) === index)
    suggestions.value = unique.slice(0, 6)
  }, 200)
}

// ===== 输入框获得焦点时，显示热门关键词（标签模式） =====
const onSearchFocus = () => {
  if (keyword.value.trim()) {
    onSearchInput()
    return
  }
  isKeywordSuggestion.value = true
  suggestions.value = hotKeywords.slice(0, 19) 
}

const selectSuggestion = (item) => {
  keyword.value = item
  suggestions.value = []
  doSearch()
}

const doSearch = async () => {
  suggestions.value = []
  const kw = keyword.value.trim()
  if (!kw) {
    searchResults.value = []
    router.replace('/')
    return
  }
  
  let history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
  history = history.filter(item => item !== kw)
  history.unshift(kw)
  if (history.length > 20) history = history.slice(0, 20)
  localStorage.setItem('searchHistory', JSON.stringify(history))
  
  try {
    const res = await fetch(`${API_BASE}?action=search&keyword=${encodeURIComponent(kw)}&page=${currentPage.value}`)
    const data = await res.json()
    if (data.code === 0) {
      // ===== 按浏览量降序排列 =====
      const sortedData = (data.data || []).sort((a, b) => (b.views || 0) - (a.views || 0))
      searchResults.value = sortedData
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
  suggestions.value = []
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
    // ===== 如果有搜索关键词，清除手风琴保存的状态 =====
    sessionStorage.removeItem('accordion_open_item')
    // ===== 清除结束 =====
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
  border: 2px solid #e6c88a;
  border-radius: 8px;
  font-size: 16px;
  background: #fffcf0;
  outline: none;
  transition: border-color 0.3s, box-shadow 0.3s;
  color: #4a3a25;
}
.search-input::placeholder {
  color: #b8950a;
}
.search-input:focus {
  border-color: #f1c40f;
  box-shadow: 0 0 8px rgba(241, 196, 15, 0.3);
}
.search-btn {
  padding: 10px 28px;
  background: linear-gradient(145deg, #f7e8b0, #edcfa0);
  color: #7a5d2e;
  border: 1px solid #e6c88a;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}
.search-btn:hover {
  background: linear-gradient(145deg, #f1c40f, #d4ac0d);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(180, 130, 30, 0.25);
}

/* ===== 全文搜索按钮 ===== */
.full-search-link {
  padding: 10px 18px;
  background: #e8d5a0;
  color: #7a5d2e;
  border: 1px solid #e6c88a;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  white-space: nowrap;
}
.full-search-link:hover {
  background: #d4ac0d;
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(180, 130, 30, 0.25);
}

.clear-btn {
  padding: 10px 16px;
  background: #e8d5a0;
  color: #7a5d2e;
  border: 1px solid #e6c88a;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}
.clear-btn {
  padding: 10px 16px;
  background: #e8d5a0;
  color: #7a5d2e;
  border: 1px solid #e6c88a;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}
.clear-btn:hover {
  background: #d4ac0d;
  color: #fff;
}

/* ===== 搜索建议下拉 ===== */
.suggestions {
  max-width: 800px;
  margin: -8px auto 0 auto;
  padding: 12px 20px;
  background: #fffcf0;
  border: 1px solid #e6c88a;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(180, 130, 30, 0.15);
  position: relative;
  z-index: 10;
}

/* ===== 关键词标签模式 ===== */
.suggestion-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
.suggestion-tag {
  display: inline-block;
  padding: 4px 14px;
  background: #f7e8b0;
  color: #7a5d2e;
  border: 1px solid #e6c88a;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.suggestion-tag:hover {
  background: #f1c40f;
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(180, 130, 30, 0.25);
}

/* ===== 搜索历史列表模式 ===== */
.suggestion-item {
  padding: 8px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f5ecce;
  transition: background 0.2s;
}
.suggestion-item:hover {
  background: rgba(241, 196, 15, 0.15);
}
.suggestion-item:last-child {
  border-bottom: none;
}
.suggestion-title {
  color: #4a3a25;
  font-weight: 500;
}

.search-results {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px 20px;
}
.search-results h2 {
  color: #7a5d2e;
  border-bottom: 2px solid #f1c40f;
  padding-bottom: 10px;
}
.search-results ul {
  list-style: none;
  padding: 0;
}
.search-results li {
  padding: 12px 15px;
  background: #fdf6e0;
  margin-bottom: 8px;
  border-radius: 6px;
  border: 1px solid #f0e0b8;
  transition: 0.2s;
}
.search-results li:hover {
  box-shadow: 0 2px 8px rgba(180, 130, 30, 0.15);
  border-color: #e6c88a;
}
.search-results a {
  text-decoration: none;
  color: #5a3f1e;
  font-weight: 600;
  font-size: 17px;
}
.search-results a:hover {
  color: #b8860b;
}
.search-results .author {
  color: #a07d4a;
  font-size: 14px;
}
.search-results .meta {
  color: #b8950a;
  font-size: 12px;
}
.search-results .views {
  color: #b8950a;
  font-size: 12px;
  margin-left: 10px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding: 15px 0;
  border-top: 1px solid #f0e0b8;
}
.pagination button {
  padding: 8px 20px;
  background: linear-gradient(145deg, #f7e8b0, #edcfa0);
  color: #7a5d2e;
  border: 1px solid #e6c88a;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}
.pagination button:hover:not(:disabled) {
  background: linear-gradient(145deg, #f1c40f, #d4ac0d);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(180, 130, 30, 0.25);
}
.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}
.pagination .page-info {
  font-size: 14px;
  color: #7a5d2e;
}

@media (max-width: 600px) {
  .suggestion-tag {
    font-size: 12px;
    padding: 3px 10px;
  }
  .suggestions {
    padding: 10px 14px;
  }
  .full-search-link {
    padding: 8px 12px;
    font-size: 13px;
  }
}
</style>