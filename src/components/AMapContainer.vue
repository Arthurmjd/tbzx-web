<template>
  <div class="map-wrap">
    <div ref="mapRef" class="map-box"></div>
    <div v-if="!ready && !loadError" class="map-loading" role="status">地图加载中...</div>
    <div v-if="loadError" class="map-error">
      <el-empty :description="loadError" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { loadAMap } from '@/utils/amap'

const emit = defineEmits(['ready'])
const mapRef = ref(null)
const ready = ref(false)
const loadError = ref('')
let map = null
let loadTimer = null

onMounted(async () => {
  loadTimer = window.setTimeout(() => {
    if (!ready.value) loadError.value = '地图加载超时，请稍后重试。'
  }, 15000)
  try {
    const AMap = await loadAMap()
    map = new AMap.Map(mapRef.value, {
      zoom: 15,
      center: [118.7945, 32.0727],   // 玄武湖, 有数据后会 fitView
      viewMode: '2D'
    })
    map.addControl(new AMap.Scale())
    map.addControl(new AMap.ToolBar())
    ready.value = true
    loadError.value = ''
    clearTimeout(loadTimer)
    // 把 AMap 类和 map 实例都交给父页面, 父页面画 Marker/线/圆
    emit('ready', { AMap, map })
  } catch (e) {
    clearTimeout(loadTimer)
    loadError.value = '地图暂时无法加载，请稍后重试或联系管理员。'
    console.error('[AMap] load failed:', e)
  }
})

onBeforeUnmount(() => {
  clearTimeout(loadTimer)
  map?.destroy()
})
</script>

<style scoped>
.map-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}
.map-box {
  width: 100%;
  height: 100%;
}
.map-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  z-index: 10;
}
.map-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  font-size: 14px;
}
</style>
