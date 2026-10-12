import AMapLoader from '@amap/amap-jsapi-loader'

let amapPromise = null

export function loadAMap() {
  if (!amapPromise) {
    // 安全密钥必须在 load 之前挂到 window
    window._AMapSecurityConfig = {
      securityJsCode: import.meta.env.VITE_AMAP_SECRET
    }
    amapPromise = AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.Scale', 'AMap.ToolBar']
    })
  }
  return amapPromise
}
