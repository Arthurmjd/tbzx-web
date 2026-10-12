<template>
  <div class="zones">
    <div class="map-area"><AMapContainer @ready="onMapReady" /></div>
    <div class="panel">
      <template v-if="!picking">
        <el-button type="primary" style="width:100%" :disabled="!mapReady" @click="startPick">+ 新建安全区域</el-button>
      </template>
      <template v-else>
        <el-alert type="info" :closable="false" title="点击地图选择圆心" class="hint" />
        <div class="form">
          <div class="picked">
            圆心：<template v-if="picked">{{ picked.lng.toFixed(5) }}, {{ picked.lat.toFixed(5) }}</template>
            <span v-else class="dim">尚未选择</span>
          </div>
          <el-input v-model.trim="zoneName" placeholder="区域名称，如：家附近" aria-label="区域名称" maxlength="24" />
          <div class="radius-row">
            <span>半径</span>
            <el-slider v-model="radius" :min="50" :max="2000" :step="50" aria-label="安全区域半径" style="flex:1"
              :format-tooltip="v => v + ' 米'" />
            <span class="radius-val">{{ radius }} 米</span>
          </div>
          <div class="btns">
            <el-button type="primary" :loading="saving" :disabled="!picked || !zoneName" @click="createZone">保存</el-button>
            <el-button @click="cancelPick">取消</el-button>
          </div>
        </div>
      </template>

      <h4>已设区域</h4>
      <el-table :data="zones" size="small" empty-text="暂无安全区域">
        <el-table-column prop="zoneName" label="名称" />
        <el-table-column label="半径" width="80"><template #default="{ row }">{{ row.radiusM }} m</template></el-table-column>
        <el-table-column label="启用" width="70"><template #default="{ row }"><el-switch :model-value="row.active === 1" :aria-label="`${row.active === 1 ? '停用' : '启用'}${row.zoneName}`" @change="toggle(row)" /></template></el-table-column>
        <el-table-column label="操作" width="70"><template #default="{ row }"><el-button text type="danger" size="small" @click="remove(row)">删除</el-button></template></el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AMapContainer from '@/components/AMapContainer.vue'
import { listZones, createZone as addZone, deleteZone, toggleZone } from '@/api/zone'
import { getDeviceId } from '@/utils/device'

const picking = ref(false)
const picked = ref(null)
const zoneName = ref('')
const radius = ref(300)
const zones = ref([])
const mapReady = ref(false)
const saving = ref(false)

let AMap = null
let map = null
let circles = []
let previewCircle = null

function clearCircles() {
  circles.forEach(c => map?.remove(c))
  circles = []
  if (previewCircle) { map?.remove(previewCircle); previewCircle = null }
}

function drawZones() {
  if (!map) return
  clearCircles()
  zones.value.forEach(z => {
    const c = new AMap.Circle({
      center: [z.centerLng, z.centerLat],
      radius: z.radiusM,
      strokeColor: z.active === 1 ? '#67c23a' : '#c0c4cc',
      strokeWeight: 2,
      strokeOpacity: z.active === 1 ? 0.9 : 0.5,
      fillColor: '#67c23a',
      fillOpacity: z.active === 1 ? 0.12 : 0.04
    })
    map.add(c)
    circles.push(c)
  })
  if (circles.length) map.setFitView(circles)
}

function startPick() {
  picking.value = true
  picked.value = null
  zoneName.value = ''
}

function cancelPick() {
  picking.value = false
  picked.value = null
  if (previewCircle) { map?.remove(previewCircle); previewCircle = null }
}

function onMapReady(ctx) {
  AMap = ctx.AMap
  map = ctx.map
  mapReady.value = true
  drawZones()
  // 取点模式: 点地图 → 记录圆心并画预览圆
  map.on('click', e => {
    if (!picking.value) return
    picked.value = { lat: e.lnglat.getLat(), lng: e.lnglat.getLng() }
    if (previewCircle) map.remove(previewCircle)
    previewCircle = new AMap.Circle({
      center: [picked.value.lng, picked.value.lat],
      radius: radius.value,
      strokeColor: '#409eff',
      strokeWeight: 2,
      fillColor: '#409eff',
      fillOpacity: 0.1
    })
    map.add(previewCircle)
  })
}

async function createZone() {
  saving.value = true
  try {
    await addZone({ deviceId: getDeviceId(), zoneName: zoneName.value, centerLat: picked.value.lat, centerLng: picked.value.lng, radiusM: radius.value })
    ElMessage.success('安全区域已创建')
    cancelPick()
    zones.value = await listZones(getDeviceId())
    drawZones()
  } finally { saving.value = false }
}

async function toggle(row) {
  await toggleZone(row.id)
  zones.value = await listZones(getDeviceId())
  drawZones()
}

async function remove(row) {
  try { await ElMessageBox.confirm(`确定删除安全区域「${row.zoneName}」？`, '删除区域', { type: 'warning' }) } catch { return }
  await deleteZone(row.id)
  ElMessage.success('已删除')
  zones.value = await listZones(getDeviceId())
  drawZones()
}

watch(radius, value => previewCircle?.setRadius(value))
onMounted(async () => { zones.value = await listZones(getDeviceId()); drawZones() })
</script>

<style scoped>
.zones { display: flex; gap: 16px; height: calc(100vh - 86px); }
.map-area { flex: 1; min-width: 0; }
.panel { width: 320px; flex: none; background: #fff; border-radius: 8px; padding: 14px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
.hint { margin-bottom: 10px; }
.form { display: flex; flex-direction: column; gap: 10px; }
.picked { font-size: 13px; color: #606266; overflow-wrap: anywhere; }
.dim { color: #909399; }
.radius-row { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #606266; }
.radius-val { width: 60px; text-align: right; white-space: nowrap; }
.btns { display: flex; gap: 10px; }
.btns .el-button { margin: 0; }
.panel h4 { margin: 6px 0 0; font-size: 14px; }
@media (max-width: 760px) {
  .zones { height: auto; flex-direction: column; }
  .map-area { height: 420px; min-height: 320px; flex: none; }
  .panel { width: auto; overflow: visible; }
}
</style>
