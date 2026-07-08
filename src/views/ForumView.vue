<template>
  <div class="container">
    <div class="forum-header">
      <router-link to="/" class="back">← 返回资料集首页</router-link>
      <div class="forum-title-row">
        <h1>{{ forumName }}</h1>
        <button 
          @click="toggleSortOrder" 
          class="sort-btn"
          :title="sortOrder === 'desc' ? '点击切换为正序（从旧到新）' : '点击切换为倒序（从新到旧）'"
        >
          {{ sortOrder === 'desc' ? '📅 倒序' : '📅 正序' }}
        </button>
      </div>
    </div>

    <!-- ===== 顶部页码 ===== -->
    <div v-if="pageNumbers.length > 1" class="top-page-numbers">
      <button 
        v-for="num in pageNumbers" 
        :key="num"
        @click="goToPageNum(num)"
        class="page-num-btn"
        :class="{ active: num === page }"
      >
        {{ num }}
      </button>
    </div>
    <!-- ===== 顶部页码结束 ===== -->

    <div v-if="loading">⏳ 加载中...</div>
    <div v-else-if="posts.length === 0 && subForums.length === 0" class="empty">该版块暂无帖子</div>
    
    <div v-if="subForums.length > 0" class="sub-forums">
      <h3>📂 子版块</h3>
      <ul>
        <li v-for="sub in subForums" :key="sub.fid">
          <router-link :to="`/forum/${sub.fid}`">
            {{ sub.name }}
          </router-link>
          <span class="sub-meta">（{{ sub.threads || 0 }} 个主题）</span>
        </li>
      </ul>
    </div>
    
    <ul v-else-if="posts.length > 0">
      <li v-for="post in posts" :key="post.tid">
        <router-link :to="`/post/${post.tid}`">
          {{ post.subject }}
        </router-link>
        <span class="author"> - {{ post.author }}</span>
        <span class="meta">{{ formatTime(post.dateline) }}</span>
      </li>
    </ul>
    
    <div v-if="posts.length > 0" class="pagination-nav">
      <div class="pagination-left">
        <a href="#" @click.prevent="prevPage" :class="{ disabled: page <= 1 }">‹ 上一页</a>
        <span class="page-info">第 {{ page }} 页</span>
        <a href="#" @click.prevent="nextPage" :class="{ disabled: posts.length < perPage }">下一页 ›</a>
      </div>
      <!-- ===== 底部跳转输入 ===== -->
      <div class="page-jump">
        <span class="jump-label">跳转到</span>
        <input 
          type="number" 
          v-model.number="jumpPage" 
          min="1" 
          class="jump-input"
          @keyup.enter="goToPage"
        />
        <span class="jump-label">页</span>
        <button @click="goToPage" class="jump-btn">GO</button>
      </div>
      <!-- ===== 底部跳转结束 ===== -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const posts = ref([])
const loading = ref(true)
const forumName = ref('版块帖子')
const page = ref(1)
const fid = ref(0)
const perPage = 50
const subForums = ref([])
const sortOrder = ref('desc')
const jumpPage = ref(1)
const pageNumbers = ref([])

const forumNames = {
  '1326': '每日学习',
  '1335': '每日畅听',
  '52': '睡前一听',
  '9629': '经文念诵合集',
  '101': '初学功课流程',
  '285': '入门手册',
  '47': '佛学问答',
  '123': '供水供花供果',
  '132': '供菩萨像',
  '136': '佛具的问题',
  '898': '助设佛台',
  '900': '供油灯',
  '901': '供水',
  '902': '供果',
  '903': '供花',
  '904': '香与香炉',
  '905': '上香规程',
  '906': '上香礼仪',
  '110208': '【视频列表】大字精美拼音经文教念',
  '139250': '初学者功课推荐：一般初学者功课',
  '139251': '初学者功课推荐：老年人功课',
  '139253': '初学者功课推荐：重病患者功课',
  '16703': '【百人合唱大悲咒】无限循环畅听版',
  '9282': '【设佛台】流程',
  '8505': '【上香礼佛程序】',
  '132273': '上香礼佛程序 有佛台 +无佛台',
  '10044': '【心香拜佛】',
  '9056': '【上头香】礼佛程序',
  '130851': '供奉菩萨像须知+菩萨像下载',
  '115921': '【汇总】上香，礼佛，香炉，檀香，供油，供花，供水的问题',
  '39642': '上头香时如何点檀香木，上大香',
  '134996': '上心香的时间，地点，流程',
  '100': '【最新放生】仪式流程',
  '16685': '遇到劫时，可直接许愿放生1200条鱼',
  '167': '【目录】经典组合指南',
  '3975': '小房子念诵方法和注意事项',
  '10378': '经典组合念诵指南-视频',
  '10379': '经典组合及其作用',
  '10380': '印制经典组合',
  '10381': '经典组合必备物品',
  '10382': '经典组合念诵',
  '10383': '经典组合填写',
  '10384': '经典组合烧送',
  '10385': '处理经典组合的灰',
  '10386': '经典组合保存',
  '10387': '经典组合作废',
  '10388': '何种情况需念经典组合及数量',
  '10389': '经典组合问答',
  '16942': '（图解版）烧送小房子程序',
  '16946': '（图解版）烧送自修经文程序',
  '134832': '佛教经典组合里四种经文的作用',
  '131150': '【目录】入门手册',
  '10254': '（一）念经',
  '10277': '（二）念小房子还债',
  '10390': '（三）放生',
  '10391': '（四）许愿',
  '10392': '（五）佛台和上香',
  '10393': '（六）改名升文',
  '10394': '（七）劝导升文',
  '138593': '【下载】佛像、经文、自修、小房子等资料',
  '134831': '《普照》安卓+苹果论坛下载',
  '11910': '震撼和感动视频',
  '99413': '师父希望大家真修实修',
  '13192': '我们唯一的师父',
  '135992': '师父的来历，愿望，成就，影响',
  '102258': '【法會圖騰】合集811个视频',
  '14561': '精彩案例【视频播放列表】125个合集',
  '31710': '千万不要堕胎！堕胎果报专集',
  '102327': '经典因果视频23个',
  '133664': '哪些行为导致命运不好',
  '132253': '70个杀业的果报',
  '133642': '好人受苦，坏人享福的真正原因',
  '133719': '远离通灵人',
  '17414': '三位科学家学佛前后改变命运',
  '98538': '癌症系列看图腾专集',
  '97': '经典因果视频【小陈悦】',
  '130759': '白话佛法第一册畅听',
  '130792': '白话佛法第二册畅听',
  '130793': '白话佛法第三册畅听',
  '130794': '白话佛法第四册畅听',
  '130795': '白话佛法第五册畅听',
  '130796': '白话佛法第六册畅听',
  '130797': '白话佛法第七册畅听',
  '130798': '白话佛法第八册畅听',
  '130799': '白话佛法第九册畅听',
  '130800': '白话佛法第十册畅听',
  '130801': '白话佛法第十一册畅听',
  '130802': '白话佛法第十二册畅听',
  '100631': '历年广播讲座音频(合集381个)',
  '15563': '广播讲座第一册(合集30个)',
  '15564': '广播讲座第二册(合集28个)',
  '100632': '2010年广播讲座音频',
  '100633': '2011年广播讲座音频',
  '100634': '2012年广播讲座音频',
  '100635': '2013年广播讲座音频',
  '100636': '2014年广播讲座音频',
  '100637': '2015年广播讲座音频',
  '100638': '2016年广播讲座音频',
  '100639': '2017年广播讲座音频',
  '100640': '2018年广播讲座音频',
  '100641': '2019-2020年广播讲座音频',
  '32022': '2019-2020年广播讲座视频',
  '4837': '白话佛法开示音频合集（1-116）',
  '12928': '白话佛法视频开示【视频列表】1-116',
  '14553': '历届法會视频大合集【406个】',
  '14522': '历年法會开示(总合集746个)',
  '12167': '历年法會开示音频(合集244个)',
  '130763': '【畅听】历届FA会弟子开示合集',
  '12787': '历届见面会共修组提问合集',
  '100997': '【视频】2009年解答会合集',
  '100998': '【视频】2010年解答会合集',
  '100999': '【视频】2011年解答会合集',
  '101000': '【视频】2012年解答会合集',
  '101001': '【视频】2013年解答会合集',
  '101002': '【视频】2014年解答会合集',
  '101003': '【视频】2015年解答会合集',
  '101004': '【视频】2016年解答会合集',
  '101005': '【视频】2017年解答会合集',
  '101006': '【视频】2018年解答会合集',
  '101007': '【视频】2019年解答会合集',
  '101008': '【视频】2020年解答会合集',
  '139099': '佛教故事-畅听目录',
  '100996': '观世音菩萨三十三身动画视频',
  '135516': '师父讲的观世音菩萨故事集',
  '11938': '佛陀故事集 师父原音（101个合集）',
  '11055': '师父讲故事（音频合集）',
  '14206': '师父讲禅修故事（合集）100个',
  '133878': '畅听•般若智慧小故事•合集',
  '133879': '畅听•布施行善小故事•合集',
  '133880': '畅听•禅修静定小故事•合集',
  '133881': '畅听•忏悔改过小故事•合集',
  '133882': '畅听•持戒守戒小故事•合集',
  '133883': '畅听•烦恼菩提小故事•合集',
  '130966': '2008年玄艺问答 音频合集',
  '130965': '2009年玄艺问答 音频合集',
  '10163': '2010年玄艺问答 音频合集',
  '10162': '2011年玄艺问答 音频合集',
  '10161': '2012年玄艺问答 音频合集',
  '10160': '2013年玄艺问答 音频合集',
  '10159': '2014年玄艺问答 音频合集',
  '10158': '2015年玄艺问答 音频合集',
  '10157': '2016年玄艺问答 音频合集',
  '10156': '2017年玄艺问答 音频合集',
  '10155': '2018年玄艺问答 音频合集',
  '10154': '2019年玄艺问答 音频合集',
  '4680': '2020年玄艺问答 音频合集',
  '32519': '专题音频合集-学佛改变命运',
  '130764': '师父开示每日佛言佛语・畅听合集',
  '130971': '【畅听】佛学问答175问',
  '412': '畅听-常见问题',
  '1321': '念经吃素',
  '1322': '戒杀放生',
  '482': '忏悔发愿',
  '480': '以戒为师',
  '481': '消灾化劫',
  '479': '明理开悟',
  '1108': '积累功德',
  '478': '正解因缘',
  '483': '修行偏差',
  '1160': '拓展开示',
  '1336': '经文开示',
  '74': '白话佛法第一册',
  '73': '白话佛法第二册',
  '72': '白话佛法第三册',
  '83': '白话佛法第四册',
  '82': '白话佛法第五册',
  '81': '白话佛法第六册',
  '80': '白话佛法第七册',
  '79': '白话佛法第八册',
  '78': '白话佛法第九册',
  '77': '白话佛法第十册',
  '76': '白话佛法第十一册',
  '75': '白话佛法第十二册',
  '343': '白话佛法视频116集',
  '1121': '白话佛法视听精选',
  '257': '2010年广播讲座',
  '258': '2011年广播讲座',
  '259': '2012年广播讲座',
  '260': '2013年广播讲座',
  '261': '2014年广播讲座',
  '262': '2015年广播讲座',
  '278': '2016年广播讲座',
  '279': '2017年广播讲座',
  '265': '2018年广播讲座',
  '228': '2019-2020年广播讲座',
  '1338': '每日佛言佛语',
  '456': '佛言佛语1-14册',
  '1393': 'FYFY1-4册单页',
  '1394': 'FYFY5-8册单页',
  '1395': 'FYFY9-12册单页',
  '1396': 'FYFY13-14册单页',
  '4061': '佛言偈语（第一册）',
  '32019': '佛言偈语（第二册）',
  '32020': '佛言偈语（第三册）',
  '101977': '佛言偈语（第四册）',
  '32018': '心灵禅语（第一册）',
  '32017': '心灵禅语（第二册）',
  '461': '观音堂开示',
  '1339': '观音堂开光与联谊会',
  '289': '弟子开示一',
  '288': '弟子开示二',
  '132023': '【目录1】佛学问答175问',
  '99358': '【目录2】佛学问答175问',
  '92555': '疾病百科目录',
  '60': '解答来信疑惑整期文字',
  '286': '佛学常识集锦一 佛台 念经 礼佛',
  '292': '佛学常识集锦二 戒杀护生 善护口业',
  '297': '婚姻情感集锦一 珍惜姻缘 随顺因缘',
  '296': '婚姻情感集锦二 持守戒律 圆满家庭',
  '100707': '弘法度人辅导手册目录',
  '1105': '2008见面会开示',
  '271': '2010见面会开示',
  '272': '2011见面会开示',
  '273': '2012见面会开示',
  '274': '2013见面会开示',
  '275': '2014见面会开示',
  '277': '2015见面会开示',
  '280': '2018见面会开示',
  '281': '2019见面会开示',
  '282': '2020见面会开示',
  '12246': '2011见面会提问',
  '12768': '2014见面会提问',
  '304': '2015见面会提问',
  '305': '2016见面会提问',
  '306': '2017见面会提问',
  '307': '2018见面会提问',
  '308': '2019见面会提问',
  '309': '2020见面会提问',
  '294': '法會图腾',
  '293': '法會同修分享',
  '68': '明理视频',
  '1121': '视听精选',
  '298': '感动花絮',
  '1106': '精彩结束语',
  '347': '感动视频',
  '1327': '恩师寄语',
  '1120': '新闻报道',
  '1138': '不忘师恩',
  '206': '佛陀故事',
  '1400': '观世音菩萨故事',
  '1323': '视频故事',
  '69': '佛教动画',
  '62': '智慧小故事总目录',
  '400': '布施行善小故事',
  '399': '般若智慧小故事',
  '402': '忏悔改过小故事',
  '401': '禅修禅定小故事',
  '403': '持戒守戒小故事',
  '405': '烦恼菩提小故事',
  '406': '放下随缘 小故事',
  '463': '天地游记一',
  '462': '天地游记二',
  '1328': '天地游记未成册一',
  '1329': '天地游记未成册二',
  '647': '【心灵百科】文字·畅听',
  '135478': '【因果视频专集·分类目录】',
  '58': '图腾视频剪辑811个',
  '100321': '《一命二运三风水》',
  '100528': '《天 地 人》',
  '100973': '共圆【中国梦】',
  '134265': '释迦牟尼佛出家日，涅槃日，诞辰日，成道日',
  '134242': '观世音菩萨诞辰日，成道日，出家日开示',
  '1136': '观世音菩萨',
  '1137': '释迦牟尼佛',
  '1135': '大势至菩萨',
  '1134': '阿弥陀佛',
  '1133': '地藏王菩萨',
  '1331': '燃灯古佛',
  '1124': '其他菩萨',
  '1161': '佛菩萨开示',
  '103259': '【春节•大全辑】平安吉祥过大年',
  '1131': '元宵节',
  '1130': '清明节',
  '1129': '端午节',
  '1128': '中元节',
  '1333': '中秋节',
  '1332': '重阳节',
  '1127': '冬至',
  '1126': '新年元旦',
  '1125': '岁末年关',
  '1334': '立春',
  '1103': '2008年节目录音',
  '1104': '2009年节目录音',
  '202': '2010年节目录音',
  '201': '2011年节目录音',
  '200': '2012年节目录音',
  '199': '2013年节目录音',
  '198': '2014年节目录音',
  '197': '2015年节目录音',
  '196': '2016年节目录音',
  '195': '2017年节目录音',
  '194': '2018年节目录音',
  '193': '2019年节目录音',
  '192': '2020年节目录音',
  '605': '2011年音频剪辑',
  '592': '2012年音频剪辑',
  '579': '2013年音频剪辑',
  '566': '2014年音频剪辑',
  '553': '2015年音频剪辑',
  '540': '2016年音频剪辑',
  '527': '2017年音频剪辑',
  '514': '2018年音频剪辑',
  '440': '2019年音频剪辑',
  '424': '音频剪辑2020',
  '425': '202001',
  '434': '202002',
  '433': '202003',
  '432': '202004',
  '431': '202005',
  '430': '202006',
  '429': '202007',
  '428': '202008',
  '427': '202009',
  '426': '202010',
  '50': '分类音频',
  '453': '玄艺问答视频',
  '1319': '真修实修视频',
  '409': '留言板选摘',
  '454': '博客回复',
  '63': '灵验实例',
  '1096': '精彩感言',
  '1097': '网友反馈',
  '1098': '精彩专题',
}

const baseUrl = 'https://www.dadaozjzhitojian.cloud/sina/ff/safe_api.php'

const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  localStorage.setItem(`forum_sort_${fid.value}`, sortOrder.value)
  page.value = 1
  loadPosts()
}

const loadPosts = async () => {
  loading.value = true
  subForums.value = []
  try {
    const url = `${baseUrl}?action=list&fid=${fid.value}&page=${page.value}&limit=${perPage}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.code === 0) {
      const rawData = data.data || []
      if (sortOrder.value === 'asc') {
        posts.value = [...rawData].sort((a, b) => a.dateline - b.dateline)
      } else {
        posts.value = [...rawData].sort((a, b) => b.dateline - a.dateline)
      }
      
      // ===== 生成页码列表（显示前6页） =====
      pageNumbers.value = []
      // 如果当前页有数据，显示1-6；如果没数据，说明超出范围
      if (posts.value.length > 0) {
        // 当前页有数据，从1开始显示6页
        for (let i = 1; i <= 6; i++) {
          pageNumbers.value.push(i)
        }
      } else {
        // 当前页没数据，尝试显示前6页（用户自己判断哪些页有数据）
        for (let i = 1; i <= 6; i++) {
          pageNumbers.value.push(i)
        }
      }
      // ===== 页码生成结束 =====
      
      if (posts.value.length === 0 && page.value > 1) {
        // 如果当前页没数据，说明超出范围，回退到第一页
        page.value = 1
        await loadPosts()
        return
      }
      
      if (posts.value.length === 0) {
        await loadSubForums()
      }
    }
  } catch (error) {
    console.error('获取版块帖子失败:', error)
  } finally {
    loading.value = false
  }
}

const loadSubForums = async () => {
  try {
    const res = await fetch(`${baseUrl}?action=subforums&fid=${fid.value}`)
    const data = await res.json()
    if (data.code === 0 && data.data.length > 0) {
      subForums.value = data.data
    }
  } catch (error) {
    console.error('获取子版块失败:', error)
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadPosts()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const nextPage = () => {
  if (posts.value.length >= perPage) {
    page.value++
    loadPosts()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const goToPage = () => {
  if (jumpPage.value >= 1) {
    page.value = jumpPage.value
    loadPosts()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const goToPageNum = (num) => {
  if (num >= 1 && num !== page.value) {
    page.value = num
    loadPosts()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

watch(
  () => route.params.fid,
  (newFid) => {
    if (newFid) {
      fid.value = parseInt(newFid)
      page.value = 1
      forumName.value = forumNames[newFid] || `版块 ${newFid}`
      const savedSort = localStorage.getItem(`forum_sort_${fid.value}`)
      sortOrder.value = savedSort || 'desc'
      loadPosts()
    }
  }
)

onMounted(() => {
  const fidParam = route.params.fid
  if (fidParam) {
    fid.value = parseInt(fidParam)
    forumName.value = forumNames[fidParam] || `版块 ${fidParam}`
    const savedSort = localStorage.getItem(`forum_sort_${fid.value}`)
    sortOrder.value = savedSort || 'desc'
    loadPosts()
  } else {
    loading.value = false
  }
})
</script>

<style scoped>
.container { max-width: 800px; margin: 0 auto; padding: 20px; background: #fef9e7; min-height: 100vh; }

.forum-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.forum-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.back {
  display: inline-block;
  padding: 8px 18px;
  background: linear-gradient(145deg, #f7e8b0, #edcfa0);
  color: #7a5d2e;
  border: 1px solid #e6c88a;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  align-self: flex-start;
}
.back:hover {
  background: linear-gradient(145deg, #f1c40f, #d4ac0d);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(180, 130, 30, 0.25);
  text-decoration: none;
}

h1 { 
  color: #2c3e50; 
  border-bottom: 3px solid #f1c40f; 
  padding-bottom: 6px; 
  margin: 0;
  flex: 1;
}

.sort-btn {
  padding: 6px 16px;
  background: linear-gradient(145deg, #f7e8b0, #edcfa0);
  color: #7a5d2e;
  border: 1px solid #e6c88a;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
  margin-bottom: 4px;
}
.sort-btn:hover {
  background: linear-gradient(145deg, #f1c40f, #d4ac0d);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(180, 130, 30, 0.25);
}

/* ===== 顶部页码 ===== */
.top-page-numbers {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 0 10px 0;
  border-bottom: 1px solid #f0e0b8;
  margin-bottom: 12px;
}
.top-page-numbers .page-num-btn {
  min-width: 34px;
  height: 34px;
  padding: 0 8px;
  background: #f5f5f5;
  color: #7a5d2e;
  border: 1px solid #e6c88a;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.top-page-numbers .page-num-btn:hover {
  background: #f7e8b0;
}
.top-page-numbers .page-num-btn.active {
  background: linear-gradient(145deg, #f1c40f, #d4ac0d);
  color: #fff;
  border-color: #d4ac0d;
}

ul { list-style: none; padding: 0; }
li { padding: 12px 15px; background: white; margin-bottom: 8px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); transition: 0.2s; }
li:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
a { text-decoration: none; color: #2c3e50; font-weight: 500; }
a:hover { color: #42b983; }
.author { color: #888; font-size: 14px; }
.meta { color: #aaa; font-size: 12px; float: right; }
.empty { color: #999; text-align: center; padding: 40px 0; }

.sub-forums { margin: 20px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.sub-forums h3 { color: #785635; margin-bottom: 15px; }
.sub-forums ul { list-style: none; padding: 0; }
.sub-forums li { padding: 10px 15px; border-bottom: 1px solid #f0f0f0; background: transparent; box-shadow: none; margin: 0; border-radius: 0; }
.sub-forums li:last-child { border-bottom: none; }
.sub-forums a { font-weight: 500; }
.sub-meta { color: #999; font-size: 13px; margin-left: 8px; }

.pagination-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 25px;
  padding: 12px 0;
  border-top: 1px solid #eee;
  flex-wrap: wrap;
  gap: 10px;
}
.pagination-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.page-info { font-size: 14px; color: #888; }
.nav-links { display: flex; gap: 20px; }
.nav-links a {
  display: inline-block;
  padding: 8px 20px;
  background: linear-gradient(145deg, #f7e8b0, #edcfa0);
  color: #7a5d2e;
  border: 1px solid #e6c88a;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}
.nav-links a:hover:not(.disabled) {
  background: linear-gradient(145deg, #f1c40f, #d4ac0d);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(180, 130, 30, 0.25);
  text-decoration: none;
}
.nav-links a.disabled {
  color: #ccc;
  cursor: not-allowed;
  pointer-events: none;
  background: #f0f0f0;
  border-color: #ddd;
  transform: none !important;
}

/* ===== 底部跳转 ===== */
.page-jump {
  display: flex;
  align-items: center;
  gap: 6px;
}
.jump-label {
  font-size: 13px;
  color: #7a5d2e;
}
.jump-input {
  width: 50px;
  padding: 4px 6px;
  border: 1px solid #e6c88a;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
  background: #fffcf0;
  color: #4a3a25;
}
.jump-input:focus {
  outline: none;
  border-color: #f1c40f;
}
.jump-btn {
  padding: 4px 14px;
  background: linear-gradient(145deg, #f7e8b0, #edcfa0);
  color: #7a5d2e;
  border: 1px solid #e6c88a;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}
.jump-btn:hover {
  background: linear-gradient(145deg, #f1c40f, #d4ac0d);
  color: #fff;
}

@media (max-width: 600px) {
  .top-page-numbers {
    justify-content: center;
  }
  .top-page-numbers .page-num-btn {
    min-width: 30px;
    height: 30px;
    font-size: 12px;
    padding: 0 4px;
  }
  .pagination-nav {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .pagination-left {
    justify-content: center;
  }
  .page-jump {
    justify-content: center;
  }
}
</style>