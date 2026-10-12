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

// 本地 token 每次会话只校验一次, 避免每次跳转都打接口
let tokenChecked = false

router.beforeEach(async (to) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) return '/login'

  // 有 token 但本次会话尚未校验: 调 /auth/me 确认它仍有效 (过期/被删则踢回登录)
  if (token && !tokenChecked && to.path !== '/login') {
    try {
      const { fetchMe } = await import('@/api/auth')
      await fetchMe()
      tokenChecked = true
    } catch {
      localStorage.removeItem('token')
      return '/login'
    }
  }

  document.title = `${to.meta.title || ''} · 瞳伴随行家属端`
})

export default router
