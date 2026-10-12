<template>
  <el-container v-if="!isLogin" class="layout">
    <el-aside width="200px">
      <div class="logo">瞳伴随行 · 家属守护</div>
      <el-menu :default-active="$route.path" router>
        <el-menu-item index="/monitor">实时监控</el-menu-item>
        <el-menu-item index="/history">历史轨迹</el-menu-item>
        <el-menu-item index="/zones">安全区域</el-menu-item>
        <el-menu-item index="/alerts">风险告警</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container class="content-layout">
      <el-header height="50px">
        <span class="header-device" v-if="device">当前设备：{{ device.deviceName }}</span>
        <span class="header-device" v-else>未选择设备</span>
        <el-button text @click="logout">退出登录</el-button>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
  <router-view v-else />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getDevice } from '@/utils/device'

const route = useRoute()
const router = useRouter()
const isLogin = computed(() => route.path === '/login')
const device = ref(getDevice())
watch(() => route.path, () => { device.value = getDevice() })

function logout() {
  useUserStore().logout()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  height: 100vh;
}
.el-aside {
  background: #fff;
  border-right: 1px solid #e4e7ed;
}
.logo {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 15px;
  color: #409eff;
  border-bottom: 1px solid #e4e7ed;
}
.el-menu {
  border-right: none;
}
.content-layout { min-width: 0; }
.header-device {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: #606266;
}
@media (max-width: 760px) {
  .layout { display: block; height: auto; min-height: 100dvh; }
  .el-aside { width: 100% !important; border-right: 0; border-bottom: 1px solid #e4e7ed; }
  .logo { height: 46px; justify-content: flex-start; padding: 0 16px; }
  .el-menu { display: flex; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; }
  .el-menu::-webkit-scrollbar { display: none; }
  .el-menu :deep(.el-menu-item) { flex: none; height: 44px; padding: 0 16px; }
  .content-layout { min-height: calc(100dvh - 90px); }
}
</style>
