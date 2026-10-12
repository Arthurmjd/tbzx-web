import request from '@/utils/request'
import { MOCK_DEVICE, mockLatestLocation } from '@/mock/data'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const wait = (ms = 200) => new Promise(r => setTimeout(r, ms))

// 设备列表
export async function listDevices() {
  if (USE_MOCK) { await wait(); return [MOCK_DEVICE] }
  return request.get('/devices')
}

// 最新位置 (家属端轮询)
export async function getLatestLocation(deviceId) {
  if (USE_MOCK) { await wait(100); return mockLatestLocation() }
  return request.get(`/devices/${deviceId}/latest-location`)
}

// 实时轨迹尾巴 (家属端, 最近 N 点升序, 末端=最新)
export async function getRecentLocations(deviceId, limit = 30) {
  if (USE_MOCK) {
    await wait(100)
    const base = mockLatestLocation()
    const pts = []
    for (let i = limit; i > 0; i--) {
      pts.push({
        lat: base.lastLat + (Math.random() - 0.5) * 0.0008,
        lng: base.lastLng + (Math.random() - 0.5) * 0.0008,
        speed: 1 + Math.random(),
        accuracy: 5 + Math.random() * 10,
        pointTs: new Date(Date.now() - i * 5000).toISOString()
      })
    }
    return pts
  }
  return request.get(`/devices/${deviceId}/recent-locations`, { params: { limit } })
}

// 绑定设备
export function bindDevice(deviceId, bindCode) {
  return request.post(`/devices/${deviceId}/bind`, { bindCode })
}
