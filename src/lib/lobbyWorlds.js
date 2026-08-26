/**
 * Survey Corps garrison hall — AOT homage lobby.
 * Original art only (walls, steam, wing banners — not official IP assets).
 */
import { FLOOR, ROOM, PLAYER_R } from './templeRoom.js'

export { FLOOR, ROOM, PLAYER_R }

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
  name: 'Survey Corps HQ',
  tagline: 'Rally. Dedicate. Breach.',
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

/** Original wing banner — Survey Corps homage, not official emblem. */
function drawCorpsBanner(ctx, x, y, scale = 1) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  // Cloak-colored field
  ctx.fillStyle = '#1a2820'
  ctx.strokeStyle = 'rgba(212, 165, 116, 0.55)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(-36, -52, 72, 104, 6)
  ctx.fill()
  ctx.stroke()
  // Twin wings
  ctx.fillStyle = 'rgba(126, 200, 154, 0.55)'
  ctx.beginPath()
  ctx.moveTo(0, -28)
  ctx.lineTo(-26, -6)
  ctx.lineTo(-8, -2)
  ctx.lineTo(-22, 18)
  ctx.lineTo(0, 4)
  ctx.lineTo(22, 18)
  ctx.lineTo(8, -2)
  ctx.lineTo(26, -6)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(240, 201, 138, 0.65)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.font = '800 8px Outfit, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(230, 236, 232, 0.55)'
  ctx.textAlign = 'center'
  ctx.fillText('SCOUT REGIMENT', 0, 38)
  ctx.restore()
}

function drawColossalBeyond(ctx, winX, winY, winW, winH, t) {
  const cx = winX + winW / 2
  const baseY = winY + winH
  // Head / shoulders silhouette beyond wall
  ctx.fillStyle = 'rgba(6, 10, 8, 0.92)'
  ctx.beginPath()
  ctx.moveTo(cx - 90, baseY)
  ctx.quadraticCurveTo(cx - 100, winY + 30, cx - 40, winY + 18)
  ctx.quadraticCurveTo(cx, winY - 8, cx + 40, winY + 18)
  ctx.quadraticCurveTo(cx + 100, winY + 30, cx + 90, baseY)
  ctx.closePath()
  ctx.fill()
  // Eyes — faint green glow
  const eyeY = winY + winH * 0.38
  const pulse = 0.35 + Math.sin(t * 1.2) * 0.12
  for (const dx of [-28, 28]) {
    const g = ctx.createRadialGradient(cx + dx, eyeY, 1, cx + dx, eyeY, 14)
    g.addColorStop(0, `rgba(126, 200, 154, ${pulse})`)
    g.addColorStop(1, 'rgba(126, 200, 154, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx + dx, eyeY, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgba(180, 230, 190, ${0.55 + pulse * 0.3})`
    ctx.beginPath()
    ctx.arc(cx + dx, eyeY, 3.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Survey Corps HQ — wall gate vista, corps banners, rally pad. */
export function drawHangoutRoom(ctx, t, ambience = {}) {
  const voice = ambience.voiceLevel || 0

  ctx.fillStyle = '#050708'
  ctx.fillRect(0, 0, 1280, 720)

  // Stone hall shell
  const grad = ctx.createLinearGradient(ROOM.x, ROOM.y, ROOM.x, ROOM.y + ROOM.h)
  grad.addColorStop(0, '#121a16')
  grad.addColorStop(0.4, '#1a2420')
  grad.addColorStop(1, '#0e1612')
  ctx.fillStyle = grad
  roundRect(ctx, ROOM.x - 8, ROOM.y - 8, ROOM.w + 16, ROOM.h + 16, 14)
  ctx.fill()

  ctx.strokeStyle = 'rgba(139, 115, 85, 0.4)'
  ctx.lineWidth = 4
  roundRect(ctx, ROOM.x + 4, ROOM.y + 4, ROOM.w - 8, ROOM.h - 8, 12)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(107, 154, 98, 0.25)'
  ctx.lineWidth = 2
  roundRect(ctx, ROOM.x + 10, ROOM.y + 10, ROOM.w - 20, ROOM.h - 20, 10)
  ctx.stroke()

  // Giant wall / gate vista
  const winY = ROOM.y + 18
  const winH = 110
  const winX = ROOM.x + 48
  const winW = ROOM.w - 96

  const sky = ctx.createLinearGradient(0, winY, 0, winY + winH)
  sky.addColorStop(0, '#3a2820')
  sky.addColorStop(0.35, '#1e2830')
  sky.addColorStop(1, '#0c1410')
  ctx.fillStyle = sky
  roundRect(ctx, winX, winY, winW, winH, 6)
  ctx.fill()

  drawColossalBeyond(ctx, winX, winY, winW, winH, t)

  // Three wall layers in the vista
  ctx.fillStyle = 'rgba(18, 26, 22, 0.95)'
  ctx.fillRect(winX + 20, winY + 58, winW * 0.2, winH - 58)
  ctx.fillRect(winX + winW * 0.28, winY + 42, winW * 0.3, winH - 42)
  ctx.fillRect(winX + winW * 0.62, winY + 52, winW * 0.28, winH - 52)
  // Battlements
  ctx.fillStyle = 'rgba(28, 38, 32, 0.9)'
  for (let i = 0; i < 14; i++) {
    const bx = winX + 24 + i * ((winW - 48) / 14)
    ctx.fillRect(bx, winY + 42 + (i % 3) * 6, 14, 12)
  }

  // Green titan steam
  for (let i = 0; i < 8; i++) {
    const sx = winX + 50 + ((i * 89 + t * 22) % (winW - 100))
    const sy = winY + 10 + Math.sin(t * 0.9 + i) * 6
    const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, 28 + i * 3)
    g.addColorStop(0, `rgba(126, 200, 154, ${0.16 + Math.sin(t + i) * 0.05})`)
    g.addColorStop(1, 'rgba(126, 200, 154, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(sx, sy, 22 + i * 2, 12, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Gate arch overlay
  ctx.strokeStyle = 'rgba(212, 165, 116, 0.45)'
  ctx.lineWidth = 3
  roundRect(ctx, winX, winY, winW, winH, 6)
  ctx.stroke()
  ctx.font = '700 11px Outfit, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(240, 201, 138, 0.55)'
  ctx.textAlign = 'center'
  ctx.fillText('BEYOND THE WALL', winX + winW / 2, winY + winH - 10)

  // Side banners
  drawCorpsBanner(ctx, ROOM.x + 48, ROOM.y + ROOM.h * 0.42, 1.15)
  drawCorpsBanner(ctx, ROOM.x + ROOM.w - 48, ROOM.y + ROOM.h * 0.42, 1.15)

  // ODM cable lines (decorative)
  ctx.strokeStyle = 'rgba(212, 165, 116, 0.18)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(ROOM.x + 80, ROOM.y + 140)
  ctx.quadraticCurveTo(ROOM.x + ROOM.w / 2, ROOM.y + 100, ROOM.x + ROOM.w - 80, ROOM.y + 140)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(ROOM.x + 100, ROOM.y + ROOM.h - 40)
  ctx.quadraticCurveTo(ROOM.x + ROOM.w / 2, ROOM.y + ROOM.h - 80, ROOM.x + ROOM.w - 100, ROOM.y + ROOM.h - 40)
  ctx.stroke()

  // Stone floor
  ctx.fillStyle = '#1c2622'
  ctx.fillRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h)
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
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

  // Rally pad — wing motif ring
  const cx = FLOOR.x + FLOOR.w / 2
  const cy = FLOOR.y + FLOOR.h * 0.52
  ctx.beginPath()
  ctx.ellipse(cx, cy, 158, 74, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(107, 154, 98, 0.12)'
  ctx.fill()
  ctx.strokeStyle = `rgba(107, 154, 98, ${0.42 + Math.sin(t * 1.5) * 0.1 + voice * 0.15})`
  ctx.lineWidth = 3.5
  ctx.stroke()

  // Mini wings in pad center
  ctx.fillStyle = `rgba(126, 200, 154, ${0.2 + Math.sin(t) * 0.05})`
  ctx.beginPath()
  ctx.moveTo(cx, cy - 22)
  ctx.lineTo(cx - 36, cy - 2)
  ctx.lineTo(cx - 10, cy + 2)
  ctx.lineTo(cx - 28, cy + 22)
  ctx.lineTo(cx, cy + 6)
  ctx.lineTo(cx + 28, cy + 22)
  ctx.lineTo(cx + 10, cy + 2)
  ctx.lineTo(cx + 36, cy - 2)
  ctx.closePath()
  ctx.fill()

  ctx.font = '700 12px Outfit, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(240, 201, 138, 0.7)'
  ctx.textAlign = 'center'
  ctx.fillText('RALLY HERE', cx, cy + 36)

  if (voice > 0.05) {
    const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, 210)
    g.addColorStop(0, `rgba(107, 154, 98, ${voice * 0.16})`)
    g.addColorStop(1, 'rgba(107, 154, 98, 0)')
    ctx.fillStyle = g
    ctx.fillRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h)
  }

  if ((ambience.pulse || 0) > 0) {
    ctx.fillStyle = `rgba(126, 200, 154, ${ambience.pulse * 0.16})`
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
  ctx.fillStyle = 'rgba(14, 18, 16, 0.94)'
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

  ctx.fillStyle = 'rgba(8, 12, 10, 0.9)'
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
