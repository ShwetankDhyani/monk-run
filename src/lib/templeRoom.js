/** Buddhist living-room layout: art, colliders, prop seeds, black-hole placement. */

export const ROOM = { x: 80, y: 100, w: 1120, h: 560 }

/** Static furniture / wall colliders (circle-rect separation in lobby). */
export const STATIC_COLLIDERS = [
  { x: 80, y: 100, w: 1120, h: 24 },
  { x: 80, y: 636, w: 1120, h: 24 },
  { x: 80, y: 100, w: 24, h: 560 },
  { x: 1176, y: 100, w: 24, h: 560 },
  // Back sofa bench
  { x: 480, y: 148, w: 320, h: 52 },
  // Left bookshelf
  { x: 118, y: 168, w: 88, h: 148 },
  // Right sideboard
  { x: 1060, y: 168, w: 88, h: 120 },
  // Coffee table
  { x: 520, y: 300, w: 240, h: 72 },
  // Left armchair
  { x: 168, y: 420, w: 96, h: 88 },
  // Right armchair
  { x: 1016, y: 420, w: 96, h: 88 },
  // Altar table (back center)
  { x: 560, y: 208, w: 160, h: 36 },
  // Floor lamp left
  { x: 248, y: 260, w: 36, h: 36 },
  // Plant right
  { x: 980, y: 280, w: 44, h: 44 },
]

export function randomBlackHolePos() {
  const pad = 100
  const minX = ROOM.x + pad
  const maxX = ROOM.x + ROOM.w - pad
  const minY = ROOM.y + pad + 40
  const maxY = ROOM.y + ROOM.h - pad - 40
  for (let i = 0; i < 40; i++) {
    const x = minX + Math.random() * (maxX - minX)
    const y = minY + Math.random() * (maxY - minY)
    const r = 28
    let ok = true
    for (const c of STATIC_COLLIDERS) {
      const nx = Math.max(c.x, Math.min(x, c.x + c.w))
      const ny = Math.max(c.y, Math.min(y, c.y + c.h))
      if ((x - nx) ** 2 + (y - ny) ** 2 < r * r) {
        ok = false
        break
      }
    }
    if (ok) return { x: Math.round(x), y: Math.round(y) }
  }
  return { x: 640, y: 380 }
}

export function makeLivingRoomProps(bhX = 640, bhY = 380) {
  return [
    { id: 'v1', kind: 'vase', x: 620, y: 248, mass: 1.4, r: 12, vx: 0, vy: 0, rot: 0 },
    { id: 'v2', kind: 'vase', x: 1088, y: 310, mass: 1.4, r: 12, vx: 0, vy: 0, rot: 0 },
    { id: 'f1', kind: 'flowers', x: 640, y: 228, mass: 0.5, r: 16, vx: 0, vy: 0, rot: 0 },
    { id: 'b1', kind: 'bowl', x: 580, y: 318, mass: 0.85, r: 11, vx: 0, vy: 0, rot: 0 },
    { id: 'c1', kind: 'candle', x: 600, y: 218, mass: 0.3, r: 7, vx: 0, vy: 0, rot: 0 },
    { id: 'c2', kind: 'candle', x: 680, y: 218, mass: 0.3, r: 7, vx: 0, vy: 0, rot: 0 },
    { id: 'm1', kind: 'mat', x: 640, y: 480, mass: 0.65, r: 22, vx: 0, vy: 0, rot: 0 },
    { id: 'p1', kind: 'petal', x: 540, y: 400, mass: 0.12, r: 5, vx: 0, vy: 0, rot: 0 },
    { id: 'p2', kind: 'petal', x: 720, y: 420, mass: 0.12, r: 5, vx: 0, vy: 0, rot: 0 },
    { id: 'p3', kind: 'petal', x: 640, y: 360, mass: 0.12, r: 5, vx: 0, vy: 0, rot: 0 },
    { id: 't1', kind: 'tea', x: 700, y: 318, mass: 0.55, r: 9, vx: 0, vy: 0, rot: 0 },
    { id: 'b2', kind: 'beads', x: 200, y: 500, mass: 0.25, r: 8, vx: 0, vy: 0, rot: 0 },
  ]
}

function plank(ctx, x, y, w, h, shade) {
  ctx.fillStyle = shade
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = 'rgba(20,12,6,0.12)'
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}

/** Draw a warm Buddhist living room (top-down). */
export function drawLivingRoom(ctx, t) {
  const { x: rx, y: ry, w: rw, h: rh } = ROOM

  // Outer wall trim
  ctx.fillStyle = '#2a1810'
  ctx.fillRect(rx - 6, ry - 6, rw + 12, rh + 12)

  // Warm wall plaster
  const wallG = ctx.createLinearGradient(rx, ry, rx, ry + rh)
  wallG.addColorStop(0, '#c4a882')
  wallG.addColorStop(1, '#a88868')
  ctx.fillStyle = wallG
  ctx.fillRect(rx, ry, rw, rh)

  // Wainscoting strip
  ctx.fillStyle = '#6b4a32'
  ctx.fillRect(rx, ry + rh - 48, rw, 48)
  ctx.strokeStyle = 'rgba(30,18,8,0.25)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(rx, ry + rh - 48)
  ctx.lineTo(rx + rw, ry + rh - 48)
  ctx.stroke()

  // Hardwood floor
  const fx = rx + 28
  const fy = ry + 28
  const fw = rw - 56
  const fh = rh - 76
  ctx.fillStyle = '#5c3d28'
  ctx.fillRect(fx, fy, fw, fh)
  const plankW = 52
  for (let row = 0; row < Math.ceil(fh / 28); row++) {
    const py = fy + row * 28
    const offset = row % 2 === 0 ? 0 : plankW / 2
    for (let col = -1; col < Math.ceil(fw / plankW) + 1; col++) {
      const px = fx + col * plankW + offset
      const shade = (row + col) % 3 === 0 ? '#7a5238' : (row + col) % 3 === 1 ? '#6b4528' : '#8b6240'
      plank(ctx, px, py, plankW - 2, 26, shade)
    }
  }

  // Large center rug
  ctx.save()
  ctx.translate(rx + rw / 2, ry + rh / 2 + 20)
  ctx.fillStyle = '#6b1a1a'
  roundRect(ctx, -280, -100, 560, 200, 12)
  ctx.strokeStyle = '#c9a227'
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.strokeStyle = '#8b6914'
  ctx.lineWidth = 2
  roundRect(ctx, -250, -78, 500, 156, 8)
  ctx.stroke()
  // Rug pattern
  ctx.strokeStyle = 'rgba(201,162,39,0.35)'
  ctx.lineWidth = 1
  for (let i = -220; i <= 220; i += 44) {
    ctx.beginPath()
    ctx.moveTo(i, -70)
    ctx.lineTo(i, 70)
    ctx.stroke()
  }
  ctx.restore()

  // Back window with soft light
  ctx.fillStyle = '#1a2838'
  roundRect(ctx, rx + 380, ry + 12, 520, 36, 6)
  ctx.fillStyle = 'rgba(180,210,240,0.55)'
  roundRect(ctx, rx + 388, ry + 16, 504, 28, 4)
  ctx.fill()
  ctx.fillStyle = '#8b7355'
  ctx.fillRect(rx + 638, ry + 12, 4, 36)
  // Curtains
  ctx.fillStyle = '#7a1f1f'
  ctx.fillRect(rx + 360, ry + 8, 36, 44)
  ctx.fillRect(rx + 884, ry + 8, 36, 44)
  // Window glow on floor
  const winGlow = ctx.createRadialGradient(rx + rw / 2, ry + 80, 0, rx + rw / 2, ry + 200, 220)
  winGlow.addColorStop(0, `rgba(200,220,255,${0.12 + Math.sin(t * 0.5) * 0.02})`)
  winGlow.addColorStop(1, 'rgba(200,220,255,0)')
  ctx.fillStyle = winGlow
  ctx.fillRect(fx, fy, fw, fh)

  // Back sofa
  ctx.fillStyle = '#4a3020'
  roundRect(ctx, rx + 480, ry + 148, 320, 52, 10)
  ctx.fill()
  ctx.fillStyle = '#5c3828'
  roundRect(ctx, rx + 488, ry + 154, 304, 38, 8)
  ctx.fill()
  // Sofa cushions
  ctx.fillStyle = '#6b4530'
  ;[500, 580, 660, 740].forEach((cx) => roundRect(ctx, rx + cx, ry + 158, 68, 30, 6))

  // Altar / shrine (back center)
  ctx.fillStyle = '#3a2414'
  ctx.fillRect(rx + 560, ry + 208, 160, 36)
  ctx.fillStyle = '#c9a227'
  ctx.fillRect(rx + 568, ry + 200, 144, 10)
  // Buddha statue silhouette
  ctx.fillStyle = '#d4af37'
  ctx.beginPath()
  ctx.arc(rx + 640, ry + 224, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#8b6914'
  ctx.fillRect(rx + 634, ry + 232, 12, 10)
  // Offering bowls
  ctx.fillStyle = '#b8860b'
  ctx.beginPath()
  ctx.ellipse(rx + 600, ry + 228, 8, 5, 0, 0, Math.PI * 2)
  ctx.ellipse(rx + 680, ry + 228, 8, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Left bookshelf
  ctx.fillStyle = '#3a2414'
  ctx.fillRect(rx + 118, ry + 168, 88, 148)
  ctx.fillStyle = '#5c3828'
  for (let s = 0; s < 4; s++) {
    ctx.fillRect(rx + 122, ry + 178 + s * 34, 80, 4)
    ctx.fillStyle = ['#6b4520', '#4a6741', '#8b6914', '#5a4a8a'][s]
    ctx.fillRect(rx + 126, ry + 184 + s * 34, 72, 24)
    ctx.fillStyle = '#5c3828'
  }

  // Right sideboard
  ctx.fillStyle = '#3a2414'
  roundRect(ctx, rx + 1060, ry + 168, 88, 120, 6)
  ctx.fillStyle = '#5c3828'
  roundRect(ctx, rx + 1066, ry + 174, 76, 108, 4)
  // Tea set on sideboard
  ctx.fillStyle = '#e8dcc8'
  ctx.beginPath()
  ctx.arc(rx + 1100, ry + 210, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#b8860b'
  ctx.beginPath()
  ctx.ellipse(rx + 1120, ry + 230, 12, 7, 0, 0, Math.PI * 2)
  ctx.fill()

  // Coffee table
  ctx.fillStyle = '#4a3020'
  roundRect(ctx, rx + 520, ry + 300, 240, 72, 8)
  ctx.fillStyle = '#6b4528'
  roundRect(ctx, rx + 528, ry + 306, 224, 60, 6)
  // Table items
  ctx.fillStyle = '#f5f5dc'
  ctx.fillRect(rx + 580, ry + 318, 8, 14)
  ctx.fillStyle = `rgba(255,180,60,${0.65 + Math.sin(t * 6) * 0.25})`
  ctx.beginPath()
  ctx.arc(rx + 584, ry + 314, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#b8860b'
  ctx.beginPath()
  ctx.ellipse(rx + 640, ry + 330, 14, 8, 0, 0, Math.PI * 2)
  ctx.fill()

  // Left armchair
  ctx.fillStyle = '#5c3828'
  roundRect(ctx, rx + 168, ry + 420, 96, 88, 10)
  ctx.fillStyle = '#7a1f1f'
  roundRect(ctx, rx + 176, ry + 428, 80, 68, 8)

  // Right armchair
  ctx.fillStyle = '#5c3828'
  roundRect(ctx, rx + 1016, ry + 420, 96, 88, 10)
  ctx.fillStyle = '#4a6741'
  roundRect(ctx, rx + 1024, ry + 428, 80, 68, 8)

  // Floor cushions
  ctx.fillStyle = '#8b6914'
  ;[
    [340, 520], [420, 540], [860, 520], [940, 540],
  ].forEach(([cx, cy]) => {
    ctx.beginPath()
    ctx.ellipse(rx + cx, ry + cy, 28, 20, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#c9a227'
    ctx.lineWidth = 2
    ctx.stroke()
  })

  // Floor lamp (left)
  ctx.fillStyle = '#3a2414'
  ctx.beginPath()
  ctx.arc(rx + 266, ry + 278, 14, 0, Math.PI * 2)
  ctx.fill()
  const lampGlow = ctx.createRadialGradient(rx + 266, ry + 278, 0, rx + 266, ry + 278, 80)
  lampGlow.addColorStop(0, `rgba(255,220,160,${0.18 + Math.sin(t * 2) * 0.04})`)
  lampGlow.addColorStop(1, 'rgba(255,200,120,0)')
  ctx.fillStyle = lampGlow
  ctx.beginPath()
  ctx.arc(rx + 266, ry + 278, 80, 0, Math.PI * 2)
  ctx.fill()

  // Potted plant (right)
  ctx.fillStyle = '#6b4520'
  ctx.beginPath()
  ctx.ellipse(rx + 1002, ry + 302, 14, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#4a6741'
  ctx.beginPath()
  ctx.arc(rx + 1002, ry + 288, 18, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#3a5530'
  ctx.beginPath()
  ctx.arc(rx + 992, ry + 282, 10, 0, Math.PI * 2)
  ctx.arc(rx + 1012, ry + 280, 10, 0, Math.PI * 2)
  ctx.fill()

  // Hanging lanterns (warm ambient)
  ;[320, 640, 960].forEach((lx, i) => {
    const bob = Math.sin(t * 1.2 + i) * 2
    ctx.fillStyle = '#c45c4a'
    ctx.beginPath()
    ctx.ellipse(rx + lx, ry + 56 + bob, 12, 16, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(rx + lx, ry + 56 + bob, 5, 0, Math.PI * 2)
    ctx.fill()
    const lg = ctx.createRadialGradient(rx + lx, ry + 120, 0, rx + lx, ry + 280, 160)
    lg.addColorStop(0, `rgba(255,200,120,${0.06 + Math.sin(t + i) * 0.015})`)
    lg.addColorStop(1, 'rgba(255,180,80,0)')
    ctx.fillStyle = lg
    ctx.fillRect(fx, fy, fw, fh)
  })

  // Incense smoke wisps near altar
  ctx.strokeStyle = `rgba(200,200,200,${0.08 + Math.sin(t * 3) * 0.03})`
  ctx.lineWidth = 2
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.moveTo(rx + 640 + i * 8, ry + 196)
    ctx.quadraticCurveTo(rx + 650 + i * 10, ry + 170 - Math.sin(t * 2 + i) * 8, rx + 660 + i * 6, ry + 150)
    ctx.stroke()
  }
}

export function drawLivingProp(ctx, p, t) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rot)
  if (p.kind === 'vase') {
    ctx.fillStyle = '#6b4520'
    ctx.beginPath()
    ctx.moveTo(-8, 8)
    ctx.lineTo(-10, 14)
    ctx.lineTo(10, 14)
    ctx.lineTo(8, 8)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#8b4513'
    ctx.beginPath()
    ctx.ellipse(0, 2, 9, 12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#e8a0b0'
    ctx.beginPath()
    ctx.arc(-4, -14, 6, 0, Math.PI * 2)
    ctx.arc(5, -16, 5, 0, Math.PI * 2)
    ctx.arc(0, -10, 7, 0, Math.PI * 2)
    ctx.fill()
  } else if (p.kind === 'flowers') {
    ctx.fillStyle = '#4a6741'
    ctx.fillRect(-2, 0, 4, 18)
    ctx.fillStyle = '#e8a0b0'
    ctx.beginPath()
    ctx.arc(0, -10, 11, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(0, -10, 4, 0, Math.PI * 2)
    ctx.fill()
  } else if (p.kind === 'bowl') {
    ctx.fillStyle = '#b8860b'
    ctx.beginPath()
    ctx.ellipse(0, 0, 12, 7, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#d4af37'
    ctx.beginPath()
    ctx.ellipse(0, -2, 8, 4, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (p.kind === 'candle') {
    ctx.fillStyle = '#f5f5dc'
    ctx.fillRect(-3, -4, 6, 14)
    ctx.fillStyle = `rgba(255,180,60,${0.7 + Math.sin(t * 8) * 0.3})`
    ctx.beginPath()
    ctx.arc(0, -8, 4, 0, Math.PI * 2)
    ctx.fill()
  } else if (p.kind === 'mat') {
    ctx.fillStyle = '#7a1f1f'
    ctx.beginPath()
    ctx.ellipse(0, 0, 22, 14, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#c9a227'
    ctx.lineWidth = 2
    ctx.stroke()
  } else if (p.kind === 'tea') {
    ctx.fillStyle = '#e8dcc8'
    ctx.beginPath()
    ctx.arc(0, 0, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#8b6914'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, 8, 0, Math.PI * 2)
    ctx.stroke()
  } else if (p.kind === 'beads') {
    ctx.fillStyle = '#c9a227'
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(Math.cos(a) * 7, Math.sin(a) * 7, 2.5, 0, Math.PI * 2)
      ctx.fill()
    }
  } else {
    ctx.fillStyle = '#e8a0b0'
    ctx.beginPath()
    ctx.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
