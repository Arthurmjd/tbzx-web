<template>
  <div class="history">
    <div class="side">
      <h3>出行记录</h3>
      <div class="session-list" v-loading="loadingSessions">
        <el-empty v-if="!sessions.length" description="暂无出行记录" :image-size="60" />
        <el-card
          v-for="s in sessions"
          :key="s.id"
          shadow="hover"
          :class="{ active: s.id === chosen }"
          role="button"
          tabindex="0"
          :aria-pressed="s.id === chosen"
          @click="choose(s)"
          @keydown.enter.prevent="choose(s)"
          @keydown.space.prevent="choose(s)"
        >
          <div class="s-title">
            出行 #{{ s.id }}
            <el-tag :type="s.status === 0 ? 'success' : 'info'" size="small">
              {{ s.status === 0 ? '进行中' : '已结束' }}
            </el-tag>
          </div>
          <div class="s-line">{{ fmt(s.startTime) }} ~ {{ s.endTime ? fmt(s.endTime) : '…' }}</div>
          <div class="s-line dim">里程 {{ (s.distanceM / 1000).toFixed(2) }} km · 告警 {{ s.alertCount }} 次</div>
        </el-card>
      </div>
    </div>
    <div class="main" v-loading="loadingTrack">
      <div class="map-area"><AMapContainer @ready="onMapReady" /></div>
      <div class="replay" v-if="track?.points?.length">
        <el-button size="small" type="primary" @click="playing = !playing">{{ playing ? '暂停' : '回放' }}</el-button>
        <el-slider v-model="cursor" :max="track.points.length - 1" aria-label="轨迹播放进度" style="flex:1" />
        <span class="count">{{ cursor + 1 }}/{{ track.points.length }} 点</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import AMapContainer from '@/components/AMapContainer.vue'
import { listSessions, getTrack } from '@/api/session'
import { getDeviceId } from '@/utils/device'

const sessions = ref([])
const loadingSessions = ref(false)
const loadingTrack = ref(false)
const chosen = ref(null)
const track = ref(null)
const cursor = ref(0)
const playing = ref(false)

let AMap = null
let map = null
let polyline = null
let replayMarker = null
let marks = []
let playTimer = null

const fmt = s => (s ? new Date(s).toLocaleString() : '--')

async function loadSessions() {
  loadingSessions.value = true
  try {
    sessions.value = await listSessions(getDeviceId())
  } finally {
    loadingSessions.value = false
  }
}

async function choose(s) {
  chosen.value = s.id
  playing.value = false
  loadingTrack.value = true
  try {
    track.value = await getTrack(s.id)
    cursor.value = 0
    drawTrack()
  } finally {
    loadingTrack.value = false
  }
}

function clearOverlays() {
  if (polyline) map.remove(polyline)
  if (replayMarker) map.remove(replayMarker)
  marks.forEach(m => map.remove(m))
  polyline = replayMarker = null
  marks = []
}

function drawTrack() {
  if (!map || !track.value?.points?.length) return
  clearOverlays()
  const pts = track.value.points.map(p => [p.lng, p.lat])
  polyline = new AMap.Polyline({
    path: pts,
    strokeColor: '#409eff',
    strokeWeight: 4,
    showDir: true,
    lineJoin: 'round'
  })
  map.add(polyline)
  // 起点 / 终点标注 (借鉴 MapForTour 的轨迹交互)
  const [sLng, sLat] = pts[0]
  const [eLng, eLat] = pts[pts.length - 1]
  marks.push(new AMap.Marker({ position: [sLng, sLat], label: { content: '起点' } }))
  marks.push(new AMap.Marker({ position: [eLng, eLat], label: { content: '终点' } }))
  map.add(marks)
  replayMarker = new AMap.CircleMarker({
    center: pts[0],
    radius: 7,
    fillColor: '#409eff',
    fillOpacity: 1,
    strokeColor: '#fff',
    strokeWeight: 2
  })
  map.add(replayMarker)
  map.setFitView()
}

// 回放: cursor 变化 → 小圆点沿线走 (5s 采集间隔压缩到 0.2s/点)
watch(cursor, i => {
  const p = track.value?.points[i]
  if (p) replayMarker?.setCenter([p.lng, p.lat])
})

watch(playing, v => {
  clearInterval(playTimer)
  if (v && track.value) {
    playTimer = setInterval(() => {
      if (cursor.value >= track.value.points.length - 1) {
        playing.value = false
        return
      }
      cursor.value++
    }, 200)
  }
})

function onMapReady(ctx) {
  AMap = ctx.AMap
  map = ctx.map
  drawTrack()
}

onMounted(loadSessions)
onBeforeUnmount(() => clearInterval(playTimer))
</script>

<style scoped>
.history { display: flex; gap: 16px; height: calc(100vh - 86px); }
.side { width: 280px; flex: none; display: flex; flex-direction: column; min-width: 0; background: #fff; border-radius: 8px; padding: 12px; box-sizing: border-box; }
.side h3 { margin: 4px 4px 12px; font-size: 15px; }
.session-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
.session-list :deep(.el-card) { cursor: pointer; border: 2px solid transparent; }
.session-list :deep(.el-card.active) { border-color: #409eff; }
.session-list :deep(.el-card:focus-visible) { outline: 2px solid #409eff; outline-offset: -2px; }
.s-title { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; }
.s-line { font-size: 12px; color: #606266; margin-top: 6px; }
.s-line.dim { color: #909399; }
.main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.map-area { flex: 1; min-height: 0; }
.replay { display: flex; align-items: center; gap: 12px; background: #fff; border-radius: 8px; padding: 10px 14px; }
.count { font-size: 12px; color: #909399; white-space: nowrap; }
@media (max-width: 760px) {
  .history { height: auto; flex-direction: column; }
  .side { width: auto; }
  .session-list { max-height: 260px; }
  .map-area { height: 420px; min-height: 320px; flex: none; }
  .replay { gap: 8px; }
}
</style>
