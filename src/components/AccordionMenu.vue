<template>
  <div class="data-container">
    <!-- 分类循环 -->
    <div v-for="(groups, catName, index) in categories" :key="index">
      <div class="category-title">
        <div class="category-icon"></div>
        <span class="category-title-text">{{ catName }}</span>
      </div>
      <div class="accordion-container">
        <div v-for="(group, gIndex) in groups" :key="gIndex" class="accordion-item">
          <div class="accordion-header" @click="toggleAccordion($event, catName, group.group_title)">
            <span class="accordion-header-text">{{ group.group_title }}</span>
            <span class="accordion-icon" :ref="`icon_${catName}_${group.group_title}`">▶</span>
          </div>
          <div class="accordion-content" :ref="`content_${catName}_${group.group_title}`">
            <ul class="submenu">
              <li v-for="(item, i) in group.items" :key="i" class="submenu-item">
                <a :href="item.url" @click.prevent="handleLinkClick(item.url, catName, group.group_title)">
                  {{ item.title }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const categories = ref({})

// ===== 展开状态存储 =====
const SESSION_KEY = 'accordion_open_item'

// 保存当前展开的栏目（分类名 + 组名）
const saveOpenItem = (catName, groupTitle) => {
  if (catName && groupTitle) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ catName, groupTitle }))
  }
}

// 获取保存的展开栏目
const getOpenItem = () => {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

// 清除保存的展开状态（可选的清除方法）
const clearOpenItem = () => {
  sessionStorage.removeItem(SESSION_KEY)
}

// ===== 加载数据 =====
// ===== 加载数据（带缓存） =====
const loadData = async () => {
  // 检查缓存
  const cached = localStorage.getItem('articles_data')
  const cachedTime = localStorage.getItem('articles_data_time')
  const now = Date.now()
  
  // 如果缓存存在且未过期（24小时）
  if (cached && cachedTime && (now - parseInt(cachedTime) < 24 * 60 * 60 * 1000)) {
    try {
      categories.value = JSON.parse(cached)
      console.log('✅ 使用缓存的手风琴数据')
      // 数据加载完成后恢复展开状态
      await nextTick()
      setTimeout(() => {
        restoreAccordionState()
      }, 100)
      return
    } catch (e) {}
  }
  
  // 请求新数据
  try {
    const res = await fetch('/articles.json?_=' + Date.now())
    if (!res.ok) throw new Error('加载失败')
    const data = await res.json()
    categories.value = data
    localStorage.setItem('articles_data', JSON.stringify(data))
    localStorage.setItem('articles_data_time', String(now))
    console.log('✅ 已缓存手风琴数据')
    
    // 数据加载完成后恢复展开状态
    await nextTick()
    setTimeout(() => {
      restoreAccordionState()
    }, 100)
  } catch (e) {
    console.error('手风琴数据加载失败:', e)
    // 如果请求失败，尝试使用过期缓存
    if (cached) {
      try {
        categories.value = JSON.parse(cached)
        console.log('⚠️ 使用过期缓存数据')
        await nextTick()
        setTimeout(() => {
          restoreAccordionState()
        }, 100)
      } catch (e2) {}
    }
  }
}

// 在 onMounted 中调用 loadData
onMounted(() => {
  loadData()
})

// ===== 恢复展开状态 =====
const restoreAccordionState = () => {
  const saved = getOpenItem()
  if (!saved) return
  
  const { catName, groupTitle } = saved
  if (!catName || !groupTitle) return
  
  let targetHeader = null
  
  const headers = document.querySelectorAll('.accordion-header')
  for (const header of headers) {
    const textSpan = header.querySelector('.accordion-header-text')
    if (textSpan) {
      const text = textSpan.textContent.replace(/\s+/g, ' ').trim()
      const targetText = groupTitle.replace(/\s+/g, ' ').trim()
      if (text === targetText) {
        const container = header.closest('.accordion-container')
        if (container) {
          const prevTitle = container.previousElementSibling
          if (prevTitle && prevTitle.classList.contains('category-title')) {
            const titleSpan = prevTitle.querySelector('.category-title-text')
            if (titleSpan) {
              const catText = titleSpan.textContent.replace(/\s+/g, ' ').trim()
              const targetCat = catName.replace(/\s+/g, ' ').trim()
              if (catText === targetCat) {
                targetHeader = header
                const content = header.nextElementSibling
                const icon = header.querySelector('.accordion-icon')
                if (content && !content.style.maxHeight) {
                  content.style.maxHeight = content.scrollHeight + 'px'
                  if (icon) icon.classList.add('active')
                }
                break
              }
            }
          }
        }
      }
    }
  }
  
  // ===== 定位到展开的栏目 =====
  if (targetHeader) {
    setTimeout(() => {
      const rect = targetHeader.getBoundingClientRect()
      const top = rect.top + window.pageYOffset - 80 // 80px 偏移，避免被顶部栏遮挡
      window.scrollTo({ top, behavior: 'smooth' })
    }, 350) // 等待展开动画完成后再滚动
  }
}

// ===== 切换手风琴 =====
const toggleAccordion = (event, catName, groupTitle) => {
  const content = event.currentTarget.nextElementSibling
  const icon = event.currentTarget.querySelector('.accordion-icon')
  
  // 关闭同容器内的其他项
  const container = event.currentTarget.closest('.accordion-container')
  if (container) {
    container.querySelectorAll('.accordion-content').forEach(el => {
      if (el !== content) {
        el.style.maxHeight = null
        const prevIcon = el.previousElementSibling?.querySelector('.accordion-icon')
        if (prevIcon) prevIcon.classList.remove('active')
      }
    })
  }
  
  // 切换当前项
  if (content.style.maxHeight) {
    content.style.maxHeight = null
    icon.classList.remove('active')
    // 如果关闭的是当前保存的项，清除保存状态
    const saved = getOpenItem()
    if (saved && saved.catName === catName && saved.groupTitle === groupTitle) {
      sessionStorage.removeItem(SESSION_KEY)
    }
  } else {
    content.style.maxHeight = content.scrollHeight + 'px'
    icon.classList.add('active')
    // 保存当前展开的项
    saveOpenItem(catName, groupTitle)
  }
}

// ===== 处理链接点击 =====
const handleLinkClick = (url, catName, groupTitle) => {
  // 保存当前展开状态，返回时恢复
  saveOpenItem(catName, groupTitle)
  
  // 帖子链接：article.html#/viewthread/tid/xxx
  const tidMatch = url.match(/article\.html#\/viewthread\/tid\/(\d+)/)
  if (tidMatch) {
    router.push(`/post/${tidMatch[1]}`)
    return
  }
  
  // 版块链接：article.html#/forumdisplay/fid/xxx
  const fidMatch = url.match(/article\.html#\/forumdisplay\/fid\/(\d+)/)
  if (fidMatch) {
    router.push(`/forum/${fidMatch[1]}`)
    return
  }
  
  // 直接版块链接：forum.php?mod=forumdisplay&fid=xxx
  const directFidMatch = url.match(/forum\.php\?mod=forumdisplay&fid=(\d+)/)
  if (directFidMatch) {
    router.push(`/forum/${directFidMatch[1]}`)
    return
  }
  
  // 其他链接跳转到首页
  router.push('/')
}

// 暴露清除方法（可选）
defineExpose({ clearOpenItem })
</script>

<style scoped>
.data-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 15px;
  background-color: #f9e9dc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.category-title {
  display: flex;
  align-items: center;
  margin: 25px 0 10px 0;
}
.category-title:first-of-type { margin-top: 0; }

.category-icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
  background-image: url('https://balh.top/tubiao/lianhua.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  flex-shrink: 0;
}

.category-title-text {
  font-size: 24px;
  color: #785635;
  font-weight: 700;
  line-height: 1.4;
}

.accordion-container {
  width: 100%;
  background: #f8e0cd;
  border-radius: 12px;
  border: 1px solid #d8b898;
  overflow: hidden;
  margin-bottom: 25px;
}

.accordion-item {
  border-bottom: 1px solid #d8b898;
}
.accordion-item:last-child { border-bottom: none; }

.accordion-header {
  padding: 16px 20px;
  background-color: #FCF6E6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}
.accordion-header:active { background-color: #f0b880; }

.accordion-header-text {
  font-size: 20px;
  color: #5a3f1e;
  font-weight: 600;
  flex: 1;
}

.accordion-icon {
  font-size: 18px;
  color: #946d45;
  transition: transform 0.2s;
  margin-left: 10px;
}
.accordion-icon.active { transform: rotate(90deg); }

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  background-color: #f9e4d0;
}

.submenu {
  list-style: none;
  margin: 0;
  padding: 0;
}

.submenu-item {
  border-bottom: 1px solid #d8b898;
  background-color: #faf6ca;
}
.submenu-item:last-child { border-bottom: none; }

.submenu-item a {
  display: block;
  padding: 12px 20px;
  color: #4a3220;
  text-decoration: none;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}
.submenu-item a:active { background-color: #f0b880; }

@media (max-width: 768px) {
  .data-container { padding: 15px 12px; }
  .category-icon { width: 22px; height: 22px; margin-right: 6px; }
  .category-title-text { font-size: 22px; }
  .accordion-header { padding: 14px 16px; min-height: 52px; }
  .accordion-header-text { font-size: 19px; }
  .submenu-item a { padding: 14px 16px; font-size: 18px; }
}
</style>