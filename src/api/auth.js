import request from '@/utils/request'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const wait = (ms = 200) => new Promise(r => setTimeout(r, ms))

// 图形验证码: 取 id + 图片 (答案留在服务端)
export async function fetchCaptcha() {
  if (USE_MOCK) {
    await wait()
    return { captchaId: 'mock', image: '' }
  }
  return request.get('/auth/captcha')
}

// 登录
export async function login({ username, password, captchaId, captchaCode }) {
  if (USE_MOCK) {
    await wait()
    return { token: 'mock-jwt-token', userId: 1, username }
  }
  return request.post('/auth/login', { username, password, captchaId, captchaCode })
}

// 注册
export async function register({ username, password, realName }) {
  if (USE_MOCK) {
    await wait()
    return { userId: 1, username }
  }
  return request.post('/auth/register', { username, password, realName })
}

// 校验 token 并取当前用户 (刷新/启动时确认本地 token 是否仍有效)
export async function fetchMe() {
  if (USE_MOCK) {
    await wait()
    return { userId: 1, username: localStorage.getItem('username') || 'test', realName: '测试用户' }
  }
  return request.get('/auth/me')
}
