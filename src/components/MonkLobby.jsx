import { useEffect, useRef, useState } from 'react'
import { resolvePlayerLook } from '../data/avatars.js'
import { dirFromDelta, drawMonkTopDown } from '../lib/avatarDraw.js'
import {
  STATIC_COLLIDERS,
  FLOOR,
  PLAYER_R,
  drawLivingRoom,
  drawLivingProp,
  drawBlackHole,
  makeLivingRoomProps,
} from '../lib/templeRoom.js'

const WORLD = { w: 1280, h: 720 }
const SPEED = 185

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

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n))
}

function circleRectOverlap(cx, cy, r, rect) {
  const nx = clamp(cx, rect.x, rect.x + rect.w)
  const ny = clamp(cy, rect.y, rect.y + rect.h)
  const dx = cx - nx
  const dy = cy - ny
  return dx * dx + dy * dy < r * r
}

function separateCircle(cx, cy, r, rect) {
  const nx = clamp(cx, rect.x, rect.x + rect.w)
  const ny = clamp(cy, rect.y, rect.y + rect.h)
  const dx = cx - nx
  const dy = cy - ny
  const d = Math.hypot(dx, dy) || 0.001
  if (d >= r) return { x: cx, y: cy }
  const push = r - d + 0.5
  return { x: cx + (dx / d) * push, y: cy + (dy / d) * push }
}

function moveEntity(ent, dx, dy, colliders, radius = PLAYER_R) {
  let { x, y } = ent
  x += dx
  for (const c of colliders) {
    if (circleRectOverlap(x, y, radius, c)) {
      const s = separateCircle(x, y, radius, c)
      x = s.x
      y = s.y
    }
  }
  y += dy
  for (const c of colliders) {
    if (circleRectOverlap(x, y, radius, c)) {
      const s = separateCircle(x, y, radius, c)
      x = s.x
      y = s.y
    }
  }
  ent.x = clamp(x, FLOOR.x + radius, FLOOR.x + FLOOR.w - radius)
  ent.y = clamp(y, FLOOR.y + radius, FLOOR.y + FLOOR.h - radius)
}

function propColliders(props) {
  return props.map((p) => ({ x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 }))
}

function drawNameplate(ctx, x, y, name, isSelf) {
  const label = (name || 'Monk').slice(0, 14)
  ctx.font = '600 13px Fraunces, Georgia, serif'
  const tw = ctx.measureText(label).width
  ctx.fillStyle = 'rgba(10,6,4,0.92)'
  ctx.strokeStyle = isSelf ? '#fbbf24' : 'rgba(200,160,100,0.65)'
  ctx.lineWidth = 2
  const w = tw + 14
  const hx = x - w / 2
  const hy = y - 42
  ctx.beginPath()
  ctx.roundRect(hx, hy, w, 18, 5)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#fff8e8'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x, hy + 9)
}

function canvasFromClient(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect()
  return { x: ((clientX - rect.left) / rect.width) * WORLD.w, y: ((clientY - rect.top) / rect.height) * WORLD.h }
}

function nearestPlayer(x, y, peers, players, maxDist = 55) {
  let best = null
  let bestD = maxDist
  for (const [id, pose] of peers.entries()) {
    const d = Math.hypot(pose.x - x, pose.y - y)
    if (d < bestD) {
      bestD = d
      best = { id, name: players.find((p) => p.id === id)?.name || 'Monk' }
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
  blackHoleX = 640,
  blackHoleY = 380,
  focused = true,
}) {
  const canvasRef = useRef(null)
  const keysRef = useRef(new Set())
  const selfRef = useRef({ x: 640, y: 520, dir: 'down', walk: 0 })
  const spawnedRef = useRef(false)
  const peersRef = useRef(new Map())
  const propsRef = useRef(makeLivingRoomProps(blackHoleX, blackHoleY))
  const lastSend = useRef(0)
  const lastTs = useRef(performance.now())
  const smackCd = useRef(0)
  const suckLocal = useRef({ stretchX: 1, stretchY: 1, spin: 0 })
  const touchRef = useRef({ active: false, lastX: 0, lastY: 0, longPressTimer: null, moved: false })
  const playersRef = useRef(players)
  const callbacksRef = useRef({ onPose, onSmack, onEmote })
  const countdownRef = useRef(countdownSec)
  const bhRef = useRef({ x: blackHoleX, y: blackHoleY })
  const [actionMenu, setActionMenu] = useState(null)
  playersRef.current = players
  callbacksRef.current = { onPose, onSmack, onEmote }
  countdownRef.current = countdownSec
  bhRef.current = { x: blackHoleX, y: blackHoleY }

  useEffect(() => {
    const pose = lobby?.[selfId]
    if (pose?.x == null || pose?.y == null) return
    const me = selfRef.current
    if (!spawnedRef.current) {
      me.x = pose.x
      me.y = pose.y
      me.dir = pose.dir || 'down'
      spawnedRef.current = true
      callbacksRef.current.onPose?.({ x: me.x, y: me.y, dir: me.dir })
    }
  }, [lobby, selfId])

  useEffect(() => {
    const map = peersRef.current
    const alive = new Set()
    for (const p of players) {
      if (p.id === selfId) continue
      alive.add(p.id)
      const pose = lobby?.[p.id] || {}
      if (pose.x == null || pose.y == null) continue
      const cur = map.get(p.id) || { x: pose.x, y: pose.y, dir: pose.dir ?? 'down', walk: 0, stretchX: 1, stretchY: 1, spin: 0 }
      cur.tx = pose.x
      cur.ty = pose.y
      if (pose.dir != null) cur.tDir = pose.dir
      if (cur.x == null) {
        cur.x = pose.x
        cur.y = pose.y
      }
      cur.emote = pose.emote
      cur.emoteUntil = pose.emoteUntil
      cur.hitFlash = pose.hitFlash
      map.set(p.id, cur)
    }
    for (const id of map.keys()) if (!alive.has(id)) map.delete(id)
  }, [lobby, players, selfId])

  useEffect(() => {
    const me = selfRef.current
    if (spawnedRef.current) {
      callbacksRef.current.onPose?.({ x: me.x, y: me.y, dir: me.dir })
    }
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
          const near = nearestPlayer(me.x, me.y, peersRef.current, playersRef.current, 70)
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
      touchRef.current = { ...touchRef.current, active: true, lastX: t.clientX, lastY: t.clientY, moved: false }
      clearLongPress()
      const pt = canvasFromClient(canvas, t.clientX, t.clientY)
      touchRef.current.longPressTimer = setTimeout(() => {
        if (touchRef.current.moved) return
        const near = nearestPlayer(pt.x, pt.y, peersRef.current, playersRef.current, 65)
        if (near) setActionMenu({ targetId: near.id, targetName: near.name, clientX: t.clientX, clientY: t.clientY })
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
      keysRef.current.clear()
      if (Math.abs(dx) > Math.abs(dy)) keysRef.current.add(dx > 0 ? 'ArrowRight' : 'ArrowLeft')
      else keysRef.current.add(dy > 0 ? 'ArrowDown' : 'ArrowUp')
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
  }, [focused])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf = 0

    const frame = (now) => {
      const dt = Math.min(0.05, (now - lastTs.current) / 1000)
      lastTs.current = now
      smackCd.current = Math.max(0, smackCd.current - dt)

      const BH = bhRef.current
      let bhScale = 0
      let suck = 0
      if (portalHold) {
        bhScale = 1
        suck = 1
      } else if (portalActive && countdownStartedAt && countdownEndsAt) {
        const total = Math.max(1, countdownEndsAt - countdownStartedAt)
        const elapsed = Date.now() - countdownStartedAt
        const p = Math.min(1, elapsed / total)
        // Snap in immediately, grow fast, suck hard — snappy & impressive
        if (p < 0.08) {
          bhScale = 0.2 + (p / 0.08) * 0.25
        } else if (p < 0.45) {
          bhScale = 0.45 + ((p - 0.08) / 0.37) ** 0.9 * 0.55
        } else {
          bhScale = 1
        }
        suck = p < 0.35 ? 0 : ((p - 0.35) / 0.65) ** 0.95
      }
      const birth = portalActive && countdownStartedAt
        ? Math.min(1, (Date.now() - countdownStartedAt) / Math.max(1, countdownEndsAt - countdownStartedAt))
        : 0
      const sucking = suck > 0.06
      const me = selfRef.current
      const props = propsRef.current
      const colliders = [...STATIC_COLLIDERS, ...propColliders(props)]

      if (!sucking) {
        let dx = 0
        let dy = 0
        for (const k of keysRef.current) {
          const v = KEY[k]
          if (v) {
            dx += v.x
            dy += v.y
          }
        }
        if (dx || dy) {
          const len = Math.hypot(dx, dy) || 1
          moveEntity(me, (dx / len) * SPEED * dt, (dy / len) * SPEED * dt, colliders)
          me.dir = dirFromDelta(dx, dy, me.dir)
          me.walk += dt
        } else me.walk *= 0.85
        suckLocal.current = { stretchX: 1, stretchY: 1, spin: 0 }
      } else {
        const dist = Math.hypot(BH.x - me.x, BH.y - me.y) || 1
        const pull = (420 + suck * 1800) * dt
        me.x += ((BH.x - me.x) / dist) * pull
        me.y += ((BH.y - me.y) / dist) * pull
        me.dir = dirFromDelta(BH.x - me.x, BH.y - me.y, me.dir)
        me.walk += dt * 5
        suckLocal.current = { stretchX: Math.max(0.08, 1 - suck * 0.88), stretchY: 1 + suck * 3.2, spin: suck * 10 }
      }

      if (now - lastSend.current > 45) {
        lastSend.current = now
        callbacksRef.current.onPose?.({ x: me.x, y: me.y, dir: me.dir })
      }

      for (const peer of peersRef.current.values()) {
        if (peer.tx != null) {
          peer.x += (peer.tx - peer.x) * Math.min(1, dt * 28)
          peer.y += (peer.ty - peer.y) * Math.min(1, dt * 28)
        }
        if (peer.tDir != null) peer.dir = peer.tDir
        peer.walk = (peer.walk || 0) + dt
        if (sucking) {
          const dist = Math.hypot(BH.x - peer.x, BH.y - peer.y) || 1
          const pull = (380 + suck * 1600) * dt
          peer.x += ((BH.x - peer.x) / dist) * pull
          peer.y += ((BH.y - peer.y) / dist) * pull
          peer.dir = dirFromDelta(BH.x - peer.x, BH.y - peer.y, peer.dir || 'down')
          peer.stretchX = Math.max(0.08, 1 - suck * 0.85)
          peer.stretchY = 1 + suck * 2.8
          peer.spin = suck * 9
        } else {
          peer.stretchX = 1
          peer.stretchY = 1
          peer.spin = 0
        }
      }

      for (const p of props) {
        if (sucking) {
          const dx = BH.x - p.x
          const dy = BH.y - p.y
          const dist = Math.hypot(dx, dy) || 1
          const pull = (180 + suck * 2200 / p.mass) * dt
          p.vx += (dx / dist) * pull
          p.vy += (dy / dist) * pull
          p.vx += (-dy / dist) * suck * 120 * dt
          p.vy += (dx / dist) * suck * 120 * dt
          p.x += p.vx * dt
          p.y += p.vy * dt
          p.rot += suck * 8 * dt * (1 / p.mass)
        }
      }

      const t = now / 1000
      ctx.fillStyle = '#1a100c'
      ctx.fillRect(0, 0, WORLD.w, WORLD.h)
      drawLivingRoom(ctx, t)
      for (const p of props) drawLivingProp(ctx, p, t)
      if (bhScale > 0.002) drawBlackHole(ctx, t, BH.x, BH.y, bhScale, suck, birth)

      const list = [...peersRef.current.entries()]
        .map(([id, pose]) => ({ id, pose, isSelf: false }))
        .concat([{ id: selfId, pose: me, isSelf: true }])
        .sort((a, b) => a.pose.y - b.pose.y)

      for (const { id, pose, isSelf } of list) {
        const pl = playersRef.current.find((x) => x.id === id)
        const look = resolvePlayerLook(pl?.avatar || pl?.vibe || 'monk-rift', id, playersRef.current)
        const sx = isSelf ? suckLocal.current.stretchX : pose.stretchX || 1
        const sy = isSelf ? suckLocal.current.stretchY : pose.stretchY || 1
        ctx.save()
        if (pose.spin) {
          ctx.translate(pose.x, pose.y)
          ctx.rotate(pose.spin * 0.12)
          ctx.translate(-pose.x, -pose.y)
        }
        drawMonkTopDown(ctx, pose.x, pose.y, look, pose.dir || 'down', pose.walk || 0, sx, sy)
        if (!sucking || suck < 0.9) drawNameplate(ctx, pose.x, pose.y, pl?.name, isSelf)
        if (pose.emote && pose.emoteUntil > now) {
          ctx.font = '20px serif'
          ctx.textAlign = 'center'
          ctx.fillText({ wave: '👋', bow: '🙇', laugh: '😆', shock: '😲' }[pose.emote] || '✨', pose.x, pose.y - 36)
        }
        ctx.restore()
      }

      if (suck > 0.25) {
        ctx.fillStyle = `rgba(0,0,0,${suck * 0.55})`
        ctx.fillRect(0, 0, WORLD.w, WORLD.h)
      }

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [selfId, portalActive, countdownStartedAt, countdownEndsAt, portalHold, blackHoleX, blackHoleY])

  const runAction = (kind) => {
    if (!actionMenu) return
    if (kind === 'smack') callbacksRef.current.onSmack?.(actionMenu.targetId)
    else callbacksRef.current.onEmote?.(kind)
    setActionMenu(null)
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1a100c]">
      <canvas ref={canvasRef} width={WORLD.w} height={WORLD.h} className="h-full w-full touch-none object-contain" tabIndex={0} />
      {actionMenu && (
        <div className="absolute z-20 min-w-[140px] rounded-xl border border-amber/30 bg-[#1a100c]/95 p-2 shadow-xl" style={{ left: Math.min(window.innerWidth - 160, actionMenu.clientX - 70), top: Math.max(8, actionMenu.clientY - 120) }}>
          <p className="mb-2 px-2 text-[10px] uppercase tracking-widest text-muted">{actionMenu.targetName}</p>
          {['wave', 'bow', 'laugh', 'shock', 'smack'].map((k) => (
            <button key={k} type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm capitalize text-amber-100 hover:bg-white/10" onClick={() => runAction(k)}>
              {k}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
