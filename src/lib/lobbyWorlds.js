/**
 * Chaos lobbies — themed rooms for the party before PLAY.
 * Shared floor bounds; each world has its own furniture, palette, relic, and vibe.
 */
import {
  FLOOR,
  ROOM,
  STATIC_COLLIDERS as TEMPLE_COLLIDERS,
  drawLivingRoom,
  drawLivingProp,
  makeLivingRoomProps,
  PLAYER_R,
} from './templeRoom.js'

export { FLOOR, ROOM, PLAYER_R }

const RX = ROOM.x
const RY = ROOM.y

function walls() {
  return [
    { x: FLOOR.x, y: FLOOR.y - 18, w: FLOOR.w, h: 18 },
    { x: FLOOR.x, y: FLOOR.y + FLOOR.h, w: FLOOR.w, h: 18 },
    { x: FLOOR.x - 18, y: FLOOR.y, w: 18, h: FLOOR.h },
    { x: FLOOR.x + FLOOR.w, y: FLOOR.y, w: 18, h: FLOOR.h },
  ]
}

function fillRound(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}

function drawAmbienceParticles(ctx, t, kind, voiceLevel = 0) {
  const n = kind === 'neon' ? 18 : 14
  for (let i = 0; i < n; i++) {
    const seed = i * 97.13
    const x = FLOOR.x + ((seed * 13 + t * (12 + voiceLevel * 40)) % FLOOR.w)
    const y =
      FLOOR.y +
      20 +
      ((seed * 7 + Math.sin(t * 0.7 + i) * 30 + (1 - voiceLevel) * 20) % (FLOOR.h - 40))
    const a = 0.15 + voiceLevel * 0.35 + (Math.sin(t * 2 + i) + 1) * 0.08
    if (kind === 'incense') {
      ctx.fillStyle = `rgba(200,180,140,${a * 0.45})`
      ctx.beginPath()
      ctx.arc(x, y, 3 + voiceLevel * 4, 0, Math.PI * 2)
      ctx.fill()
    } else if (kind === 'dust') {
      ctx.fillStyle = `rgba(232,196,120,${a})`
      ctx.fillRect(x, y, 2, 2)
    } else if (kind === 'chips') {
      ctx.fillStyle = i % 2 ? `rgba(80,220,120,${a})` : `rgba(240,80,100,${a})`
      ctx.fillRect(x, y, 3, 2)
    } else if (kind === 'snow') {
      ctx.fillStyle = `rgba(230,240,255,${0.25 + a})`
      ctx.beginPath()
      ctx.arc(x, y, 1.5, 0, Math.PI * 2)
      ctx.fill()
    } else if (kind === 'neon') {
      ctx.fillStyle = i % 3 === 0 ? `rgba(0,255,200,${a})` : `rgba(255,0,180,${a})`
      ctx.fillRect(x, y, 2, 6)
    }
  }
}

function drawTempleRoom(ctx, t, ambience = {}) {
  drawLivingRoom(ctx, t)
  drawAmbienceParticles(ctx, t, 'incense', ambience.voiceLevel || 0)
  if (ambience.pulse > 0) {
    ctx.fillStyle = `rgba(255,180,60,${ambience.pulse * 0.12})`
    ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h)
  }
}

function drawDesertRoom(ctx, t, ambience = {}) {
  // Warm sand pavilion
  ctx.fillStyle = '#2a1c12'
  ctx.fillRect(ROOM.x - 20, ROOM.y - 20, ROOM.w + 40, ROOM.h + 40)
  const sky = ctx.createLinearGradient(0, ROOM.y, 0, ROOM.y + 120)
  sky.addColorStop(0, '#c4783a')
  sky.addColorStop(1, '#e8b86a')
  ctx.fillStyle = sky
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, 90)
  // Sun
  ctx.fillStyle = 'rgba(255,220,120,0.85)'
  ctx.beginPath()
  ctx.arc(RX + 980, RY + 48, 28, 0, Math.PI * 2)
  ctx.fill()
  // Sand floor
  ctx.fillStyle = '#c9a06a'
  ctx.fillRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h)
  ctx.fillStyle = 'rgba(160,110,60,0.25)'
  for (let i = 0; i < 8; i++) {
    ctx.beginPath()
    ctx.ellipse(FLOOR.x + 80 + i * 130, FLOOR.y + 200 + (i % 3) * 60, 70, 18, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  // Tents
  fillRound(ctx, RX + 140, RY + 180, 120, 90, 8, '#8b4518')
  ctx.fillStyle = '#d4a574'
  ctx.beginPath()
  ctx.moveTo(RX + 130, RY + 180)
  ctx.lineTo(RX + 200, RY + 130)
  ctx.lineTo(RX + 270, RY + 180)
  ctx.fill()
  fillRound(ctx, RX + 920, RY + 200, 110, 80, 8, '#6b3a1f')
  ctx.fillStyle = '#e8c08a'
  ctx.beginPath()
  ctx.moveTo(RX + 910, RY + 200)
  ctx.lineTo(RX + 975, RY + 155)
  ctx.lineTo(RX + 1040, RY + 200)
  ctx.fill()
  // Oasis pool
  ctx.fillStyle = '#2a6a7a'
  ctx.beginPath()
  ctx.ellipse(RX + 560, RY + 360, 90, 40, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(120,220,200,0.35)'
  ctx.beginPath()
  ctx.ellipse(RX + 560, RY + 360, 70, 28, 0, 0, Math.PI * 2)
  ctx.fill()
  // Palm stumps
  ctx.fillStyle = '#5a3a22'
  ctx.fillRect(RX + 470, RY + 300, 14, 50)
  ctx.fillRect(RX + 630, RY + 300, 14, 50)
  ctx.fillStyle = '#3d7a3a'
  ctx.beginPath()
  ctx.arc(RX + 477, RY + 295, 22, 0, Math.PI * 2)
  ctx.arc(RX + 637, RY + 295, 22, 0, Math.PI * 2)
  ctx.fill()
  drawAmbienceParticles(ctx, t, 'dust', ambience.voiceLevel || 0)
  if (ambience.pulse > 0) {
    ctx.fillStyle = `rgba(255,200,80,${ambience.pulse * 0.15})`
    ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h)
  }
}

function drawCasinoRoom(ctx, t, ambience = {}) {
  ctx.fillStyle = '#120818'
  ctx.fillRect(ROOM.x - 20, ROOM.y - 20, ROOM.w + 40, ROOM.h + 40)
  // Carpet
  ctx.fillStyle = '#3a0a18'
  ctx.fillRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h)
  ctx.strokeStyle = 'rgba(212,165,116,0.35)'
  ctx.lineWidth = 2
  for (let x = FLOOR.x + 40; x < FLOOR.x + FLOOR.w; x += 80) {
    ctx.beginPath()
    ctx.moveTo(x, FLOOR.y)
    ctx.lineTo(x, FLOOR.y + FLOOR.h)
    ctx.stroke()
  }
  // Neon trim
  ctx.strokeStyle = `rgba(0,255,180,${0.4 + Math.sin(t * 3) * 0.2})`
  ctx.lineWidth = 3
  ctx.strokeRect(FLOOR.x + 4, FLOOR.y + 4, FLOOR.w - 8, FLOOR.h - 8)
  ctx.strokeStyle = `rgba(255,40,120,${0.35 + Math.sin(t * 2.2 + 1) * 0.2})`
  ctx.strokeRect(FLOOR.x + 12, FLOOR.y + 12, FLOOR.w - 24, FLOOR.h - 24)
  // Tables
  fillRound(ctx, RX + 200, RY + 220, 160, 100, 50, '#0d4a2e')
  fillRound(ctx, RX + 520, RY + 250, 180, 110, 55, '#0d4a2e')
  fillRound(ctx, RX + 860, RY + 220, 160, 100, 50, '#0d4a2e')
  ctx.fillStyle = '#d4a574'
  ctx.font = '700 14px Outfit, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('21', RX + 280, RY + 275)
  ctx.fillText('ROULETTE', RX + 610, RY + 310)
  ctx.fillText('♠ ♥', RX + 940, RY + 275)
  // Slot bank
  fillRound(ctx, RX + 480, RY + 430, 260, 70, 10, '#1a1020')
  ctx.fillStyle = `rgba(255,215,80,${0.5 + Math.sin(t * 6) * 0.3})`
  ctx.fillRect(RX + 500, RY + 448, 50, 36)
  ctx.fillRect(RX + 585, RY + 448, 50, 36)
  ctx.fillRect(RX + 670, RY + 448, 50, 36)
  drawAmbienceParticles(ctx, t, 'chips', ambience.voiceLevel || 0)
  if (ambience.pulse > 0) {
    ctx.fillStyle = `rgba(0,255,160,${ambience.pulse * 0.18})`
    ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h)
  }
}

function drawLodgeRoom(ctx, t, ambience = {}) {
  ctx.fillStyle = '#1a1410'
  ctx.fillRect(ROOM.x - 20, ROOM.y - 20, ROOM.w + 40, ROOM.h + 40)
  // Night window
  const win = ctx.createLinearGradient(0, ROOM.y, 0, ROOM.y + 100)
  win.addColorStop(0, '#1a2840')
  win.addColorStop(1, '#0a1018')
  ctx.fillStyle = win
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, 100)
  // Snow outside
  ctx.fillStyle = 'rgba(220,230,245,0.5)'
  for (let i = 0; i < 20; i++) {
    const x = ROOM.x + ((i * 73 + t * 20) % ROOM.w)
    const y = ROOM.y + 10 + ((i * 41 + t * 35) % 80)
    ctx.beginPath()
    ctx.arc(x, y, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }
  // Wood floor
  ctx.fillStyle = '#5a3d28'
  ctx.fillRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h)
  ctx.strokeStyle = 'rgba(30,18,10,0.35)'
  for (let y = FLOOR.y; y < FLOOR.y + FLOOR.h; y += 28) {
    ctx.beginPath()
    ctx.moveTo(FLOOR.x, y)
    ctx.lineTo(FLOOR.x + FLOOR.w, y)
    ctx.stroke()
  }
  // Fireplace
  fillRound(ctx, RX + 520, RY + 160, 180, 120, 8, '#2a1a12')
  ctx.fillStyle = `rgba(255,${120 + Math.sin(t * 8) * 40},40,0.9)`
  ctx.beginPath()
  ctx.moveTo(RX + 560, RY + 260)
  ctx.lineTo(RX + 610, RY + 180 + Math.sin(t * 9) * 8)
  ctx.lineTo(RX + 660, RY + 260)
  ctx.fill()
  // Couches
  fillRound(ctx, RX + 160, RY + 320, 200, 70, 12, '#4a3030')
  fillRound(ctx, RX + 860, RY + 320, 200, 70, 12, '#4a3030')
  // Rug
  ctx.fillStyle = '#6b3030'
  ctx.beginPath()
  ctx.ellipse(RX + 610, RY + 400, 140, 50, 0, 0, Math.PI * 2)
  ctx.fill()
  drawAmbienceParticles(ctx, t, 'snow', ambience.voiceLevel || 0)
  if (ambience.pulse > 0) {
    ctx.fillStyle = `rgba(255,140,60,${ambience.pulse * 0.14})`
    ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h)
  }
}

function drawArcadeRoom(ctx, t, ambience = {}) {
  ctx.fillStyle = '#06060e'
  ctx.fillRect(ROOM.x - 20, ROOM.y - 20, ROOM.w + 40, ROOM.h + 40)
  // Grid floor
  ctx.fillStyle = '#0c0c18'
  ctx.fillRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h)
  ctx.strokeStyle = 'rgba(0,255,200,0.15)'
  ctx.lineWidth = 1
  for (let x = FLOOR.x; x < FLOOR.x + FLOOR.w; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, FLOOR.y)
    ctx.lineTo(x, FLOOR.y + FLOOR.h)
    ctx.stroke()
  }
  for (let y = FLOOR.y; y < FLOOR.y + FLOOR.h; y += 40) {
    ctx.beginPath()
    ctx.moveTo(FLOOR.x, y)
    ctx.lineTo(FLOOR.x + FLOOR.w, y)
    ctx.stroke()
  }
  // Cabinets
  const cabs = [
    [180, 200, '#ff2d95'],
    [340, 200, '#00f0ff'],
    [820, 200, '#b4ff00'],
    [980, 200, '#ff6b2d'],
    [500, 380, '#c44dff'],
    [680, 380, '#2d7dff'],
  ]
  for (const [x, y, col] of cabs) {
    fillRound(ctx, RX + x, RY + y, 70, 100, 6, '#141422')
    ctx.fillStyle = col
    ctx.globalAlpha = 0.55 + Math.sin(t * 4 + x) * 0.25
    ctx.fillRect(RX + x + 10, RY + y + 12, 50, 36)
    ctx.globalAlpha = 1
    ctx.fillStyle = '#222'
    ctx.fillRect(RX + x + 18, RY + y + 60, 34, 22)
  }
  // Dance pad
  fillRound(ctx, RX + 540, RY + 500, 140, 50, 6, '#1a1a28')
  ctx.fillStyle = `rgba(255,0,180,${0.4 + Math.sin(t * 5) * 0.3})`
  ctx.fillRect(RX + 555, RY + 512, 28, 28)
  ctx.fillStyle = `rgba(0,255,200,${0.4 + Math.sin(t * 5 + 1) * 0.3})`
  ctx.fillRect(RX + 595, RY + 512, 28, 28)
  ctx.fillStyle = `rgba(255,220,0,${0.4 + Math.sin(t * 5 + 2) * 0.3})`
  ctx.fillRect(RX + 635, RY + 512, 28, 28)
  drawAmbienceParticles(ctx, t, 'neon', ambience.voiceLevel || 0)
  if (ambience.pulse > 0) {
    ctx.fillStyle = `rgba(255,0,200,${ambience.pulse * 0.16})`
    ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h)
  }
}

function makeSimpleProps(specs) {
  return specs.map((s, i) => ({
    id: `p-${i}`,
    kind: s.kind || 'generic',
    x: s.x,
    y: s.y,
    r: s.r || 12,
    mass: s.mass || 1,
    vx: 0,
    vy: 0,
    rot: 0,
    color: s.color || '#c4a574',
  }))
}

function drawSimpleProp(ctx, p) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rot || 0)
  ctx.fillStyle = p.color || '#c4a574'
  ctx.beginPath()
  ctx.arc(0, 0, p.r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()
}

export const LOBBY_WORLDS = {
  temple: {
    id: 'temple',
    name: 'Temple',
    tagline: 'Incense, rugs, and righteous smacks',
    accent: '#d4a574',
    moveSpeed: 185,
    colliders: TEMPLE_COLLIDERS,
    drawRoom: drawTempleRoom,
    makeProps: makeLivingRoomProps,
    drawProp: drawLivingProp,
    relic: { glyph: '🔔', label: 'Temple bell', holdMs: 8000 },
    ambience: 'incense',
  },
  desert: {
    id: 'desert',
    name: 'Desert oasis',
    tagline: 'Sand in your shoes, sun in your eyes',
    accent: '#e8b86a',
    moveSpeed: 205,
    colliders: [
      ...walls(),
      { x: RX + 140, y: RY + 160, w: 130, h: 110 },
      { x: RX + 920, y: RY + 180, w: 120, h: 100 },
      { x: RX + 480, y: RY + 330, w: 160, h: 70 },
      { x: RX + 460, y: RY + 290, w: 30, h: 60 },
      { x: RX + 620, y: RY + 290, w: 30, h: 60 },
    ],
    drawRoom: drawDesertRoom,
    makeProps: () =>
      makeSimpleProps([
        { x: 360, y: 480, r: 10, color: '#c4783a', kind: 'pot' },
        { x: 820, y: 500, r: 11, color: '#a06030', kind: 'pot' },
        { x: 640, y: 520, r: 8, color: '#e8c08a', kind: 'coin' },
        { x: 300, y: 360, r: 9, color: '#d4a060', kind: 'pot' },
        { x: 980, y: 420, r: 10, color: '#b87840', kind: 'pot' },
      ]),
    drawProp: drawSimpleProp,
    relic: { glyph: '🪲', label: 'Golden scarab', holdMs: 7500 },
    ambience: 'dust',
  },
  casino: {
    id: 'casino',
    name: 'Midnight casino',
    tagline: 'Neon, nerves, and bad decisions',
    accent: '#00e5b0',
    moveSpeed: 195,
    colliders: [
      ...walls(),
      { x: RX + 200, y: RY + 220, w: 160, h: 100 },
      { x: RX + 520, y: RY + 250, w: 180, h: 110 },
      { x: RX + 860, y: RY + 220, w: 160, h: 100 },
      { x: RX + 480, y: RY + 430, w: 260, h: 70 },
    ],
    drawRoom: drawCasinoRoom,
    makeProps: () =>
      makeSimpleProps([
        { x: 400, y: 480, r: 7, color: '#50dc78', kind: 'chip' },
        { x: 780, y: 490, r: 7, color: '#f05064', kind: 'chip' },
        { x: 300, y: 400, r: 7, color: '#f0d050', kind: 'chip' },
        { x: 900, y: 400, r: 7, color: '#5080f0', kind: 'chip' },
        { x: 640, y: 560, r: 9, color: '#e8c08a', kind: 'chip' },
      ]),
    drawProp: drawSimpleProp,
    relic: { glyph: '🎰', label: 'Lucky chip', holdMs: 6500 },
    ambience: 'chips',
  },
  lodge: {
    id: 'lodge',
    name: 'Alpine lodge',
    tagline: 'Fire crackles. Snow watches.',
    accent: '#e07a5f',
    moveSpeed: 165,
    colliders: [
      ...walls(),
      { x: RX + 520, y: RY + 160, w: 180, h: 120 },
      { x: RX + 160, y: RY + 320, w: 200, h: 70 },
      { x: RX + 860, y: RY + 320, w: 200, h: 70 },
    ],
    drawRoom: drawLodgeRoom,
    makeProps: () =>
      makeSimpleProps([
        { x: 420, y: 480, r: 10, color: '#8b5a3c', kind: 'mug' },
        { x: 780, y: 500, r: 10, color: '#6b4030', kind: 'mug' },
        { x: 560, y: 540, r: 12, color: '#c4a090', kind: 'pillow' },
        { x: 700, y: 540, r: 12, color: '#a08070', kind: 'pillow' },
      ]),
    drawProp: drawSimpleProp,
    relic: { glyph: '☕', label: 'Cursed cocoa', holdMs: 9000 },
    ambience: 'snow',
  },
  arcade: {
    id: 'arcade',
    name: 'Neon arcade',
    tagline: 'Insert coin. Cause problems.',
    accent: '#ff2d95',
    moveSpeed: 220,
    colliders: [
      ...walls(),
      { x: RX + 180, y: RY + 200, w: 70, h: 100 },
      { x: RX + 340, y: RY + 200, w: 70, h: 100 },
      { x: RX + 820, y: RY + 200, w: 70, h: 100 },
      { x: RX + 980, y: RY + 200, w: 70, h: 100 },
      { x: RX + 500, y: RY + 380, w: 70, h: 100 },
      { x: RX + 680, y: RY + 380, w: 70, h: 100 },
    ],
    drawRoom: drawArcadeRoom,
    makeProps: () =>
      makeSimpleProps([
        { x: 450, y: 520, r: 8, color: '#00f0ff', kind: 'cart' },
        { x: 800, y: 540, r: 8, color: '#ff2d95', kind: 'cart' },
        { x: 320, y: 420, r: 9, color: '#b4ff00', kind: 'cart' },
        { x: 960, y: 420, r: 9, color: '#c44dff', kind: 'cart' },
      ]),
    drawProp: drawSimpleProp,
    relic: { glyph: '💾', label: 'Glitch cart', holdMs: 6000 },
    ambience: 'neon',
  },
}

export const LOBBY_THEME_IDS = Object.keys(LOBBY_WORLDS)

export function getLobbyWorld(themeId) {
  return LOBBY_WORLDS[themeId] || LOBBY_WORLDS.temple
}

export function drawRelic(ctx, relic, world, t) {
  if (!relic || relic.holderId) return
  const bob = Math.sin(t * 3.5) * 4
  const x = relic.x
  const y = relic.y + bob
  ctx.save()
  ctx.shadowColor = world.accent
  ctx.shadowBlur = 18
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.beginPath()
  ctx.ellipse(relic.x, relic.y + 10, 16, 6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.font = '28px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(world.relic.glyph, x, y)
  ctx.shadowBlur = 0
  ctx.font = '600 10px Outfit, sans-serif'
  ctx.fillStyle = 'rgba(255,248,230,0.9)'
  ctx.fillText(world.relic.label, x, y + 22)
  ctx.restore()
}

export function drawRelicOverPlayer(ctx, x, y, world, t, relic = null) {
  const bob = Math.sin(t * 5) * 3
  const gx = x + 18
  const gy = y - 28 + bob
  if (relic?.fuseAt && relic.fuseAt > Date.now()) {
    const hold = world.relic.holdMs || 8000
    const left = Math.max(0, relic.fuseAt - Date.now())
    const p = 1 - left / hold
    ctx.save()
    ctx.beginPath()
    ctx.arc(gx, gy, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p)
    ctx.strokeStyle = p > 0.7 ? '#ff6b4a' : world.accent
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.restore()
  }
  ctx.font = '22px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(world.relic.glyph, gx, gy)
}
