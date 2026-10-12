import request from '@/utils/request'
import { MOCK_ALERTS } from '@/mock/data'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const wait = (ms = 200) => new Promise(r => setTimeout(r, ms))

// 告警列表 (分页)
export async function listAlerts(deviceId, page = 1, size = 20) {
  if (USE_MOCK) {
    await wait()
    const start = (page - 1) * size
    return { total: MOCK_ALERTS.length, list: MOCK_ALERTS.slice(start, start + size) }
  }
  return request.get(`/devices/${deviceId}/alerts`, { params: { page, size } })
}
