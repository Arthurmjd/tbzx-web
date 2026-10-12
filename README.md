# tbzx-web · 瞳伴随行家属守护平台（Web 端）

Vue 3 + Vite + Element Plus + 高德地图 JS API 2.0

## 技术栈

| 类别 | 选择 |
|---|---|
| 框架 | Vue 3 + Vite |
| UI | Element Plus |
| 地图 | 高德 JS API 2.0（`@amap/amap-jsapi-loader`） |
| 状态 | Pinia |
| HTTP | axios |

坐标全链路 GCJ-02，**不做任何坐标转换**。

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173
```

### 环境变量

文件内容见 `.env.development`（**首次使用必须替换高德 Key**）：

```ini
VITE_API_BASE=/api
VITE_USE_MOCK=true
VITE_AMAP_KEY=你的高德Key
VITE_AMAP_SECRET=你的高德安全密钥
```

- 高德 Key：lbs.amap.com → 控制台 → 应用管理 → 添加 Key，类型选 **Web端(JS API)**
- `VITE_USE_MOCK=true` 时走内置 Mock 数据层，**后端未就绪也能开发全部页面**
- 后端联调时改 `VITE_USE_MOCK=false`，前端代码零改动（`/api` 已由 vite proxy 转发到 `localhost:8080`）

### Mock 模式说明

- 任意账号密码可登录
- 设备位置沿玄武湖步行环线随时间插值移动，轮询时位置真实会动
- 历史轨迹返回最近 500 点，支持回放
- 安全区域新增/删除/启停在会话内生效（内存状态）

## 目录结构

```
src/
├── api/          # 接口层（每个函数内部按 VITE_USE_MOCK 分流）
├── mock/data.js  # Mock 数据与轨迹生成器
├── utils/        # request(JWT axios) / amap(loader) / device(当前设备)
├── stores/       # Pinia 登录态
├── router/       # 路由 + 登录守卫
├── components/   # AMapContainer 地图容器
└── views/        # Login / Monitor / HistoryTrack / SafeZone / Alerts
```

## 页面

| 路径 | 说明 |
|---|---|
| `/login` | 登录，自动选中绑定的第一台设备 |
| `/monitor` | 实时监控，15s 轮询最新位置，页面切后台自动暂停 |
| `/history` | 历史轨迹，选出行记录 → 画线 + 起终点 + 回放 |
| `/zones` | 安全区域，点地图取圆心 → 建圆形区域，可启停/删除 |
| `/alerts` | 风险告警列表，按严重程度着色 + 分页 |

## 文档

- 完整 guide：`瞳伴随行-云端/docs/04-Web家属端开发指南.md`
- API 契约：`瞳伴随行-云端/docs/03-位置模块完整实现方案.md`

## 构建部署

```bash
npm run build     # 产出 dist/
```

`dist/` 上传 ECS 的 `/data/www/tbzx-web/`，nginx 已配置静态服务 + `/api` 反向代理。
