<template>
  <div class="login-page">
    <!-- 生成式背景（瞳汐 · Tidal Aperture），抽成公共组件 -->
    <LoginArtwork />

    <!-- 左：品牌文案与功能亮点 -->
    <aside class="intro">
      <div class="brand">
        <div class="logo"></div>
        <span class="brand-name">瞳伴随行</span>
      </div>

      <h1 class="headline">让每一次出行<br />都有人守护</h1>
      <p class="lead">
        面向家属的守护与出行信息服务平台。实时定位、历史轨迹、安全区域与风险告警，
        一站式掌握长辈的出行安全。
      </p>

      <ul class="features">
        <li><span class="dot d1"></span><b>实时定位</b><i>15 秒刷新，随时掌握当前位置</i></li>
        <li><span class="dot d2"></span><b>历史轨迹</b><i>回看每一段出行路线</i></li>
        <li><span class="dot d3"></span><b>安全区域</b><i>越界即时提醒</i></li>
        <li><span class="dot d4"></span><b>风险告警</b><i>异常第一时间知晓</i></li>
      </ul>

      <p class="foot">© 2026 瞳伴随行</p>
    </aside>

    <!-- 右：登录 / 注册 卡片 -->
    <form class="login-card" @submit.prevent="onSubmit">
      <div class="brand">
        <div class="logo"></div>
        <h2>瞳伴随行</h2>
      </div>
      <div class="tag">家属守护 · 出行信息服务平台</div>

      <div class="tabs" role="tablist">
        <button
          type="button"
          class="tab"
          role="tab"
          :class="{ active: mode === 'login' }"
          :aria-selected="mode === 'login'"
          @click="switchMode('login')"
        >登录</button>
        <button
          type="button"
          class="tab"
          role="tab"
          :class="{ active: mode === 'register' }"
          :aria-selected="mode === 'register'"
          @click="switchMode('register')"
        >注册</button>
      </div>

      <!-- 登录 -->
      <template v-if="mode === 'login'">
        <div class="field">
          <label for="login-user">账号</label>
          <input
            id="login-user"
            v-model.trim="form.username"
            type="text"
            placeholder="test"
            autocomplete="username"
          />
        </div>
        <div class="field">
          <label for="login-pass">密码</label>
          <input
            id="login-pass"
            v-model="form.password"
            type="password"
            placeholder="••••••"
            autocomplete="current-password"
          />
        </div>
        <div v-if="!isMock" class="field">
          <label for="login-cap">验证码</label>
          <div class="captcha-row">
            <input
              id="login-cap"
              v-model.trim="form.captchaCode"
              type="text"
              maxlength="4"
              placeholder="4 位字符"
              autocomplete="off"
            />
            <img
              class="captcha-img"
              :src="captcha.image"
              alt="点击刷新验证码"
              title="看不清？点击刷新"
              @click="loadCaptcha"
            />
          </div>
        </div>
        <button class="submit" type="submit" :disabled="loading">
          {{ loading ? '登 录 中…' : '登 录' }}
        </button>
      </template>

      <!-- 注册 -->
      <template v-else>
        <div class="field">
          <label for="reg-user">用户名</label>
          <input
            id="reg-user"
            v-model.trim="reg.username"
            type="text"
            placeholder="3-50 位"
            autocomplete="username"
          />
        </div>
        <div class="field">
          <label for="reg-name">真实姓名 <em>选填</em></label>
          <input
            id="reg-name"
            v-model.trim="reg.realName"
            type="text"
            placeholder="如：张三"
            autocomplete="name"
          />
        </div>
        <div class="field">
          <label for="reg-pass">密码</label>
          <input
            id="reg-pass"
            v-model="reg.password"
            type="password"
            placeholder="6-50 位"
            autocomplete="new-password"
          />
        </div>
        <div class="field">
          <label for="reg-pass2">确认密码</label>
          <input
            id="reg-pass2"
            v-model="reg.password2"
            type="password"
            placeholder="再次输入密码"
            autocomplete="new-password"
          />
        </div>
        <button class="submit" type="submit" :disabled="loading">
          {{ loading ? '提 交 中…' : '注 册' }}
        </button>
        <div class="hint">注册成功后即可用该账号登录</div>
      </template>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login, fetchCaptcha, register } from '@/api/auth'
import { listDevices } from '@/api/device'
import { useUserStore } from '@/stores/user'
import LoginArtwork from '@/components/LoginArtwork.vue'

const router = useRouter()
const isMock = import.meta.env.VITE_USE_MOCK === 'true'

const mode = ref('login')           // 'login' | 'register'
const loading = ref(false)

const form = reactive({ username: '', password: '', captchaCode: '' })
const reg = reactive({ username: '', realName: '', password: '', password2: '' })
const captcha = reactive({ id: '', image: '' })

function switchMode(m) {
  mode.value = m
  if (m === 'login') loadCaptcha()
}

function onSubmit() {
  return mode.value === 'login' ? doLogin() : doRegister()
}

async function doLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入账号密码')
    return
  }
  if (!isMock && !form.captchaCode) {
    ElMessage.warning('请输入验证码')
    return
  }
  loading.value = true
  try {
    const res = await login({
      username: form.username,
      password: form.password,
      captchaId: captcha.id,
      captchaCode: form.captchaCode
    })
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
  } catch {
    loadCaptcha() // 登录失败(含验证码错误/过期)刷新验证码
  } finally {
    loading.value = false
  }
}

async function doRegister() {
  if (!reg.username || !reg.password || !reg.password2) {
    ElMessage.warning('请填写用户名和密码')
    return
  }
  if (reg.username.length < 3 || reg.username.length > 50) {
    ElMessage.warning('用户名长度需为 3-50 位')
    return
  }
  if (reg.password.length < 6 || reg.password.length > 50) {
    ElMessage.warning('密码长度需为 6-50 位')
    return
  }
  if (reg.password !== reg.password2) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  loading.value = true
  try {
    await register({
      username: reg.username,
      password: reg.password,
      realName: reg.realName
    })
    ElMessage.success('注册成功，请登录')
    // 回登录页并带上新账号
    form.username = reg.username
    form.password = ''
    reg.password = reg.password2 = ''
    mode.value = 'login'
    loadCaptcha()
  } catch {
    /* 错误提示由 request 拦截器统一弹出 (如：用户名已存在) */
  } finally {
    loading.value = false
  }
}

// 取 / 刷新图形验证码
async function loadCaptcha() {
  if (isMock) return
  try {
    const res = await fetchCaptcha()
    captcha.id = res.captchaId
    captcha.image = res.image
    form.captchaCode = ''
  } catch {
    /* 忽略：用户可点击图片重试 */
  }
}

onMounted(() => {
  loadCaptcha()
})
</script>

<style scoped>
.login-page {
  position: fixed;
  inset: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 48px;
  padding: 0 6%;
  box-sizing: border-box;
  /* p5 加载失败时的兜底蓝底 */
  background: linear-gradient(160deg, #123a63 0%, #1f5f9e 60%, #2f79b4 100%);
}

/* ── 左：品牌文案与功能亮点 ── */
.intro {
  position: relative;
  z-index: 2;
  max-width: 520px;
  color: #eaf6ff;
}

.intro .brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}

.intro .brand .logo {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: radial-gradient(circle at 38% 36%, #ffffff 0%, #63b8ec 46%, #1b4f86 100%);
  box-shadow: 0 0 18px rgba(150, 216, 255, 0.85);
  animation: breathe 4.6s ease-in-out infinite;
}

.intro .brand-name {
  font-family: 'Lora', 'Noto Serif SC', serif;
  font-size: 20px;
  letter-spacing: 6px;
}

.headline {
  font-family: 'Lora', 'Noto Serif SC', serif;
  font-size: 44px;
  line-height: 1.28;
  font-weight: 500;
  letter-spacing: 4px;
  margin: 0 0 18px;
  text-shadow: 0 2px 24px rgba(10, 40, 80, 0.5);
}

.lead {
  font-size: 14px;
  line-height: 1.9;
  color: #cbe6fb;
  max-width: 460px;
  margin: 0 0 30px;
}

.features {
  list-style: none;
  padding: 0;
  margin: 0 0 34px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 22px;
  max-width: 470px;
}

.features li {
  position: relative;
  padding-left: 20px;
}

.features b {
  display: block;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
}

.features i {
  font-style: normal;
  font-size: 12px;
  color: #a9cbe6;
}

.dot {
  position: absolute;
  left: 0;
  top: 5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 10px currentColor;
}

.d1 { background: #eaf8ff; color: #eaf8ff; }
.d2 { background: #8fd8ff; color: #8fd8ff; }
.d3 { background: #6fb6ea; color: #6fb6ea; }
.d4 { background: #4a9fd8; color: #4a9fd8; }

.foot {
  font-size: 11px;
  color: #7fa2c2;
  letter-spacing: 1px;
}

/* ── 右：卡片 ── */
.login-card {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  width: min(340px, 34vw);
  min-width: 300px;
  padding: 30px 28px 24px;
  border-radius: 18px;
  background: rgba(7, 28, 54, 0.36);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  border: 1px solid rgba(190, 230, 255, 0.38);
  box-shadow: 0 24px 60px rgba(4, 20, 42, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.16);
  color: #f2fbff;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.logo {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: radial-gradient(circle at 38% 36%, #ffffff 0%, #63b8ec 46%, #1b4f86 100%);
  box-shadow: 0 0 16px rgba(150, 216, 255, 0.85);
  animation: breathe 4.6s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { transform: scale(1); box-shadow: 0 0 14px rgba(140, 208, 255, 0.7); }
  50% { transform: scale(1.12); box-shadow: 0 0 28px rgba(180, 228, 255, 1); }
}

h2 {
  font-family: 'Lora', 'Noto Serif SC', serif;
  font-size: 21px;
  font-weight: 500;
  letter-spacing: 3px;
  margin: 0;
}

.tag {
  font-size: 11px;
  color: #c6e4fb;
  letter-spacing: 1.5px;
  margin-bottom: 18px;
}

/* 登录 / 注册 切换 */
.tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 20px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.08);
}

.tab {
  flex: 1;
  padding: 8px 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #cfe7fb;
  font-size: 13px;
  letter-spacing: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab.active {
  background: rgba(234, 248, 255, 0.92);
  color: #06213f;
  font-weight: 600;
}

.field {
  margin-bottom: 13px;
}

label {
  display: block;
  font-size: 11px;
  color: #cfe7fb;
  margin-bottom: 6px;
  letter-spacing: 1px;
}

label em {
  font-style: normal;
  font-size: 10px;
  color: #7fa2c2;
  margin-left: 4px;
}

input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  border-radius: 10px;
  border: 1px solid rgba(190, 230, 255, 0.3);
  background: rgba(255, 255, 255, 0.14);
  color: #f2fbff;
  font-size: 13px;
  outline: none;
  transition: all 0.2s ease;
}

input:focus {
  border-color: #eaf8ff;
  box-shadow: 0 0 0 3px rgba(190, 230, 255, 0.22);
  background: rgba(255, 255, 255, 0.22);
}

input::placeholder {
  color: #a9cbe6;
}

.captcha-row {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.captcha-row input {
  flex: 1;
  min-width: 0;
  letter-spacing: 5px;
}

.captcha-img {
  width: 108px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid rgba(190, 230, 255, 0.3);
  background: rgba(255, 255, 255, 0.08);
  object-fit: cover;
}

.submit {
  width: 100%;
  margin-top: 9px;
  padding: 12px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 4px;
  color: #06213f;
  background: linear-gradient(120deg, #eaf8ff, #79c2f0 58%, #c4ecff);
  box-shadow: 0 10px 26px rgba(120, 190, 240, 0.5);
  transition: all 0.25s ease;
}

.submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 34px rgba(120, 190, 240, 0.7);
}

.submit:disabled {
  opacity: 0.7;
  cursor: default;
}

.hint {
  margin-top: 12px;
  font-size: 10.5px;
  color: #a9cbe6;
  text-align: center;
  letter-spacing: 0.6px;
}

@media (max-width: 900px) {
  .login-page {
    flex-direction: column;
    justify-content: center;
    gap: 26px;
    padding: 40px 6%;
    overflow-y: auto;
  }
  .intro {
    max-width: 100%;
    text-align: center;
  }
  .intro .brand { justify-content: center; }
  .headline { font-size: 30px; letter-spacing: 2px; }
  .lead { margin-left: auto; margin-right: auto; }
  .features { grid-template-columns: 1fr; text-align: left; }
  .login-card { width: min(340px, 92vw); min-width: 0; }
}
</style>
