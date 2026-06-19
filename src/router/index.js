import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import ForumView from '../views/ForumView.vue'  // 新增

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/post/:tid',
      name: 'postDetail',
      component: PostDetailView
    },
    {
      path: '/forum/:fid',   // 新增：版块帖子列表
      name: 'forum',
      component: ForumView
    }
  ]
})

export default router