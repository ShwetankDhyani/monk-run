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

/** spirit form hair — middle part, long framing strands, glossy sheen. */
function drawRiftSpiritHair(ctx, look, headY, headR) {
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

function drawRiftSpiritEars(ctx, look, headY, headR) {
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

function drawRiftSpiritHeadShape(ctx, look, headY, headR) {
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

function drawRiftSpiritFace(ctx, look, headY, headR, dir = 'down') {
  if (dir === 'down') {
    drawRiftSpiritEars(ctx, look, headY, headR)

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

/** spirit form floating head + head-shaped shadow — no body. */
function drawRiftSpiritHead(ctx, look, dir, walk, scale) {
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
    drawRiftSpiritHair(ctx, look, headY, headR)
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
    drawRiftSpiritHair(ctx, look, headY, headR)
    drawRiftSpiritFace(ctx, look, headY, headR, dir)
    ctx.restore()
    return
  }

  drawRiftSpiritHeadShape(ctx, look, headY, headR)
  drawRiftSpiritHair(ctx, look, headY, headR)
  drawRiftSpiritFace(ctx, look, headY, headR, 'down')
}

/** Ultra-hard steel blade — thin flat sword with trigger grip (not a bandaged stub). */
/** Ultra-hard steel blade — thin flat sword with trigger grip (not a bandaged stub). */
function drawBladeStaffUnit(ctx, angle, mirrored = false) {
  ctx.save()
  ctx.rotate(angle)
  if (mirrored) ctx.scale(-1, 1)

  // Trigger-style handle (staff grip)
  ctx.fillStyle = '#1a1410'
  ctx.fillRect(-1.4, -1.5, 2.8, 5)
  ctx.fillStyle = '#3a3028'
  ctx.beginPath()
  ctx.moveTo(-2.4, 2.2)
  ctx.lineTo(-0.2, 2.2)
  ctx.lineTo(-0.6, 5.8)
  ctx.lineTo(-2.8, 5.2)
  ctx.closePath()
  ctx.fill()
  // Guard / collar
  ctx.fillStyle = '#c9a227'
  ctx.fillRect(-2.2, 3.4, 4.4, 1.2)

  // Long flat steel blade — continuous plate, not segmented wraps
  const bladeLen = 18
  const bladeW = 2.1
  const tipY = 5 + bladeLen

  const steel = ctx.createLinearGradient(-bladeW, 5, bladeW, 5)
  steel.addColorStop(0, '#8a96a4')
  steel.addColorStop(0.35, '#e8eef4')
  steel.addColorStop(0.55, '#c8d0d8')
  steel.addColorStop(1, '#6a7888')
  ctx.fillStyle = steel
  ctx.beginPath()
  ctx.moveTo(-bladeW, 4.8)
  ctx.lineTo(bladeW, 4.8)
  ctx.lineTo(bladeW * 0.85, tipY - 3)
  ctx.lineTo(0, tipY)
  ctx.lineTo(-bladeW * 0.85, tipY - 3)
  ctx.closePath()
  ctx.fill()

  // Edge outline
  ctx.strokeStyle = '#4a5868'
  ctx.lineWidth = 0.6
  ctx.stroke()

  // Center ridge (reads as a sword, not bandage rings)
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 0.7
  ctx.beginPath()
  ctx.moveTo(0, 5.2)
  ctx.lineTo(0, tipY - 2.5)
  ctx.stroke()

  // Thin fuller line
  ctx.strokeStyle = 'rgba(40,50,60,0.35)'
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.moveTo(-0.7, 6)
  ctx.lineTo(-0.5, tipY - 4)
  ctx.stroke()

  ctx.restore()
}

function drawBladeStaffs(ctx, dir, walk, scale) {
  const sway = Math.sin(walk * 12) * 0.6

  if (dir === 'down') {
    // Dual blades angled out from the hips — clear sword silhouette
    for (const [hx, hy, ang, mir] of [
      [-10 * scale, 2 + sway, 0.42, false],
      [10 * scale, 2 + sway, -0.42, true],
    ]) {
      ctx.save()
      ctx.translate(hx, hy)
      drawBladeStaffUnit(ctx, ang, mir)
      ctx.restore()
    }
    return
  }

  if (dir === 'up') {
    for (const [hx, hy, ang] of [
      [-8 * scale, 3, -0.2],
      [8 * scale, 3, 0.2],
    ]) {
      ctx.save()
      ctx.translate(hx, hy)
      drawBladeStaffUnit(ctx, ang, false)
      ctx.restore()
    }
    return
  }

  const flip = dir === 'left' ? -1 : 1
  ctx.save()
  ctx.scale(flip, 1)
  // Lead blade forward, second slightly back
  ctx.translate(9 * scale, 1 + sway)
  drawBladeStaffUnit(ctx, 0.25, false)
  ctx.translate(-5, 2)
  drawBladeStaffUnit(ctx, -0.1, true)
  ctx.restore()
}

function drawBladeCollar(ctx, look, dir, scale) {
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

function drawBladeHair(ctx, look, headY, headR, dir) {
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

function drawBladeEyes(ctx, look, headY, headR, dir = 'down') {
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

function drawBladeFace(ctx, look, dir, headY, headR) {
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
    drawBladeHair(ctx, look, headY, headR, dir)
    drawBladeEyes(ctx, look, headY, headR, dir)
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
    drawBladeHair(ctx, look, headY, headR, dir)
    return
  }

  ctx.fillStyle = look.skin
  ctx.beginPath()
  ctx.ellipse(0, headY, headR * 0.92, headR * 0.98, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#1a1008'
  ctx.lineWidth = 1.4
  ctx.stroke()
  drawBladeHair(ctx, look, headY, headR, dir)
  drawBladeEyes(ctx, look, headY, headR, dir)
  ctx.strokeStyle = '#4a3830'
  ctx.lineWidth = 0.9
  ctx.beginPath()
  ctx.moveTo(-headR * 0.12, headY + headR * 0.34)
  ctx.lineTo(headR * 0.12, headY + headR * 0.34)
  ctx.stroke()
}

function drawVeilScarf(ctx, look, dir, scale) {
  if (!look.scarf) return
  const main = look.scarf
  const dark = look.scarfDark || '#4a080c'
  const light = look.scarfLight || '#9a2428'
  const s = scale

  const end = (x0, y0, lean, len) => {
    ctx.fillStyle = main
    ctx.beginPath()
    ctx.moveTo(x0 - 2 * s, y0)
    ctx.quadraticCurveTo(x0 + lean * 2.5 * s, y0 + len * 0.5, x0 + lean * 2.8 * s, y0 + len)
    ctx.quadraticCurveTo(x0 + lean * 0.6 * s, y0 + len + 1.4 * s, x0 - lean * 1.2 * s, y0 + len - 0.5 * s)
    ctx.quadraticCurveTo(x0 - lean * 2.2 * s, y0 + len * 0.5, x0 + 2 * s, y0)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = dark
    ctx.beginPath()
    ctx.moveTo(x0, y0 + 1.5 * s)
    ctx.quadraticCurveTo(x0 + lean * 1.2 * s, y0 + len * 0.55, x0 + lean * 1.4 * s, y0 + len - 1 * s)
    ctx.quadraticCurveTo(x0 + lean * 0.3 * s, y0 + len - 0.6 * s, x0 - lean * 0.4 * s, y0 + len - 1.4 * s)
    ctx.quadraticCurveTo(x0 - lean * 1 * s, y0 + len * 0.55, x0 + 0.4 * s, y0 + 1.5 * s)
    ctx.closePath()
    ctx.fill()
  }

  if (dir === 'down') {
    // Sit under the chin — wrap ring low on the neck
    ctx.fillStyle = dark
    ctx.beginPath()
    ctx.ellipse(0, 6.5 * s, 10 * s, 3.2 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = main
    ctx.beginPath()
    ctx.ellipse(0, 5.8 * s, 9 * s, 2.6 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    // Fold highlight
    ctx.strokeStyle = light
    ctx.lineWidth = 1.8 * s
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(0, 5.2 * s, 7.2 * s, Math.PI * 0.15, Math.PI * 0.85)
    ctx.stroke()
    // Second wrap band
    ctx.strokeStyle = dark
    ctx.lineWidth = 2.4 * s
    ctx.beginPath()
    ctx.arc(0, 7 * s, 7.8 * s, Math.PI * 0.12, Math.PI * 0.88)
    ctx.stroke()
    // Knot + hanging ends
    ctx.fillStyle = light
    ctx.beginPath()
    ctx.ellipse(0, 8.2 * s, 3 * s, 2 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = main
    ctx.beginPath()
    ctx.ellipse(0, 8.4 * s, 2.2 * s, 1.4 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    end(-6.5 * s, 8 * s, -1.1, 11 * s)
    end(6.5 * s, 8 * s, 1.1, 11.5 * s)
    return
  }

  if (dir === 'up') {
    ctx.fillStyle = dark
    ctx.beginPath()
    ctx.ellipse(0, 6 * s, 10.5 * s, 4 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = main
    ctx.beginPath()
    ctx.ellipse(0, 5.2 * s, 9 * s, 3 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    end(-5 * s, 7.5 * s, -0.9, 9 * s)
    end(5 * s, 7.5 * s, 0.9, 9 * s)
    return
  }

  const flip = dir === 'left' ? -1 : 1
  ctx.save()
  ctx.scale(flip, 1)
  ctx.fillStyle = dark
  ctx.beginPath()
  ctx.ellipse(3.5 * s, 6 * s, 6 * s, 3.5 * s, 0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = main
  ctx.beginPath()
  ctx.ellipse(3 * s, 5.2 * s, 5 * s, 2.6 * s, 0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = light
  ctx.lineWidth = 1.6 * s
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(3 * s, 4.8 * s, 4 * s, Math.PI * 0.2, Math.PI * 0.95)
  ctx.stroke()
  end(6.5 * s, 7 * s, 1.25, 11 * s)
  ctx.restore()
}

function drawVeilHair(ctx, look, headY, headR, dir) {
  ctx.fillStyle = look.hair
  if (dir === 'up') {
    ctx.beginPath()
    ctx.arc(0, headY - 1, headR * 0.92, 0, Math.PI * 2)
    ctx.fill()
    // Chin-length bob from behind — no chord across face
    ctx.beginPath()
    ctx.moveTo(-headR * 0.9, headY)
    ctx.quadraticCurveTo(-headR * 0.95, headY + headR * 0.55, -headR * 0.55, headY + headR * 0.7)
    ctx.lineTo(headR * 0.55, headY + headR * 0.7)
    ctx.quadraticCurveTo(headR * 0.95, headY + headR * 0.55, headR * 0.9, headY)
    ctx.closePath()
    ctx.fill()
    return
  }

  if (dir === 'left' || dir === 'right') {
    ctx.beginPath()
    ctx.arc(2, headY - headR * 0.25, headR * 0.8, Math.PI * 0.7, Math.PI * 2.3)
    ctx.fill()
    // Side bob hanging past jaw
    ctx.beginPath()
    ctx.moveTo(0, headY - headR * 0.15)
    ctx.quadraticCurveTo(8, headY + headR * 0.15, 7, headY + headR * 0.65)
    ctx.quadraticCurveTo(4, headY + headR * 0.7, 1, headY + headR * 0.35)
    ctx.closePath()
    ctx.fill()
    // Soft bang
    ctx.beginPath()
    ctx.moveTo(-1, headY - headR * 0.55)
    ctx.quadraticCurveTo(4, headY - headR * 0.2, 2, headY - headR * 0.05)
    ctx.quadraticCurveTo(0, headY - headR * 0.25, -2, headY - headR * 0.45)
    ctx.closePath()
    ctx.fill()
    return
  }

  // Crown / top of bob
  ctx.beginPath()
  ctx.arc(0, headY - headR * 0.22, headR * 0.9, Math.PI * 1.02, Math.PI * 1.98)
  ctx.fill()

  // Soft bangs — separate rounded clumps, no flat bar across the face
  const bangs = [-0.42, -0.2, 0, 0.2, 0.42]
  for (const sx of bangs) {
    ctx.beginPath()
    ctx.moveTo(sx * headR, headY - headR * 0.55)
    ctx.quadraticCurveTo(
      sx * headR - 0.12 * headR,
      headY - headR * 0.1,
      sx * headR,
      headY - headR * 0.02,
    )
    ctx.quadraticCurveTo(
      sx * headR + 0.12 * headR,
      headY - headR * 0.1,
      sx * headR,
      headY - headR * 0.55,
    )
    ctx.closePath()
    ctx.fill()
  }

  // Side locks framing the face (chin-length) — stay off the face center
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(side * headR * 0.78, headY - headR * 0.25)
    ctx.quadraticCurveTo(side * headR * 1.05, headY + headR * 0.15, side * headR * 0.85, headY + headR * 0.72)
    ctx.quadraticCurveTo(side * headR * 0.55, headY + headR * 0.55, side * headR * 0.62, headY + headR * 0.1)
    ctx.closePath()
    ctx.fill()
  }
}

function drawVeilEyes(ctx, look, headY, headR, dir = 'down') {
  if (dir === 'left' || dir === 'right') {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.fillStyle = look.eyes
    ctx.beginPath()
    ctx.ellipse(8.2, headY + 0.5, 1.6, 1.1, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#0a0808'
    ctx.beginPath()
    ctx.arc(8.2, headY + 0.6, 0.75, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = look.brow
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(5.5, headY - headR * 0.1)
    ctx.quadraticCurveTo(8, headY - headR * 0.16, 10.2, headY - headR * 0.08)
    ctx.stroke()
    ctx.restore()
    return
  }

  const eyeY = headY + 1.5
  const gap = headR * 0.28
  const eyeW = 1.7

  // Soft lids — no heavy black bar
  ctx.fillStyle = look.eyes
  ctx.beginPath()
  ctx.ellipse(-gap, eyeY, eyeW, eyeW * 0.7, 0, 0, Math.PI * 2)
  ctx.ellipse(gap, eyeY, eyeW, eyeW * 0.7, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#0a0808'
  ctx.beginPath()
  ctx.arc(-gap, eyeY + 0.15, eyeW * 0.4, 0, Math.PI * 2)
  ctx.arc(gap, eyeY + 0.15, eyeW * 0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.beginPath()
  ctx.arc(-gap - 0.4, eyeY - 0.35, 0.45, 0, Math.PI * 2)
  ctx.arc(gap - 0.4, eyeY - 0.35, 0.45, 0, Math.PI * 2)
  ctx.fill()

  // Thin separate brows
  ctx.strokeStyle = look.brow
  ctx.lineWidth = 1
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-gap - eyeW, eyeY - eyeW - 1.2)
  ctx.quadraticCurveTo(-gap, eyeY - eyeW - 2.2, -gap + eyeW * 0.6, eyeY - eyeW - 1)
  ctx.moveTo(gap + eyeW, eyeY - eyeW - 1.2)
  ctx.quadraticCurveTo(gap, eyeY - eyeW - 2.2, gap - eyeW * 0.6, eyeY - eyeW - 1)
  ctx.stroke()
}

function drawVeilFace(ctx, look, dir, headY, headR) {
  if (dir === 'left' || dir === 'right') {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.fillStyle = look.skin
    ctx.beginPath()
    ctx.ellipse(5, headY - 1, headR * 0.68, headR * 0.88, 0, 0, Math.PI * 2)
    ctx.fill()
    drawVeilHair(ctx, look, headY, headR, dir)
    drawVeilEyes(ctx, look, headY, headR, dir)
    ctx.restore()
    return
  }

  if (dir === 'up') {
    drawVeilHair(ctx, look, headY, headR, dir)
    return
  }

  // Clean face — no outline stroke (avoids dark edge artifacts at small size)
  ctx.fillStyle = look.skin
  ctx.beginPath()
  ctx.ellipse(0, headY, headR * 0.88, headR * 0.98, 0, 0, Math.PI * 2)
  ctx.fill()
  drawVeilHair(ctx, look, headY, headR, dir)
  drawVeilEyes(ctx, look, headY, headR, dir)
  // No mouth line — calm closed expression
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
    drawVeilHair(ctx, look, headY, headR, dir)
  } else if (feature === 'eren') {
    drawRiftSpiritHair(ctx, look, headY, headR)
  } else if (feature === 'armin') {
    ctx.beginPath()
    ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(-headR + 1, headY - headR - 1, headR * 2 - 2, 6)
  } else if (feature === 'levi') {
    drawBladeHair(ctx, look, headY, headR, dir)
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
    drawBladeFace(ctx, look, dir, headY, headR)
    return
  }
  if (feature === 'mikasa') {
    drawVeilFace(ctx, look, dir, headY, headR)
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
    drawVeilEyes(ctx, look, headY, headR)
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
  const isRift = look.feature === 'eren'
  const isBlade = look.feature === 'levi'
  const isVeil = look.feature === 'mikasa'

  ctx.save()
  ctx.translate(x, y + bob)
  ctx.scale(scaleX, scaleY)

  if (isRift) {
    drawRiftSpiritHead(ctx, look, facing, walk, scale)
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
    if (isBlade) drawBladeStaffs(ctx, facing, walk, scale)
    drawCharacterFace(ctx, look, facing, headY, headR)
    if (isVeil) drawVeilScarf(ctx, look, facing, scale)
  } else {
    drawMonkRobe(ctx, look, facing, walk, scale)
    if (isBlade) {
      drawBladeStaffs(ctx, facing, walk, scale)
      drawBladeCollar(ctx, look, facing, scale)
    } else if (!isVeil) {
      drawPrayerBeads(ctx, look, facing)
    }
    drawLegs(ctx, look, facing, walk, scale)
    drawCharacterFace(ctx, look, facing, headY, headR)
    if (isVeil) drawVeilScarf(ctx, look, facing, scale)
  }

  ctx.restore()
}

export function drawAvatarPreview(ctx, cx, cy, avatarId, paletteIdx = 0) {
  const avatar = MONK_AVATARS.find((a) => a.id === avatarId) || MONK_AVATARS[0]
  const look = { ...avatar, ...ROBE_PALETTE[paletteIdx % ROBE_PALETTE.length], avatarId: avatar.id }
  drawMonkTopDown(ctx, cx, cy, look, 'down', 0)
}
