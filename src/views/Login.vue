<template>
  <div class="login-page">
    <el-card class="login-card">
      <h2 class="title">瞳伴随行</h2>
      <p class="subtitle">家属守护平台</p>
      <el-form @submit.prevent="onLogin">
        <el-form-item>
          <el-input v-model.trim="form.username" placeholder="用户名" aria-label="用户名" autocomplete="username" size="large" autofocus />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" aria-label="密码" autocomplete="current-password" size="large" show-password />
        </el-form-item>
        <el-button native-type="submit" type="primary" size="large" style="width:100%" :loading="loading">登 录</el-button>
      </el-form>
      <p v-if="isMock" class="tip">Mock 模式下任意账号密码均可登录</p>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api/auth'
import { listDevices } from '@/api/device'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const form = reactive({ username: '', password: '' })
const loading = ref(false)
const isMock = import.meta.env.VITE_USE_MOCK === 'true'

async function onLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入账号密码')
    return
  }
  loading.value = true
  try {
    const res = await login(form)
    useUserStore().setLogin({
      token: res.token,
      userId: res.userId,
      username: form.username
    })
    const devices = await listDevices()
    if (!devices?.length) {
      ElMessage.warning('尚未绑定设备，请先绑定设备')
      return
    }
    localStorage.setItem('device', JSON.stringify(devices[0]))
    ElMessage.success(`欢迎回来，${form.username}`)
    router.push('/monitor')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #e8f4ff 0%, #d9ecff 50%, #c6e2ff 100%);
}
.login-card {
  width: min(380px, 100%);
  padding: 8px 12px;
  border-radius: 12px;
}
.title {
  text-align: center;
  margin: 8px 0 4px;
  color: #409eff;
}
.subtitle {
  text-align: center;
  color: #909399;
  margin: 0 0 24px;
  font-size: 13px;
}
.tip {
  text-align: center;
  color: #909399;
  font-size: 12px;
  margin: 12px 0 0;
}
</style>
