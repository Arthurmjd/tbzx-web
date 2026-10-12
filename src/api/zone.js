import request from '@/utils/request'
import { mockListZones, mockAddZone, mockToggleZone, mockDeleteZone } from '@/mock/data'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const wait = (ms = 200) => new Promise(r => setTimeout(r, ms))

// 安全区域列表
export async function listZones(deviceId) {
  if (USE_MOCK) { await wait(); return mockListZones() }
  return request.get(`/devices/${deviceId}/zones`)
}

// 创建安全区域
export async function createZone(data) {
  if (USE_MOCK) { await wait(); return mockAddZone(data) }
  return request.post(`/devices/${data.deviceId}/zones`, data)
}

// 启用/停用
export async function toggleZone(zoneId) {
  if (USE_MOCK) { await wait(); return mockToggleZone(zoneId) }
  return request.patch(`/zones/${zoneId}/toggle`)
}

// 删除
export async function deleteZone(zoneId) {
  if (USE_MOCK) { await wait(); return mockDeleteZone(zoneId) }
  return request.delete(`/zones/${zoneId}`)
}
