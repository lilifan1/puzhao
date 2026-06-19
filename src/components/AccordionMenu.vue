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
          <div class="accordion-header" @click="toggleAccordion($event, index, gIndex)">
            <span class="accordion-header-text">{{ group.group_title }}</span>
            <span class="accordion-icon" :ref="`icon_${index}_${gIndex}`">▶</span>
          </div>
          <div class="accordion-content" :ref="`content_${index}_${gIndex}`">
            <ul class="submenu">
              <li v-for="(item, i) in group.items" :key="i" class="submenu-item">
                <a :href="item.url" @click.prevent="handleLinkClick(item.url)">
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const categories = ref({})

// 加载 JSON 数据
onMounted(async () => {
  try {
    const res = await fetch('/articles.json?_=' + Date.now())
    if (!res.ok) throw new Error('加载失败')
    categories.value = await res.json()
  } catch (e) {
    console.error('手风琴数据加载失败:', e)
  }
})

// 切换手风琴
const toggleAccordion = (event, catIndex, groupIndex) => {
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
  
  if (content.style.maxHeight) {
    content.style.maxHeight = null
    icon.classList.remove('active')
  } else {
    content.style.maxHeight = content.scrollHeight + 'px'
    icon.classList.add('active')
  }
}

// 处理链接点击 - 支持哈希路由
const handleLinkClick = (url) => {
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
  
  // 其他链接跳转到首页
  router.push('/')
}
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
  color: #785635;
  font-weight: 500;
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
  color: #6b4d2d;
  text-decoration: none;
  font-size: 15px;
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