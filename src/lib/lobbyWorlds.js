/**
 * Gathering hall — one social hangout. Presence over toys.
 */
import {
  FLOOR,
  ROOM,
  STATIC_COLLIDERS,
  drawLivingRoom,
  drawLivingProp,
  makeLivingRoomProps,
  PLAYER_R,
} from './templeRoom.js'

export { FLOOR, ROOM, PLAYER_R }

export const GATHER_CIRCLES = [
  { x: ROOM.x + 340, y: ROOM.y + 400, r: 78, label: 'Hearth' },
  { x: ROOM.x + 780, y: ROOM.y + 400, r: 72, label: 'Window' },
  { x: ROOM.x + 560, y: ROOM.y + 500, r: 64, label: 'Rug' },
]

export const HANGOUT = {
  id: 'hall',
  name: 'Gathering hall',
  tagline: 'Talk first. Fall when you’re ready.',
  accent: '#d4a574',
  moveSpeed: 170,
  colliders: STATIC_COLLIDERS,
  makeProps: makeLivingRoomProps,
  drawProp: drawLivingProp,
}

/** @deprecated alias — keep old call sites from exploding during transition */
export function getLobbyWorld() {
  return HANGOUT
}

export const LOBBY_THEME_IDS = ['hall']
export const LOBBY_WORLDS = { hall: HANGOUT }

function drawGatherCircles(ctx, t) {
  for (const c of GATHER_CIRCLES) {
    const pulse = 0.55 + Math.sin(t * 1.2 + c.x * 0.01) * 0.08
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(c.x, c.y, c.r, c.r * 0.42, 0, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(212, 165, 116, ${0.07 * pulse})`
    ctx.fill()
    ctx.strokeStyle = `rgba(212, 165, 116, ${0.2 * pulse})`
    ctx.lineWidth = 1.5
    ctx.setLineDash([6, 8])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.font = '500 10px Outfit, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(230, 220, 200, 0.38)'
    ctx.textAlign = 'center'
    ctx.fillText(c.label, c.x, c.y + 4)
    ctx.restore()
  }
}

function drawLanternMotes(ctx, t, voiceLevel = 0) {
  const n = 10 + Math.floor(voiceLevel * 10)
  for (let i = 0; i < n; i++) {
    const seed = i * 97.13
    const x = FLOOR.x + ((seed * 13 + t * (8 + voiceLevel * 22)) % FLOOR.w)
    const y = FLOOR.y + 30 + ((seed * 7 + Math.sin(t * 0.5 + i) * 24) % (FLOOR.h - 50))
    const a = 0.08 + voiceLevel * 0.22 + (Math.sin(t * 1.5 + i) + 1) * 0.04
    ctx.fillStyle = `rgba(240, 200, 140, ${a})`
    ctx.beginPath()
    ctx.arc(x, y, 2 + voiceLevel * 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function drawHangoutRoom(ctx, t, ambience = {}) {
  drawLivingRoom(ctx, t)
  drawGatherCircles(ctx, t)
  drawLanternMotes(ctx, t, ambience.voiceLevel || 0)
  if ((ambience.pulse || 0) > 0) {
    ctx.fillStyle = `rgba(255, 200, 120, ${ambience.pulse * 0.1})`
    ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h)
  }
}

export function drawVoiceAura(ctx, x, y, level, t) {
  if (level < 0.04) return
  const rings = 2 + Math.floor(level * 3)
  for (let i = 0; i < rings; i++) {
    const r = 22 + level * 28 + i * 10 + Math.sin(t * 6 + i) * 2
    ctx.beginPath()
    ctx.arc(x, y + 4, r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(94, 196, 182, ${(0.34 - i * 0.09) * Math.min(1, level * 2)})`
    ctx.lineWidth = 2
    ctx.stroke()
  }
}

export function drawSpeechBubble(ctx, x, y, text) {
  const label = String(text || '').slice(0, 42)
  if (!label) return
  ctx.save()
  ctx.font = '500 12px Outfit, system-ui, sans-serif'
  const tw = Math.min(200, ctx.measureText(label).width)
  const w = tw + 18
  const h = 26
  const bx = x - w / 2
  const by = y - 74
  ctx.fillStyle = 'rgba(12, 14, 20, 0.92)'
  ctx.strokeStyle = 'rgba(212, 165, 116, 0.45)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(bx, by, w, h, 8)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x - 6, by + h)
  ctx.lineTo(x, by + h + 8)
  ctx.lineTo(x + 6, by + h)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#f2ebe0'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x, by + h / 2)
  ctx.restore()
}

export function drawNameplate(ctx, x, y, name, opts = {}) {
  const { isSelf = false, speaking = false, host = false } = opts
  const label = (name || 'Monk').slice(0, 14)
  ctx.font = '600 13px Fraunces, Georgia, serif'
  const tw = ctx.measureText(label).width
  const badge = host ? 28 : 0
  const w = tw + 16 + badge
  const hx = x - w / 2
  const hy = y - 48
  ctx.fillStyle = 'rgba(8, 10, 16, 0.9)'
  ctx.strokeStyle = speaking ? '#5ec4b6' : isSelf ? '#f0c98a' : 'rgba(200,160,100,0.55)'
  ctx.lineWidth = speaking ? 2.5 : 1.75
  ctx.beginPath()
  ctx.roundRect(hx, hy, w, 20, 6)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#f5efe4'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, hx + 8, hy + 10)
  if (host) {
    ctx.font = '600 8px Outfit, system-ui, sans-serif'
    ctx.fillStyle = '#f0c98a'
    ctx.textAlign = 'right'
    ctx.fillText('HOST', hx + w - 6, hy + 10)
  }
}

export function drawNearnessBond(ctx, ax, ay, bx, by) {
  const d = Math.hypot(bx - ax, by - ay)
  if (d < 28 || d > 100) return
  const a = 0.22 * (1 - (d - 28) / 72)
  ctx.strokeStyle = `rgba(94, 196, 182, ${a})`
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 6])
  ctx.beginPath()
  ctx.moveTo(ax, ay)
  ctx.lineTo(bx, by)
  ctx.stroke()
  ctx.setLineDash([])
}

export const drawSocialNameplate = drawNameplate
