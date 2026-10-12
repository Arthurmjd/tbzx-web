import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 10000
})

// 请求: 带上 JWT
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 响应: 直接剥 data; 401 一律踢回登录页
request.interceptors.response.use(
  res => {
    // 后端若包 {code, message, data} 信封, 在这里剥一层:
    // if (res.data && res.data.code !== undefined) {
    //   if (res.data.code !== 0) return Promise.reject(res.data)
    //   return res.data.data
    // }
    return res.data
  },
  err => {
    const status = err.response?.status
    const url = err.config?.url || ''
    // 登录/注册接口本身的 401 = 凭证错误, 显示后端真实原因, 不当成 token 过期
    if (status === 401 && /\/auth\//.test(url)) {
      ElMessage.error(err.response?.data?.message || '用户名或密码错误')
      return Promise.reject(err)
    }
    if (status === 401) {
      localStorage.removeItem('token')
      if (router.currentRoute.value.path !== '/login') router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
    } else {
      ElMessage.error(err.response?.data?.message || '请求失败')
    }
    return Promise.reject(err)
  }
)

export default request
