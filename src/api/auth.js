import request from '@/utils/request'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const wait = (ms = 200) => new Promise(r => setTimeout(r, ms))

// 登录
export async function login({ username, password }) {
  if (USE_MOCK) {
    await wait()
    return { token: 'mock-jwt-token', userId: 1, username }
  }
  return request.post('/auth/login', { username, password })
}
