<template>
  <div class="alerts">
    <div class="toolbar">
      <span class="title">风险告警记录</span>
      <el-button size="small" :loading="loading" @click="load">刷新</el-button>
    </div>
    <el-table :data="rows" v-loading="loading" empty-text="暂无告警记录">
      <el-table-column label="时间" width="180">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="类型" width="140">
        <template #default="{ row }">{{ TYPE[row.alertType] || row.alertType }}</template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="240" />
      <el-table-column label="严重程度" width="100">
        <template #default="{ row }">
          <el-tag :type="SEV[row.severity]?.tag || 'info'" size="small" effect="dark">
            {{ SEV[row.severity]?.label || '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="现场图" width="90">
        <template #default="{ row }">
          <el-image v-if="row.hasImage && row.imageUrl" class="alert-image" :src="row.imageUrl" :preview-src-list="[row.imageUrl]" fit="cover" alt="告警现场图" />
          <span v-else class="dim">{{ row.hasImage ? '待同步' : '--' }}</span>
        </template>
      </el-table-column>
    </el-table>
    <div class="mobile-alerts" v-loading="loading">
      <el-empty v-if="!rows.length" description="暂无告警记录" :image-size="64" />
      <div v-for="row in rows" :key="row.id" class="mobile-alert">
        <div class="mobile-alert-head">
          <strong>{{ TYPE[row.alertType] || row.alertType }}</strong>
          <el-tag :type="SEV[row.severity]?.tag || 'info'" size="small" effect="dark">{{ SEV[row.severity]?.label || '未知' }}</el-tag>
        </div>
        <div class="mobile-alert-desc">{{ row.description }}</div>
        <time :datetime="row.createdAt">{{ fmt(row.createdAt) }}</time>
        <el-image v-if="row.hasImage && row.imageUrl" class="alert-image" :src="row.imageUrl" :preview-src-list="[row.imageUrl]" fit="cover" alt="告警现场图" />
      </div>
    </div>
    <div class="pager">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :total="total"
        :page-size="size"
        :current-page="page"
        @current-change="onPage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listAlerts } from '@/api/alert'
import { getDeviceId } from '@/utils/device'

// severity → 展示映射 (高危红 / 注意黄, 国内习惯)
const SEV = {
  0: { tag: 'info', label: '提示' },
  1: { tag: 'warning', label: '注意' },
  2: { tag: 'danger', label: '高危' },
  3: { tag: 'danger', label: 'SOS' }
}

const TYPE = {
  VEHICLE_APPROACH: '车辆接近',
  RED_LIGHT: '红灯提醒',
  SHORT_TIME: '绿灯不足',
  CONSTRUCTION: '施工障碍',
  GEOFENCE_EXIT: '离开安全区域',
  SOS: 'SOS 求助',
  OFFLINE: '设备失联'
}

const rows = ref([])
const total = ref(0)
const page = ref(1)
const size = 20
const loading = ref(false)

const fmt = s => (s ? new Date(s).toLocaleString() : '--')

async function load() {
  loading.value = true
  try {
    const res = await listAlerts(getDeviceId(), page.value, size)
    rows.value = res.list || res
    total.value = res.total ?? rows.value.length
  } finally {
    loading.value = false
  }
}

function onPage(p) {
  page.value = p
  load()
}

onMounted(load)
</script>

<style scoped>
.alerts {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  height: calc(100vh - 86px);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.title { font-size: 15px; font-weight: 600; }
.dim { color: #909399; }
.alert-image { width: 52px; height: 40px; border-radius: 4px; cursor: zoom-in; }
.mobile-alerts { display: none; }
.pager {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}
@media (max-width: 760px) {
  .alerts { height: auto; min-height: 460px; }
  .alerts :deep(.el-table) { display: none; }
  .mobile-alerts { display: block; }
  .mobile-alert { padding: 14px 0; border-bottom: 1px solid #ebeef5; }
  .mobile-alert-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 14px; }
  .mobile-alert-desc { margin: 8px 0; font-size: 13px; line-height: 1.5; color: #606266; }
  .mobile-alert time { color: #909399; font-size: 12px; }
  .pager { justify-content: center; }
  .pager :deep(.el-pagination__total) { display: none; }
}
</style>
