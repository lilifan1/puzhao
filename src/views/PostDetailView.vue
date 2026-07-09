<template>
  <div class="container">
    <!-- 导航栏 -->
    <div class="nav-bar">
      <router-link to="/" class="nav-btn">🏠 资料集首页</router-link>
      <button @click="goBack" class="nav-btn">← 返回上一级</button>
    </div>

    <!-- ===== 骨架屏 ===== -->
    <div v-if="loading" class="skeleton">
      <div class="skeleton-header"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line" style="width: 80%;"></div>
      <div class="skeleton-line" style="width: 60%;"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line" style="width: 70%;"></div>
      <div class="skeleton-line" style="width: 50%;"></div>
    </div>

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
            @timeupdate="saveVideoProgress"
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
        <!-- ===== 视频快进快退（仅视频播放器） ===== -->
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
        <span v-else class="nav-link disabled"></span>
        <router-link v-if="nextPost" :to="`/post/${nextPost.tid}`" class="nav-link">
          下一篇：{{ nextPost.subject }} →
        </router-link>
        <span v-else class="nav-link disabled"></span>
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
            @timeupdate="saveAudioProgress"
          ></audio>
          <p>正在播放：{{ currentAudio.title }}</p>
          <!-- ===== 单独音频快进快退（仅当前播放的音频） ===== -->
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

// ==================== 记忆播放 ====================
const saveAudioProgress = () => {
  if (audioPlayer.value && currentAudioIndex.value >= 0) {
    localStorage.setItem(`audio_progress_${currentAudioIndex.value}`, audioPlayer.value.currentTime)
  }
}

const saveVideoProgress = () => {
  if (videoPlayer.value && currentVideoIndex.value >= 0) {
    localStorage.setItem(`video_progress_${currentVideoIndex.value}`, videoPlayer.value.currentTime)
  }
}

// ==================== 播放器控制（快进/快退/跳转） ====================

const audioFastUpdate = (type) => {
  const audio = audioPlayer.value
  if (!audio) return
  switch (type) {
    case 1:
      audio.currentTime = Math.max(0, audio.currentTime - 15)
      break
    case 2:
      audio.currentTime = audio.currentTime + 15
      break
    case 3:
      const h = parseInt(audioJumpHour.value) || 0
      const m = parseInt(audioJumpMin.value) || 0
      const s = parseInt(audioJumpSec.value) || 0
      audio.currentTime = h * 3600 + m * 60 + s
      break
  }
}

const videoFastUpdate = (type) => {
  const video = videoPlayer.value
  if (!video) return
  switch (type) {
    case 1:
      video.currentTime = Math.max(0, video.currentTime - 15)
      break
    case 2:
      video.currentTime = video.currentTime + 15
      break
    case 3:
      const h = parseInt(videoJumpHour.value) || 0
      const m = parseInt(videoJumpMin.value) || 0
      const s = parseInt(videoJumpSec.value) || 0
      video.currentTime = h * 3600 + m * 60 + s
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
    
    // ===== 删除“更多精彩”目录（加强版） =====
const allElements = contentEl.querySelectorAll('*')
const keywords = ['更多精彩请点击以下目录', '更多精彩', '每日学习', '每日畅听', '白话佛法', '入门知识', '感动视频', '广播讲座', '睡前一听', '博客留言', '法會开示']
allElements.forEach(el => {
  const text = el.textContent || ''
  let matchCount = 0
  for (const kw of keywords) {
    if (text.includes(kw)) matchCount++
  }
  // 如果包含3个以上关键词，说明是“更多精彩”目录
  if (matchCount >= 3 && !el.querySelector('.sm2-bar-ui') && !el.querySelector('audio')) {
    el.style.display = 'none'
  }
})
// ===== 删除结束 =====

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
    
    nextTick(() => {
      const player = audioPlayer.value
      if (player) {
        const savedTime = localStorage.getItem(`audio_progress_${index}`)
        
        player.removeEventListener('loadedmetadata', player._onLoadedMetadata)
        player._onLoadedMetadata = () => {
          if (savedTime && !isNaN(parseFloat(savedTime)) && parseFloat(savedTime) > 0) {
            player.currentTime = parseFloat(savedTime)
            console.log(`🎵 恢复音频进度: ${parseFloat(savedTime).toFixed(1)}秒`)
          }
        }
        player.addEventListener('loadedmetadata', player._onLoadedMetadata)
        
        if (player.readyState >= 1) {
          if (savedTime && !isNaN(parseFloat(savedTime)) && parseFloat(savedTime) > 0) {
            player.currentTime = parseFloat(savedTime)
            console.log(`🎵 恢复音频进度: ${parseFloat(savedTime).toFixed(1)}秒`)
          }
        }
        
        player.play().catch(() => {})
      }
    })
  }
}

const playVideo = (index) => {
  if (index >= 0 && index < videoList.value.length) {
    currentVideoIndex.value = index
    currentVideoUrl.value = videoList.value[index].url
    currentVideoTitle.value = videoList.value[index].title
    
    nextTick(() => {
      const player = videoPlayer.value
      if (player) {
        // ===== 先暂停加载，等元数据加载后再恢复进度 =====
        const savedTime = localStorage.getItem(`video_progress_${index}`)
        
        // 移除旧监听器，避免重复
        player.removeEventListener('loadedmetadata', player._onLoadedMetadata)
        
        player._onLoadedMetadata = () => {
          if (savedTime && !isNaN(parseFloat(savedTime)) && parseFloat(savedTime) > 0) {
            player.currentTime = parseFloat(savedTime)
            console.log(`🎬 恢复视频进度: ${parseFloat(savedTime).toFixed(1)}秒`)
          }
        }
        player.addEventListener('loadedmetadata', player._onLoadedMetadata)
        
        // 如果视频已经加载完成，直接设置
        if (player.readyState >= 1) {
          if (savedTime && !isNaN(parseFloat(savedTime)) && parseFloat(savedTime) > 0) {
            player.currentTime = parseFloat(savedTime)
            console.log(`🎬 恢复视频进度: ${parseFloat(savedTime).toFixed(1)}秒`)
          }
        }
        
        player.play().catch(() => {})
      }
    })
  }
}

 const onAudioEnded = () => {
  if (currentAudioIndex.value < audioList.value.length - 1) {
    const nextIndex = currentAudioIndex.value + 1
    playAudio(nextIndex)
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

  const mediaElements = contentEl.querySelectorAll('video, audio')
  if (mediaElements.length === 0) return

  mediaElements.forEach(media => {
    let container = media.closest('section') || media.closest('div') || media.parentElement
    if (!container) return
    if (container.dataset.mediaBound === 'true') return

    const btns = container.querySelectorAll('button')
    btns.forEach(btn => {
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

      btn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()

        const mediaEl = container.querySelector('video, audio')
        if (!mediaEl) return

        if (type === 1) {
          mediaEl.currentTime = Math.max(0, mediaEl.currentTime - 15)
        } else if (type === 2) {
          mediaEl.currentTime = mediaEl.currentTime + 15
        } else if (type === 3) {
          const inputs = container.querySelectorAll('input[type="number"]')
          let h = 0, m = 0, s = 0
          inputs.forEach((input, idx) => {
            const val = parseInt(input.value) || 0
            if (idx === 0 || input.placeholder?.includes('时')) h = val
            else if (idx === 1 || input.placeholder?.includes('分')) m = val
            else if (idx === 2 || input.placeholder?.includes('秒')) s = val
          })
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
        }
      })

      btn.dataset.handled = 'true'
    })

    container.dataset.mediaBound = 'true'
  })
}

const setupMediaObserver = () => {
  const contentEl = document.querySelector('.content')
  if (!contentEl) return

  if (mediaObserver) {
    mediaObserver.disconnect()
    mediaObserver = null
  }

  setTimeout(() => bindMediaControls(), 100)

  mediaObserver = new MutationObserver(() => {
    const hasMedia = contentEl.querySelector('video, audio')
    const hasButtons = contentEl.querySelector('button')
    if (hasMedia || hasButtons) {
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

    // ===== 先提取音频列表 =====
    nextTick(() => {
      setTimeout(() => {
        extractAudioList()
        extractVideoList()
        bindLinkHandler()
        setupMediaObserver()
      }, 300)
    })

    // ===== 上下篇：分页循环获取全部帖子 =====
    if (post.value && post.value.fid) {
      const fid = post.value.fid
      const currentTid = Number(tid)

      let allPosts = []
      let page = 1
      const limit = 50
      let hasMore = true
      let found = false

      while (hasMore && !found) {
        try {
          const listRes = await fetch(`${baseUrl}?action=list&fid=${fid}&limit=${limit}&page=${page}`)
          const listData = await listRes.json()

          if (listData.code === 0 && listData.data && listData.data.length > 0) {
            const posts = listData.data
            allPosts = allPosts.concat(posts)

            const foundInPage = posts.findIndex(p => Number(p.tid) === currentTid)
            if (foundInPage !== -1) {
              found = true
              const sortedPosts = allPosts.sort((a, b) => b.dateline - a.dateline)
              const currentIndex = sortedPosts.findIndex(p => Number(p.tid) === currentTid)

              if (currentIndex !== -1) {
                prevPost.value = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null

                if (currentIndex < sortedPosts.length - 1) {
                  nextPost.value = sortedPosts[currentIndex + 1]
                } else {
                  try {
                    const nextPageRes = await fetch(`${baseUrl}?action=list&fid=${fid}&limit=${limit}&page=${page + 1}`)
                    const nextPageData = await nextPageRes.json()
                    if (nextPageData.code === 0 && nextPageData.data && nextPageData.data.length > 0) {
                      const nextPagePosts = nextPageData.data.sort((a, b) => b.dateline - a.dateline)
                      nextPost.value = nextPagePosts[0] || null
                    } else {
                      nextPost.value = null
                    }
                  } catch (e) {
                    nextPost.value = null
                  }
                }
              }
              break
            }

            page++
            if (listData.data.length < limit) {
              hasMore = false
            }
          } else {
            hasMore = false
          }
        } catch (e) {
          console.error('分页获取失败:', e)
          hasMore = false
        }
      }

      if (!found && allPosts.length > 0) {
        const sortedPosts = allPosts.sort((a, b) => b.dateline - a.dateline)
        const currentIndex = sortedPosts.findIndex(p => Number(p.tid) === currentTid)
        if (currentIndex !== -1) {
          prevPost.value = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null
          nextPost.value = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null
        }
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

/* ===== 骨架屏 ===== */
.skeleton {
  padding: 20px 0;
  animation: pulse 1.5s ease-in-out infinite;
}
.skeleton-header {
  width: 60%;
  height: 28px;
  background: #e8dcc8;
  border-radius: 4px;
  margin-bottom: 16px;
}
.skeleton-line {
  height: 16px;
  background: #e8dcc8;
  border-radius: 4px;
  margin-bottom: 10px;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ===== 导航栏 ===== */
.nav-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.nav-btn {
  display: inline-block;
  padding: 8px 18px;
  background: #f7e8b0;
  color: #7a5d2e;
  border: 1px solid #e6c88a;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}
.nav-btn:hover {
  background: #edcfa0;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(180, 130, 30, 0.25);
}

/* ===== 帖子头部 ===== */
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
  color: #b8860b;
  font-weight: 700; 
  border-left: 4px solid #f1c40f;
  padding-left: 14px;
}
.copy-btn {
  flex-shrink: 0;
  padding: 6px 16px;
  background: #f7e8b0;
  color: #7a5d2e;
  border: 1px solid #e6c88a;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  height: fit-content;
}
.copy-btn:hover {
  background: #f1c40f;
  color: #fff;
  transform: translateY(-1px);
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

.meta {
  color: #a07d4a;
  font-size: 14px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0e0b8;
  margin-bottom: 20px;
}

/* ===== 帖子内容 ===== */
.content {
  line-height: 1.9;
  font-size: 16px;
  overflow-wrap: break-word;
  color: #4a3a25;
}
.content img {
  max-width: 100%;
}
.content a {
  color: #b8860b;
  text-decoration: none;
  border-bottom: 1px dashed #e6c88a;
}
.content a:hover {
  color: #7a5d2e;
  border-bottom-color: #7a5d2e;
  text-decoration: none;
}

.error {
  color: #c0392b;
  text-align: center;
  padding: 50px 0;
}

/* ===== 上下篇导航 ===== */
.post-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
  padding: 12px 16px;
  border-top: 1px solid #f0e0b8;
  border-bottom: 1px solid #f0e0b8;
  gap: 10px;
  flex-wrap: wrap;
  background: rgba(255, 248, 220, 0.4);
  border-radius: 8px;
}
.nav-link {
  color: #b8860b;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  max-width: 42%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 4px 10px;
  border-radius: 4px;
  transition: all 0.3s ease;
}
.nav-link:hover:not(.disabled) {
  color: #7a5d2e;
  background: rgba(241, 196, 15, 0.2);
  text-decoration: underline;
}
.nav-link.disabled {
  color: transparent;
  cursor: default;
}

/* ===== 音频列表 ===== */
.audio-list {
  margin-top: 30px;
  padding: 20px;
  background: #fdf6e0;
  border-radius: 10px;
  border: 1px solid #f0e0b8;
}
.audio-list h3 {
  color: #7a5d2e;
  margin-bottom: 15px;
  border-bottom: 2px solid #f1c40f;
  padding-bottom: 8px;
}
.audio-list ul {
  list-style: none;
  padding: 0;
}
.audio-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  border-bottom: 1px solid #f5ecce;
  cursor: pointer;
  transition: all 0.25s ease;
  border-radius: 6px;
}
.audio-item:hover {
  background: rgba(241, 196, 15, 0.15);
}
.audio-item.active {
  background: rgba(241, 196, 15, 0.25);
  border-left: 3px solid #f1c40f;
}
.audio-index {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1c40f;
  color: white;
  border-radius: 50%;
  font-size: 13px;
  font-weight: bold;
  flex-shrink: 0;
}
.audio-title {
  flex: 1;
  font-size: 16px;
  color: #4a3a25;
  font-weight: 500;
}
.audio-play {
  color: #b8860b;
  font-size: 16px;
}
.audio-item:hover .audio-play {
  color: #d4a017;
}

.player {
  margin-bottom: 15px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(180, 130, 30, 0.12);
  border: 1px solid #f0e0b8;
}
.player p {
  margin-top: 8px;
  color: #7a5d2e;
  font-size: 14px;
  font-weight: 500;
}
.play-status {
  color: #b8860b !important;
  font-size: 13px !important;
  font-weight: 400 !important;
}

/* ===== 视频 ===== */
.video-section {
  margin: 20px 0;
  padding: 18px;
  background: #fdf6e0;
  border-radius: 10px;
  border: 1px solid #f0e0b8;
}
.video-section h3 {
  color: #7a5d2e;
  border-bottom: 2px solid #f1c40f;
  padding-bottom: 8px;
  margin-bottom: 12px;
}
.video-container {
  background: #1a1a1a;
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
  border: 2px solid #e6c88a;
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
  color: #4a3a25;
}
.video-counter {
  color: #a07d4a;
  font-size: 14px;
}
.video-nav {
  display: flex;
  gap: 15px;
  margin: 10px 0;
}
.video-nav button {
  padding: 8px 20px;
  background: #f7e8b0;
  color: #7a5d2e;
  border: 1px solid #e6c88a;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}
.video-nav button:hover:not(:disabled) {
  background: #f1c40f;
  color: #fff;
  transform: translateY(-1px);
}
.video-nav button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
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
  border-bottom: 1px solid #f5ecce;
  cursor: pointer;
  transition: all 0.25s ease;
  border-radius: 6px;
}
.video-list-item:hover {
  background: rgba(241, 196, 15, 0.12);
}
.video-list-item.active {
  background: rgba(241, 196, 15, 0.22);
  border-left: 3px solid #f1c40f;
}
.video-list-index {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1c40f;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}
.video-list-title {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  color: #4a3a25;
}
.video-list-play {
  color: #b8860b;
  font-size: 14px;
}
.video-list-item:hover .video-list-play {
  color: #d4a017;
}

/* ===== 快进快退控制栏 ===== */
.media-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0 8px 0;
  padding: 10px 14px;
  background: rgba(255, 248, 220, 0.6);
  border-radius: 8px;
  border: 1px solid #f0e0b8;
}
.ctrl-btn {
  padding: 5px 14px;
  background: #f7e8b0;
  color: #7a5d2e;
  border: 1px solid #e6c88a;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}
.ctrl-btn:hover {
  background: #f1c40f;
  color: #fff;
  transform: translateY(-1px);
}
.jump-btn {
  background: #e8d5a0;
}
.jump-btn:hover {
  background: #d4ac0d !important;
  color: #fff !important;
}
.ctrl-divider {
  color: #d4b880;
  margin: 0 4px;
}
.ctrl-label {
  font-size: 13px;
  color: #7a5d2e;
}
.jump-input {
  width: 42px;
  padding: 4px 2px;
  border: 1px solid #e6c88a;
  border-radius: 4px;
  text-align: center;
  font-size: 13px;
  background: #fffcf0;
  color: #4a3a25;
}
.jump-input:focus {
  outline: none;
  border-color: #f1c40f;
}
.jump-colon {
  color: #b8950a;
  font-weight: bold;
}

@media (max-width: 600px) {
  .media-controls {
    gap: 5px;
    padding: 8px 10px;
  }
  .ctrl-btn {
    padding: 4px 10px;
    font-size: 12px;
  }
  .jump-input {
    width: 32px;
    font-size: 12px;
    padding: 3px 1px;
  }
  .ctrl-label {
    font-size: 12px;
  }
}

/* ===== 返回顶部 ===== */
.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 20px;
  width: 48px;
  height: 48px;
  background: #f7e8b0;
  color: #7a5d2e;
  border: 1px solid #e6c88a;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(180, 130, 30, 0.2);
  transition: all 0.3s ease;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.back-to-top:hover {
  background: #f1c40f;
  color: #fff;
  transform: translateY(-3px);
}
.back-to-top:active {
  transform: scale(0.92);
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