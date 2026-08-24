const LAYER_NAMES = [
  'ROOT SILENCE',
  'SAFFRON WHEEL',
  'CYAN SANGHA',
  'ACID STUPA',
  'EMBER KOAN',
  'ORBIT MANTRA',
  'FRACTAL ROBE',
  'VOID BELL',
]

const TINTS = [
  [1.0, 0.95, 0.9],
  [1.1, 0.9, 0.7],
  [0.75, 1.05, 1.15],
  [0.85, 1.15, 0.8],
  [1.15, 0.75, 0.85],
  [0.9, 1.0, 1.1],
  [1.05, 0.95, 0.75],
  [0.95, 0.9, 1.2],
]

function rand(a, b) {
  return a + Math.random() * (b - a)
}

export function createWorld() {
  const particles = []
  const sutras = []
  let layer = 0
  let sutrasCollected = 0
  let toastTimer = 0
  let toastText = ''

  function spawnBurst(count, cx, cy, speed = 1) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = rand(0.15, 1.2) * speed
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.6, 1.8),
        max: rand(0.6, 1.8),
        size: rand(1.5, 5.5),
        hue: Math.random(),
      })
    }
  }

  function spawnSutra(w, h) {
    const margin = 80
    sutras.push({
      x: rand(margin, w - margin),
      y: rand(margin, h - margin),
      r: rand(10, 18),
      phase: Math.random() * Math.PI * 2,
      pulse: rand(1.5, 3.2),
      taken: false,
    })
  }

  function ensureSutras(w, h) {
    while (sutras.filter((s) => !s.taken).length < 3 + Math.min(layer, 4)) {
      spawnSutra(w, h)
    }
  }

  function resetOpening(cssW, cssH, dpr = 1) {
    particles.length = 0
    sutras.length = 0
    spawnBurst(120, cssW * 0.5 * dpr, cssH * 0.5 * dpr, 2.2)
    ensureSutras(cssW, cssH)
  }

  function showToast(text, duration = 2.4) {
    toastText = text
    toastTimer = duration
  }

  function update(dt, state, canvas) {
    const w = canvas.width
    const h = canvas.height
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cssW = w / dpr
    const cssH = h / dpr

    // Drift look into world space for collision
    const px = (state.lookX * 0.5 + 0.5) * cssW
    const py = (state.lookY * 0.5 + 0.5) * cssH
    const reach = 42 + state.chant * 50

    ensureSutras(cssW, cssH)

    for (const s of sutras) {
      if (s.taken) continue
      s.phase += dt * s.pulse
      const dx = s.x - px
      const dy = s.y - py
      // Gravity bends toward gaze when chanting
      if (state.chant > 0.2) {
        const dist = Math.hypot(dx, dy) || 1
        s.x -= (dx / dist) * state.chant * 40 * dt
        s.y -= (dy / dist) * state.chant * 40 * dt
      }
      // Soft wander
      s.x += Math.sin(s.phase * 0.7) * 12 * dt
      s.y += Math.cos(s.phase * 0.55) * 12 * dt
      s.x = Math.max(40, Math.min(cssW - 40, s.x))
      s.y = Math.max(40, Math.min(cssH - 40, s.y))

      if (Math.hypot(s.x - px, s.y - py) < reach + s.r) {
        s.taken = true
        sutrasCollected++
        spawnBurst(48, s.x * dpr, s.y * dpr, 1.6)
        const prev = layer
        if (sutrasCollected % 3 === 0) {
          layer = Math.min(7, layer + 1)
        }
        showToast(layer > prev ? LAYER_NAMES[layer] : 'SUTRA ABSORBED')
        state.onSutra?.(layer)
      }
    }

    // Prune taken
    for (let i = sutras.length - 1; i >= 0; i--) {
      if (sutras[i].taken) sutras.splice(i, 1)
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life -= dt
      p.x += p.vx * 60 * dt
      p.y += p.vy * 60 * dt
      p.vx *= 0.985
      p.vy *= 0.985
      // Spiral pull toward center when chanting
      if (state.chant > 0.1) {
        const cx = w * 0.5
        const cy = h * 0.5
        p.vx += (cx - p.x) * 0.0008 * state.chant
        p.vy += (cy - p.y) * 0.0008 * state.chant
      }
      if (p.life <= 0) particles.splice(i, 1)
    }

    // Ambient sparkle
    if (particles.length < 80 && Math.random() < 0.35) {
      spawnBurst(2, rand(0, w), rand(0, h), 0.3)
    }

    if (toastTimer > 0) toastTimer -= dt

    return {
      layer,
      sutrasCollected,
      toastText,
      toastVisible: toastTimer > 0,
      layerName: LAYER_NAMES[layer],
      tint: TINTS[layer],
    }
  }

  function drawHud(ctx, canvas, meta, state) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.width
    const h = canvas.height
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, w, h)

    // Particles
    for (const p of particles) {
      const a = Math.max(0, p.life / p.max)
      const r = p.hue < 0.33 ? 244 : p.hue < 0.66 ? 0 : 128
      const g = p.hue < 0.33 ? 162 : p.hue < 0.66 ? 229 : 255
      const b = p.hue < 0.33 ? 97 : p.hue < 0.66 ? 255 : 114
      ctx.beginPath()
      ctx.fillStyle = `rgba(${r},${g},${b},${a * 0.85})`
      ctx.arc(p.x, p.y, p.size * dpr * (0.6 + a), 0, Math.PI * 2)
      ctx.fill()
    }

    // Sutras
    ctx.save()
    ctx.scale(dpr, dpr)
    const cssW = w / dpr
    const cssH = h / dpr
    for (const s of sutras) {
      if (s.taken) continue
      const pulse = 0.75 + 0.25 * Math.sin(s.phase)
      const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2.2)
      grd.addColorStop(0, `rgba(128,255,114,${0.85 * pulse})`)
      grd.addColorStop(0.4, `rgba(0,229,255,${0.45 * pulse})`)
      grd.addColorStop(1, 'rgba(244,162,97,0)')
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r * 2.2, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = `rgba(255,246,232,${0.55 + 0.35 * pulse})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r * pulse, 0, Math.PI * 2)
      ctx.stroke()

      // Inner sigil
      ctx.save()
      ctx.translate(s.x, s.y)
      ctx.rotate(s.phase * 0.5)
      ctx.strokeStyle = `rgba(244,162,97,${0.7 * pulse})`
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        const x = Math.cos(a) * s.r * 0.55
        const y = Math.sin(a) * s.r * 0.55
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
      ctx.restore()
    }

    // Gaze reticle — morphs when chanting
    const gx = (state.lookX * 0.5 + 0.5) * cssW
    const gy = (state.lookY * 0.5 + 0.5) * cssH
    const cr = 18 + state.chant * 28
    ctx.strokeStyle = `rgba(0,229,255,${0.35 + state.chant * 0.45})`
    ctx.lineWidth = 1.25
    ctx.beginPath()
    ctx.arc(gx, gy, cr, 0, Math.PI * 2)
    ctx.stroke()
    if (state.chant > 0.05) {
      ctx.strokeStyle = `rgba(244,162,97,${state.chant * 0.7})`
      ctx.beginPath()
      ctx.arc(gx, gy, cr * 1.35, state.time, state.time + Math.PI * 1.2)
      ctx.stroke()
    }

    // Minimal corner mantra — not a HUD dashboard
    ctx.font = `600 ${11 * (cssW < 500 ? 0.95 : 1)}px "IBM Plex Mono", monospace`
    ctx.fillStyle = 'rgba(245,240,255,0.4)'
    ctx.textAlign = 'left'
    ctx.fillText(`LAYER ${meta.layer} · ${meta.layerName}`, 18, cssH - 22)
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(128,255,114,0.45)'
    ctx.fillText(`${meta.sutrasCollected} SUTRAS`, cssW - 18, cssH - 22)

    // Brand whisper top
    ctx.textAlign = 'center'
    ctx.font = `800 ${Math.max(14, Math.min(22, cssW * 0.035))}px Syne, sans-serif`
    ctx.fillStyle = `rgba(244,162,97,${0.22 + state.chant * 0.25})`
    ctx.fillText('monk.run', cssW * 0.5, 28)

    ctx.restore()
  }

  return {
    resetOpening,
    update,
    drawHud,
    showToast,
    get layer() { return layer },
    spawnBurst,
  }
}

export { LAYER_NAMES, TINTS }
