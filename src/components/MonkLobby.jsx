import { useEffect, useRef, useState } from 'react'
import { MONK_VIBES } from '../data/locations'

const WORLD = { w: 1280, h: 720 }
const FLOOR = { x: 90, y: 210, w: 1100, h: 430 }
const BH = { x: 980, y: 400, r: 58 }
const SPEED = 210
const SPAWN_SPOTS = [
  { x: 300, y: 430, facing: 1 },
  { x: 460, y: 500, facing: -1 },
  { x: 620, y: 420, facing: 1 },
  { x: 780, y: 510, facing: -1 },
  { x: 900, y: 440, facing: 1 },
]

const KEY = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  W: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  S: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  A: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
  D: { x: 1, y: 0 },
}

function vibeOf(id, name) {
  let h = 0
  const s = String(id || name || 'monk')
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return MONK_VIBES[h % MONK_VIBES.length]
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n))
}

function softBody(ctx, x, y, robe, sash, skin, facing, walk, stretchX = 1, stretchY = 1) {
  const bob = Math.sin(walk * 10) * 1.4
  const leg = Math.sin(walk * 11) * 5
  ctx.save()
  ctx.translate(x, y + bob)
  ctx.scale(facing < 0 ? -stretchX : stretchX, stretchY)

  ctx.fillStyle = 'rgba(20,12,6,0.22)'
  ctx.beginPath()
  ctx.ellipse(0, 30, 16, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = robe
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-7, 18)
  ctx.lineTo(-7 - leg * 0.25, 30)
  ctx.moveTo(7, 18)
  ctx.lineTo(7 + leg * 0.25, 30)
  ctx.stroke()

  ctx.fillStyle = robe
  ctx.beginPath()
  ctx.moveTo(-15, -6)
  ctx.quadraticCurveTo(-18, 10, -12, 22)
  ctx.lineTo(12, 22)
  ctx.quadraticCurveTo(18, 10, 15, -6)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = sash
  ctx.fillRect(-14, 4, 28, 5)
  ctx.beginPath()
  ctx.moveTo(2, -4)
  ctx.quadraticCurveTo(18, 6, 10, 20)
  ctx.quadraticCurveTo(4, 14, 2, 4)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = skin
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(-14, 2)
  ctx.quadraticCurveTo(-22, 8 + leg * 0.2, -16, 16)
  ctx.moveTo(14, 2)
  ctx.quadraticCurveTo(22, 6 - leg * 0.2, 17, 15)
  ctx.stroke()

  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.ellipse(0, -18, 13, 14, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1a1008'
  ctx.beginPath()
  ctx.ellipse(0, -26, 13, 7, 0, Math.PI, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#2a1a0c'
  ctx.beginPath()
  ctx.ellipse(-4.5, -19, 1.5, 2, 0, 0, Math.PI * 2)
  ctx.ellipse(4.5, -19, 1.5, 2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#5a3a28'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.arc(0, -14, 3.5, 0.15, Math.PI - 0.15)
  ctx.stroke()

  ctx.restore()
}

function drawHall(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, WORLD.h)
  g.addColorStop(0, '#1a100c')
  g.addColorStop(0.35, '#3a2418')
  g.addColorStop(0.55, '#5c3a24')
  g.addColorStop(1, '#2a1810')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, WORLD.w, WORLD.h)

  // Ceiling beams
  ctx.fillStyle = '#1a1008'
  for (let i = 0; i < 7; i++) {
    const x = 80 + i * 180
    ctx.fillRect(x, 0, 28, 200)
    ctx.fillStyle = '#5a3a22'
    ctx.fillRect(x + 4, 0, 8, 200)
    ctx.fillStyle = '#1a1008'
  }

  // Back wall fresco strip
  ctx.fillStyle = '#4a3020'
  ctx.fillRect(60, 70, WORLD.w - 120, 130)
  ctx.fillStyle = '#c9a227'
  ctx.fillRect(60, 70, WORLD.w - 120, 6)
  ctx.fillRect(60, 194, WORLD.w - 120, 6)

  // Buddha niches
  for (let i = 0; i < 5; i++) {
    const x = 160 + i * 220
    ctx.fillStyle = '#2a1810'
    ctx.beginPath()
    ctx.moveTo(x - 48, 190)
    ctx.quadraticCurveTo(x - 48, 90, x, 82)
    ctx.quadraticCurveTo(x + 48, 90, x + 48, 190)
    ctx.fill()
    ctx.fillStyle = '#d4af37'
    ctx.beginPath()
    ctx.ellipse(x, 128, 18, 22, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#b8860b'
    ctx.fillRect(x - 22, 148, 44, 36)
    ctx.fillStyle = 'rgba(255,210,100,0.12)'
    ctx.beginPath()
    ctx.arc(x, 130, 40 + Math.sin(t * 2 + i) * 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // Floor
  const fg = ctx.createLinearGradient(0, FLOOR.y, 0, FLOOR.y + FLOOR.h)
  fg.addColorStop(0, '#8b5a2b')
  fg.addColorStop(1, '#5a3818')
  ctx.fillStyle = fg
  ctx.fillRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h)

  ctx.strokeStyle = 'rgba(40,22,10,0.25)'
  ctx.lineWidth = 1
  for (let y = FLOOR.y; y < FLOOR.y + FLOOR.h; y += 36) {
    ctx.beginPath()
    ctx.moveTo(FLOOR.x, y)
    ctx.lineTo(FLOOR.x + FLOOR.w, y)
    ctx.stroke()
  }
  for (let x = FLOOR.x; x < FLOOR.x + FLOOR.w; x += 48) {
    ctx.beginPath()
    ctx.moveTo(x, FLOOR.y)
    ctx.lineTo(x, FLOOR.y + FLOOR.h)
    ctx.stroke()
  }

  // Prayer mats
  const mats = [
    [220, 480],
    [380, 520],
    [540, 470],
    [700, 530],
  ]
  mats.forEach(([mx, my], i) => {
    ctx.save()
    ctx.translate(mx, my)
    ctx.rotate(-0.08 + i * 0.04)
    ctx.fillStyle = '#7a1f1f'
    ctx.fillRect(-34, -18, 68, 36)
    ctx.fillStyle = '#c9a227'
    ctx.strokeRect(-34, -18, 68, 36)
    ctx.fillRect(-28, -4, 56, 4)
    ctx.restore()
  })

  // Offering table
  ctx.fillStyle = '#3a2414'
  ctx.fillRect(180, 300, 120, 18)
  ctx.fillRect(190, 318, 14, 40)
  ctx.fillRect(276, 318, 14, 40)
  ctx.fillStyle = '#c9a227'
  ctx.beginPath()
  ctx.arc(210, 292, 6, 0, Math.PI * 2)
  ctx.arc(240, 288, 7, 0, Math.PI * 2)
  ctx.arc(270, 292, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,160,40,0.5)'
  ctx.beginPath()
  ctx.arc(210, 284, 4 + Math.sin(t * 8) * 1.5, 0, Math.PI * 2)
  ctx.arc(240, 278, 5 + Math.sin(t * 9) * 1.5, 0, Math.PI * 2)
  ctx.arc(270, 284, 4 + Math.sin(t * 7) * 1.5, 0, Math.PI * 2)
  ctx.fill()

  // Incense smoke near altar
  for (let i = 0; i < 5; i++) {
    const sx = 240 + Math.sin(t * 0.7 + i) * 8
    const sy = 260 - ((t * 28 + i * 18) % 70)
    ctx.fillStyle = `rgba(220,200,180,${0.12 - i * 0.015})`
    ctx.beginPath()
    ctx.ellipse(sx, sy, 10 + i * 2, 16, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Side pillars
  ;[120, 1160].forEach((px) => {
    ctx.fillStyle = '#2a1810'
    ctx.fillRect(px - 22, 200, 44, 430)
    ctx.fillStyle = '#c9a227'
    ctx.fillRect(px - 26, 200, 52, 14)
    ctx.fillRect(px - 26, 610, 52, 14)
  })

  // Bell
  ctx.fillStyle = '#8a7010'
  ctx.beginPath()
  ctx.moveTo(150, 250)
  ctx.quadraticCurveTo(150, 290, 170, 300)
  ctx.quadraticCurveTo(190, 290, 190, 250)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#c9a227'
  ctx.lineWidth = 2
  ctx.stroke()

  // Tea table & cushions
  ctx.fillStyle = '#4a3020'
  ctx.fillRect(480, 320, 90, 12)
  ctx.fillRect(488, 332, 10, 28)
  ctx.fillRect(552, 332, 10, 28)
  ;[
    [470, 365],
    [560, 368],
    [515, 380],
  ].forEach(([cx, cy], i) => {
    ctx.fillStyle = i === 2 ? '#6b2a2a' : '#7a1f1f'
    ctx.beginPath()
    ctx.ellipse(cx, cy, 22, 14, 0, 0, Math.PI * 2)
    ctx.fill()
  })

  // Bookshelf & scrolls
  ctx.fillStyle = '#2a1810'
  ctx.fillRect(860, 260, 70, 110)
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = ['#8b4513', '#5a3818', '#7a5020', '#4a3020'][i]
    ctx.fillRect(868 + (i % 2) * 28, 270 + Math.floor(i / 2) * 38, 22, 30)
  }

  // Hanging lanterns
  for (let i = 0; i < 4; i++) {
    const lx = 220 + i * 240
    ctx.strokeStyle = '#5a3a22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(lx, 0)
    ctx.lineTo(lx, 120)
    ctx.stroke()
    ctx.fillStyle = '#c97830'
    ctx.fillRect(lx - 14, 118, 28, 34)
    ctx.fillStyle = `rgba(255,200,100,${0.08 + Math.sin(t * 3 + i) * 0.04})`
    ctx.beginPath()
    ctx.arc(lx, 148, 40, 0, Math.PI * 2)
    ctx.fill()
  }

  // Light beams
  for (let i = 0; i < 3; i++) {
    const bx = 280 + i * 320
    ctx.fillStyle = `rgba(255,220,160,${0.03 + Math.sin(t + i) * 0.01})`
    ctx.beginPath()
    ctx.moveTo(bx - 30, 80)
    ctx.lineTo(bx + 80, 80)
    ctx.lineTo(bx + 140, FLOOR.y + FLOOR.h)
    ctx.lineTo(bx - 60, FLOOR.y + FLOOR.h)
    ctx.closePath()
    ctx.fill()
  }

  // Shoe rack by entrance
  ctx.fillStyle = '#3a2414'
  ctx.fillRect(130, 560, 80, 8)
  ctx.fillRect(138, 568, 8, 22)
  ctx.fillRect(194, 568, 8, 22)
  ctx.fillStyle = '#2a1810'
  ctx.fillRect(142, 572, 22, 10)
  ctx.fillRect(162, 574, 20, 8)
}

function drawMeditationAlcove(ctx) {
  const { x, y } = BH
  ctx.fillStyle = '#2a1810'
  ctx.beginPath()
  ctx.arc(x, y, 72, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#c9a227'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y - 8, 38, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,210,120,0.08)'
  ctx.beginPath()
  ctx.arc(x, y - 8, 28, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,230,200,0.55)'
  ctx.font = '600 11px "Segoe UI", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('meditation alcove', x, y + 52)
}

function drawBlackHole(ctx, t, scale, suck) {
  if (scale <= 0.01) return
  const { x, y, r } = BH
  const pulse = 1 + Math.sin(t * 6) * 0.04
  const R = Math.max(2, r * scale * pulse * (1 + suck * 0.35))

  // Accretion disk
  for (let i = 8; i >= 1; i--) {
    const ang = t * (1.2 + i * 0.15)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(1.55, 0.42)
    const ag = ctx.createRadialGradient(0, 0, R * 0.3, 0, 0, R * (1.2 + i * 0.18))
    ag.addColorStop(0, `rgba(255,200,120,${0.08 * suck + 0.04})`)
    ag.addColorStop(0.45, `rgba(255,120,40,${0.12 + suck * 0.1})`)
    ag.addColorStop(0.75, `rgba(180,40,80,${0.1})`)
    ag.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = ag
    ctx.beginPath()
    ctx.arc(0, 0, R * (1.15 + i * 0.12), 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // Photon ring
  ctx.strokeStyle = `rgba(255,220,160,${0.2 + scale * 0.5 + suck * 0.4})`
  ctx.lineWidth = 2 + scale * 2 + suck * 2
  ctx.beginPath()
  ctx.ellipse(x, y, R * 1.35, R * 0.55, t * 0.4, 0, Math.PI * 2)
  ctx.stroke()

  // Event horizon
  const eg = ctx.createRadialGradient(x, y, 0, x, y, R)
  eg.addColorStop(0, '#000')
  eg.addColorStop(0.7, '#050508')
  eg.addColorStop(0.92, '#1a0a18')
  eg.addColorStop(1, 'rgba(40,10,30,0.3)')
  ctx.fillStyle = eg
  ctx.beginPath()
  ctx.arc(x, y, R, 0, Math.PI * 2)
  ctx.fill()

  // Inner void shimmer
  ctx.strokeStyle = `rgba(120,180,255,${0.1 + scale * 0.2 + suck * 0.25})`
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(x, y, R * 0.72, t, t + Math.PI * 1.2)
  ctx.stroke()

  if (scale < 0.85 && suck < 0.3) {
    ctx.fillStyle = `rgba(255,230,180,${0.4 + scale * 0.5})`
    ctx.font = '700 12px "Segoe UI", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('singularity forming…', x, y + R + 22)
  }
}

function drawNameplate(ctx, x, y, name, isSelf) {
  const label = (name || 'Monk').slice(0, 16)
  ctx.font = `700 12px "Segoe UI", system-ui, sans-serif`
  const tw = ctx.measureText(label).width
  const w = tw + 16
  const hx = x - w / 2
  const hy = y - 58

  ctx.fillStyle = 'rgba(20,10,6,0.78)'
  roundRect(ctx, hx, hy, w, 20, 6)
  ctx.fill()
  ctx.strokeStyle = isSelf ? 'rgba(255,200,100,0.85)' : 'rgba(200,160,100,0.45)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = '#ffe8c0'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x, hy + 10)
  ctx.textBaseline = 'alphabetic'
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function makeNpcs() {
  return [
    { name: 'Ananda', x: 260, y: 490, facing: 1, walk: 0, activity: 'sweep', t: 0, robe: '#6b4423', sash: '#c9a227', skin: '#ddb896' },
    { name: 'Maya', x: 540, y: 360, facing: -1, walk: 0, activity: 'incense', t: 1.2, robe: '#7a2840', sash: '#d4af37', skin: '#e0b898' },
    { name: 'Tenzin', x: 680, y: 470, facing: 1, walk: 0, activity: 'meditate', t: 0.5, robe: '#8b6914', sash: '#b8860b', skin: '#c9a882' },
    { name: 'Lotus', x: 420, y: 560, facing: -1, walk: 0, activity: 'tea', t: 2, robe: '#4a6741', sash: '#8fbc8f', skin: '#ddb896' },
    { name: 'Jizo', x: 820, y: 380, facing: 1, walk: 0, activity: 'chant', t: 0.8, robe: '#5a4632', sash: '#c97830', skin: '#c9a882' },
  ]
}

function updateNpc(npc, dt, t) {
  if (npc.activity === 'sweep') {
    const span = 120
    npc.x = 220 + ((t * 45 + npc.t * 50) % (span * 2))
    if (npc.x > 220 + span) npc.x = 220 + span * 2 - (npc.x - 220 - span)
    npc.facing = Math.sin(t * 0.8 + npc.t) > 0 ? 1 : -1
    npc.walk += dt * 1.4
  } else if (npc.activity === 'incense') {
    npc.walk = Math.sin(t * 1.5) * 0.05
  } else if (npc.activity === 'meditate') {
    npc.walk = 0
  } else if (npc.activity === 'tea') {
    npc.walk = Math.sin(t * 2 + npc.t) * 0.08
  } else if (npc.activity === 'chant') {
    npc.walk = Math.sin(t * 3) * 0.12
    npc.y = 380 + Math.sin(t * 0.6) * 3
  }
}

function drawActivityIcon(ctx, npc, t) {
  const icons = { incense: '🪔', meditate: '🧘', tea: '🍵', chant: '📿', sweep: '🧹' }
  const icon = icons[npc.activity]
  if (!icon) return
  ctx.font = '16px serif'
  ctx.textAlign = 'center'
  ctx.fillText(icon, npc.x + (npc.facing > 0 ? 24 : -24), npc.y - 44 + Math.sin(t * 2 + npc.t) * 2)
}

function canvasFromClient(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((clientX - rect.left) / rect.width) * WORLD.w,
    y: ((clientY - rect.top) / rect.height) * WORLD.h,
  }
}

function nearestPlayer(x, y, selfId, me, peers, players, maxDist = 70) {
  let best = null
  let bestD = maxDist
  for (const [id, pose] of peers.entries()) {
    const d = Math.hypot(pose.x - x, pose.y - y)
    if (d < bestD) {
      bestD = d
      best = { id, pose, name: players.find((p) => p.id === id)?.name || 'Monk' }
    }
  }
  return best
}

export function MonkLobby({
  selfId,
  players,
  lobby,
  onPose,
  onSmack,
  onEmote,
  countdownSec = null,
  portalActive = false,
  countdownStartedAt = 0,
  countdownEndsAt = 0,
  portalHold = false,
  focused = true,
}) {
  const canvasRef = useRef(null)
  const keysRef = useRef(new Set())
  const selfRef = useRef({
    x: FLOOR.x + 160,
    y: FLOOR.y + FLOOR.h / 2,
    facing: 1,
    walk: 0,
  })
  const peersRef = useRef(new Map())
  const debrisRef = useRef([])
  const lastSend = useRef(0)
  const lastTs = useRef(performance.now())
  const smackCd = useRef(0)
  const suckLocal = useRef({ active: false, stretchX: 1, stretchY: 1, spin: 0 })
  const portalRef = useRef({ scale: 0, suck: 0, active: false })
  const npcsRef = useRef(makeNpcs())
  const touchRef = useRef({ active: false, lastX: 0, lastY: 0, longPressTimer: null, moved: false })
  const playersRef = useRef(players)
  const callbacksRef = useRef({ onPose, onSmack, onEmote })
  const countdownRef = useRef(countdownSec)
  const [actionMenu, setActionMenu] = useState(null)
  playersRef.current = players
  callbacksRef.current = { onPose, onSmack, onEmote }
  countdownRef.current = countdownSec

  useEffect(() => {
    const map = peersRef.current
    const alive = new Set()
    for (const p of players) {
      if (p.id === selfId) continue
      alive.add(p.id)
      const pose = lobby?.[p.id] || {}
      const idx = Math.max(0, players.findIndex((x) => x.id === p.id))
      const spot = SPAWN_SPOTS[idx % SPAWN_SPOTS.length]
      const cur = map.get(p.id) || {
        x: pose.x ?? spot.x,
        y: pose.y ?? spot.y,
        facing: pose.facing ?? spot.facing,
        walk: 0,
        stretchX: 1,
        stretchY: 1,
        spin: 0,
      }
      if (pose.x != null) cur.tx = pose.x
      if (pose.y != null) cur.ty = pose.y
      if (cur.tx == null) {
        cur.tx = spot.x
        cur.ty = spot.y
        cur.x = spot.x
        cur.y = spot.y
      }
      cur.facing = pose.facing ?? cur.facing ?? spot.facing
      cur.emote = pose.emote
      cur.emoteUntil = pose.emoteUntil
      cur.hitFlash = pose.hitFlash
      map.set(p.id, cur)
    }
    for (const id of map.keys()) if (!alive.has(id)) map.delete(id)
  }, [lobby, players, selfId])

  useEffect(() => {
    const me = selfRef.current
    callbacksRef.current.onPose?.({ x: me.x, y: me.y, facing: me.facing })
  }, [])

  // Seed hall debris once
  useEffect(() => {
    if (debrisRef.current.length) return
    const items = []
    for (let i = 0; i < 28; i++) {
      items.push({
        x: FLOOR.x + 40 + Math.random() * (FLOOR.w - 200),
        y: FLOOR.y + 40 + Math.random() * (FLOOR.h - 80),
        kind: i % 5,
        rot: Math.random() * Math.PI * 2,
        s: 0.6 + Math.random() * 0.7,
        vx: 0,
        vy: 0,
      })
    }
    // A few recognizable props near the mats
    items.push({ x: 300, y: 500, kind: 10, rot: 0.2, s: 1, vx: 0, vy: 0 })
    items.push({ x: 520, y: 440, kind: 11, rot: -0.1, s: 1, vx: 0, vy: 0 })
    items.push({ x: 640, y: 560, kind: 12, rot: 0.4, s: 1, vx: 0, vy: 0 })
    debrisRef.current = items
  }, [])

  useEffect(() => {
    const down = (e) => {
      if (!focused) return
      if (KEY[e.key]) {
        keysRef.current.add(e.key)
        e.preventDefault()
      }
      if (e.code === 'Space') {
        e.preventDefault()
        if (smackCd.current <= 0) {
          smackCd.current = 0.4
          const me = selfRef.current
          const near = nearestPlayer(me.x, me.y, selfId, me, peersRef.current, playersRef.current, 95)
          callbacksRef.current.onSmack?.(near?.id)
        }
      }
      if (e.key === '1') callbacksRef.current.onEmote?.('wave')
      if (e.key === '2') callbacksRef.current.onEmote?.('bow')
      if (e.key === '3') callbacksRef.current.onEmote?.('laugh')
      if (e.key === '4') callbacksRef.current.onEmote?.('shock')
    }
    const up = (e) => keysRef.current.delete(e.key)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [focused])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !focused) return undefined

    const clearLongPress = () => {
      if (touchRef.current.longPressTimer) {
        clearTimeout(touchRef.current.longPressTimer)
        touchRef.current.longPressTimer = null
      }
    }

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      touchRef.current.active = true
      touchRef.current.lastX = t.clientX
      touchRef.current.lastY = t.clientY
      touchRef.current.moved = false
      clearLongPress()
      const pt = canvasFromClient(canvas, t.clientX, t.clientY)
      touchRef.current.longPressTimer = setTimeout(() => {
        if (touchRef.current.moved) return
        const near = nearestPlayer(pt.x, pt.y, selfId, selfRef.current, peersRef.current, playersRef.current, 80)
        if (near) {
          setActionMenu({
            targetId: near.id,
            targetName: near.name,
            clientX: t.clientX,
            clientY: t.clientY,
          })
        }
      }, 480)
    }

    const onTouchMove = (e) => {
      if (!touchRef.current.active || e.touches.length !== 1) return
      const t = e.touches[0]
      const dx = t.clientX - touchRef.current.lastX
      const dy = t.clientY - touchRef.current.lastY
      if (Math.hypot(dx, dy) > 8) {
        touchRef.current.moved = true
        clearLongPress()
      }
      touchRef.current.lastX = t.clientX
      touchRef.current.lastY = t.clientY
      const len = Math.hypot(dx, dy) || 1
      keysRef.current.clear()
      if (Math.abs(dx) > Math.abs(dy)) {
        keysRef.current.add(dx > 0 ? 'ArrowRight' : 'ArrowLeft')
      } else {
        keysRef.current.add(dy > 0 ? 'ArrowDown' : 'ArrowUp')
      }
      e.preventDefault()
    }

    const onTouchEnd = () => {
      touchRef.current.active = false
      keysRef.current.clear()
      clearLongPress()
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)
    canvas.addEventListener('touchcancel', onTouchEnd)
    return () => {
      clearLongPress()
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [focused, selfId])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf = 0

    const frame = (now) => {
      const dt = Math.min(0.05, (now - lastTs.current) / 1000)
      lastTs.current = now
      smackCd.current = Math.max(0, smackCd.current - dt)

      let bhScale = 0
      let suck = 0
      if (portalHold) {
        bhScale = 1
        suck = 1
      } else if (portalActive && countdownStartedAt && countdownEndsAt) {
        const total = Math.max(1, countdownEndsAt - countdownStartedAt)
        const elapsed = Date.now() - countdownStartedAt
        const p = Math.min(1, elapsed / total)
        bhScale = p < 0.45 ? (p / 0.45) ** 1.6 : 1
        suck = p < 0.55 ? 0 : ((p - 0.55) / 0.45) ** 1.2
      }
      portalRef.current = { scale: bhScale, suck, active: portalActive || portalHold }
      const sucking = suck > 0.08
      const me = selfRef.current
      const keys = keysRef.current
      const countdownSecNow = countdownRef.current

      // Movement
      if (!sucking) {
        let dx = 0
        let dy = 0
        for (const k of keys) {
          const v = KEY[k]
          if (v) {
            dx += v.x
            dy += v.y
          }
        }
        if (dx || dy) {
          const len = Math.hypot(dx, dy) || 1
          me.x += (dx / len) * SPEED * dt
          me.y += (dy / len) * SPEED * dt
          me.facing = dx !== 0 ? Math.sign(dx) : me.facing
          me.walk += dt
        } else {
          me.walk *= 0.85
        }
        me.x = clamp(me.x, FLOOR.x + 28, FLOOR.x + FLOOR.w - 28)
        me.y = clamp(me.y, FLOOR.y + 36, FLOOR.y + FLOOR.h - 24)
        suckLocal.current = { active: false, stretchX: 1, stretchY: 1, spin: 0 }
      } else {
        // Fast black-hole pull with tidal stretch
        const dx = BH.x - me.x
        const dy = BH.y - me.y
        const dist = Math.hypot(dx, dy) || 1
        const pull = 380 + suck * 1400
        me.x += (dx / dist) * pull * dt
        me.y += (dy / dist) * pull * dt
        me.walk += dt * 4
        const stretch = 1 + suck * 2.8
        const squash = Math.max(0.15, 1 - suck * 0.85)
        const tang = Math.atan2(dy, dx)
        suckLocal.current = {
          active: true,
          stretchX: squash + Math.abs(Math.cos(tang)) * (stretch - 1) * 0.5,
          stretchY: stretch,
          spin: suck * 8,
        }
        if (dist < BH.r * 0.45) {
          me.x = BH.x
          me.y = BH.y
          suckLocal.current.stretchX = 0.12
          suckLocal.current.stretchY = 3.2
        }
      }

      if (now - lastSend.current > 50) {
        lastSend.current = now
        callbacksRef.current.onPose?.({ x: me.x, y: me.y, facing: me.facing })
      }

      // Peer lerp + suck
      for (const peer of peersRef.current.values()) {
        if (peer.tx != null) {
          peer.x += (peer.tx - peer.x) * Math.min(1, dt * 24)
          peer.y += (peer.ty - peer.y) * Math.min(1, dt * 24)
          peer.walk += dt
        }
        if (sucking) {
          const dx = BH.x - peer.x
          const dy = BH.y - peer.y
          const dist = Math.hypot(dx, dy) || 1
          const pull = 320 + suck * 1200
          peer.x += (dx / dist) * pull * dt
          peer.y += (dy / dist) * pull * dt
          const stretch = 1 + suck * 2.5
          peer.stretchX = Math.max(0.12, 1 - suck * 0.8)
          peer.stretchY = stretch
          peer.spin = suck * 7
        } else {
          peer.stretchX = 1
          peer.stretchY = 1
          peer.spin = 0
        }
      }

      // Debris sucked toward BH
      for (const d of debrisRef.current) {
        if (sucking) {
          const dx = BH.x - d.x
          const dy = BH.y - d.y
          const dist = Math.hypot(dx, dy) || 1
          const pull = 200 + suck * 1600
          d.vx += (dx / dist) * pull * dt
          d.vy += (dy / dist) * pull * dt
          d.rot += suck * 10 * dt
          d.vx += (-dy / dist) * suck * 180 * dt
          d.vy += (dx / dist) * suck * 180 * dt
        } else {
          d.vx *= 0.92
          d.vy *= 0.92
        }
        d.x += d.vx * dt
        d.y += d.vy * dt
        if (sucking && Math.hypot(BH.x - d.x, BH.y - d.y) < BH.r * 0.5) {
          d.s *= 0.85
          if (d.s < 0.08) {
            d.x = FLOOR.x + Math.random() * (FLOOR.w * 0.55)
            d.y = FLOOR.y + Math.random() * FLOOR.h
            d.s = 0.5 + Math.random() * 0.6
            d.vx = 0
            d.vy = 0
          }
        }
      }

      // Draw
      const t = now / 1000
      drawHall(ctx, t)
      if (bhScale > 0.01) drawBlackHole(ctx, t, bhScale, suck)
      else drawMeditationAlcove(ctx)

      for (const npc of npcsRef.current) {
        updateNpc(npc, dt, t)
      }

      // Dust streams when sucking
      if (sucking) {
        for (let i = 0; i < 40; i++) {
          const a = t * 3 + i * 0.4
          const rad = BH.r * bhScale + 40 + ((i * 37 + t * 220 * suck) % 320)
          const px = BH.x + Math.cos(a) * rad * 0.85
          const py = BH.y + Math.sin(a) * rad * 0.45
          const life = 1 - rad / 400
          ctx.fillStyle = `rgba(255,200,140,${0.15 * suck * Math.max(0, life)})`
          ctx.beginPath()
          ctx.arc(px, py, 1.5 + suck * 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Debris
      for (const d of debrisRef.current) {
        ctx.save()
        ctx.translate(d.x, d.y)
        ctx.rotate(d.rot)
        ctx.scale(d.s, d.s)
        if (d.kind === 10) {
          // singing bowl
          ctx.fillStyle = '#b8860b'
          ctx.beginPath()
          ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#ffe08a'
          ctx.stroke()
        } else if (d.kind === 11) {
          // lotus
          ctx.fillStyle = '#e8a0b0'
          for (let p = 0; p < 6; p++) {
            ctx.rotate(Math.PI / 3)
            ctx.beginPath()
            ctx.ellipse(0, -8, 4, 10, 0, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.fillStyle = '#f0d060'
          ctx.beginPath()
          ctx.arc(0, 0, 4, 0, Math.PI * 2)
          ctx.fill()
        } else if (d.kind === 12) {
          // mala beads
          ctx.strokeStyle = '#c9a227'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(0, 0, 12, 0, Math.PI * 1.5)
          ctx.stroke()
          ctx.fillStyle = '#8b1a1a'
          for (let b = 0; b < 8; b++) {
            const ang = (b / 8) * Math.PI * 1.5
            ctx.beginPath()
            ctx.arc(Math.cos(ang) * 12, Math.sin(ang) * 12, 2.5, 0, Math.PI * 2)
            ctx.fill()
          }
        } else {
          // dust / petal / leaf
          const colors = ['#e8c9a0', '#d4a574', '#c97878', '#c9a227', '#8fbc8f']
          ctx.fillStyle = colors[d.kind % colors.length]
          ctx.beginPath()
          ctx.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      // NPC monks
      for (const npc of npcsRef.current) {
        softBody(ctx, npc.x, npc.y, npc.robe, npc.sash, npc.skin, npc.facing, npc.walk || 0)
        drawNameplate(ctx, npc.x, npc.y, npc.name, false)
        drawActivityIcon(ctx, npc, t)
      }

      const list = [...peersRef.current.entries()]
        .map(([id, pose]) => ({ id, pose, isSelf: false }))
        .concat([{ id: selfId, pose: me, isSelf: true }])
        .sort((a, b) => a.pose.y - b.pose.y)

      for (const { id, pose, isSelf } of list) {
        const p = players.find((x) => x.id === id)
        const vibe = vibeOf(id, p?.name)
        const sx = isSelf ? suckLocal.current.stretchX : pose.stretchX || 1
        const sy = isSelf ? suckLocal.current.stretchY : pose.stretchY || 1
        const spin = isSelf ? suckLocal.current.spin : pose.spin || 0

        ctx.save()
        if (spin) {
          ctx.translate(pose.x, pose.y)
          ctx.rotate(spin * 0.15)
          ctx.translate(-pose.x, -pose.y)
        }
        softBody(ctx, pose.x, pose.y, vibe.robe, vibe.sash, vibe.skin, pose.facing || 1, pose.walk || 0, sx, sy)

        if (!sucking || suck < 0.85) {
          drawNameplate(ctx, pose.x, pose.y - (sy - 1) * 20, p?.name || 'Monk', isSelf)
        }

        if (!isSelf && pose.hitFlash && pose.hitFlash > now) {
          ctx.strokeStyle = 'rgba(255,80,60,0.85)'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(pose.x, pose.y - 8, 28, 0, Math.PI * 2)
          ctx.stroke()
        }
        if (pose.emote && pose.emoteUntil > now) {
          const icon = { wave: '👋', bow: '🙇', laugh: '😆', shock: '😲' }[pose.emote] || '✨'
          ctx.font = '22px serif'
          ctx.textAlign = 'center'
          ctx.fillText(icon, pose.x + 22, pose.y - 48)
        }
        ctx.restore()
      }

      // Screen vignette when sucking hard
      if (suck > 0.3) {
        const vg = ctx.createRadialGradient(BH.x, BH.y, 40, BH.x, BH.y, 700)
        vg.addColorStop(0, 'rgba(0,0,0,0)')
        vg.addColorStop(0.5, `rgba(0,0,0,${suck * 0.25})`)
        vg.addColorStop(1, `rgba(0,0,0,${suck * 0.55})`)
        ctx.fillStyle = vg
        ctx.fillRect(0, 0, WORLD.w, WORLD.h)
      }

      if (countdownSecNow != null) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)'
        ctx.fillRect(0, 0, WORLD.w, 64)
        ctx.fillStyle = '#ffe6a8'
        ctx.font = '800 28px "Segoe UI", system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(
          countdownSecNow > 0 ? `Singularity in ${countdownSecNow}` : 'Crossing the event horizon…',
          WORLD.w / 2,
          42,
        )
      }

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [selfId, portalActive, countdownStartedAt, countdownEndsAt, portalHold])

  const runAction = (kind) => {
    if (!actionMenu) return
    if (kind === 'smack') callbacksRef.current.onSmack?.(actionMenu.targetId)
    else callbacksRef.current.onEmote?.(kind)
    setActionMenu(null)
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1a100c]">
      <canvas
        ref={canvasRef}
        width={WORLD.w}
        height={WORLD.h}
        className="h-full w-full touch-none object-contain"
        tabIndex={0}
      />
      {actionMenu && (
        <div
          className="absolute z-20 min-w-[140px] rounded-xl border border-amber/30 bg-[#1a100c]/95 p-2 shadow-xl"
          style={{
            left: Math.min(window.innerWidth - 160, actionMenu.clientX - 70),
            top: Math.max(8, actionMenu.clientY - 120),
          }}
        >
          <p className="mb-2 px-2 text-[10px] uppercase tracking-widest text-muted">{actionMenu.targetName}</p>
          {[
            ['wave', 'Wave'],
            ['bow', 'Bow'],
            ['laugh', 'Laugh'],
            ['shock', 'Shock'],
            ['smack', 'Smack'],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-amber-100 hover:bg-white/10"
              onClick={() => runAction(k)}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className="mt-1 w-full rounded-lg px-3 py-1 text-xs text-muted hover:bg-white/5"
            onClick={() => setActionMenu(null)}
          >
            Cancel
          </button>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/55 px-3 py-2 text-[11px] text-amber-100/85">
        Move · <kbd className="text-amber-200">WASD</kbd> / drag · smack{' '}
        <kbd className="text-amber-200">Space</kbd> · long-press for actions
      </div>
    </div>
  )
}
