/** Top-down AOT monk scouts — big heads, small robed bodies, 4-way facing. */
import { ROBE_PALETTE, MONK_AVATARS } from '../data/avatars.js'

export const DIRECTIONS = ['down', 'up', 'left', 'right']

export function dirFromDelta(dx, dy, prev = 'down') {
  if (!dx && !dy) return prev
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left'
  return dy > 0 ? 'down' : 'up'
}

function bodyScale(feature) {
  if (feature === 'levi') return 0.82
  if (feature === 'armin') return 0.9
  return 1
}

function headRadius(feature) {
  if (feature === 'levi') return 14
  if (feature === 'armin') return 15
  return 16
}

function drawRobeBody(ctx, look, dir, walk, scale) {
  const bodyW = 18 * scale
  const bodyH = 20 * scale
  const sway = Math.sin(walk * 12) * 0.6

  ctx.fillStyle = look.robe || look.hood
  ctx.strokeStyle = '#1a1008'
  ctx.lineWidth = 1.5

  if (dir === 'down' || dir === 'up') {
    ctx.beginPath()
    ctx.ellipse(0, 8 + sway * 0.2, bodyW * 0.5, bodyH * 0.45, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = look.hood || look.robe
    ctx.beginPath()
    ctx.moveTo(-bodyW * 0.35, 0)
    ctx.quadraticCurveTo(0, -6, bodyW * 0.35, 0)
    ctx.lineTo(bodyW * 0.28, 6)
    ctx.lineTo(-bodyW * 0.28, 6)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  } else {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.beginPath()
    ctx.moveTo(-2, 0)
    ctx.quadraticCurveTo(10, 4, 9, 16)
    ctx.lineTo(-4, 17)
    ctx.quadraticCurveTo(-8, 8, -2, 0)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  ctx.fillStyle = look.sash
  if (dir === 'down' || dir === 'up') {
    ctx.fillRect(-bodyW * 0.42, 4, bodyW * 0.84, 4)
  } else {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.fillRect(-1, 4, 11, 3)
    ctx.restore()
  }
}

function drawEyes(ctx, look, headY, headR, dir, wide = false) {
  if (dir !== 'down') return
  const eyeY = headY + 1
  const eyeW = wide ? 2.2 : 1.8
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.ellipse(-headR * 0.32, eyeY, eyeW + 0.5, eyeW + 1, 0, 0, Math.PI * 2)
  ctx.ellipse(headR * 0.32, eyeY, eyeW + 0.5, eyeW + 1, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = look.eyes || '#2a1810'
  ctx.beginPath()
  ctx.arc(-headR * 0.32, eyeY, eyeW * 0.65, 0, Math.PI * 2)
  ctx.arc(headR * 0.32, eyeY, eyeW * 0.65, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1a1008'
  ctx.beginPath()
  ctx.arc(-headR * 0.32, eyeY, eyeW * 0.35, 0, Math.PI * 2)
  ctx.arc(headR * 0.32, eyeY, eyeW * 0.35, 0, Math.PI * 2)
  ctx.fill()
}

function drawHairBack(ctx, look, headY, headR, feature) {
  ctx.fillStyle = look.hair
  if (feature === 'mikasa') {
    ctx.beginPath()
    ctx.arc(0, headY - 1, headR + 1, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(-headR - 1, headY - 2, headR * 2 + 2, headR * 0.7)
  } else if (feature === 'eren') {
    ctx.beginPath()
    ctx.arc(0, headY - 2, headR + 2, Math.PI * 0.85, Math.PI * 2.15)
    ctx.fill()
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath()
      ctx.moveTo(i * 4, headY - headR)
      ctx.lineTo(i * 4 + 2, headY - headR - 5)
      ctx.lineTo(i * 4 + 4, headY - headR + 1)
      ctx.fill()
    }
  } else if (feature === 'armin') {
    ctx.beginPath()
    ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(-headR, headY - headR - 2, headR * 2, 6)
  } else if (feature === 'levi') {
    ctx.beginPath()
    ctx.arc(0, headY - 3, headR, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(-headR * 0.6, headY - headR - 4, headR * 1.2, 5)
  } else if (feature === 'hange') {
    ctx.beginPath()
    ctx.arc(0, headY - 1, headR + 2, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(headR + 2, headY + 2, 4, 8, 0.3, 0, Math.PI * 2)
    ctx.fill()
  } else if (feature === 'jean') {
    ctx.beginPath()
    ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(-2, headY - headR - 6, 4, 8)
  } else if (feature === 'historia') {
    ctx.beginPath()
    ctx.arc(0, headY - 2, headR + 2, Math.PI, Math.PI * 2)
    ctx.fill()
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath()
      ctx.ellipse(i * 5, headY - headR - 2, 3, 6, i * 0.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawCharacterFace(ctx, look, dir, headY, headR) {
  const feature = look.feature || 'eren'

  if (dir === 'up') {
    ctx.fillStyle = look.hair
    ctx.beginPath()
    ctx.arc(0, headY, headR * 0.85, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  if (dir === 'left' || dir === 'right') {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.fillStyle = look.skin
    ctx.beginPath()
    ctx.ellipse(5, headY - 2, headR * 0.75, headR * 0.95, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a1008'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillStyle = look.hair
    ctx.beginPath()
    ctx.arc(2, headY - headR * 0.5, headR * 0.7, Math.PI, Math.PI * 2)
    ctx.fill()
    if (feature === 'mikasa') {
      ctx.fillStyle = look.sash
      ctx.fillRect(-2, headY - headR * 0.8, headR * 1.1, 3)
    }
    if (feature === 'hange') {
      ctx.strokeStyle = '#1a1008'
      ctx.lineWidth = 1.2
      ctx.strokeRect(2, headY - 4, 8, 5)
    }
    ctx.fillStyle = '#1a1008'
    ctx.beginPath()
    ctx.arc(9, headY - 2, 1.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    return
  }

  // facing down — most detail
  ctx.fillStyle = look.skin
  ctx.strokeStyle = '#1a1008'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(0, headY, headR, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  drawHairBack(ctx, look, headY, headR, feature)

  if (feature === 'mikasa') {
    ctx.fillStyle = look.sash
    ctx.fillRect(-headR * 0.85, headY - headR * 0.55, headR * 1.7, 4)
  }

  if (feature === 'historia') {
    ctx.fillStyle = '#d4af37'
    ctx.beginPath()
    ctx.moveTo(-5, headY - headR - 2)
    ctx.lineTo(0, headY - headR - 7)
    ctx.lineTo(5, headY - headR - 2)
    ctx.closePath()
    ctx.fill()
  }

  ctx.strokeStyle = look.brow || look.hair
  ctx.lineWidth = feature === 'eren' ? 2.2 : 1.6
  ctx.beginPath()
  ctx.moveTo(-headR * 0.55, headY - headR * 0.15)
  ctx.lineTo(-headR * 0.12, headY - headR * 0.22)
  ctx.moveTo(headR * 0.55, headY - headR * 0.15)
  ctx.lineTo(headR * 0.12, headY - headR * 0.22)
  ctx.stroke()

  drawEyes(ctx, look, headY, headR, dir, feature === 'armin' || feature === 'hange')

  if (feature === 'hange') {
    ctx.strokeStyle = '#1a1008'
    ctx.lineWidth = 1.5
    ctx.strokeRect(-headR * 0.72, headY - headR * 0.08, headR * 0.55, headR * 0.32)
    ctx.strokeRect(headR * 0.17, headY - headR * 0.08, headR * 0.55, headR * 0.32)
    ctx.beginPath()
    ctx.moveTo(-headR * 0.17, headY - headR * 0.02)
    ctx.lineTo(headR * 0.17, headY - headR * 0.02)
    ctx.stroke()
  }

  ctx.fillStyle = look.skin
  ctx.beginPath()
  ctx.ellipse(0, headY + headR * 0.28, headR * 0.12, headR * 0.08, 0, 0, Math.PI * 2)
  ctx.fill()

  if (feature === 'eren') {
    ctx.strokeStyle = look.skin
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(-headR * 0.2, headY + headR * 0.35)
    ctx.lineTo(0, headY + headR * 0.42)
    ctx.lineTo(headR * 0.2, headY + headR * 0.35)
    ctx.stroke()
  } else if (feature === 'jean') {
    ctx.fillStyle = look.skin
    ctx.beginPath()
    ctx.ellipse(0, headY + headR * 0.38, headR * 0.22, headR * 0.14, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (feature === 'levi') {
    ctx.strokeStyle = '#3a3028'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(-headR * 0.15, headY + headR * 0.32)
    ctx.quadraticCurveTo(0, headY + headR * 0.38, headR * 0.15, headY + headR * 0.32)
    ctx.stroke()
  }
}

function drawLegs(ctx, look, dir, walk, scale) {
  const leg = Math.sin(walk * 14) * 4
  ctx.strokeStyle = look.robe
  ctx.lineWidth = 4
  ctx.lineCap = 'round'

  if (dir === 'down') {
    ctx.beginPath()
    ctx.moveTo(-5, 14 * scale)
    ctx.lineTo(-5 - leg * 0.2, 20 * scale)
    ctx.moveTo(5, 14 * scale)
    ctx.lineTo(5 + leg * 0.2, 20 * scale)
    ctx.stroke()
  } else if (dir === 'up') {
    ctx.beginPath()
    ctx.moveTo(-4, 12 * scale)
    ctx.lineTo(-4 + leg * 0.15, 17 * scale)
    ctx.moveTo(4, 12 * scale)
    ctx.lineTo(4 - leg * 0.15, 17 * scale)
    ctx.stroke()
  } else {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.beginPath()
    ctx.moveTo(2, 14 * scale)
    ctx.lineTo(7 + leg * 0.25, 20 * scale)
    ctx.stroke()
    ctx.restore()
  }

  ctx.fillStyle = '#3a2414'
  if (dir === 'down' || dir === 'up') {
    ctx.beginPath()
    ctx.ellipse(-5, 21 * scale, 4, 2.5, 0, 0, Math.PI * 2)
    ctx.ellipse(5, 21 * scale, 4, 2.5, 0, 0, Math.PI * 2)
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
      ctx.arc(5, 5 + i * 2.5, 1.8, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  } else {
    ctx.beginPath()
    ctx.arc(-7, 9, 1.8, 0, Math.PI * 2)
    ctx.arc(7, 9, 1.8, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function drawMonkTopDown(ctx, x, y, look, dir = 'down', walk = 0, scaleX = 1, scaleY = 1) {
  const bob = Math.sin(walk * 12) * 1
  const feature = look.feature || 'eren'
  const scale = bodyScale(feature)
  const headR = headRadius(feature)
  const headY = dir === 'up' ? 0 : -10
  const facing = DIRECTIONS.includes(dir) ? dir : 'down'

  ctx.save()
  ctx.translate(x, y + bob)
  ctx.scale(scaleX, scaleY)

  ctx.fillStyle = 'rgba(0,0,0,0.32)'
  ctx.beginPath()
  ctx.ellipse(2, 14, 12 * scale, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  if (facing === 'up') {
    drawLegs(ctx, look, facing, walk, scale)
    drawRobeBody(ctx, look, facing, walk, scale)
    drawCharacterFace(ctx, look, facing, headY, headR)
  } else {
    drawRobeBody(ctx, look, facing, walk, scale)
    drawPrayerBeads(ctx, look, facing)
    drawLegs(ctx, look, facing, walk, scale)
    drawCharacterFace(ctx, look, facing, headY, headR)
  }

  ctx.restore()
}

export function drawAvatarPreview(ctx, cx, cy, avatarId, paletteIdx = 0) {
  const avatar = MONK_AVATARS.find((a) => a.id === avatarId) || MONK_AVATARS[0]
  const look = { ...avatar, ...ROBE_PALETTE[paletteIdx % ROBE_PALETTE.length], avatarId: avatar.id }
  drawMonkTopDown(ctx, cx, cy, look, 'down', 0)
}
