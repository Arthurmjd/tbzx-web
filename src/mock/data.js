// Mock 数据层: 后端未就绪时的全前端开发支撑
// 最新位置沿玄武湖步行环线随时间插值移动, 轮询时位置真实会动

// 玄武湖步行环线控制点 (lat, lng) — GCJ-02
const PATH = [
  [32.0727, 118.7945], [32.0745, 118.7972], [32.0762, 118.7965],
  [32.0778, 118.7936], [32.0760, 118.7910], [32.0735, 118.7905]
]
const STEP_MS = 5 * 1000        // 两个点间隔 5s (和 App 采集周期一致)
const CYCLE = 840               // 一圈 840 个点 = 70 分钟

// 线性插值: 取环线上第 n 个位置 (跨控制点平滑过渡)
function pointAt(n) {
  const cycle = n % CYCLE
  const segLen = CYCLE / PATH.length          // 每段控制点之间的点数
  const seg = Math.floor(cycle / segLen)
  const t = (cycle % segLen) / segLen
  const [aLat, aLng] = PATH[seg]
  const [bLat, bLng] = PATH[(seg + 1) % PATH.length]
  return { lat: aLat + (bLat - aLat) * t, lng: aLng + (bLng - aLng) * t }
}

export const MOCK_DEVICE = {
  deviceId: 'TBZX-DEMO00001',
  deviceName: '我的助行设备',
  online: true,
  batteryLevel: 78,
  currentSessionId: 15
}

export function mockLatestLocation() {
  const p = pointAt(Date.now() / STEP_MS)
  return {
    ...MOCK_DEVICE,
    lastLat: p.lat,
    lastLng: p.lng,
    lastHeartbeatAt: new Date().toISOString(),
    lastPointAt: new Date().toISOString()
  }
}

// 历史轨迹: 最近 N 个点 (每 5s 一个, ≤500 点无需抽稀)
export function mockTrack(pointCount = 500) {
  const now = Math.floor(Date.now() / STEP_MS)
  const points = []
  for (let i = now - pointCount; i <= now; i++) {
    const p = pointAt(i)
    points.push({
      lat: p.lat,
      lng: p.lng,
      speed: 1.1 + Math.sin(i / 9) * 0.3,
      createdAt: new Date(i * STEP_MS).toISOString()
    })
  }
  return { sessionId: 15, pointCount: points.length, points }
}

export const MOCK_SESSIONS = [
  { id: 15, startTime: new Date(Date.now() - 36e5).toISOString(), endTime: null, distanceM: 3200, alertCount: 1, status: 0 },
  { id: 14, startTime: new Date(Date.now() - 864e5).toISOString(), endTime: new Date(Date.now() - 828e5).toISOString(), distanceM: 1800, alertCount: 0, status: 1 }
]

export const MOCK_ALERTS = [
  { id: 3, alertType: 'GEOFENCE_EXIT', severity: 2, description: '已离开安全区域「家附近」', hasImage: 0, createdAt: new Date(Date.now() - 36e5).toISOString() },
  { id: 2, alertType: 'VEHICLE_APPROACH', severity: 1, description: '检测到车辆接近', hasImage: 0, createdAt: new Date(Date.now() - 72e5).toISOString() },
  { id: 1, alertType: 'OFFLINE', severity: 2, description: '设备超过10分钟未心跳', hasImage: 0, createdAt: new Date(Date.now() - 108e5).toISOString() }
]

// ---- 安全区域: 会话内可变的内存状态 ----
let zones = [
  { id: 1, zoneName: '家附近', centerLat: 32.0700, centerLng: 118.7930, radiusM: 300, active: 1 },
  { id: 2, zoneName: '常去公园', centerLat: 32.0780, centerLng: 118.7950, radiusM: 200, active: 1 }
]

export function mockListZones() {
  return [...zones]
}

export function mockAddZone(z) {
  const created = { id: Date.now(), active: 1, ...z }
  zones = [...zones, created]
  return created
}

export function mockToggleZone(id) {
  zones = zones.map(z => (z.id === id ? { ...z, active: z.active === 1 ? 0 : 1 } : z))
  return zones.find(z => z.id === id)
}

export function mockDeleteZone(id) {
  zones = zones.filter(z => z.id !== id)
}
