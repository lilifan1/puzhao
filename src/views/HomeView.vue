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
          <!-- 关键：链接带上 from=search 参数，并保存搜索关键词 -->
          <router-link :to="`/post/${post.tid}?from=search&keyword=${encodeURIComponent(keyword)}`" @click="saveSearchState">
            {{ post.subject }}
          </router-link>
          <span class="author"> - {{ post.author }}</span>
          <span class="meta">{{ formatTime(post.dateline) }}</span>
        </li>
      </ul>
    </div>
    
    <!-- 手风琴菜单（无搜索时显示） -->
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

const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

const doSearch = async () => {
  const kw = keyword.value.trim()
  if (!kw) {
    searchResults.value = []
    // 清除 URL 参数
    router.replace('/')
    return
  }
  try {
    const res = await fetch(`/api?action=search&keyword=${encodeURIComponent(kw)}`)
    const data = await res.json()
    if (data.code === 0) {
      searchResults.value = data.data
      // 保存搜索状态到 URL
      router.replace(`/?from=search&keyword=${encodeURIComponent(kw)}`)
    } else {
      searchResults.value = []
    }
  } catch (error) {
    console.error('搜索失败:', error)
    searchResults.value = []
  }
}

// 保存搜索状态（点击帖子时调用）
const saveSearchState = () => {
  // 将当前搜索关键词保存到 sessionStorage，以便返回时恢复
  sessionStorage.setItem('searchKeyword', keyword.value)
  sessionStorage.setItem('searchResults', JSON.stringify(searchResults.value))
}

const clearSearch = () => {
  keyword.value = ''
  searchResults.value = []
  sessionStorage.removeItem('searchKeyword')
  sessionStorage.removeItem('searchResults')
  router.replace('/')
}

// 恢复搜索状态
const restoreSearchState = () => {
  const savedKeyword = sessionStorage.getItem('searchKeyword')
  const savedResults = sessionStorage.getItem('searchResults')
  
  // 如果 URL 中有 from=search 参数，尝试恢复
  if (route.query.from === 'search') {
    // 如果有保存的关键词，恢复
    if (savedKeyword) {
      keyword.value = savedKeyword
    }
    // 如果有保存的搜索结果，恢复
    if (savedResults) {
      try {
        searchResults.value = JSON.parse(savedResults)
        // 滚动到搜索结果位置
        setTimeout(() => {
          const resultsEl = document.querySelector('.search-results')
          if (resultsEl) {
            resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 300)
      } catch (e) {
        console.warn('恢复搜索结果失败:', e)
      }
    }
    // 聚焦搜索框
    nextTick(() => {
      if (searchInput.value) {
        searchInput.value.focus()
      }
    })
  } else {
    // 如果 URL 中没有 from=search，清除保存的状态
    if (!route.query.keyword) {
      sessionStorage.removeItem('searchKeyword')
      sessionStorage.removeItem('searchResults')
    }
  }
}

onMounted(() => {
  // 检查是否有搜索关键词参数
  const urlKeyword = route.query.keyword
  if (urlKeyword) {
    keyword.value = decodeURIComponent(urlKeyword)
    // 自动执行搜索
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
</style>