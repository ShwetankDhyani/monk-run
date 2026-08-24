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

/** Messy hair standing up from the crown — no face-covering forelocks. */
function drawErenMessyTopHair(ctx, look, headY, headR) {
  ctx.fillStyle = look.hair
  ctx.beginPath()
  ctx.arc(0, headY - 1, headR * 0.82, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(0, headY - 3, headR * 0.75, Math.PI, Math.PI * 2)
  ctx.fill()

  const spikes = [
    [-8, -11], [-4, -14], [0, -16], [4, -14], [8, -11],
    [-10, -8], [10, -8], [-6, -13], [6, -13],
  ]
  for (const [sx, sy] of spikes) {
    ctx.beginPath()
    ctx.moveTo(sx * 0.38, headY - headR + 4)
    ctx.lineTo(sx * 0.48, headY - headR + sy * 0.55)
    ctx.lineTo(sx * 0.38 + 2, headY - headR + 5)
    ctx.closePath()
    ctx.fill()
  }
}

function drawErenFaceFeatures(ctx, look, headY, headR) {
  ctx.strokeStyle = look.brow
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-headR * 0.55, headY - headR * 0.12)
  ctx.lineTo(-headR * 0.12, headY - headR * 0.2)
  ctx.moveTo(headR * 0.55, headY - headR * 0.12)
  ctx.lineTo(headR * 0.12, headY - headR * 0.2)
  ctx.stroke()

  drawEyes(ctx, look, headY, headR, 'down', false)

  ctx.strokeStyle = 'rgba(100,70,50,0.7)'
  ctx.lineWidth = 1.1
  ctx.beginPath()
  ctx.moveTo(-headR * 0.5, headY - headR * 0.02)
  ctx.lineTo(-headR * 0.34, headY + headR * 0.12)
  ctx.stroke()

  ctx.fillStyle = look.skin
  ctx.beginPath()
  ctx.ellipse(0, headY + headR * 0.32, headR * 0.1, headR * 0.06, 0, 0, Math.PI * 2)
  ctx.fill()
}

/** Eren gag: headless body + head cradled in hands out front. */
function drawErenHeadInHands(ctx, look, scale, walk) {
  const sway = Math.sin(walk * 12) * 0.4
  const heldR = 12 * scale
  const heldY = 7 + sway
  const heldX = 0

  // Neck stump
  ctx.fillStyle = look.skin
  ctx.beginPath()
  ctx.ellipse(0, -3 + sway * 0.2, 5.5 * scale, 4 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#1a1008'
  ctx.lineWidth = 1.2
  ctx.stroke()
  ctx.fillStyle = '#7a2828'
  ctx.beginPath()
  ctx.ellipse(0, -3 + sway * 0.2, 4 * scale, 2.8 * scale, 0, 0, Math.PI * 2)
  ctx.fill()

  // Arms cradling the head
  ctx.strokeStyle = look.robe
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-9 * scale, 1)
  ctx.quadraticCurveTo(-heldR - 2, heldY - 2, heldX - heldR + 1, heldY)
  ctx.moveTo(9 * scale, 1)
  ctx.quadraticCurveTo(heldR + 2, heldY - 2, heldX + heldR - 1, heldY)
  ctx.stroke()
  ctx.fillStyle = look.skin
  ctx.beginPath()
  ctx.ellipse(-heldR + 1, heldY + 1, 3.5 * scale, 2.5 * scale, 0, 0, Math.PI * 2)
  ctx.ellipse(heldR - 1, heldY + 1, 3.5 * scale, 2.5 * scale, 0, 0, Math.PI * 2)
  ctx.fill()

  // Held head (face visible, messy top only)
  ctx.fillStyle = look.skin
  ctx.strokeStyle = '#1a1008'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.arc(heldX, heldY, heldR, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  drawErenMessyTopHair(ctx, look, heldY, heldR)
  drawErenFaceFeatures(ctx, look, heldY, heldR)
}

function drawMikasaScarfAtNeck(ctx, look, scale) {
  if (!look.scarf) return
  const y = 1 * scale
  ctx.fillStyle = look.scarf
  ctx.fillRect(-10 * scale, y, 20 * scale, 4 * scale)
  ctx.fillRect(-12 * scale, y + 3, 4 * scale, 8 * scale)
  ctx.fillRect(8 * scale, y + 3, 4 * scale, 7 * scale)
}

function drawMikasaEyes(ctx, look, headY, headR) {
  const eyeY = headY + 1
  const gap = headR * 0.3
  const eyeW = 2.0
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.ellipse(-gap, eyeY, eyeW + 0.5, eyeW + 1, 0, 0, Math.PI * 2)
  ctx.ellipse(gap, eyeY, eyeW + 0.5, eyeW + 1, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = look.eyes
  ctx.beginPath()
  ctx.arc(-gap, eyeY, eyeW * 0.6, 0, Math.PI * 2)
  ctx.arc(gap, eyeY, eyeW * 0.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1a1008'
  ctx.beginPath()
  ctx.arc(-gap, eyeY, eyeW * 0.32, 0, Math.PI * 2)
  ctx.arc(gap, eyeY, eyeW * 0.32, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#1a1008'
  ctx.lineWidth = 0.8
  for (const sx of [-gap, gap]) {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath()
      ctx.moveTo(sx + i * 1.2 - 0.6, eyeY - eyeW - 0.5)
      ctx.lineTo(sx + i * 1.2, eyeY - eyeW - 1.2)
      ctx.stroke()
    }
  }
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
    ctx.beginPath()
    ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(-headR * 0.88, headY - headR * 0.05, headR * 1.76, headR * 0.38)
    ctx.fillRect(-headR - 1, headY - headR * 0.05, 4, headR * 0.75)
    ctx.fillRect(headR - 3, headY - headR * 0.05, 4, headR * 0.75)
  } else if (feature === 'eren') {
    drawErenMessyTopHair(ctx, look, headY, headR)
  } else if (feature === 'armin') {
    ctx.beginPath()
    ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(-headR + 1, headY - headR - 1, headR * 2 - 2, 6)
  } else if (feature === 'levi') {
    ctx.fillRect(-headR * 0.55, headY - headR - 4, headR * 1.1, 4)
    ctx.beginPath()
    ctx.moveTo(-headR * 0.45, headY - headR * 0.15)
    ctx.lineTo(-headR * 0.15, headY + 1)
    ctx.lineTo(-headR * 0.05, headY - headR * 0.1)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(headR * 0.45, headY - headR * 0.15)
    ctx.lineTo(headR * 0.15, headY + 1)
    ctx.lineTo(headR * 0.05, headY - headR * 0.1)
    ctx.fill()
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

  ctx.save()
  ctx.translate(x, y + bob)
  ctx.scale(scaleX, scaleY)

  ctx.fillStyle = 'rgba(0,0,0,0.32)'
  ctx.beginPath()
  ctx.ellipse(2, 14 * scale, 11 * scale, 5.5, 0, 0, Math.PI * 2)
  ctx.fill()

  if (facing === 'up') {
    drawLegs(ctx, look, facing, walk, scale)
    drawMonkRobe(ctx, look, facing, walk, scale)
    if (isEren) drawErenHeadInHands(ctx, look, scale, walk)
    else drawCharacterFace(ctx, look, facing, headY, headR)
    if (look.feature === 'mikasa') drawMikasaScarfAtNeck(ctx, look, scale)
  } else if (isEren && (facing === 'down' || facing === 'left' || facing === 'right')) {
    drawMonkRobe(ctx, look, facing, walk, scale)
    drawPrayerBeads(ctx, look, facing)
    drawLegs(ctx, look, facing, walk, scale)
    drawErenHeadInHands(ctx, look, scale, walk)
  } else {
    drawMonkRobe(ctx, look, facing, walk, scale)
    drawPrayerBeads(ctx, look, facing)
    drawLegs(ctx, look, facing, walk, scale)
    drawCharacterFace(ctx, look, facing, headY, headR)
    if (look.feature === 'mikasa') {
      drawMikasaScarfAtNeck(ctx, look, scale)
    }
  }

  ctx.restore()
}

export function drawAvatarPreview(ctx, cx, cy, avatarId, paletteIdx = 0) {
  const avatar = MONK_AVATARS.find((a) => a.id === avatarId) || MONK_AVATARS[0]
  const look = { ...avatar, ...ROBE_PALETTE[paletteIdx % ROBE_PALETTE.length], avatarId: avatar.id }
  drawMonkTopDown(ctx, cx, cy, look, 'down', 0)
}
