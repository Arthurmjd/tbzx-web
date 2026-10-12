// 当前选中设备的读取工具 (第一版单设备, 从简)

export function getDevice() {
  const raw = localStorage.getItem('device')
  if (raw) {
    try { return JSON.parse(raw) } catch { /* ignore */ }
  }
  return null
}

export function getDeviceId() {
  return getDevice()?.deviceId || 'TBZX-DEMO00001'
}
