/** Top-down AOT monk scouts — big heads, saffron robes, recognizable traits. */
import { MONK_AVATARS, ROBE_PALETTE } from '../data/avatars.js'

export const DIRECTIONS = ['down', 'up', 'left', 'right']

export function dirFromDelta(dx, dy, prev = 'down') {
  if (!dx && !dy) return prev
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left'
  return dy > 0 ? 'down' : 'up'
}

function bodyScale(look) {
  return look.heightScale || 1
}

function headRadius(look) {
  if (look.feature === 'historia') return 15
  if (look.feature === 'mikasa') return 15
  if (look.feature === 'jean') return 17
  if (look.feature === 'levi') return 14
  return 16
}

function drawMonkRobe(ctx, look, dir, walk, scale) {
  const bodyW = 16 * scale
  const bodyH = 18 * scale
  const sway = Math.sin(walk * 12) * 0.5

  ctx.fillStyle = look.robe
  ctx.strokeStyle = '#1a1008'
  ctx.lineWidth = 1.5

  if (dir === 'down' || dir === 'up') {
    ctx.beginPath()
    ctx.ellipse(0, 8 + sway * 0.2, bodyW * 0.5, bodyH * 0.45, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = look.hood || look.robe
    ctx.beginPath()
    ctx.moveTo(-bodyW * 0.32, 0)
    ctx.quadraticCurveTo(0, -5, bodyW * 0.32, 0)
    ctx.lineTo(bodyW * 0.26, 6)
    ctx.lineTo(-bodyW * 0.26, 6)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  } else {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.beginPath()
    ctx.moveTo(-2, 0)
    ctx.quadraticCurveTo(9, 4, 8, 15)
    ctx.lineTo(-5, 16)
    ctx.quadraticCurveTo(-8, 7, -2, 0)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  ctx.fillStyle = look.sash
  if (dir === 'down' || dir === 'up') {
    ctx.fillRect(-bodyW * 0.4, 3, bodyW * 0.8, 4)
  } else {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.fillRect(-1, 3, 10, 3)
    ctx.restore()
  }
}

function drawEyes(ctx, look, headY, headR, dir, wide = false) {
  if (dir !== 'down') return
  const eyeY = headY + 1
  const eyeW = wide ? 2.2 : 1.8
  const gap = headR * 0.32
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.ellipse(-gap, eyeY, eyeW + 0.4, eyeW + 0.9, 0, 0, Math.PI * 2)
  ctx.ellipse(gap, eyeY, eyeW + 0.4, eyeW + 0.9, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = look.eyes
  ctx.beginPath()
  ctx.arc(-gap, eyeY, eyeW * 0.65, 0, Math.PI * 2)
  ctx.arc(gap, eyeY, eyeW * 0.65, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1a1008'
  ctx.beginPath()
  ctx.arc(-gap, eyeY, eyeW * 0.35, 0, Math.PI * 2)
  ctx.arc(gap, eyeY, eyeW * 0.35, 0, Math.PI * 2)
  ctx.fill()
}

/** Attack Titan hair — middle part, long framing strands, glossy sheen. */
function drawErenTitanHair(ctx, look, headY, headR) {
  ctx.fillStyle = look.hair
  ctx.beginPath()
  ctx.arc(0, headY - headR * 0.28, headR * 0.9, Math.PI, Math.PI * 2)
  ctx.fill()

  const strands = [
    [-0.62, 0.62], [-0.38, 0.78], [-0.18, 0.55], [0.18, 0.55], [0.38, 0.78], [0.62, 0.62],
    [-0.72, 0.48], [0.72, 0.48],
  ]
  for (const [sx, len] of strands) {
    const x0 = sx * headR
    ctx.beginPath()
    ctx.moveTo(x0, headY - headR * 0.48)
    ctx.quadraticCurveTo(x0 * 1.15, headY + headR * 0.08, x0 * 0.88, headY + headR * len)
    ctx.quadraticCurveTo(x0 * 0.95, headY + headR * (len * 0.55), x0, headY - headR * 0.48)
    ctx.fill()
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.35)'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(0, headY - headR * 0.92)
  ctx.lineTo(0, headY - headR * 0.18)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  ctx.beginPath()
  ctx.ellipse(-headR * 0.22, headY - headR * 0.58, headR * 0.28, headR * 0.1, -0.35, 0, Math.PI * 2)
  ctx.fill()
}

function drawErenTitanEars(ctx, look, headY, headR) {
  ctx.fillStyle = look.skin
  ctx.strokeStyle = '#1a1008'
  ctx.lineWidth = 1
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(side * headR * 0.86, headY - headR * 0.12)
    ctx.lineTo(side * headR * 1.1, headY - headR * 0.38)
    ctx.lineTo(side * headR * 0.9, headY + headR * 0.06)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
}

function drawErenTitanHeadShape(ctx, look, headY, headR) {
  ctx.fillStyle = look.skin
  ctx.beginPath()
  ctx.moveTo(0, headY - headR)
  ctx.bezierCurveTo(headR * 0.98, headY - headR * 0.82, headR * 1.05, headY + headR * 0.1, headR * 0.74, headY + headR * 0.78)
  ctx.lineTo(-headR * 0.74, headY + headR * 0.78)
  ctx.bezierCurveTo(-headR * 1.05, headY + headR * 0.1, -headR * 0.98, headY - headR * 0.82, 0, headY - headR)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#1a1008'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = 'rgba(70,45,30,0.22)'
  ctx.beginPath()
  ctx.ellipse(-headR * 0.52, headY + headR * 0.08, headR * 0.18, headR * 0.1, -0.4, 0, Math.PI * 2)
  ctx.ellipse(headR * 0.52, headY + headR * 0.08, headR * 0.18, headR * 0.1, 0.4, 0, Math.PI * 2)
  ctx.fill()
}

function drawErenTitanFace(ctx, look, headY, headR, dir = 'down') {
  if (dir === 'down') {
    drawErenTitanEars(ctx, look, headY, headR)

    ctx.fillStyle = 'rgba(0,0,0,0.42)'
    const eyeY = headY + 1
    const gap = headR * 0.32
    const eyeW = 2.2
    ctx.beginPath()
    ctx.ellipse(-gap, eyeY, eyeW + 1.2, eyeW + 0.9, 0, 0, Math.PI * 2)
    ctx.ellipse(gap, eyeY, eyeW + 1.2, eyeW + 0.9, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.save()
    ctx.shadowColor = look.eyes
    ctx.shadowBlur = 8
    ctx.fillStyle = look.eyes
    ctx.beginPath()
    ctx.ellipse(-gap, eyeY, eyeW + 0.4, eyeW + 0.2, 0, 0, Math.PI * 2)
    ctx.ellipse(gap, eyeY, eyeW + 0.4, eyeW + 0.2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = '#9affec'
    ctx.beginPath()
    ctx.ellipse(-gap, eyeY, eyeW * 0.55, eyeW * 0.35, 0, 0, Math.PI * 2)
    ctx.ellipse(gap, eyeY, eyeW * 0.55, eyeW * 0.35, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    ctx.strokeStyle = 'rgba(50,35,25,0.55)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(-headR * 0.12, headY + headR * 0.12)
    ctx.lineTo(-headR * 0.08, headY + headR * 0.28)
    ctx.moveTo(headR * 0.12, headY + headR * 0.12)
    ctx.lineTo(headR * 0.08, headY + headR * 0.28)
    ctx.stroke()

    const mouthY = headY + headR * 0.4
    const mouthW = headR * 0.74
    ctx.fillStyle = '#120808'
    ctx.beginPath()
    ctx.moveTo(-mouthW, mouthY - 2)
    ctx.quadraticCurveTo(0, mouthY + headR * 0.24, mouthW, mouthY - 2)
    ctx.lineTo(mouthW * 0.92, mouthY + 1)
    ctx.quadraticCurveTo(0, mouthY + headR * 0.38, -mouthW * 0.92, mouthY + 1)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#f2f0ea'
    for (let i = -3; i <= 3; i++) {
      const tx = i * 3.1
      ctx.fillRect(tx - 1.3, mouthY - 1.2, 2.6, 3.4)
      ctx.fillRect(tx - 1.3, mouthY + 2.2, 2.6, 3)
    }

    ctx.strokeStyle = 'rgba(80,30,30,0.5)'
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(-mouthW * 0.95, mouthY - 1.5)
    ctx.quadraticCurveTo(0, mouthY + headR * 0.08, mouthW * 0.95, mouthY - 1.5)
    ctx.stroke()
  } else {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    const eyeY = headY + 1
    ctx.fillStyle = 'rgba(0,0,0,0.42)'
    ctx.beginPath()
    ctx.ellipse(8, eyeY, 3.2, 2.6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.save()
    ctx.shadowColor = look.eyes
    ctx.shadowBlur = 6
    ctx.fillStyle = look.eyes
    ctx.beginPath()
    ctx.ellipse(8, eyeY, 2.4, 1.8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    ctx.fillStyle = '#120808'
    ctx.beginPath()
    ctx.moveTo(4, headY + headR * 0.32)
    ctx.quadraticCurveTo(9, headY + headR * 0.52, 14, headY + headR * 0.3)
    ctx.lineTo(13, headY + headR * 0.38)
    ctx.quadraticCurveTo(9, headY + headR * 0.58, 5, headY + headR * 0.38)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#f2f0ea'
    for (let i = 0; i < 4; i++) ctx.fillRect(6 + i * 2.2, headY + headR * 0.34, 1.8, 2.2)
    ctx.restore()
  }
}

/** Attack Titan floating head + head-shaped shadow — no body. */
function drawErenFloatingHead(ctx, look, dir, walk, scale) {
  const float = Math.sin(walk * 12) * 1.8
  const headR = 17 * scale
  const headY = -4 + float
  const shadowY = headY + headR + 5

  ctx.fillStyle = 'rgba(0,0,0,0.14)'
  ctx.beginPath()
  ctx.ellipse(1, shadowY + 2, headR * 1.08, headR * 0.42, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(0,0,0,0.32)'
  ctx.beginPath()
  ctx.ellipse(1, shadowY, headR * 0.82, headR * 0.32, 0, 0, Math.PI * 2)
  ctx.fill()

  if (dir === 'up') {
    ctx.fillStyle = look.hair
    ctx.beginPath()
    ctx.arc(0, headY, headR * 0.9, 0, Math.PI * 2)
    ctx.fill()
    drawErenTitanHair(ctx, look, headY, headR)
    return
  }

  if (dir === 'left' || dir === 'right') {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.fillStyle = look.skin
    ctx.beginPath()
    ctx.ellipse(4, headY, headR * 0.82, headR * 1.02, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a1008'
    ctx.lineWidth = 1.4
    ctx.stroke()
    ctx.fillStyle = look.hair
    ctx.beginPath()
    ctx.arc(1, headY - headR * 0.42, headR * 0.75, Math.PI, Math.PI * 2)
    ctx.fill()
    drawErenTitanHair(ctx, look, headY, headR)
    drawErenTitanFace(ctx, look, headY, headR, dir)
    ctx.restore()
    return
  }

  drawErenTitanHeadShape(ctx, look, headY, headR)
  drawErenTitanHair(ctx, look, headY, headR)
  drawErenTitanFace(ctx, look, headY, headR, 'down')
}

function drawLeviBladeUnit(ctx, angle, mirrored = false) {
  ctx.save()
  ctx.rotate(angle)
  if (mirrored) ctx.scale(-1, 1)

  ctx.fillStyle = '#2a2018'
  ctx.fillRect(-1.6, -2.5, 3.2, 5.5)
  ctx.fillStyle = '#3a3028'
  ctx.beginPath()
  ctx.moveTo(-2.2, 2.5)
  ctx.lineTo(2.2, 2.5)
  ctx.lineTo(1.6, 5.5)
  ctx.lineTo(-1.6, 5.5)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#c0c8d0'
  ctx.strokeStyle = '#687888'
  ctx.lineWidth = 0.55
  for (let i = 0; i < 4; i++) {
    const by = 6 + i * 3.2
    ctx.fillRect(-2.6, by, 5.2, 2.8)
    ctx.strokeRect(-2.6, by, 5.2, 2.8)
  }
  ctx.fillRect(-1.8, 6 + 4 * 3.2, 3.6, 2)
  ctx.strokeRect(-1.8, 6 + 4 * 3.2, 3.6, 2)

  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillRect(-1.2, 7, 1, 8)

  ctx.restore()
}

function drawLeviBlades(ctx, dir, walk, scale) {
  const sway = Math.sin(walk * 12) * 0.8

  if (dir === 'down') {
    for (const [hx, hy, ang, mir] of [
      [-11 * scale, 5 + sway, 0.55, false],
      [11 * scale, 5 + sway, -0.55, true],
    ]) {
      ctx.save()
      ctx.translate(hx, hy)
      drawLeviBladeUnit(ctx, ang, mir)
      ctx.restore()
    }
    return
  }

  if (dir === 'up') {
    for (const [hx, hy, ang] of [
      [-9 * scale, 6, -0.25],
      [9 * scale, 6, 0.25],
    ]) {
      ctx.save()
      ctx.translate(hx, hy)
      drawLeviBladeUnit(ctx, ang, false)
      ctx.restore()
    }
    return
  }

  const flip = dir === 'left' ? -1 : 1
  ctx.save()
  ctx.scale(flip, 1)
  ctx.translate(10 * scale, 4 + sway)
  drawLeviBladeUnit(ctx, 0.35, false)
  ctx.translate(-4, 3)
  drawLeviBladeUnit(ctx, -0.15, true)
  ctx.restore()
}

function drawLeviCravat(ctx, look, dir, scale) {
  if (dir === 'up') return
  ctx.fillStyle = look.cravat || '#f0ece4'
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 0.7

  if (dir === 'down') {
    ctx.beginPath()
    ctx.moveTo(-5 * scale, -1)
    ctx.quadraticCurveTo(0, 3 * scale, 5 * scale, -1)
    ctx.lineTo(4 * scale, 4 * scale)
    ctx.quadraticCurveTo(0, 6 * scale, -4 * scale, 4 * scale)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fillRect(-1.5 * scale, 0, 3 * scale, 2 * scale)
    return
  }

  const flip = dir === 'left' ? -1 : 1
  ctx.save()
  ctx.scale(flip, 1)
  ctx.beginPath()
  ctx.moveTo(2, 0)
  ctx.quadraticCurveTo(7 * scale, 2 * scale, 5 * scale, 6 * scale)
  ctx.lineTo(2, 5 * scale)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

function drawLeviHair(ctx, look, headY, headR, dir) {
  ctx.fillStyle = look.hair
  if (dir === 'up') {
    ctx.beginPath()
    ctx.arc(0, headY, headR * 0.85, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  if (dir === 'left' || dir === 'right') {
    ctx.beginPath()
    ctx.arc(2, headY - headR * 0.35, headR * 0.72, Math.PI * 0.85, Math.PI * 2.15)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(4, headY - headR * 0.2)
    ctx.lineTo(7, headY + headR * 0.15)
    ctx.lineTo(5, headY + headR * 0.05)
    ctx.closePath()
    ctx.fill()
    return
  }

  ctx.fillRect(-headR * 0.95, headY - headR * 0.15, headR * 0.22, headR * 0.8)
  ctx.fillRect(headR * 0.73, headY - headR * 0.15, headR * 0.22, headR * 0.8)
  ctx.beginPath()
  ctx.arc(0, headY - headR * 0.32, headR * 0.74, Math.PI, Math.PI * 2)
  ctx.fill()

  const fringes = [
    [-0.34, 0.38], [-0.14, 0.52], [0, 0.48], [0.14, 0.52], [0.34, 0.38],
  ]
  for (const [sx, len] of fringes) {
    ctx.beginPath()
    ctx.moveTo(sx * headR, headY - headR * 0.52)
    ctx.lineTo(sx * headR * 0.82, headY - headR * 0.52 + headR * len * 0.38)
    ctx.lineTo(sx * headR * 1.08, headY - headR * 0.52 + headR * len * 0.38)
    ctx.closePath()
    ctx.fill()
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 0.7
  ctx.beginPath()
  ctx.moveTo(0, headY - headR * 0.78)
  ctx.lineTo(0, headY - headR * 0.32)
  ctx.stroke()
}

function drawLeviEyes(ctx, look, headY, headR, dir = 'down') {
  if (dir === 'left' || dir === 'right') {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.fillStyle = look.eyes
    ctx.beginPath()
    ctx.ellipse(9, headY - 1, 1.6, 1, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1a1008'
    ctx.beginPath()
    ctx.arc(9.2, headY - 1, 0.7, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = look.brow
    ctx.lineWidth = 1.1
    ctx.beginPath()
    ctx.moveTo(6, headY - headR * 0.18)
    ctx.lineTo(10, headY - headR * 0.24)
    ctx.stroke()
    ctx.restore()
    return
  }

  const eyeY = headY + 1
  const gap = headR * 0.27
  const eyeW = 1.55

  ctx.fillStyle = look.skin
  ctx.fillRect(-gap - eyeW - 0.5, eyeY - eyeW - 1.2, eyeW * 2 + 1, 1.4)
  ctx.fillRect(gap - eyeW - 0.5, eyeY - eyeW - 1.2, eyeW * 2 + 1, 1.4)

  ctx.fillStyle = look.eyes
  ctx.beginPath()
  ctx.ellipse(-gap, eyeY, eyeW, eyeW * 0.52, 0, 0, Math.PI * 2)
  ctx.ellipse(gap, eyeY, eyeW, eyeW * 0.52, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1a1008'
  ctx.beginPath()
  ctx.arc(-gap, eyeY, eyeW * 0.42, 0, Math.PI * 2)
  ctx.arc(gap, eyeY, eyeW * 0.42, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = look.brow
  ctx.lineWidth = 1.15
  ctx.beginPath()
  ctx.moveTo(-headR * 0.52, headY - headR * 0.1)
  ctx.lineTo(-headR * 0.06, headY - headR * 0.2)
  ctx.moveTo(headR * 0.52, headY - headR * 0.1)
  ctx.lineTo(headR * 0.06, headY - headR * 0.2)
  ctx.stroke()
}

function drawLeviFace(ctx, look, dir, headY, headR) {
  if (dir === 'left' || dir === 'right') {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.fillStyle = look.skin
    ctx.beginPath()
    ctx.ellipse(5, headY - 1, headR * 0.72, headR * 0.9, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a1008'
    ctx.lineWidth = 1.3
    ctx.stroke()
    drawLeviHair(ctx, look, headY, headR, dir)
    drawLeviEyes(ctx, look, headY, headR, dir)
    ctx.strokeStyle = '#4a3830'
    ctx.lineWidth = 0.9
    ctx.beginPath()
    ctx.moveTo(7, headY + headR * 0.22)
    ctx.lineTo(9, headY + headR * 0.22)
    ctx.stroke()
    ctx.restore()
    return
  }

  if (dir === 'up') {
    drawLeviHair(ctx, look, headY, headR, dir)
    return
  }

  ctx.fillStyle = look.skin
  ctx.beginPath()
  ctx.ellipse(0, headY, headR * 0.92, headR * 0.98, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#1a1008'
  ctx.lineWidth = 1.4
  ctx.stroke()
  drawLeviHair(ctx, look, headY, headR, dir)
  drawLeviEyes(ctx, look, headY, headR, dir)
  ctx.strokeStyle = '#4a3830'
  ctx.lineWidth = 0.9
  ctx.beginPath()
  ctx.moveTo(-headR * 0.12, headY + headR * 0.34)
  ctx.lineTo(headR * 0.12, headY + headR * 0.34)
  ctx.stroke()
}

function drawMikasaScarf(ctx, look, dir, scale) {
  if (!look.scarf) return
  const main = look.scarf
  const dark = look.scarfDark || '#4a080c'
  const light = look.scarfLight || '#9a2428'
  const s = scale

  const clothEnd = (x0, y0, lean, len) => {
    ctx.fillStyle = main
    ctx.beginPath()
    ctx.moveTo(x0 - 2.4 * s, y0)
    ctx.quadraticCurveTo(x0 + lean * 2.2 * s, y0 + len * 0.45, x0 + lean * 3 * s, y0 + len)
    ctx.quadraticCurveTo(x0 + lean * 0.8 * s, y0 + len + 1.2 * s, x0 - lean * 1.4 * s, y0 + len - 0.4 * s)
    ctx.quadraticCurveTo(x0 - lean * 2.4 * s, y0 + len * 0.5, x0 + 2.4 * s, y0)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = dark
    ctx.beginPath()
    ctx.moveTo(x0 - 0.5 * s, y0 + 1.2 * s)
    ctx.quadraticCurveTo(x0 + lean * 1.1 * s, y0 + len * 0.55, x0 + lean * 1.6 * s, y0 + len - 0.8 * s)
    ctx.quadraticCurveTo(x0 + lean * 0.4 * s, y0 + len - 0.4 * s, x0 - lean * 0.5 * s, y0 + len - 1.2 * s)
    ctx.quadraticCurveTo(x0 - lean * 1.1 * s, y0 + len * 0.55, x0 + 0.5 * s, y0 + 1.2 * s)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = light
    ctx.lineWidth = 0.9 * s
    ctx.lineCap = 'round'
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath()
      ctx.moveTo(x0 + lean * 0.6 * s + i * 1.2 * s, y0 + len - 0.6 * s)
      ctx.lineTo(x0 + lean * 1.4 * s + i * 1.4 * s, y0 + len + 1.6 * s)
      ctx.stroke()
    }
  }

  if (dir === 'down') {
    // Loose fabric loops around the neck (scarf, not shirt collar)
    const loops = [
      { y: 0.2, r: 7.8, w: 3.4, col: dark, a0: 0.05, a1: 0.95 },
      { y: -0.6, r: 7.2, w: 2.8, col: main, a0: 1.05, a1: 1.95 },
      { y: 0.8, r: 6.6, w: 2.2, col: light, a0: 0.15, a1: 0.85 },
    ]
    for (const L of loops) {
      ctx.strokeStyle = L.col
      ctx.lineWidth = L.w * s
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.arc(0, L.y * s, L.r * s, Math.PI * L.a0, Math.PI * L.a1)
      ctx.stroke()
    }

    // Thin donut of fabric — robe shows through the center
    ctx.fillStyle = main
    ctx.beginPath()
    ctx.ellipse(0, 1.6 * s, 9.2 * s, 3.6 * s, 0, 0, Math.PI * 2)
    ctx.ellipse(0, 1.4 * s, 5.2 * s, 1.6 * s, 0, 0, Math.PI * 2)
    ctx.fill('evenodd')

    ctx.fillStyle = dark
    ctx.beginPath()
    ctx.ellipse(0, 2.4 * s, 8.4 * s, 2.8 * s, 0, Math.PI * 0.05, Math.PI * 0.95)
    ctx.fill()

    // Knot where ends cross
    ctx.fillStyle = light
    ctx.beginPath()
    ctx.moveTo(-3.5 * s, 3 * s)
    ctx.quadraticCurveTo(0, 5.5 * s, 3.5 * s, 3 * s)
    ctx.quadraticCurveTo(2 * s, 6.5 * s, 0, 7 * s)
    ctx.quadraticCurveTo(-2 * s, 6.5 * s, -3.5 * s, 3 * s)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = main
    ctx.beginPath()
    ctx.ellipse(0, 4.8 * s, 2.6 * s, 1.8 * s, 0, 0, Math.PI * 2)
    ctx.fill()

    clothEnd(-7.5 * s, 4.5 * s, -1.15, 12 * s)
    clothEnd(7.5 * s, 4.5 * s, 1.15, 12.5 * s)
    return
  }

  if (dir === 'up') {
    ctx.strokeStyle = dark
    ctx.lineWidth = 4 * s
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(0, 2.2 * s, 8.5 * s, Math.PI * 0.12, Math.PI * 0.88)
    ctx.stroke()
    ctx.strokeStyle = main
    ctx.lineWidth = 3.2 * s
    ctx.beginPath()
    ctx.arc(0, 1.4 * s, 7.6 * s, Math.PI * 0.18, Math.PI * 0.82)
    ctx.stroke()
    ctx.strokeStyle = light
    ctx.lineWidth = 2 * s
    ctx.beginPath()
    ctx.arc(0, 0.8 * s, 6.8 * s, Math.PI * 0.22, Math.PI * 0.78)
    ctx.stroke()

    clothEnd(-5.5 * s, 6 * s, -0.9, 10 * s)
    clothEnd(5.5 * s, 6 * s, 0.9, 10 * s)
    return
  }

  const flip = dir === 'left' ? -1 : 1
  ctx.save()
  ctx.scale(flip, 1)
  ctx.strokeStyle = dark
  ctx.lineWidth = 3.6 * s
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(3 * s, 2.2 * s, 5.5 * s, Math.PI * 0.1, Math.PI * 1.1)
  ctx.stroke()
  ctx.strokeStyle = main
  ctx.lineWidth = 2.8 * s
  ctx.beginPath()
  ctx.arc(3 * s, 1.4 * s, 4.8 * s, Math.PI * 0.15, Math.PI * 1.05)
  ctx.stroke()
  ctx.strokeStyle = light
  ctx.lineWidth = 1.8 * s
  ctx.beginPath()
  ctx.arc(3 * s, 0.8 * s, 4.2 * s, Math.PI * 0.2, Math.PI * 0.95)
  ctx.stroke()
  clothEnd(7 * s, 4 * s, 1.3, 12 * s)
  ctx.restore()
}

function drawMikasaHair(ctx, look, headY, headR, dir) {
  ctx.fillStyle = look.hair
  if (dir === 'up') {
    ctx.beginPath()
    ctx.arc(0, headY, headR * 0.9, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(-headR * 0.88, headY + headR * 0.15, headR * 1.76, headR * 0.38)
    return
  }

  if (dir === 'left' || dir === 'right') {
    ctx.beginPath()
    ctx.arc(3, headY - headR * 0.22, headR * 0.78, Math.PI * 0.65, Math.PI * 2.35)
    ctx.fill()
    ctx.fillRect(6, headY - headR * 0.02, 5, headR * 0.68)
    ctx.beginPath()
    ctx.moveTo(1, headY - headR * 0.42)
    ctx.lineTo(5, headY + headR * 0.02)
    ctx.lineTo(0, headY - headR * 0.12)
    ctx.closePath()
    ctx.fill()
    return
  }

  ctx.beginPath()
  ctx.arc(0, headY - headR * 0.2, headR * 0.88, Math.PI, Math.PI * 2)
  ctx.fill()

  for (const sx of [-0.4, -0.2, 0, 0.2, 0.4]) {
    ctx.beginPath()
    ctx.moveTo(sx * headR, headY - headR * 0.52)
    ctx.lineTo((sx - 0.07) * headR, headY - headR * 0.06)
    ctx.lineTo((sx + 0.07) * headR, headY - headR * 0.06)
    ctx.closePath()
    ctx.fill()
  }

  ctx.fillRect(-headR * 0.96, headY - headR * 0.02, headR * 0.3, headR * 0.74)
  ctx.fillRect(headR * 0.66, headY - headR * 0.02, headR * 0.3, headR * 0.74)
  ctx.beginPath()
  ctx.ellipse(0, headY + headR * 0.44, headR * 0.84, headR * 0.24, 0, 0, Math.PI)
  ctx.fill()
}

function drawMikasaEyes(ctx, look, headY, headR, dir = 'down') {
  if (dir === 'left' || dir === 'right') {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.fillStyle = look.eyes
    ctx.beginPath()
    ctx.ellipse(8.5, headY, 1.7, 1.15, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#0a0808'
    ctx.beginPath()
    ctx.arc(8.5, headY + 0.2, 0.85, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = look.brow
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(5.5, headY - headR * 0.14)
    ctx.quadraticCurveTo(8, headY - headR * 0.2, 10.5, headY - headR * 0.12)
    ctx.stroke()
    ctx.restore()
    return
  }

  const eyeY = headY + 2
  const gap = headR * 0.28
  const eyeW = 1.75

  ctx.fillStyle = 'rgba(0,0,0,0.14)'
  ctx.fillRect(-gap - eyeW, eyeY - eyeW - 1.2, eyeW * 2, 1.6)
  ctx.fillRect(gap - eyeW, eyeY - eyeW - 1.2, eyeW * 2, 1.6)

  ctx.fillStyle = '#eae8e4'
  ctx.beginPath()
  ctx.ellipse(-gap, eyeY, eyeW + 0.3, eyeW * 0.72, 0, 0, Math.PI * 2)
  ctx.ellipse(gap, eyeY, eyeW + 0.3, eyeW * 0.72, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = look.eyes
  ctx.beginPath()
  ctx.ellipse(-gap, eyeY + 0.35, eyeW * 0.68, eyeW * 0.52, 0, 0, Math.PI * 2)
  ctx.ellipse(gap, eyeY + 0.35, eyeW * 0.68, eyeW * 0.52, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#0a0808'
  ctx.beginPath()
  ctx.arc(-gap, eyeY + 0.4, eyeW * 0.36, 0, Math.PI * 2)
  ctx.arc(gap, eyeY + 0.4, eyeW * 0.36, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = look.brow
  ctx.lineWidth = 1.1
  ctx.beginPath()
  ctx.moveTo(-headR * 0.45, headY - headR * 0.06)
  ctx.quadraticCurveTo(-headR * 0.14, headY - headR * 0.16, headR * 0.04, headY - headR * 0.08)
  ctx.moveTo(headR * 0.45, headY - headR * 0.06)
  ctx.quadraticCurveTo(headR * 0.14, headY - headR * 0.16, -headR * 0.04, headY - headR * 0.08)
  ctx.stroke()
}

function drawMikasaFace(ctx, look, dir, headY, headR) {
  if (dir === 'left' || dir === 'right') {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.fillStyle = look.skin
    ctx.beginPath()
    ctx.ellipse(5, headY - 1, headR * 0.7, headR * 0.9, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a1008'
    ctx.lineWidth = 1.3
    ctx.stroke()
    drawMikasaHair(ctx, look, headY, headR, dir)
    drawMikasaEyes(ctx, look, headY, headR, dir)
    ctx.restore()
    return
  }

  if (dir === 'up') {
    drawMikasaHair(ctx, look, headY, headR, dir)
    return
  }

  ctx.fillStyle = look.skin
  ctx.beginPath()
  ctx.ellipse(0, headY, headR * 0.9, headR * 1.02, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#1a1008'
  ctx.lineWidth = 1.4
  ctx.stroke()
  drawMikasaHair(ctx, look, headY, headR, dir)
  drawMikasaEyes(ctx, look, headY, headR, dir)
}

function drawHair(ctx, look, headY, headR, feature, dir) {
  ctx.fillStyle = look.hair
  if (dir === 'up') {
    ctx.beginPath()
    ctx.arc(0, headY, headR * 0.85, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  if (feature === 'mikasa') {
    drawMikasaHair(ctx, look, headY, headR, dir)
  } else if (feature === 'eren') {
    drawErenTitanHair(ctx, look, headY, headR)
  } else if (feature === 'armin') {
    ctx.beginPath()
    ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(-headR + 1, headY - headR - 1, headR * 2 - 2, 6)
  } else if (feature === 'levi') {
    drawLeviHair(ctx, look, headY, headR, dir)
  } else if (feature === 'hange') {
    ctx.beginPath()
    ctx.arc(0, headY - 1, headR + 2, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(headR + 1, headY + 1, 3.5, 8, 0.35, 0, Math.PI * 2)
    ctx.fill()
  } else if (feature === 'jean') {
    ctx.beginPath()
    ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(-3, headY - headR - 2)
    ctx.lineTo(0, headY - headR - 7)
    ctx.lineTo(4, headY - headR - 2)
    ctx.fill()
  } else if (feature === 'historia') {
    ctx.beginPath()
    ctx.arc(0, headY - 2, headR + 2, Math.PI, Math.PI * 2)
    ctx.fill()
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath()
      ctx.ellipse(i * 4.5, headY - headR - 1, 2.5, 6, i * 0.15, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawCharacterFace(ctx, look, dir, headY, headR) {
  const feature = look.feature || 'eren'

  if (feature === 'eren') return
  if (feature === 'levi') {
    drawLeviFace(ctx, look, dir, headY, headR)
    return
  }
  if (feature === 'mikasa') {
    drawMikasaFace(ctx, look, dir, headY, headR)
    return
  }

  if (dir === 'left' || dir === 'right') {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.fillStyle = look.skin
    if (feature === 'mikasa') {
      ctx.beginPath()
      ctx.ellipse(5, headY - 1, headR * 0.68, headR * 0.88, 0, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.ellipse(5, headY - 2, headR * 0.75, headR * 0.95, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.strokeStyle = '#1a1008'
    ctx.lineWidth = 1.4
    ctx.stroke()
    drawHair(ctx, look, headY, headR, feature, dir)
    if (feature === 'hange') {
      ctx.strokeStyle = '#1a1008'
      ctx.strokeRect(2, headY - 4, 8, 5)
    }
    ctx.fillStyle = '#1a1008'
    ctx.beginPath()
    ctx.arc(9, headY - 2, 1.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    return
  }

  if (dir === 'up') {
    drawHair(ctx, look, headY, headR, feature, dir)
    return
  }

  ctx.fillStyle = look.skin
  ctx.strokeStyle = '#1a1008'
  ctx.lineWidth = 1.4
  if (feature === 'mikasa') {
    ctx.beginPath()
    ctx.ellipse(0, headY, headR * 0.9, headR * 1.0, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.arc(0, headY, headR, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  drawHair(ctx, look, headY, headR, feature, dir)

  if (feature === 'historia' && look.tiara) {
    ctx.fillStyle = look.tiara
    ctx.beginPath()
    ctx.moveTo(-5, headY - headR - 1)
    ctx.lineTo(0, headY - headR - 7)
    ctx.lineTo(5, headY - headR - 1)
    ctx.closePath()
    ctx.fill()
  }

  ctx.strokeStyle = look.brow
  ctx.lineWidth = feature === 'mikasa' ? 1.1 : 1.5
  if (feature === 'mikasa') {
    ctx.beginPath()
    ctx.moveTo(-headR * 0.48, headY - headR * 0.08)
    ctx.quadraticCurveTo(-headR * 0.15, headY - headR * 0.18, headR * 0.02, headY - headR * 0.1)
    ctx.moveTo(headR * 0.48, headY - headR * 0.08)
    ctx.quadraticCurveTo(headR * 0.15, headY - headR * 0.18, -headR * 0.02, headY - headR * 0.1)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(-headR * 0.55, headY - headR * 0.15)
    ctx.lineTo(-headR * 0.12, headY - headR * 0.22)
    ctx.moveTo(headR * 0.55, headY - headR * 0.15)
    ctx.lineTo(headR * 0.12, headY - headR * 0.22)
    ctx.stroke()
  }

  if (feature === 'mikasa') {
    drawMikasaEyes(ctx, look, headY, headR)
  } else {
    drawEyes(ctx, look, headY, headR, dir, feature === 'armin' || feature === 'hange')
  }

  if (feature === 'hange') {
    ctx.strokeStyle = '#1a1008'
    ctx.lineWidth = 1.4
    ctx.strokeRect(-headR * 0.72, headY - headR * 0.08, headR * 0.55, headR * 0.32)
    ctx.strokeRect(headR * 0.17, headY - headR * 0.08, headR * 0.55, headR * 0.32)
    ctx.beginPath()
    ctx.moveTo(-headR * 0.17, headY)
    ctx.lineTo(headR * 0.17, headY)
    ctx.stroke()
  }

  if (feature === 'jean') {
    ctx.strokeStyle = '#5a4030'
    ctx.beginPath()
    ctx.moveTo(-headR * 0.18, headY + headR * 0.38)
    ctx.quadraticCurveTo(0, headY + headR * 0.45, headR * 0.2, headY + headR * 0.35)
    ctx.stroke()
  } else if (feature === 'mikasa') {
    ctx.fillStyle = '#c08090'
    ctx.beginPath()
    ctx.arc(0, headY + headR * 0.28, headR * 0.07, 0, Math.PI * 2)
    ctx.fill()
  } else if (feature === 'hange') {
    ctx.strokeStyle = '#6a4030'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.arc(0, headY + headR * 0.38, headR * 0.18, 0.2, Math.PI - 0.2)
    ctx.stroke()
  } else if (feature === 'levi') {
    ctx.strokeStyle = '#4a3830'
    ctx.beginPath()
    ctx.moveTo(-headR * 0.15, headY + headR * 0.36)
    ctx.lineTo(headR * 0.15, headY + headR * 0.36)
    ctx.stroke()
  } else {
    ctx.fillStyle = look.skin
    ctx.beginPath()
    ctx.ellipse(0, headY + headR * 0.32, headR * 0.1, headR * 0.06, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawLegs(ctx, look, dir, walk, scale) {
  const leg = Math.sin(walk * 14) * 4
  ctx.strokeStyle = look.robe
  ctx.lineWidth = 4
  ctx.lineCap = 'round'

  if (dir === 'down') {
    ctx.beginPath()
    ctx.moveTo(-5, 13 * scale)
    ctx.lineTo(-5 - leg * 0.2, 19 * scale)
    ctx.moveTo(5, 13 * scale)
    ctx.lineTo(5 + leg * 0.2, 19 * scale)
    ctx.stroke()
  } else if (dir === 'up') {
    ctx.beginPath()
    ctx.moveTo(-4, 11 * scale)
    ctx.lineTo(-4 + leg * 0.15, 16 * scale)
    ctx.moveTo(4, 11 * scale)
    ctx.lineTo(4 - leg * 0.15, 16 * scale)
    ctx.stroke()
  } else {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.beginPath()
    ctx.moveTo(2, 13 * scale)
    ctx.lineTo(7 + leg * 0.25, 19 * scale)
    ctx.stroke()
    ctx.restore()
  }

  ctx.fillStyle = '#3a2414'
  if (dir === 'down' || dir === 'up') {
    ctx.beginPath()
    ctx.ellipse(-5, 20 * scale, 4, 2.5, 0, 0, Math.PI * 2)
    ctx.ellipse(5, 20 * scale, 4, 2.5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawPrayerBeads(ctx, look, dir) {
  if (dir === 'up') return
  ctx.fillStyle = look.sash
  const flip = dir === 'left' ? -1 : dir === 'right' ? 1 : 0
  if (flip) {
    ctx.save()
    ctx.scale(flip, 1)
    for (let i = 0; i < 4; i++) {
      ctx.beginPath()
      ctx.arc(5, 4 + i * 2.5, 1.6, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  } else {
    ctx.beginPath()
    ctx.arc(-7, 8, 1.6, 0, Math.PI * 2)
    ctx.arc(7, 8, 1.6, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function drawMonkTopDown(ctx, x, y, look, dir = 'down', walk = 0, scaleX = 1, scaleY = 1) {
  const bob = Math.sin(walk * 12) * 1
  const scale = bodyScale(look)
  const headR = headRadius(look)
  const headY = dir === 'up' ? 0 : -10
  const facing = DIRECTIONS.includes(dir) ? dir : 'down'
  const isEren = look.feature === 'eren'
  const isLevi = look.feature === 'levi'
  const isMikasa = look.feature === 'mikasa'

  ctx.save()
  ctx.translate(x, y + bob)
  ctx.scale(scaleX, scaleY)

  if (isEren) {
    drawErenFloatingHead(ctx, look, facing, walk, scale)
    ctx.restore()
    return
  }

  ctx.fillStyle = 'rgba(0,0,0,0.32)'
  ctx.beginPath()
  ctx.ellipse(2, 14 * scale, 11 * scale, 5.5, 0, 0, Math.PI * 2)
  ctx.fill()

  if (facing === 'up') {
    drawLegs(ctx, look, facing, walk, scale)
    drawMonkRobe(ctx, look, facing, walk, scale)
    if (isLevi) drawLeviBlades(ctx, facing, walk, scale)
    drawCharacterFace(ctx, look, facing, headY, headR)
    if (isMikasa) drawMikasaScarf(ctx, look, facing, scale)
  } else {
    drawMonkRobe(ctx, look, facing, walk, scale)
    if (isLevi) {
      drawLeviBlades(ctx, facing, walk, scale)
      drawLeviCravat(ctx, look, facing, scale)
    } else if (!isMikasa) {
      drawPrayerBeads(ctx, look, facing)
    }
    drawLegs(ctx, look, facing, walk, scale)
    drawCharacterFace(ctx, look, facing, headY, headR)
    if (isMikasa) drawMikasaScarf(ctx, look, facing, scale)
  }

  ctx.restore()
}

export function drawAvatarPreview(ctx, cx, cy, avatarId, paletteIdx = 0) {
  const avatar = MONK_AVATARS.find((a) => a.id === avatarId) || MONK_AVATARS[0]
  const look = { ...avatar, ...ROBE_PALETTE[paletteIdx % ROBE_PALETTE.length], avatarId: avatar.id }
  drawMonkTopDown(ctx, cx, cy, look, 'down', 0)
}
