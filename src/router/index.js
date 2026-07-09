import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import ForumView from '../views/ForumView.vue'
import FullSearch from '../views/FullSearch.vue'

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
      path: '/forum/:fid',
      name: 'forum',
      component: ForumView
    },
    {
      path: '/fullsearch',
      name: 'fullsearch',
      component: FullSearch
    }
  ]
})

export default router