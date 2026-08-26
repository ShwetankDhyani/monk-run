/**
 * Garrison hall — expedition lobby energy:
 * stone barracks, wall vista, squad rally pad.
 * Original art in monk.run palette (homage, not official IP).
 */
import { FLOOR, ROOM, PLAYER_R } from './templeRoom.js'

export { FLOOR, ROOM, PLAYER_R }

/** Walls only — open floor so the squad can stand together. */
export const LOBBY_WALLS = [
  { x: FLOOR.x, y: FLOOR.y - 18, w: FLOOR.w, h: 18 },
  { x: FLOOR.x, y: FLOOR.y + FLOOR.h, w: FLOOR.w, h: 18 },
  { x: FLOOR.x - 18, y: FLOOR.y, w: 18, h: FLOOR.h },
  { x: FLOOR.x + FLOOR.w, y: FLOOR.y, w: 18, h: FLOOR.h },
]

export const LOBBY_CHAR_SCALE = 1.72
export const LOBBY_PLAYER_R = 26

export const HANGOUT = {
  id: 'garrison',
  name: 'Garrison hall',
  tagline: 'Rally. Talk. Breach when ready.',
  accent: '#6b9a62',
  moveSpeed: 210,
  colliders: LOBBY_WALLS,
  charScale: LOBBY_CHAR_SCALE,
  playerR: LOBBY_PLAYER_R,
  makeProps: () => [],
  drawProp: () => {},
}

export function getLobbyWorld() {
  return HANGOUT
}

export const LOBBY_THEME_IDS = ['garrison']
export const LOBBY_WORLDS = { garrison: HANGOUT }

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** Original wing banner — chevron geometry, not official emblem. */
function drawCorpsBanner(ctx, x, y, scale = 1) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.fillStyle = 'rgba(18, 24, 20, 0.92)'
  ctx.strokeStyle = 'rgba(107, 154, 98, 0.55)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(-28, -38, 56, 76, 6)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = 'rgba(126, 200, 154, 0.35)'
  ctx.beginPath()
  ctx.moveTo(0, -24)
  ctx.lineTo(14, -4)
  ctx.lineTo(0, -10)
  ctx.lineTo(-14, -4)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(212, 165, 116, 0.45)'
  ctx.stroke()
  ctx.restore()
}

/** Garrison interior — wall vista, stone floor, rally pad. */
export function drawHangoutRoom(ctx, t, ambience = {}) {
  const voice = ambience.voiceLevel || 0

  ctx.fillStyle = '#06080c'
  ctx.fillRect(0, 0, 1280, 720)

  const grad = ctx.createLinearGradient(ROOM.x, ROOM.y, ROOM.x, ROOM.y + ROOM.h)
  grad.addColorStop(0, '#141c18')
  grad.addColorStop(0.45, '#1a2420')
  grad.addColorStop(1, '#101814')
  ctx.fillStyle = grad
  roundRect(ctx, ROOM.x - 8, ROOM.y - 8, ROOM.w + 16, ROOM.h + 16, 18)
  ctx.fill()

  ctx.strokeStyle = 'rgba(107, 154, 98, 0.28)'
  ctx.lineWidth = 3
  roundRect(ctx, ROOM.x + 6, ROOM.y + 6, ROOM.w - 12, ROOM.h - 12, 14)
  ctx.stroke()

  // Wall vista — distant ramparts at horizon
  const winY = ROOM.y + 22
  const winH = 88
  const sky = ctx.createLinearGradient(0, winY, 0, winY + winH)
  sky.addColorStop(0, '#2a3840')
  sky.addColorStop(0.55, '#182028')
  sky.addColorStop(1, '#0c1218')
  ctx.fillStyle = sky
  roundRect(ctx, ROOM.x + 56, winY, ROOM.w - 112, winH, 8)
  ctx.fill()

  // Wall silhouettes (original geometry)
  ctx.fillStyle = 'rgba(12, 18, 16, 0.95)'
  const wx = ROOM.x + 72
  const ww = ROOM.w - 144
  ctx.fillRect(wx, winY + 38, ww * 0.22, winH - 38)
  ctx.fillRect(wx + ww * 0.32, winY + 28, ww * 0.28, winH - 28)
  ctx.fillRect(wx + ww * 0.68, winY + 34, ww * 0.24, winH - 34)

  // Green steam wisps beyond the wall
  for (let i = 0; i < 5; i++) {
    const sx = wx + 40 + ((i * 97 + t * 18) % (ww - 80))
    const sy = winY + 18 + Math.sin(t * 0.8 + i) * 4
    const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, 22 + i * 4)
    g.addColorStop(0, `rgba(126, 200, 154, ${0.12 + Math.sin(t + i) * 0.04})`)
    g.addColorStop(1, 'rgba(126, 200, 154, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(sx, sy, 18 + i * 3, 10, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.strokeStyle = 'rgba(139, 115, 85, 0.35)'
  ctx.lineWidth = 2
  roundRect(ctx, ROOM.x + 56, winY, ROOM.w - 112, winH, 8)
  ctx.stroke()

  // Side banners
  drawCorpsBanner(ctx, ROOM.x + 42, ROOM.y + ROOM.h * 0.38, 1)
  drawCorpsBanner(ctx, ROOM.x + ROOM.w - 42, ROOM.y + ROOM.h * 0.38, 1)

  // Stone floor
  ctx.fillStyle = '#1e2824'
  ctx.fillRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h)
  ctx.strokeStyle = 'rgba(255,255,255,0.028)'
  ctx.lineWidth = 1
  const tile = 52
  for (let x = FLOOR.x; x < FLOOR.x + FLOOR.w; x += tile) {
    ctx.beginPath()
    ctx.moveTo(x, FLOOR.y)
    ctx.lineTo(x, FLOOR.y + FLOOR.h)
    ctx.stroke()
  }
  for (let y = FLOOR.y; y < FLOOR.y + FLOOR.h; y += tile) {
    ctx.beginPath()
    ctx.moveTo(FLOOR.x, y)
    ctx.lineTo(FLOOR.x + FLOOR.w, y)
    ctx.stroke()
  }

  const cx = FLOOR.x + FLOOR.w / 2
  const cy = FLOOR.y + FLOOR.h * 0.52
  ctx.beginPath()
  ctx.ellipse(cx, cy, 150, 70, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(107, 154, 98, 0.11)'
  ctx.fill()
  ctx.strokeStyle = `rgba(107, 154, 98, ${0.38 + Math.sin(t * 1.5) * 0.08 + voice * 0.15})`
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(cx, cy, 118, 52, 0, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(212, 165, 116, 0.28)'
  ctx.lineWidth = 2
  ctx.setLineDash([8, 10])
  ctx.stroke()
  ctx.setLineDash([])

  ctx.font = '600 13px Outfit, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(230, 236, 232, 0.45)'
  ctx.textAlign = 'center'
  ctx.fillText('RALLY HERE', cx, cy + 5)

  if (voice > 0.05) {
    const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, 200)
    g.addColorStop(0, `rgba(107, 154, 98, ${voice * 0.14})`)
    g.addColorStop(1, 'rgba(107, 154, 98, 0)')
    ctx.fillStyle = g
    ctx.fillRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h)
  }

  if ((ambience.pulse || 0) > 0) {
    ctx.fillStyle = `rgba(126, 200, 154, ${ambience.pulse * 0.14})`
    ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h)
  }
}

export function drawVoiceAura(ctx, x, y, level, t) {
  if (level < 0.04) return
  const rings = 2 + Math.floor(level * 3)
  for (let i = 0; i < rings; i++) {
    const r = 28 + level * 32 + i * 12 + Math.sin(t * 6 + i) * 2
    ctx.beginPath()
    ctx.arc(x, y + 6, r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(107, 154, 98, ${(0.4 - i * 0.1) * Math.min(1, level * 2)})`
    ctx.lineWidth = 2.5
    ctx.stroke()
  }
}

export function drawSpeechBubble(ctx, x, y, text) {
  const label = String(text || '').slice(0, 36)
  if (!label) return
  ctx.save()
  ctx.font = '600 13px Outfit, system-ui, sans-serif'
  const tw = Math.min(220, ctx.measureText(label).width)
  const w = tw + 20
  const h = 28
  const bx = x - w / 2
  const by = y - 92
  ctx.fillStyle = 'rgba(14, 18, 26, 0.94)'
  ctx.strokeStyle = 'rgba(107, 154, 98, 0.55)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(bx, by, w, h, 10)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x - 7, by + h)
  ctx.lineTo(x, by + h + 9)
  ctx.lineTo(x + 7, by + h)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#eef4f0'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x, by + h / 2)
  ctx.restore()
}

export function drawSocialNameplate(ctx, x, y, name, opts = {}) {
  const { isSelf = false, speaking = false, host = false, color = '#d4a574' } = opts
  const label = (name || 'Scout').slice(0, 12)
  ctx.save()
  ctx.font = '700 14px Outfit, system-ui, sans-serif'
  const tw = ctx.measureText(label).width
  const hostW = host ? 52 : 0
  const w = tw + 28 + hostW
  const h = 24
  const hx = x - w / 2
  const hy = y - 62

  ctx.fillStyle = 'rgba(8, 12, 18, 0.88)'
  ctx.beginPath()
  ctx.roundRect(hx, hy, w, h, 12)
  ctx.fill()

  ctx.strokeStyle = speaking ? '#6b9a62' : isSelf ? '#f0c98a' : 'rgba(255,255,255,0.14)'
  ctx.lineWidth = speaking ? 2.5 : 1.5
  ctx.stroke()

  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(hx + 12, hy + h / 2, 5, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#f4f7f5'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, hx + 22, hy + h / 2 + 0.5)

  if (host) {
    ctx.font = '800 7px Outfit, system-ui, sans-serif'
    ctx.fillStyle = '#f0c98a'
    ctx.textAlign = 'right'
    ctx.fillText('CMD', hx + w - 8, hy + h / 2)
  }
  ctx.restore()
}

export function drawNearnessBond(ctx, ax, ay, bx, by) {
  const d = Math.hypot(bx - ax, by - ay)
  if (d < 36 || d > 120) return
  const a = 0.2 * (1 - (d - 36) / 84)
  ctx.strokeStyle = `rgba(107, 154, 98, ${a})`
  ctx.lineWidth = 2
  ctx.setLineDash([5, 7])
  ctx.beginPath()
  ctx.moveTo(ax, ay)
  ctx.lineTo(bx, by)
  ctx.stroke()
  ctx.setLineDash([])
}

export function spawnPortalDebris(cx, cy, count = 16) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4
    const rad = 140 + Math.random() * 340
    return {
      x: cx + Math.cos(angle) * rad,
      y: cy + Math.sin(angle) * rad,
      vx: 0,
      vy: 0,
      mass: 0.35 + Math.random() * 1.1,
      r: 4 + Math.random() * 7,
      rot: Math.random() * Math.PI * 2,
      hue: i % 3,
    }
  })
}

export function drawPortalDebris(ctx, p, t) {
  if (p.x == null || p.y == null) return
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rot || 0)
  const colors = ['#6b9a62', '#d4a574', '#7ec89a']
  ctx.fillStyle = colors[p.hue % 3] || '#6b9a62'
  ctx.globalAlpha = 0.85
  ctx.beginPath()
  ctx.roundRect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2, 2)
  ctx.fill()
  ctx.globalAlpha = 0.35 + Math.sin(t * 8 + p.x) * 0.1
  ctx.strokeStyle = '#f0c98a'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()
}
