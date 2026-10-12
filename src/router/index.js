import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', component: () => import('@/views/Login.vue') },
  { path: '/', redirect: '/monitor' },
  { path: '/monitor', component: () => import('@/views/Monitor.vue'), meta: { title: '实时监控' } },
  { path: '/history', component: () => import('@/views/HistoryTrack.vue'), meta: { title: '历史轨迹' } },
  { path: '/zones', component: () => import('@/views/SafeZone.vue'), meta: { title: '安全区域' } },
  { path: '/alerts', component: () => import('@/views/Alerts.vue'), meta: { title: '风险告警' } }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) return '/login'
  document.title = `${to.meta.title || ''} · 瞳伴随行家属端`
})

export default router
