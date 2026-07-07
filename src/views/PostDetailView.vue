<template>
  <div class="container">
    <!-- 导航栏 -->
    <div class="nav-bar">
      <router-link to="/" class="nav-btn">🏠 资料集首页</router-link>
      <button @click="goBack" class="nav-btn">← 返回上一级</button>
    </div>

    <div v-if="loading">⏳ 加载中...</div>
    <div v-else-if="post">
      <div class="post-header">
        <h1>{{ post.subject }}</h1>
        <button @click="copyLink" class="copy-btn" title="复制本页链接">📋 复制链接</button>
      </div>

      <div class="meta">
        作者：{{ post.author }} | 
        发布时间：{{ formatTime(post.dateline) }} | 
        浏览：{{ post.views }} 
      </div>

      <!-- ===== 视频播放器 ===== -->
      <div v-if="videoList.length > 0" class="video-section">
        <h3>🎬 视频播放</h3>
        <div class="video-container">
          <video 
            v-if="currentVideoUrl"
            ref="videoPlayer"
            controls 
            :src="currentVideoUrl" 
            poster="https://static.wixstatic.com/media/8dd7cb_777ac92550e94cf3824d803eaa3941d8~mv2.jpg"
            style="width: 100%; max-height: 500px;"
            controlslist="nodownload"
            playsinline
            @ended="onVideoEnded"
          ></video>
          <div v-else class="no-video">请从列表中选择一个视频</div>
        </div>
        <div class="video-info">
          <span class="video-title">{{ currentVideoTitle || '未选择' }}</span>
          <span class="video-counter">{{ currentVideoIndex + 1 }} / {{ videoList.length }}</span>
        </div>
        <div class="video-nav">
          <button @click="prevVideo" :disabled="currentVideoIndex <= 0">◀ 上一个</button>
          <button @click="nextVideo" :disabled="currentVideoIndex >= videoList.length - 1">下一个 ▶</button>
        </div>
        <p class="play-status" v-if="videoList.length > 1">⏭️ 播放完成后将自动播放下一个</p>
        <!-- 视频控制栏 -->
        <div class="media-controls">
          <button @click="videoFastUpdate(1)" class="ctrl-btn">⏪ 快退15秒</button>
          <button @click="videoFastUpdate(2)" class="ctrl-btn">快进15秒 ⏩</button>
          <span class="ctrl-divider">|</span>
          <span class="ctrl-label">跳转：</span>
          <input type="number" v-model.number="videoJumpHour" min="0" max="99" class="jump-input" placeholder="时">
          <span class="jump-colon">:</span>
          <input type="number" v-model.number="videoJumpMin" min="0" max="59" class="jump-input" placeholder="分">
          <span class="jump-colon">:</span>
          <input type="number" v-model.number="videoJumpSec" min="0" max="59" class="jump-input" placeholder="秒">
          <button @click="videoFastUpdate(3)" class="ctrl-btn jump-btn">跳转</button>
        </div>
        <div class="video-list">
          <div 
            v-for="(item, index) in videoList" 
            :key="index"
            class="video-list-item"
            :class="{ active: index === currentVideoIndex }"
            @click="playVideo(index)"
          >
            <span class="video-list-index">{{ index + 1 }}</span>
            <span class="video-list-title">{{ item.title }}</span>
            <span class="video-list-play">▶</span>
          </div>
        </div>
      </div>

      <!-- 帖子内容 -->
      <div class="content" v-html="post.message"></div>

      <!-- 上下篇导航 -->
      <div v-if="prevPost || nextPost" class="post-nav">
        <router-link v-if="prevPost" :to="`/post/${prevPost.tid}`" class="nav-link">
          ← 上一篇：{{ prevPost.subject }}
        </router-link>
        <span v-else class="nav-link disabled">← 已是第一篇</span>
        <router-link v-if="nextPost" :to="`/post/${nextPost.tid}`" class="nav-link">
          下一篇：{{ nextPost.subject }} →
        </router-link>
        <span v-else class="nav-link disabled">已是最后一篇 →</span>
      </div>

      <!-- ===== 音频播放器 ===== -->
      <div v-if="audioList.length > 0" class="audio-list" id="audio-list-container">
        <h3>🎵 音频列表</h3>
        <div v-if="currentAudio" class="player">
          <audio 
            ref="audioPlayer"
            controls 
            :src="currentAudio.url" 
            style="width: 100%;"
            @ended="onAudioEnded"
          ></audio>
          <p>正在播放：{{ currentAudio.title }}</p>
          <!-- 音频控制栏 -->
          <div class="media-controls">
            <button @click="audioFastUpdate(1)" class="ctrl-btn">⏪ 快退15秒</button>
            <button @click="audioFastUpdate(2)" class="ctrl-btn">快进15秒 ⏩</button>
            <span class="ctrl-divider">|</span>
            <span class="ctrl-label">跳转：</span>
            <input type="number" v-model.number="audioJumpHour" min="0" max="99" class="jump-input" placeholder="时">
            <span class="jump-colon">:</span>
            <input type="number" v-model.number="audioJumpMin" min="0" max="59" class="jump-input" placeholder="分">
            <span class="jump-colon">:</span>
            <input type="number" v-model.number="audioJumpSec" min="0" max="59" class="jump-input" placeholder="秒">
            <button @click="audioFastUpdate(3)" class="ctrl-btn jump-btn">跳转</button>
          </div>
          <p class="play-status" v-if="audioList.length > 1">⏭️ 播放完成后将自动播放下一个</p>
        </div>
        <ul>
          <li v-for="(item, index) in audioList" :key="index" 
              @click="playAudio(index)"
              class="audio-item"
              :class="{ active: currentAudioIndex === index }">
            <span class="audio-index">{{ index + 1 }}</span>
            <span class="audio-title">{{ item.title }}</span>
            <span class="audio-play">▶</span>
          </li>
        </ul>
      </div>
    </div>
    <div v-else class="error">❌ 帖子不存在或已被删除</div>

    <!-- ===== 返回顶部 ===== -->
    <button 
      v-show="showBackToTop" 
      @click="scrollToTop" 
      class="back-to-top" 
      title="返回顶部"
    >
      ↑
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const post = ref(null)
const loading = ref(true)

const audioList = ref([])
const currentAudio = ref(null)
const currentAudioIndex = ref(-1)

const videoList = ref([])
const currentVideoIndex = ref(-1)
const currentVideoUrl = ref('')
const currentVideoTitle = ref('')

const prevPost = ref(null)
const nextPost = ref(null)
const fromSearch = ref(false)
const showBackToTop = ref(false)

const videoPlayer = ref(null)
const audioPlayer = ref(null)

// 跳转输入框
const audioJumpHour = ref(0)
const audioJumpMin = ref(0)
const audioJumpSec = ref(0)
const videoJumpHour = ref(0)
const videoJumpMin = ref(0)
const videoJumpSec = ref(0)

let observer = null
let mediaObserver = null

const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

const goBack = () => {
  if (route.query.from === 'search' || fromSearch.value) {
    router.push('/?from=search')
    return
  }
  window.history.back()
}

const copyLink = async () => {
  if (!post.value) return
  const title = post.value.subject || '普照'
  const cleanUrl = window.location.href.split('?')[0]
  const shareText = `${title}\n${cleanUrl}`

  const btn = document.querySelector('.copy-btn')
  const originalText = btn?.textContent || '📋 复制链接'

  try {
    await navigator.clipboard.writeText(shareText)
    if (btn) {
      btn.textContent = '✅ 已复制'
      setTimeout(() => {
        btn.textContent = originalText
      }, 2000)
    }
  } catch {
    const input = document.createElement('input')
    input.value = shareText
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    if (btn) {
      btn.textContent = '✅ 已复制'
      setTimeout(() => {
        btn.textContent = originalText
      }, 2000)
    }
  }
}

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 400
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ==================== 播放器控制（快进/快退/跳转） ====================

// 音频快进快退跳转
const audioFastUpdate = (type) => {
  const audio = audioPlayer.value
  if (!audio) {
    console.warn('音频播放器未找到')
    return
  }
  
  switch (type) {
    case 1: // 后退15秒
      audio.currentTime = Math.max(0, audio.currentTime - 15)
      break
    case 2: // 前进15秒
      audio.currentTime = audio.currentTime + 15
      break
    case 3: // 自定义跳转
      const h = parseInt(audioJumpHour.value) || 0
      const m = parseInt(audioJumpMin.value) || 0
      const s = parseInt(audioJumpSec.value) || 0
      audio.currentTime = h * 3600 + m * 60 + s
      break
    default:
      break
  }
}

// 视频快进快退跳转
const videoFastUpdate = (type) => {
  const video = videoPlayer.value
  if (!video) {
    console.warn('视频播放器未找到')
    return
  }
  
  switch (type) {
    case 1: // 后退15秒
      video.currentTime = Math.max(0, video.currentTime - 15)
      break
    case 2: // 前进15秒
      video.currentTime = video.currentTime + 15
      break
    case 3: // 自定义跳转
      const h = parseInt(videoJumpHour.value) || 0
      const m = parseInt(videoJumpMin.value) || 0
      const s = parseInt(videoJumpSec.value) || 0
      video.currentTime = h * 3600 + m * 60 + s
      break
    default:
      break
  }
}

// ==================== 音频 ====================
const extractAudioList = (retryCount = 0) => {
  const contentEl = document.querySelector('.content')
  if (!contentEl) {
    if (retryCount < 10) {
      setTimeout(() => extractAudioList(retryCount + 1), 300)
    }
    return
  }

  let list = []
  const ul = contentEl.querySelector('ul.sm2-playlist-bd')
  if (ul) {
    const items = ul.querySelectorAll('li')
    items.forEach(li => {
      const a = li.querySelector('a')
      if (a) {
        const url = a.getAttribute('href')
        if (url) {
          let title = a.textContent.trim()
          title = title.replace(/\s+/g, ' ').trim()
          
          if (!title || /^\d+$/.test(title)) {
            const clone = li.cloneNode(true)
            const aClone = clone.querySelector('a')
            if (aClone) aClone.remove()
            const extraText = clone.textContent.trim()
            if (extraText) {
              title = extraText.replace(/\s+/g, ' ').trim()
            }
          }
          
          if (!title || /^\d+$/.test(title)) {
            title = `音频 ${list.length + 1}`
          }
          
          list.push({ title, url })
        }
      }
    })
  }

  if (list.length === 0) {
    const links = contentEl.querySelectorAll('a[href*=".mp3"], a[href*=".m4a"]')
    links.forEach(a => {
      const url = a.getAttribute('href')
      if (url && !list.find(item => item.url === url)) {
        let title = a.textContent.trim()
        title = title.replace(/\s+/g, ' ').trim()
        if (!title || /^\d+$/.test(title)) {
          title = `音频 ${list.length + 1}`
        }
        list.push({ title, url })
      }
    })
  }

  if (list.length > 0) {
    audioList.value = list
    if (currentAudioIndex.value === -1) {
      currentAudioIndex.value = 0
      currentAudio.value = { url: list[0].url, title: list[0].title }
    }
    
    const allPlayers = contentEl.querySelectorAll('.sm2-bar-ui, ul.sm2-playlist-bd, .sm2-playlist-drawer')
    allPlayers.forEach(el => {
      el.style.display = 'none'
    })
  
  // ===== 精确遮盖"更多精彩"目录 =====
  // 找到包含"温馨提醒"或"更多精彩"的父容器 section
  const section = contentEl.querySelector('section._editor[data-support="96编辑器"]')
  if (section) {
    // 在这个 section 内，找到"更多精彩"相关的 ul 或 div
    // 方法1：查找包含"每日学习"等关键词的 ul
    const uls = section.querySelectorAll('ul')
    uls.forEach(ul => {
      const text = ul.textContent || ''
      if (text.includes('每日学习') || text.includes('每日畅听') || text.includes('白话佛法')) {
        // 检查这个 ul 是否在音频播放器附近
        const parent = ul.closest('div') || ul.parentElement
        // 如果父容器不包含音频播放器，隐藏它
        if (parent && !parent.querySelector('.sm2-bar-ui') && !parent.querySelector('audio')) {
          parent.style.display = 'none'
          console.log('✅ 已隐藏"更多精彩"目录')
        }
      }
    })

    // 方法2：如果方法1没生效，直接隐藏包含"更多精彩请点击以下目录"的元素
    const allDivs = section.querySelectorAll('div, p')
    allDivs.forEach(el => {
      const text = el.textContent || ''
      if (text.includes('更多精彩请点击以下目录') || text.includes('更多精彩')) {
        // 隐藏这个元素及其父容器（但不影响音频播放器）
        const parent = el.closest('div') || el.parentElement
        if (parent && !parent.querySelector('.sm2-bar-ui') && !parent.querySelector('audio')) {
          parent.style.display = 'none'
          console.log('✅ 已隐藏"更多精彩"目录（备用）')
        }
      }
    })
  }
  // ===== 遮盖结束 =====

    nextTick(() => {
      moveAudioListAfterTitle()
    })
  }
}

const moveAudioListAfterTitle = () => {
  const contentEl = document.querySelector('.content')
  if (!contentEl) return
  
  const audioSection = document.getElementById('audio-list-container')
  if (!audioSection) return
  
  let targetNode = null
  const allElements = contentEl.querySelectorAll('*')
  
  const keywords = [
    '温馨提醒 点击标题即可收听',
    '温馨提示：点击下面的标题即可收听音频',
    '温馨提示',
    '备用音频',
    '点击标题收听'
  ]
  
  for (const el of allElements) {
    const text = el.textContent || ''
    for (const kw of keywords) {
      if (text.includes(kw)) {
        targetNode = el
        break
      }
    }
    if (targetNode) break
  }
  
  if (targetNode) {
    let container = targetNode.closest('section')
    if (container) {
      const existingPlayer = container.querySelector('.sm2-bar-ui')
      if (existingPlayer) {
        existingPlayer.style.display = 'none'
      }
      container.appendChild(audioSection)
      console.log('✅ 音频列表已移动到关键词容器末尾')
      return
    }
  }
  
  if (contentEl.firstChild) {
    contentEl.insertBefore(audioSection, contentEl.firstChild)
    console.log('✅ 音频列表已移动到内容开头')
    return
  }
  
  if (contentEl.firstChild) {
    contentEl.insertBefore(audioSection, contentEl.firstChild)
    console.log('✅ 音频列表已移动到内容开头（兜底）')
  } else {
    contentEl.appendChild(audioSection)
    console.log('✅ 音频列表已追加到内容中（兜底）')
  }
}

const playAudio = (index) => {
  if (index >= 0 && index < audioList.value.length) {
    currentAudioIndex.value = index
    currentAudio.value = { 
      url: audioList.value[index].url, 
      title: audioList.value[index].title 
    }
  }
}

const onAudioEnded = () => {
  if (currentAudioIndex.value < audioList.value.length - 1) {
    const nextIndex = currentAudioIndex.value + 1
    playAudio(nextIndex)
    setTimeout(() => {
      if (audioPlayer.value) {
        audioPlayer.value.play()
      }
    }, 300)
  }
}

// ==================== 视频 ====================
const extractVideoList = (retryCount = 0) => {
  const contentEl = document.querySelector('.content')
  if (!contentEl) {
    if (retryCount < 10) {
      setTimeout(() => extractVideoList(retryCount + 1), 300)
    }
    return
  }

  let items = contentEl.querySelectorAll('.videolist1')
  if (items.length === 0) {
    items = contentEl.querySelectorAll('.videolist')
  }

  if (items.length === 0) {
    if (retryCount === 0) {
      setupVideoListObserver()
    }
    return
  }

  const list = []
  items.forEach(item => {
    let title = ''
    const span = item.querySelector('span[id]')
    if (span) {
      title = span.textContent.trim()
    }
    if (!title) {
      const ac = item.querySelector('ac')
      if (ac) {
        title = ac.textContent.trim()
      }
    }
    if (!title) {
      title = item.textContent.trim()
    }
    title = title.replace(/\s+/g, ' ').trim()
    
    let url = ''
    if (span) {
      const onclick = span.getAttribute('@click') || ''
      const match = onclick.match(/'(http[^']+)'/)
      if (match) {
        url = match[1]
      }
    }
    if (!url) {
      const a = item.querySelector('a[href*=".mp4"]')
      if (a) {
        url = a.getAttribute('href')
      }
    }
    if (!url) {
      const a = item.querySelector('a')
      if (a) {
        const href = a.getAttribute('href')
        if (href && (href.includes('.mp4') || href.includes('.m3u8'))) {
          url = href
        }
      }
    }
    
    if (url && title) {
      list.push({ title, url })
    }
  })

  if (list.length > 0) {
    videoList.value = list
    if (currentVideoIndex.value === -1) {
      currentVideoIndex.value = 0
      currentVideoUrl.value = list[0].url
      currentVideoTitle.value = list[0].title
    }
    hideOriginalVideo()
  }
}

const hideOriginalVideo = () => {
  const contentEl = document.querySelector('.content')
  if (!contentEl) return
  
  const firstVideo = contentEl.querySelector('.videolist1')
  if (firstVideo) {
    let parent = firstVideo.parentElement
    let count = 0
    while (parent && count < 6) {
      if (parent.tagName === 'DIV' && parent.children.length > 2) {
        parent.style.display = 'none'
        break
      }
      parent = parent.parentElement
      count++
    }
  }
  const videoContainer = contentEl.querySelector('#app, .video-container-original, div[style*="text-align: center; margin: 15px 0px;"]')
  if (videoContainer) {
    videoContainer.style.display = 'none'
  }
}

const setupVideoListObserver = () => {
  if (observer) {
    observer.disconnect()
    observer = null
  }

  const contentEl = document.querySelector('.content')
  if (!contentEl) return

  const existingItems = contentEl.querySelectorAll('.videolist1, .videolist')
  if (existingItems.length > 0) {
    extractVideoList()
    return
  }

  observer = new MutationObserver(() => {
    const items = contentEl.querySelectorAll('.videolist1, .videolist')
    if (items.length > 0) {
      observer.disconnect()
      observer = null
      extractVideoList()
    }
  })

  observer.observe(contentEl, {
    childList: true,
    subtree: true
  })

  setTimeout(() => {
    if (observer) {
      observer.disconnect()
      observer = null
      extractVideoList()
    }
  }, 8000)
}

const playVideo = (index) => {
  if (index >= 0 && index < videoList.value.length) {
    currentVideoIndex.value = index
    currentVideoUrl.value = videoList.value[index].url
    currentVideoTitle.value = videoList.value[index].title
  }
}

const prevVideo = () => {
  if (currentVideoIndex.value > 0) {
    playVideo(currentVideoIndex.value - 1)
  }
}

const nextVideo = () => {
  if (currentVideoIndex.value < videoList.value.length - 1) {
    playVideo(currentVideoIndex.value + 1)
  }
}

const onVideoEnded = () => {
  if (currentVideoIndex.value < videoList.value.length - 1) {
    const nextIndex = currentVideoIndex.value + 1
    playVideo(nextIndex)
    setTimeout(() => {
      if (videoPlayer.value) {
        videoPlayer.value.play()
      }
    }, 500)
  }
}

// ==================== 链接处理 ====================
const handleLinkClick = (event) => {
  let target = event.target
  while (target && target.tagName !== 'A') {
    target = target.parentElement
  }
  if (!target) return

  const href = target.getAttribute('href')
  if (!href) return

  // 处理页面内锚点跳转
  if (href.startsWith('#')) {
    event.preventDefault()
    event.stopPropagation()
    const targetId = href.substring(1)
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    return
  }

  const articleTidMatch = href.match(/article\.html#\/viewthread\/tid\/(\d+)/)
  if (articleTidMatch) {
    event.preventDefault()
    event.stopPropagation()
    router.push(`/post/${articleTidMatch[1]}`)
    return
  }

  const articleFidMatch = href.match(/article\.html#\/forumdisplay\/fid\/(\d+)/)
  if (articleFidMatch) {
    event.preventDefault()
    event.stopPropagation()
    router.push(`/forum/${articleFidMatch[1]}`)
    return
  }

  if (href.startsWith('forum.php')) {
    event.preventDefault()
    event.stopPropagation()
    
    const tidMatch = href.match(/tid=(\d+)/)
    if (tidMatch) {
      router.push(`/post/${tidMatch[1]}`)
      return
    }
    
    const fidMatch = href.match(/fid=(\d+)/)
    if (fidMatch) {
      router.push(`/forum/${fidMatch[1]}`)
      return
    }
    
    router.push('/')
  }
}

const bindLinkHandler = () => {
  const container = document.querySelector('.container')
  if (container) {
    container.removeEventListener('click', handleLinkClick)
    container.addEventListener('click', handleLinkClick)
  }
}

// ==================== 绑定 v-html 中的媒体控制按钮 ====================
const bindMediaControls = () => {
  const contentEl = document.querySelector('.content')
  if (!contentEl) return

  console.log('🔄 开始绑定媒体控制按钮...')

  // 找到所有包含 video 或 audio 的容器
  const mediaElements = contentEl.querySelectorAll('video, audio')
  if (mediaElements.length === 0) {
    console.log('⚠️ 未找到 video/audio 元素')
    return
  }

  mediaElements.forEach(media => {
    // 向上查找包含此媒体的容器
    let container = media.closest('section') || media.closest('div') || media.parentElement
    if (!container) return

    // 如果容器已经被处理过，跳过
    if (container.dataset.mediaBound === 'true') return

    // 找到这个容器里的所有按钮
    const btns = container.querySelectorAll('button')
    btns.forEach(btn => {
      // 如果按钮已经被绑定，跳过
      if (btn.dataset.handled === 'true') return

      const text = btn.textContent.trim()
      let type = 0

      if (text.includes('快退') || text.includes('后退') || text.includes('退')) {
        type = 1
      } else if (text.includes('快进') || text.includes('前进') || text.includes('进')) {
        type = 2
      } else if (text.includes('跳转') || text.includes('转')) {
        type = 3
      }

      if (type === 0) return

      // 绑定点击事件
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()

        const mediaEl = container.querySelector('video, audio')
        if (!mediaEl) return

        if (type === 1) {
          mediaEl.currentTime = Math.max(0, mediaEl.currentTime - 15)
          console.log(`⏪ 后退15秒，当前: ${mediaEl.currentTime}`)
        } else if (type === 2) {
          mediaEl.currentTime = mediaEl.currentTime + 15
          console.log(`⏩ 前进15秒，当前: ${mediaEl.currentTime}`)
        } else if (type === 3) {
          // 查找输入框
          const inputs = container.querySelectorAll('input[type="number"]')
          let h = 0, m = 0, s = 0
          inputs.forEach((input, idx) => {
            const val = parseInt(input.value) || 0
            if (idx === 0 || input.placeholder?.includes('时')) h = val
            else if (idx === 1 || input.placeholder?.includes('分')) m = val
            else if (idx === 2 || input.placeholder?.includes('秒')) s = val
          })
          // 如果没找到 input[type="number"]，尝试找普通 input
          if (inputs.length === 0) {
            const allInputs = container.querySelectorAll('input')
            allInputs.forEach((input, idx) => {
              const val = parseInt(input.value) || 0
              if (idx === 0) h = val
              else if (idx === 1) m = val
              else if (idx === 2) s = val
            })
          }
          const targetTime = h * 3600 + m * 60 + s
          mediaEl.currentTime = targetTime
          console.log(`🎯 跳转到 ${h}:${m}:${s}，当前: ${mediaEl.currentTime}`)
        }
      })

      btn.dataset.handled = 'true'
      console.log(`✅ 按钮已绑定: ${text}`)
    })

    container.dataset.mediaBound = 'true'
  })
}

// ==================== 使用 MutationObserver 监听 DOM 变化并自动绑定 ====================
const setupMediaObserver = () => {
  const contentEl = document.querySelector('.content')
  if (!contentEl) return

  // 如果已有 observer，先断开
  if (mediaObserver) {
    mediaObserver.disconnect()
    mediaObserver = null
  }

  // 先立即绑定一次
  setTimeout(() => bindMediaControls(), 100)

  // 创建新的 observer
  mediaObserver = new MutationObserver(() => {
    // 检查是否有新的 media 元素或按钮出现
    const hasMedia = contentEl.querySelector('video, audio')
    const hasButtons = contentEl.querySelector('button')
    if (hasMedia || hasButtons) {
      // 延迟一点再绑定，确保 DOM 完全渲染
      setTimeout(() => bindMediaControls(), 200)
    }
  })

  mediaObserver.observe(contentEl, {
    childList: true,
    subtree: true
  })
}

const loadPost = async (tid) => {
  loading.value = true
  videoList.value = []
  currentVideoIndex.value = -1
  currentVideoUrl.value = ''
  currentVideoTitle.value = ''
  audioList.value = []
  currentAudioIndex.value = -1
  currentAudio.value = null

  if (observer) {
    observer.disconnect()
    observer = null
  }

  const baseUrl = 'https://www.dadaozjzhitojian.cloud/sina/ff/safe_api.php'

  try {
    const res = await fetch(`${baseUrl}?action=thread&tid=${tid}`)
    const data = await res.json()
    if (data.code === 0) {
      post.value = data.data
    } else {
      post.value = null
    }

    if (post.value && post.value.fid) {
      const listRes = await fetch(`${baseUrl}?action=list&fid=${post.value.fid}&limit=100`)
      const listData = await listRes.json()
      if (listData.code === 0) {
        const posts = listData.data
        const currentIndex = posts.findIndex(p => p.tid == tid)
        prevPost.value = currentIndex > 0 ? posts[currentIndex - 1] : null
        nextPost.value = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null
      }
    }
  } catch (error) {
    console.error('获取帖子失败:', error)
    post.value = null
  } finally {
    loading.value = false
  }
}

watch(post, () => {
  if (post.value) {
    nextTick(() => {
      setTimeout(() => {
        extractAudioList()
        extractVideoList()
        bindLinkHandler()
        setupMediaObserver()
      }, 500)
    })
  }
})

watch(
  () => route.params.tid,
  (newTid) => {
    if (newTid) {
      loadPost(newTid)
    }
  }
)

onBeforeUnmount(() => {
  const container = document.querySelector('.container')
  if (container) {
    container.removeEventListener('click', handleLinkClick)
  }
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (mediaObserver) {
    mediaObserver.disconnect()
    mediaObserver = null
  }
  window.removeEventListener('scroll', handleScroll)
})

onMounted(async () => {
  const tid = route.params.tid
  fromSearch.value = route.query.from === 'search'
  if (tid) {
    await loadPost(tid)
  }
  window.addEventListener('scroll', handleScroll)
  if (post.value) {
    nextTick(() => {
      setTimeout(() => setupMediaObserver(), 500)
    })
  }
})
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fef9e7;
  min-height: 100vh;
  border-radius: 8px;
}

.nav-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.nav-btn {
  display: inline-block;
  padding: 8px 16px;
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}
.nav-btn:hover {
  background: #42b983;
  color: white;
}

.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.post-header h1 {
  flex: 1;
  min-width: 200px;
}
.copy-btn {
  flex-shrink: 0;
  padding: 6px 14px;
  background: #f1c40f;
  color: #333;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
  height: fit-content;
  font-weight: 500;
}
.copy-btn:hover {
  background: #d4ac0d;
}

@media (max-width: 600px) {
  .post-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .post-header h1 {
    min-width: unset;
    width: 100%;
    font-size: 18px;
  }
  .copy-btn {
    align-self: flex-start;
    font-size: 13px;
    padding: 5px 12px;
  }
}

h1 { color: #2c3e50; }
.meta { color: #888; font-size: 14px; padding-bottom: 15px; border-bottom: 1px solid #eee; margin-bottom: 20px; }
.content { line-height: 1.9; font-size: 16px; overflow-wrap: break-word; }
.content img { max-width: 100%; }
.content a { color: #42b983; text-decoration: none; }
.content a:hover { text-decoration: underline; }
.error { color: #e74c3c; text-align: center; padding: 50px 0; }

.post-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
  padding: 12px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  gap: 10px;
  flex-wrap: wrap;
}
.nav-link {
  color: #42b983;
  text-decoration: none;
  font-size: 14px;
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nav-link:hover:not(.disabled) {
  text-decoration: underline;
}
.nav-link.disabled {
  color: #ccc;
  cursor: not-allowed;
}

.audio-list {
  margin-top: 30px;
  padding: 20px;
  background: #f8f8f8;
  border-radius: 8px;
}
.audio-list h3 { margin-bottom: 15px; }
.audio-list ul { list-style: none; padding: 0; }
.audio-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 4px;
}
.audio-item:hover {
  background: #e8f5e9;
}
.audio-item.active {
  background: #c8e6c9;
}
.audio-index {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #42b983;
  color: white;
  border-radius: 50%;
  font-size: 13px;
  flex-shrink: 0;
}
.audio-title {
  flex: 1;
  font-size: 16px;
  color: #333;
  font-weight: 500;
}
.audio-play {
  color: #42b983;
  font-size: 16px;
}

.player {
  margin-bottom: 15px;
  padding: 15px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.player p {
  margin-top: 8px;
  color: #666;
  font-size: 14px;
}
.play-status {
  color: #42b983 !important;
  font-size: 13px !important;
}

.video-container {
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  margin: 10px 0;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url('https://static.wixstatic.com/media/8dd7cb_777ac92550e94cf3824d803eaa3941d8~mv2.jpg');
  background-size: cover;
  background-position: center;
  position: relative;
}
.video-container video {
  display: block;
  max-height: 500px;
  width: 100%;
  position: relative;
  z-index: 1;
}
.no-video {
  color: #999;
  padding: 40px;
}
.video-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}
.video-title {
  font-weight: 500;
  color: #333;
}
.video-counter {
  color: #888;
  font-size: 14px;
}
.video-nav {
  display: flex;
  gap: 15px;
  margin: 10px 0;
}
.video-nav button {
  padding: 8px 20px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.video-nav button:hover:not(:disabled) {
  background: #359b6d;
}
.video-nav button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.video-list {
  margin-top: 15px;
  max-height: 300px;
  overflow-y: auto;
}
.video-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 4px;
}
.video-list-item:hover {
  background: #e8f5e9;
}
.video-list-item.active {
  background: #c8e6c9;
}
.video-list-index {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #42b983;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  flex-shrink: 0;
}
.video-list-title {
  flex: 1;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}
.video-list-play {
  color: #42b983;
  font-size: 14px;
}

/* ===== 播放器控制按钮 ===== */
.media-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0 8px 0;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.ctrl-btn {
  padding: 6px 16px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}
.ctrl-btn:hover {
  background: #359b6d;
}
.ctrl-btn:active {
  transform: scale(0.96);
}

.jump-btn {
  background: #3498db;
}
.jump-btn:hover {
  background: #2c81b5;
}

.ctrl-divider {
  color: #ccc;
  margin: 0 4px;
}
.ctrl-label {
  font-size: 13px;
  color: #666;
}

.jump-input {
  width: 45px;
  padding: 4px 2px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 13px;
}
.jump-input:focus {
  outline: none;
  border-color: #42b983;
}
.jump-colon {
  color: #999;
  font-weight: bold;
}

@media (max-width: 600px) {
  .media-controls {
    gap: 6px;
    padding: 10px 12px;
  }
  .ctrl-btn {
    padding: 5px 12px;
    font-size: 12px;
  }
  .jump-input {
    width: 36px;
    font-size: 12px;
    padding: 3px 1px;
  }
  .ctrl-label {
    font-size: 12px;
  }
}

.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 20px;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.6);
  color: #555;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
.back-to-top:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
.back-to-top:active {
  transform: scale(0.95);
}

@media (max-width: 600px) {
  .back-to-top {
    bottom: 20px;
    right: 15px;
    width: 42px;
    height: 42px;
    font-size: 20px;
  }
}
</style>