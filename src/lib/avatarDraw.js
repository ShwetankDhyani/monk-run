/** Canvas drawing for top-down monk avatars. */
import { ROBE_PALETTE } from '../data/avatars.js'

export function drawMonkTopDown(ctx, x, y, look, angle = 0, walk = 0, scaleX = 1, scaleY = 1) {
  const bob = Math.sin(walk * 12) * 1.2
  const id = look.avatarId || 'monk-male'
  const isBaby = id === 'monk-baby'
  const bodyR = isBaby ? 11 : 16
  const headR = isBaby ? 9 : 12

  ctx.save()
  ctx.translate(x, y + bob)
  ctx.rotate(angle)
  ctx.scale(scaleX, scaleY)

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.beginPath()
  ctx.ellipse(2, 14, bodyR + 4, bodyR * 0.55, 0, 0, Math.PI * 2)
  ctx.fill()

  // Robe body
  ctx.fillStyle = look.robe
  ctx.strokeStyle = '#1a1008'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(0, 4, bodyR, bodyR * 0.85, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Sash
  ctx.fillStyle = look.sash
  ctx.fillRect(-bodyR + 2, 0, bodyR * 2 - 4, 5)

  // Head
  ctx.fillStyle = look.skin
  ctx.beginPath()
  ctx.arc(0, -10, headR, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#1a1008'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Hair / head features by avatar type
  ctx.fillStyle = look.hair || '#2a1810'
  if (id === 'monk-bald' || id === 'monk-baby') {
    // bare scalp
  } else if (id === 'monk-female') {
    ctx.beginPath()
    ctx.arc(0, -12, headR + 2, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(-headR - 2, -12, 4, 14)
    ctx.fillRect(headR - 2, -12, 4, 14)
  } else if (id === 'monk-mohawk') {
    ctx.fillRect(-3, -22, 6, 10)
    ctx.fillStyle = '#c97830'
    ctx.fillRect(-2, -24, 4, 4)
  } else if (id === 'monk-male') {
    ctx.beginPath()
    ctx.arc(0, -14, headR - 2, Math.PI, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.arc(0, -13, headR - 1, Math.PI, Math.PI * 2)
    ctx.fill()
  }

  // Face
  ctx.fillStyle = '#1a1008'
  ctx.beginPath()
  ctx.arc(-4, -11, 1.5, 0, Math.PI * 2)
  ctx.arc(4, -11, 1.5, 0, Math.PI * 2)
  ctx.fill()

  if (id === 'monk-mustache') {
    ctx.strokeStyle = '#3a2418'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-6, -7)
    ctx.quadraticCurveTo(0, -5, 6, -7)
    ctx.stroke()
  }

  if (id === 'monk-glasses') {
    ctx.strokeStyle = '#1a1008'
    ctx.lineWidth = 1.5
    ctx.strokeRect(-9, -14, 7, 5)
    ctx.strokeRect(2, -14, 7, 5)
    ctx.beginPath()
    ctx.moveTo(-2, -12)
    ctx.lineTo(2, -12)
    ctx.stroke()
  }

  // Feet hint when walking
  const leg = Math.sin(walk * 14) * 4
  ctx.strokeStyle = look.robe
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-5, 12)
  ctx.lineTo(-5 - leg * 0.3, 18)
  ctx.moveTo(5, 12)
  ctx.lineTo(5 + leg * 0.3, 18)
  ctx.stroke()

  ctx.restore()
}

/** Mini preview for avatar picker (landing). */
export function drawAvatarPreview(ctx, cx, cy, avatarId, paletteIdx = 0) {
  const look = { avatarId, ...ROBE_PALETTE[paletteIdx % ROBE_PALETTE.length] }
  drawMonkTopDown(ctx, cx, cy, look, -0.4, 0)
}
