<template>
  <div class="monitor">
    <div class="info-card" v-if="latest">
      <div class="row">
        <span class="name">{{ latest.deviceName }}</span>
        <el-tag :type="latest.online ? 'success' : 'info'" size="small">{{ latest.online ? '在线' : '离线' }}</el-tag>
      </div>
      <div class="row">
        <span>电量</span>
        <el-progress :percentage="latest.batteryLevel ?? 0" :color="latest.batteryLevel < 20 ? '#f56c6c' : '#67c23a'" style="width: 150px" />
      </div>
      <div class="row text">位置更新：{{ fmt(latest.lastPointAt) }}</div>
      <div class="row text">最近轨迹：{{ trailCount }} 个点</div>
      <div class="row text">心跳时间：{{ fmt(latest.lastHeartbeatAt) }}</div>
      <el-divider />
      <div class="row text dim">移动 5 秒、静止渐增至 30 秒自适应刷新；后台暂停轮询。</div>
    </div>
    <div v-else-if="loadError" class="info-card"><el-empty description="暂时无法获取设备位置" :image-size="70"><el-button @click="poll">重试</el-button></el-empty></div>
    <div class="map-area"><AMapContainer @ready="onMapReady" /></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import AMapContainer from '@/components/AMapContainer.vue'
import { getLatestLocation, getRecentLocations } from '@/api/device'
import { getDeviceId } from '@/utils/device'

const latest = ref(null)
const loadError = ref(false)
const trailCount = ref(0)
const lastPos = ref(null)
let AMap = null
let map = null
let marker = null
let trail = null
let timer = null
let curInterval = 5000
const MIN_INTERVAL = 5000, MAX_INTERVAL = 30000, STATIC_GROW = 5000

const fmt = s => (s ? new Date(s).toLocaleTimeString() : '--')

function markerHtml() {
  return `<div style="width:20px;height:20px;background:#409eff;border:3px solid #fff;border-radius:50%;box-shadow:0 0 8px #409eff"></div>`
}

async function poll() {
  try {
    const [d, pts] = await Promise.all([
      getLatestLocation(getDeviceId()),
      getRecentLocations(getDeviceId(), 30)
    ])
    latest.value = d
    trailCount.value = pts?.length || 0
    if (lastPos.value) {
      const moved = Math.hypot(d.lastLat - lastPos.value.lat, d.lastLng - lastPos.value.lng)
      curInterval = moved > 0.00002 ? MIN_INTERVAL : Math.min(curInterval + STATIC_GROW, MAX_INTERVAL)
    }
    lastPos.value = { lat: d.lastLat, lng: d.lastLng }
    loadError.value = false
    updateView(d, pts)
  } catch (e) {
    loadError.value = true
    console.warn('[Monitor] poll failed:', e)
  } finally {
    if (!document.hidden) {
      clearTimeout(timer)
      timer = setTimeout(poll, curInterval)
    }
  }
}

function updateView(d, pts) {
  if (!AMap || !map) return
  if (pts && pts.length > 1) {
    const path = pts.map(p => [p.lng, p.lat])
    if (trail) {
      trail.setPath(path)
    } else {
      trail = new AMap.Polyline({
        path, strokeColor: '#409eff', strokeWeight: 4,
        strokeOpacity: 0.45, lineJoin: 'round'
      })
      map.add(trail)
    }
  }
  const pos = [d.lastLng, d.lastLat]
  if (!marker) {
    marker = new AMap.Marker({ position: pos, content: markerHtml() })
    map.add(marker)
    map.setCenter(pos)
  } else {
    marker.setPosition(pos)
    map.panTo(pos)
  }
}

function onMapReady(ctx) {
  AMap = ctx.AMap
  map = ctx.map
  if (latest.value) updateView(latest.value, null)
}

function onVisibility() {
  if (document.hidden) {
    clearTimeout(timer)
  } else {
    poll()
  }
}

onMounted(() => {
  poll()
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  clearTimeout(timer)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<style scoped>
.monitor { display: flex; gap: 16px; height: calc(100vh - 86px); }
.info-card { width: 280px; flex: none; padding: 16px; border-radius: 8px; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06); }
.map-area { flex: 1; min-width: 0; }
.row { margin: 14px 0; display: flex; align-items: center; gap: 8px; font-size: 14px; }
.row.text { display: block; }
.row.dim { color: #909399; font-size: 12px; line-height: 1.5; }
.name { font-size: 18px; font-weight: 600; overflow-wrap: anywhere; }
@media (max-width: 760px) {
  .monitor { height: auto; flex-direction: column; }
  .info-card { width: auto; }
  .map-area { height: 420px; min-height: 320px; flex: none; }
}
</style>
