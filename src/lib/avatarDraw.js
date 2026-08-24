/** Top-down monk sprites — 4-way facing, always upright (no rotation flip). */
import { ROBE_PALETTE } from '../data/avatars.js'

export const DIRECTIONS = ['down', 'up', 'left', 'right']

/** Pick facing from movement delta; keeps last direction when still. */
export function dirFromDelta(dx, dy, prev = 'down') {
  if (!dx && !dy) return prev
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left'
  return dy > 0 ? 'down' : 'up'
}

function drawRobeBody(ctx, look, dir, walk, isBaby) {
  const bodyW = isBaby ? 18 : 26
  const bodyH = isBaby ? 20 : 28
  const sway = Math.sin(walk * 12) * 0.8

  ctx.fillStyle = look.robe
  ctx.strokeStyle = '#1a1008'
  ctx.lineWidth = 2

  if (dir === 'down' || dir === 'up') {
    ctx.beginPath()
    ctx.ellipse(0, 6 + sway * 0.3, bodyW * 0.48, bodyH * 0.42, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.strokeStyle = 'rgba(26,16,8,0.35)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(-bodyW * 0.3, 14)
    ctx.quadraticCurveTo(-bodyW * 0.15, 18, 0, 16)
    ctx.quadraticCurveTo(bodyW * 0.15, 18, bodyW * 0.3, 14)
    ctx.stroke()
  } else {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.beginPath()
    ctx.moveTo(-4, -2)
    ctx.quadraticCurveTo(14, 4, 12, 18)
    ctx.lineTo(-6, 20)
    ctx.quadraticCurveTo(-10, 8, -4, -2)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  ctx.fillStyle = look.sash
  if (dir === 'down' || dir === 'up') {
    ctx.fillRect(-bodyW * 0.38, 2, bodyW * 0.76, 5)
  } else {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.fillRect(-2, 2, 14, 4)
    ctx.restore()
  }
}

function drawHead(ctx, look, dir, id) {
  const isBaby = id === 'monk-baby'
  const headR = isBaby ? 9 : 11
  const headY = dir === 'up' ? 2 : -8

  ctx.fillStyle = look.skin
  ctx.strokeStyle = '#1a1008'
  ctx.lineWidth = 1.5

  if (dir === 'down' || dir === 'up') {
    ctx.beginPath()
    ctx.arc(0, headY, headR, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    if (id === 'monk-bald' || id === 'monk-baby' || id === 'monk-male') {
      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      ctx.beginPath()
      ctx.arc(-3, headY - 3, headR * 0.45, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = look.hair || '#2a1810'
    if (id === 'monk-female') {
      ctx.beginPath()
      ctx.arc(0, headY - 2, headR + 2, Math.PI, Math.PI * 2)
      ctx.fill()
      ctx.fillRect(-headR - 2, headY - 2, 4, 12)
      ctx.fillRect(headR - 2, headY - 2, 4, 12)
    } else if (id === 'monk-mohawk') {
      ctx.fillRect(-3, headY - headR - 8, 6, 10)
      ctx.fillStyle = '#c97830'
      ctx.fillRect(-2, headY - headR - 10, 4, 4)
    } else if (id !== 'monk-bald' && id !== 'monk-baby') {
      ctx.beginPath()
      ctx.arc(0, headY - 2, headR - 1, Math.PI, Math.PI * 2)
      ctx.fill()
    }

    if (dir === 'down') {
      ctx.fillStyle = '#1a1008'
      ctx.beginPath()
      ctx.arc(-4, headY - 1, 1.6, 0, Math.PI * 2)
      ctx.arc(4, headY - 1, 1.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = look.skin
      ctx.beginPath()
      ctx.arc(0, headY + 2, 2, 0, Math.PI * 2)
      ctx.fill()

      if (id === 'monk-mustache') {
        ctx.strokeStyle = '#3a2418'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(-6, headY + 4)
        ctx.quadraticCurveTo(0, headY + 6, 6, headY + 4)
        ctx.stroke()
      }
      if (id === 'monk-glasses') {
        ctx.strokeStyle = '#1a1008'
        ctx.lineWidth = 1.5
        ctx.strokeRect(-9, headY - 4, 7, 5)
        ctx.strokeRect(2, headY - 4, 7, 5)
        ctx.beginPath()
        ctx.moveTo(-2, headY - 2)
        ctx.lineTo(2, headY - 2)
        ctx.stroke()
      }
    } else {
      ctx.fillStyle = look.robe
      ctx.beginPath()
      ctx.arc(0, headY + 4, headR * 0.7, 0, Math.PI)
      ctx.fill()
    }
  } else {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.beginPath()
    ctx.ellipse(4, -6, headR * 0.85, headR, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = look.skin
    ctx.beginPath()
    ctx.ellipse(-2, -6, 3, 4, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1a1008'
    ctx.beginPath()
    ctx.arc(8, -7, 1.5, 0, Math.PI * 2)
    ctx.fill()
    if (id === 'monk-mustache') {
      ctx.strokeStyle = '#3a2418'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(6, -2)
      ctx.quadraticCurveTo(10, 0, 8, 2)
      ctx.stroke()
    }
    ctx.restore()
  }
}

function drawLegs(ctx, look, dir, walk) {
  const leg = Math.sin(walk * 14) * 5
  ctx.strokeStyle = look.robe
  ctx.lineWidth = 5
  ctx.lineCap = 'round'

  if (dir === 'down') {
    ctx.beginPath()
    ctx.moveTo(-6, 16)
    ctx.lineTo(-6 - leg * 0.25, 24)
    ctx.moveTo(6, 16)
    ctx.lineTo(6 + leg * 0.25, 24)
    ctx.stroke()
  } else if (dir === 'up') {
    ctx.beginPath()
    ctx.moveTo(-5, 14)
    ctx.lineTo(-5 + leg * 0.2, 20)
    ctx.moveTo(5, 14)
    ctx.lineTo(5 - leg * 0.2, 20)
    ctx.stroke()
  } else {
    const flip = dir === 'left' ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.beginPath()
    ctx.moveTo(2, 16)
    ctx.lineTo(8 + leg * 0.3, 24)
    ctx.stroke()
    ctx.restore()
  }

  ctx.fillStyle = '#3a2414'
  if (dir === 'down' || dir === 'up') {
    ctx.beginPath()
    ctx.ellipse(-6, 25, 5, 3, 0, 0, Math.PI * 2)
    ctx.ellipse(6, 25, 5, 3, 0, 0, Math.PI * 2)
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
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.arc(6, 4 + i * 3, 2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  } else {
    ctx.beginPath()
    ctx.arc(-8, 8, 2, 0, Math.PI * 2)
    ctx.arc(8, 8, 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function drawMonkTopDown(ctx, x, y, look, dir = 'down', walk = 0, scaleX = 1, scaleY = 1) {
  const bob = Math.sin(walk * 12) * 1.2
  const id = look.avatarId || 'monk-male'
  const isBaby = id === 'monk-baby'
  const facing = DIRECTIONS.includes(dir) ? dir : 'down'

  ctx.save()
  ctx.translate(x, y + bob)
  ctx.scale(scaleX, scaleY)

  ctx.fillStyle = 'rgba(0,0,0,0.32)'
  ctx.beginPath()
  ctx.ellipse(2, 16, isBaby ? 12 : 16, isBaby ? 6 : 8, 0, 0, Math.PI * 2)
  ctx.fill()

  if (facing === 'up') {
    drawLegs(ctx, look, facing, walk)
    drawRobeBody(ctx, look, facing, walk, isBaby)
    drawHead(ctx, look, facing, id)
  } else {
    drawRobeBody(ctx, look, facing, walk, isBaby)
    drawPrayerBeads(ctx, look, facing)
    drawLegs(ctx, look, facing, walk)
    drawHead(ctx, look, facing, id)
  }

  ctx.restore()
}

export function drawAvatarPreview(ctx, cx, cy, avatarId, paletteIdx = 0) {
  const look = { avatarId, ...ROBE_PALETTE[paletteIdx % ROBE_PALETTE.length] }
  drawMonkTopDown(ctx, cx, cy, look, 'down', 0)
}
