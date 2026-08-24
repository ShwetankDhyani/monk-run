/** Top-down AOT scout sprites — cinematic traits, oversized heads, survey corps gear. */
import { MONK_AVATARS } from '../data/avatars.js'

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
  const base = look.feature === 'historia' ? 15 : look.feature === 'jean' ? 17 : 16
  return base
}

function jacketColor(look) {
  return look.jacket || look.robe || '#5a5048'
}

function drawSurveyJacket(ctx, look, dir, walk, scale) {
  const bodyW = 17 * scale
  const bodyH = 19 * scale
  const sway = Math.sin(walk * 12) * 0.5
  const jacket = jacketColor(look)

  ctx.fillStyle = jacket
  ctx.strokeStyle = '#1a1410'
  ctx.lineWidth = 1.4

  if (dir === 'down' || dir === 'up') {
    ctx.beginPath()
    ctx.ellipse(0, 9 + sway * 0.15, bodyW * 0.52, bodyH * 0.46, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Collar / shoulders
    ctx.fillStyle = look.shirt || '#8a8880'
    ctx.beginPath()
    ctx.moveTo(-bodyW * 0.28, 2)
    ctx.lineTo(0, 6)
    ctx.lineTo(bodyW * 0.28, 2)
    ctx.lineTo(bodyW * 0.2, 8)
    ctx.lineTo(-bodyW * 0.2, 8)
    ctx.closePath()
    ctx.fill()

    // Cross harness (Eren-style straps)
    if (look.feature === 'eren' || look.feature === 'hange') {
      ctx.strokeStyle = '#3a2818'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-bodyW * 0.35, 0)
      ctx.lineTo(bodyW * 0.35, 14)
      ctx.moveTo(bodyW * 0.35, 0)
      ctx.lineTo(-bodyW * 0.35, 14)
      ctx.stroke()
    }

    // Wings emblem hint
    if (look.feature === 'mikasa' || look.feature === 'levi') {
      ctx.fillStyle = '#3a5080'
      ctx.beginPath()
      ctx.moveTo(-bodyW * 0.42, 4)
      ctx.lineTo(-bodyW * 0.28, 7)
      ctx.lineTo(-bodyW * 0.42, 10)
      ctx.closePath()
      ctx.fill()
    }

    // Green cape (Armin)
    if (look.feature === 'armin' && look.cape) {
      ctx.fillStyle = look.cape
      ctx.beginPath()
      ctx.moveTo(-bodyW * 0.5, 0)
      ctx.quadraticCurveTo(0, -8, bodyW * 0.5, 0)
      ctx.lineTo(bodyW * 0.45, 12)
      ctx.lineTo(-bodyW * 0.45, 12)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = look.accent || '#a0a8b0'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(0, 2, 2.5, 0, Math.PI * 2)
      ctx.stroke()
    }

    // White cravat (Levi)
    if (look.feature === 'levi' && look.cravat) {
      ctx.fillStyle = look.cravat
      ctx.fillRect(-3, 0, 6, 7)
      ctx.beginPath()
      ctx.moveTo(-4, 7)
      ctx.lineTo(0, 10)
      ctx.lineTo(4, 7)
      ctx.fill()
    }
  } else {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.beginPath()
    ctx.moveTo(-2, 1)
    ctx.quadraticCurveTo(10, 5, 9, 16)
    ctx.lineTo(-4, 17)
    ctx.quadraticCurveTo(-8, 8, -2, 1)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  // Scarf / sash belt
  ctx.fillStyle = look.scarf || look.sash || '#6a5040'
  if (dir === 'down' || dir === 'up') {
    ctx.fillRect(-bodyW * 0.44, 5, bodyW * 0.88, 3)
    if (look.feature === 'mikasa' && look.scarf) {
      ctx.fillRect(-bodyW * 0.15, 8, bodyW * 0.3, 8)
    }
  }
}

function drawLuminousEyes(ctx, look, headY, headR, dir, opts = {}) {
  if (dir !== 'down') return
  const { wide = false, fierce = false } = opts
  const eyeY = headY + (fierce ? 0 : 1)
  const eyeW = wide ? 2.4 : 2.0
  const spacing = headR * 0.34

  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.ellipse(-spacing, eyeY, eyeW + 0.6, eyeW + 1.2, 0, 0, Math.PI * 2)
  ctx.ellipse(spacing, eyeY, eyeW + 0.6, eyeW + 1.2, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = look.eyes || '#2a5040'
  ctx.beginPath()
  ctx.arc(-spacing, eyeY, eyeW * 0.72, 0, Math.PI * 2)
  ctx.arc(spacing, eyeY, eyeW * 0.72, 0, Math.PI * 2)
  ctx.fill()

  // Luminous highlight
  ctx.fillStyle = 'rgba(180,255,220,0.55)'
  ctx.beginPath()
  ctx.arc(-spacing - 0.5, eyeY - 0.8, eyeW * 0.28, 0, Math.PI * 2)
  ctx.arc(spacing - 0.5, eyeY - 0.8, eyeW * 0.28, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#0a0808'
  ctx.beginPath()
  ctx.arc(-spacing, eyeY, eyeW * 0.38, 0, Math.PI * 2)
  ctx.arc(spacing, eyeY, eyeW * 0.38, 0, Math.PI * 2)
  ctx.fill()
}

function drawHair(ctx, look, headY, headR, feature, dir) {
  ctx.fillStyle = look.hair
  if (dir === 'up') {
    ctx.beginPath()
    ctx.arc(0, headY, headR * 0.9, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  if (feature === 'mikasa') {
    ctx.beginPath()
    ctx.arc(0, headY - 1, headR + 0.5, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(-headR - 0.5, headY - 2, headR * 2 + 1, headR * 0.55)
    ctx.fillRect(-headR * 0.85, headY - headR * 0.3, headR * 1.7, 4)
  } else if (feature === 'eren') {
    ctx.beginPath()
    ctx.arc(0, headY - 2, headR + 2, Math.PI * 0.82, Math.PI * 2.18)
    ctx.fill()
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath()
      ctx.moveTo(i * 3.5, headY - headR + 1)
      ctx.lineTo(i * 3.5 + 2, headY - headR - 6)
      ctx.lineTo(i * 3.5 + 4, headY - headR + 2)
      ctx.fill()
    }
  } else if (feature === 'armin') {
    ctx.beginPath()
    ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(-headR + 1, headY - headR - 1, headR * 2 - 2, 7)
  } else if (feature === 'levi') {
    ctx.fillRect(-headR * 0.55, headY - headR - 5, headR * 1.1, 5)
    ctx.beginPath()
    ctx.moveTo(-headR * 0.5, headY - headR * 0.2)
    ctx.lineTo(-headR * 0.2, headY + 2)
    ctx.lineTo(-headR * 0.05, headY - headR * 0.15)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(headR * 0.5, headY - headR * 0.2)
    ctx.lineTo(headR * 0.2, headY + 2)
    ctx.lineTo(headR * 0.05, headY - headR * 0.15)
    ctx.fill()
  } else if (feature === 'hange') {
    ctx.beginPath()
    ctx.arc(0, headY - 1, headR + 2, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(headR + 1, headY + 1, 4, 9, 0.35, 0, Math.PI * 2)
    ctx.fill()
    for (let i = 0; i < 4; i++) {
      ctx.beginPath()
      ctx.moveTo(headR - 2, headY - 4 + i * 3)
      ctx.lineTo(headR + 6, headY - 6 + i * 3)
      ctx.strokeStyle = look.hair
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  } else if (feature === 'jean') {
    ctx.beginPath()
    ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(-4, headY - headR - 2)
    ctx.lineTo(0, headY - headR - 8)
    ctx.lineTo(5, headY - headR - 3)
    ctx.fill()
  } else if (feature === 'historia') {
    ctx.beginPath()
    ctx.arc(0, headY - 2, headR + 2, Math.PI, Math.PI * 2)
    ctx.fill()
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath()
      ctx.ellipse(i * 4.5, headY - headR - 1, 3, 7, i * 0.15, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawCharacterFace(ctx, look, dir, headY, headR) {
  const feature = look.feature || 'eren'

  if (dir === 'left' || dir === 'right') {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.fillStyle = look.skin
    ctx.beginPath()
    ctx.ellipse(5, headY - 2, headR * 0.78, headR, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a1410'
    ctx.lineWidth = 1.4
    ctx.stroke()
    drawHair(ctx, look, headY, headR, feature, dir)
    if (feature === 'mikasa' && look.scarf) {
      ctx.fillStyle = look.scarf
      ctx.fillRect(-1, headY + 2, headR * 0.9, 4)
    }
    if (feature === 'hange') {
      ctx.strokeStyle = '#1a1410'
      ctx.lineWidth = 1.2
      ctx.strokeRect(2, headY - 4, 9, 5)
    }
    ctx.fillStyle = '#0a0808'
    ctx.beginPath()
    ctx.arc(9, headY - 2, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    return
  }

  if (dir === 'up') {
    drawHair(ctx, look, headY, headR, feature, dir)
    return
  }

  // Face — pale skin tone
  ctx.fillStyle = look.skin
  ctx.strokeStyle = '#1a1410'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.ellipse(0, headY, headR * 0.98, headR * 1.05, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  drawHair(ctx, look, headY, headR, feature, dir)

  // Mikasa red scarf at neck
  if (feature === 'mikasa' && look.scarf) {
    ctx.fillStyle = look.scarf
    ctx.fillRect(-headR * 0.9, headY + headR * 0.35, headR * 1.8, 5)
    ctx.fillRect(-headR * 0.25, headY + headR * 0.55, headR * 0.5, 6)
  }

  // Historia golden tiara
  if (feature === 'historia' && look.tiara) {
    ctx.fillStyle = look.tiara
    ctx.beginPath()
    ctx.moveTo(-7, headY - headR - 1)
    ctx.lineTo(-4, headY - headR - 8)
    ctx.lineTo(0, headY - headR - 5)
    ctx.lineTo(4, headY - headR - 8)
    ctx.lineTo(7, headY - headR - 1)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#a08020'
    ctx.lineWidth = 0.8
    ctx.stroke()
  }

  // Eren battle scar near left eye
  if (feature === 'eren') {
    ctx.strokeStyle = 'rgba(120,80,60,0.7)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(-headR * 0.55, headY - headR * 0.05)
    ctx.lineTo(-headR * 0.38, headY + headR * 0.12)
    ctx.stroke()
  }

  // Brows
  ctx.strokeStyle = look.brow || look.hair
  ctx.lineWidth = feature === 'eren' || feature === 'levi' ? 2.2 : 1.5
  const browY = headY - headR * 0.18
  if (feature === 'hange') {
    ctx.beginPath()
    ctx.moveTo(-headR * 0.6, browY - 2)
    ctx.quadraticCurveTo(-headR * 0.15, browY - 4, headR * 0.1, browY - 1)
    ctx.moveTo(headR * 0.6, browY - 2)
    ctx.quadraticCurveTo(headR * 0.15, browY - 4, -headR * 0.1, browY - 1)
    ctx.stroke()
  } else if (feature === 'jean') {
    ctx.beginPath()
    ctx.moveTo(-headR * 0.55, browY)
    ctx.lineTo(-headR * 0.1, browY - 2)
    ctx.moveTo(headR * 0.55, browY)
    ctx.lineTo(headR * 0.1, browY - 2)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(-headR * 0.58, browY)
    ctx.lineTo(-headR * 0.1, browY - (feature === 'levi' ? 3 : 1))
    ctx.moveTo(headR * 0.58, browY)
    ctx.lineTo(headR * 0.1, browY - (feature === 'levi' ? 3 : 1))
    ctx.stroke()
  }

  drawLuminousEyes(ctx, look, headY, headR, dir, {
    wide: feature === 'armin' || feature === 'hange',
    fierce: feature === 'eren' || feature === 'levi',
  })

  // Hange spectacles
  if (feature === 'hange') {
    ctx.strokeStyle = '#1a1410'
    ctx.lineWidth = 1.6
    ctx.strokeRect(-headR * 0.75, headY - headR * 0.05, headR * 0.58, headR * 0.34)
    ctx.strokeRect(headR * 0.17, headY - headR * 0.05, headR * 0.58, headR * 0.34)
    ctx.beginPath()
    ctx.moveTo(-headR * 0.17, headY + headR * 0.05)
    ctx.lineTo(headR * 0.17, headY + headR * 0.05)
    ctx.stroke()
  }

  // Levi under-eye fatigue
  if (feature === 'levi') {
    ctx.strokeStyle = 'rgba(80,70,80,0.45)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(-headR * 0.45, headY + headR * 0.12)
    ctx.lineTo(-headR * 0.18, headY + headR * 0.15)
    ctx.moveTo(headR * 0.45, headY + headR * 0.12)
    ctx.lineTo(headR * 0.18, headY + headR * 0.15)
    ctx.stroke()
  }

  // Mouth / expression
  if (feature === 'hange') {
    ctx.strokeStyle = '#6a4030'
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.arc(0, headY + headR * 0.42, headR * 0.22, 0.15, Math.PI - 0.15)
    ctx.stroke()
  } else if (feature === 'jean') {
    ctx.strokeStyle = '#5a4030'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(-headR * 0.2, headY + headR * 0.42)
    ctx.quadraticCurveTo(0, headY + headR * 0.48, headR * 0.22, headY + headR * 0.38)
    ctx.stroke()
  } else if (feature === 'levi') {
    ctx.strokeStyle = '#4a3830'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(-headR * 0.18, headY + headR * 0.4)
    ctx.lineTo(headR * 0.18, headY + headR * 0.4)
    ctx.stroke()
  } else if (feature === 'historia') {
    ctx.strokeStyle = '#c08090'
    ctx.lineWidth = 1.3
    ctx.beginPath()
    ctx.arc(0, headY + headR * 0.38, headR * 0.1, 0, Math.PI)
    ctx.stroke()
  } else {
    ctx.fillStyle = look.skin
    ctx.beginPath()
    ctx.ellipse(0, headY + headR * 0.35, headR * 0.1, headR * 0.06, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawLegs(ctx, look, dir, walk, scale) {
  const leg = Math.sin(walk * 14) * 3.5
  ctx.strokeStyle = jacketColor(look)
  ctx.lineWidth = 3.5
  ctx.lineCap = 'round'

  if (dir === 'down') {
    ctx.beginPath()
    ctx.moveTo(-5, 14 * scale)
    ctx.lineTo(-5 - leg * 0.18, 20 * scale)
    ctx.moveTo(5, 14 * scale)
    ctx.lineTo(5 + leg * 0.18, 20 * scale)
    ctx.stroke()
  } else if (dir === 'up') {
    ctx.beginPath()
    ctx.moveTo(-4, 12 * scale)
    ctx.lineTo(-4 + leg * 0.12, 17 * scale)
    ctx.moveTo(4, 12 * scale)
    ctx.lineTo(4 - leg * 0.12, 17 * scale)
    ctx.stroke()
  } else {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.beginPath()
    ctx.moveTo(2, 14 * scale)
    ctx.lineTo(7 + leg * 0.22, 20 * scale)
    ctx.stroke()
    ctx.restore()
  }

  ctx.fillStyle = '#2a2018'
  ctx.beginPath()
  ctx.ellipse(-5, 21 * scale, 3.5, 2.2, 0, 0, Math.PI * 2)
  ctx.ellipse(5, 21 * scale, 3.5, 2.2, 0, 0, Math.PI * 2)
  ctx.fill()
}

export function drawMonkTopDown(ctx, x, y, look, dir = 'down', walk = 0, scaleX = 1, scaleY = 1) {
  const bob = Math.sin(walk * 12) * 0.8
  const scale = bodyScale(look)
  const headR = headRadius(look)
  const headY = dir === 'up' ? 0 : -11
  const facing = DIRECTIONS.includes(dir) ? dir : 'down'

  ctx.save()
  ctx.translate(x, y + bob)
  ctx.scale(scaleX, scaleY)

  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.beginPath()
  ctx.ellipse(2, 14 * scale, 11 * scale, 5.5, 0, 0, Math.PI * 2)
  ctx.fill()

  if (facing === 'up') {
    drawLegs(ctx, look, facing, walk, scale)
    drawSurveyJacket(ctx, look, facing, walk, scale)
    drawCharacterFace(ctx, look, facing, headY, headR)
  } else {
    drawSurveyJacket(ctx, look, facing, walk, scale)
    drawLegs(ctx, look, facing, walk, scale)
    drawCharacterFace(ctx, look, facing, headY, headR)
  }

  ctx.restore()
}

export function drawAvatarPreview(ctx, cx, cy, avatarId) {
  const avatar = MONK_AVATARS.find((a) => a.id === avatarId) || MONK_AVATARS[0]
  const look = { ...avatar, avatarId: avatar.id }
  drawMonkTopDown(ctx, cx, cy, look, 'down', 0)
}
