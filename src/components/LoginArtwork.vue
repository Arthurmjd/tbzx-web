<template>
  <!-- 瞳汐 · Tidal Aperture —— 登录/注册页共用的生成式背景 (纯装饰) -->
  <div ref="artRef" class="art-bg" aria-hidden="true"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const artRef = ref(null)
let p5Instance = null

const P5_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js'

function loadP5() {
  return new Promise((resolve, reject) => {
    if (window.p5) return resolve(window.p5)
    const s = document.createElement('script')
    s.src = P5_CDN
    s.onload = () => resolve(window.p5)
    s.onerror = () => reject(new Error('p5 load failed'))
    document.head.appendChild(s)
  })
}

function createSketch(p) {
  const PALETTE = ['#123a63', '#4a9fd8', '#eaf8ff']
  const P = {
    seed: 20240512,
    particleCount: 2000,
    noiseScale: 0.0016,
    driftSpeed: 1.0,
    trailFade: 9,
    rippleRate: 1.4,
    rippleCount: 9,
    breath: 0.6
  }

  let motes = [], ripples = [], orbs = [], sparkles = [], gradient = []
  let focus = { x: 0, y: 0 }, maxR = 1000, bg = null

  const hexRgb = (h) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 255, 255]
  }

  function init() {
    p.randomSeed(P.seed)
    p.noiseSeed(P.seed)
    focus = { x: p.width * 0.33, y: p.height * 0.5 }
    maxR = Math.hypot(
      Math.max(focus.x, p.width - focus.x),
      Math.max(focus.y, p.height - focus.y)
    )
    buildBg()
    buildGradient()

    motes = []
    for (let i = 0; i < P.particleCount; i++) motes.push(newMote(true))

    orbs = []
    for (let i = 0; i < 48; i++) orbs.push(newOrb())

    sparkles = []
    for (let i = 0; i < 140; i++) {
      sparkles.push({
        x: p.random(p.width), y: p.random(p.height),
        r: p.random(0.6, 2.2), ph: p.random(p.TWO_PI), sp: p.random(0.012, 0.05)
      })
    }

    ripples = []
    for (let i = 0; i < P.rippleCount; i++) {
      ripples.push({ r: p.map(i, 0, P.rippleCount, 20, maxR * 0.9), speed: p.random(1.6, 2.4), off: p.random(1000) })
    }

    p.background(PALETTE[0])
  }

  function buildBg() {
    bg = p.createGraphics(p.width, p.height)
    bg.pixelDensity(1)
    const ctx = bg.drawingContext
    const [r0, g0, b0] = hexRgb(PALETTE[0])
    const [r1, g1, b1] = hexRgb(PALETTE[1])
    const [r2, g2, b2] = hexRgb(PALETTE[2])

    const bot = [
      Math.round(r0 * 0.45 + r1 * 0.55),
      Math.round(g0 * 0.45 + g1 * 0.55),
      Math.round(b0 * 0.45 + b1 * 0.55)
    ]
    const lg = ctx.createLinearGradient(0, 0, 0, p.height)
    lg.addColorStop(0, `rgb(${r0},${g0},${b0})`)
    lg.addColorStop(1, `rgb(${bot[0]},${bot[1]},${bot[2]})`)
    ctx.fillStyle = lg
    ctx.fillRect(0, 0, p.width, p.height)

    const halo = ctx.createRadialGradient(focus.x, focus.y, 0, focus.x, focus.y, Math.min(p.width, p.height) * 0.62)
    halo.addColorStop(0, `rgba(${r2},${g2},${b2},0.20)`)
    halo.addColorStop(0.5, `rgba(${r2},${g2},${b2},0.07)`)
    halo.addColorStop(1, `rgba(${r2},${g2},${b2},0)`)
    ctx.fillStyle = halo
    ctx.fillRect(0, 0, p.width, p.height)

    const cg = ctx.createRadialGradient(p.width * 0.84, p.height * 0.86, 0, p.width * 0.84, p.height * 0.86, p.width * 0.42)
    cg.addColorStop(0, `rgba(${r1},${g1},${b1},0.16)`)
    cg.addColorStop(1, `rgba(${r1},${g1},${b1},0)`)
    ctx.fillStyle = cg
    ctx.fillRect(0, 0, p.width, p.height)
  }

  function buildGradient() {
    const stops = PALETTE.map((h) => p.color(h))
    const N = 64
    gradient = []
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1)
      const c = t < 0.5
        ? p.lerpColor(stops[0], stops[1], t / 0.5)
        : p.lerpColor(stops[1], stops[2], (t - 0.5) / 0.5)
      c.setAlpha(p.map(i, 0, N - 1, 85, 235))
      gradient.push(c)
    }
  }

  function newOrb() {
    return {
      x: p.random(p.width), y: p.random(p.height), r: p.random(6, 34),
      spd: p.random(0.15, 0.6), hue: p.random(0.45, 1),
      vx: p.random(-0.4, 0.4), vy: p.random(-0.35, 0.35), off: p.random(1000)
    }
  }

  function newMote(initial) {
    const o = { spd: p.random(0.5, 1.9), off: p.random(1000) }
    if (initial) { o.x = p.random(p.width); o.y = p.random(p.height) } else { birth(o) }
    o.px = o.x; o.py = o.y
    return o
  }

  function birth(o) {
    const a = p.random(p.TWO_PI), rr = p.random(0, 44)
    o.x = focus.x + Math.cos(a) * rr
    o.y = focus.y + Math.sin(a) * rr
    o.spd = p.random(0.5, 1.9)
    o.off = p.random(1000)
    o.px = o.x; o.py = o.y
  }

  p.setup = () => {
    const c = p.createCanvas(p.windowWidth, p.windowHeight)
    c.style('display', 'block')
    p.pixelDensity(1)
    init()
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight)
    init()
  }

  p.draw = () => {
    const t = p.frameCount * 0.003

    p.push()
    p.tint(255, P.trailFade)
    p.image(bg, 0, 0, p.width, p.height)
    p.pop()

    const breathV = 0.5 + 0.5 * Math.sin(p.frameCount * 0.011) * P.breath

    const interval = Math.max(4, Math.round(22 / P.rippleRate))
    if (p.frameCount % interval === 0 && ripples.length < P.rippleCount) {
      ripples.push({ r: 0, speed: p.random(1.6, 2.6), off: p.random(1000) })
    }

    // 瞳孔辉光
    p.noStroke()
    const glow = p.color(PALETTE[2])
    const L = 12
    for (let k = L; k >= 1; k--) {
      const rad = (12 + k * 10) * (0.9 + breathV * 0.4)
      glow.setAlpha((1 - k / L) * 11 * (0.4 + breathV))
      p.fill(glow)
      p.circle(focus.x, focus.y, rad * 2)
    }
    const core = p.color(PALETTE[2])
    core.setAlpha(110 + 90 * breathV)
    p.fill(core)
    p.circle(focus.x, focus.y, 10 + 8 * breathV)
    const pupil = p.color(PALETTE[0])
    pupil.setAlpha(170)
    p.fill(pupil)
    p.circle(focus.x, focus.y, 6)

    // 涟漪
    p.noFill()
    const rc = p.color(PALETTE[2])
    const steps = 120
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i]
      rp.r += rp.speed
      const a = Math.pow(Math.max(0, 1 - rp.r / maxR), 1.4)
      if (a <= 0.012 || rp.r > maxR) { ripples.splice(i, 1); continue }
      rc.setAlpha(a * 100)
      p.stroke(rc)
      p.strokeWeight(1.1)
      p.beginShape()
      for (let s = 0; s <= steps; s++) {
        const ang = (s / steps) * p.TWO_PI
        const n = p.noise(Math.cos(ang) * 0.7 + rp.off, Math.sin(ang) * 0.7 + rp.off, p.frameCount * 0.004)
        const rad = rp.r * (1 + (n - 0.5) * 0.14)
        p.vertex(focus.x + Math.cos(ang) * rad, focus.y + Math.sin(ang) * rad)
      }
      p.endShape(p.CLOSE)
    }

    // 光晕圆点
    p.noStroke()
    for (const o of orbs) {
      const n = p.noise(o.x * 0.0012, o.y * 0.0012, t * 0.4 + o.off)
      o.x += Math.cos(n * p.TWO_PI * 2) * o.spd + o.vx
      o.y += Math.sin(n * p.TWO_PI * 2) * o.spd + o.vy
      if (o.x < -40) o.x = p.width + 40
      if (o.x > p.width + 40) o.x = -40
      if (o.y < -40) o.y = p.height + 40
      if (o.y > p.height + 40) o.y = -40
      const c = p.lerpColor(p.color(PALETTE[1]), p.color(PALETTE[2]), o.hue)
      for (let k = 6; k >= 1; k--) {
        c.setAlpha(p.map(k, 1, 6, 34, 3))
        p.fill(c)
        p.circle(o.x, o.y, (o.r * k / 6) * 2)
      }
    }

    // 光尘流场
    for (const o of motes) {
      const n = p.noise(o.x * P.noiseScale, o.y * P.noiseScale, t + o.off * 0.0001)
      const ang = n * p.TWO_PI * 2.4
      let vx = Math.cos(ang) * o.spd
      let vy = Math.sin(ang) * o.spd
      const dx = o.x - focus.x, dy = o.y - focus.y
      const d = Math.hypot(dx, dy) || 1
      vx += (dx / d) * 0.12
      vy += (dy / d) * 0.12
      o.px = o.x; o.py = o.y
      o.x += vx * P.driftSpeed
      o.y += vy * P.driftSpeed
      if (o.x < -20 || o.x > p.width + 20 || o.y < -20 || o.y > p.height + 20) { birth(o); continue }
      const idx = Math.floor(p.constrain(o.spd / 2, 0, 1) * (gradient.length - 1))
      p.stroke(gradient[idx])
      p.strokeWeight(1)
      p.line(o.px, o.py, o.x, o.y)
    }

    // 闪烁星点
    p.noStroke()
    const sc = p.color(PALETTE[2])
    for (const s of sparkles) {
      const tw = 0.5 + 0.5 * Math.sin(p.frameCount * s.sp + s.ph)
      sc.setAlpha(25 + 185 * tw * tw)
      p.fill(sc)
      p.circle(s.x, s.y, s.r * (0.7 + tw))
    }
  }
}

onMounted(async () => {
  try {
    const p5 = await loadP5()
    p5Instance = new p5(createSketch, artRef.value)
  } catch {
    /* 背景纯装饰，加载失败用页面 CSS 渐变兜底 */
  }
})

onBeforeUnmount(() => {
  if (p5Instance) p5Instance.remove()
  p5Instance = null
})
</script>

<style scoped>
.art-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}
</style>
