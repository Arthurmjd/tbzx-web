import request from '@/utils/request'
import { MOCK_SESSIONS, mockTrack } from '@/mock/data'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const wait = (ms = 200) => new Promise(r => setTimeout(r, ms))

// 出行记录列表
export async function listSessions(deviceId, page = 1, size = 20) {
  if (USE_MOCK) { await wait(); return MOCK_SESSIONS }
  return request.get(`/devices/${deviceId}/sessions`, { params: { page, size } })
}

// 一次出行的轨迹 (后端已抽稀 ≤500 点, 前端拿到多少画多少)
export async function getTrack(sessionId) {
  if (USE_MOCK) { await wait(300); return mockTrack(500) }
  return request.get(`/sessions/${sessionId}/track`)
}
