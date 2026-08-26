import { useEffect, useRef, useState } from 'react'
import { resolvePlayerLook } from '../data/avatars.js'
import { dirFromDelta, drawMonkTopDown } from '../lib/avatarDraw.js'
import { FLOOR, drawBlackHole } from '../lib/templeRoom.js'
import {
  HANGOUT,
  LOBBY_PLAYER_R,
  LOBBY_CHAR_SCALE,
  drawHangoutRoom,
  drawVoiceAura,
  drawSpeechBubble,
  drawSocialNameplate,
  drawNearnessBond,
  spawnPortalDebris,
  drawPortalDebris,
} from '../lib/lobbyWorlds.js'

const WORLD = { w: 1280, h: 720 }
const SPEED = HANGOUT.moveSpeed
const PLAYER_R = HANGOUT.playerR || LOBBY_PLAYER_R
const CHAR_SCALE = HANGOUT.charScale || LOBBY_CHAR_SCALE

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

/** Inverse-square pull — speed builds as monks fall toward the singularity. */
const BH_G = 1_350_000
const BH_SOFT = 65
const BH_SWIRL = 240

function applyBlackHolePull(body, bhX, bhY, dt, suck, mass = 1, maxSpeed = 3000) {
  const dx = bhX - body.x
  const dy = bhY - body.y
  const distSq = dx * dx + dy * dy
  const dist = Math.sqrt(distSq) || 0.001
  const accel = (BH_G * suck * suck) / ((distSq + BH_SOFT * BH_SOFT) * mass)

  if (body.vx == null) body.vx = 0
  if (body.vy == null) body.vy = 0

  body.vx += (dx / dist) * accel * dt
  body.vy += (dy / dist) * accel * dt

  const swirl = (BH_SWIRL * suck * suck) / mass
  body.vx += (-dy / dist) * swirl * dt
  body.vy += (dx / dist) * swirl * dt

  const speed = Math.hypot(body.vx, body.vy)
  if (speed > maxSpeed) {
    const cap = maxSpeed / speed
    body.vx *= cap
    body.vy *= cap
  }

  body.x += body.vx * dt
  body.y += body.vy * dt

  const proximity = Math.min(1, 360 / dist)
  const speedFactor = Math.min(1, speed / 1400)
  // Stretch toward the hole, but never grow past 1.5× original size on either axis.
  const stretchY = Math.min(1.5, 1 + suck * proximity * 0.42 + speedFactor * suck * 0.18)
  const stretchX = Math.max(1 / 1.5, 1 - suck * proximity * 0.28)
  return {
    stretchX,
    stretchY,
    spin: suck * proximity * 15 + speedFactor * 5,
  }
}

function kickTowardHole(body, bhX, bhY, strength = 160) {
  const dx = bhX - body.x
  const dy = bhY - body.y
  const dist = Math.hypot(dx, dy) || 1
  body.vx = (dx / dist) * strength
  body.vy = (dy / dist) * strength
}

function clearBodyVelocity(body) {
  body.vx = 0
  body.vy = 0
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
  voiceLevel = 0,
  chat = [],
  chrome = true,
}) {
  const canvasRef = useRef(null)
  const keysRef = useRef(new Set())
  const selfRef = useRef({ x: 640, y: 520, dir: 'down', walk: 0, emote: null, emoteUntil: 0 })
  const spawnedRef = useRef(false)
  const peersRef = useRef(new Map())
  const propsRef = useRef(HANGOUT.makeProps(blackHoleX, blackHoleY))
  const voiceRef = useRef(voiceLevel)
  const chatRef = useRef(chat)
  const lobbyRef = useRef(lobby)
  const pulseRef = useRef(0)
  const lastSend = useRef(0)
  const lastTs = useRef(performance.now())
  const smackCd = useRef(0)
  const suckLocal = useRef({ stretchX: 1, stretchY: 1, spin: 0 })
  const touchRef = useRef({ active: false, lastX: 0, lastY: 0, longPressTimer: null, moved: false })
  const playersRef = useRef(players)
  const callbacksRef = useRef({ onPose, onSmack, onEmote })
  const countdownRef = useRef(countdownSec)
  const bhRef = useRef({ x: blackHoleX, y: blackHoleY })
  const wasSuckingRef = useRef(false)
  const debrisSpawnedRef = useRef(false)
  const [actionMenu, setActionMenu] = useState(null)
  playersRef.current = players
  callbacksRef.current = { onPose, onSmack, onEmote }
  voiceRef.current = voiceLevel
  chatRef.current = chat
  lobbyRef.current = lobby
  countdownRef.current = countdownSec
  bhRef.current = { x: blackHoleX, y: blackHoleY }

  const applyLocalEmote = (emoteName) => {
    const until = Date.now() + 2500
    selfRef.current.emote = emoteName
    selfRef.current.emoteUntil = until
    callbacksRef.current.onEmote?.(emoteName)
  }

  useEffect(() => {
    const pose = lobby?.[selfId]
    if (pose?.x == null || pose?.y == null) return
    const me = selfRef.current
    if (!spawnedRef.current) {
      me.x = pose.x
      me.y = pose.y
      me.dir = pose.dir || 'down'
      spawnedRef.current = true
      callbacksRef.current.onPose?.({ x: me.x, y: me.y, dir: me.dir, speaking: (voiceRef.current || 0) > 0.06 })
    }
    // Keep own gesture in sync so the sender sees the same wave as everyone else.
    if (pose.emote && pose.emoteUntil) {
      me.emote = pose.emote
      me.emoteUntil = pose.emoteUntil
    }
  }, [lobby, selfId])

  useEffect(() => {
    propsRef.current = HANGOUT.makeProps(blackHoleX, blackHoleY)
  }, [blackHoleX, blackHoleY])

  // Smack pulse for living ambience
  useEffect(() => {
    for (const pose of Object.values(lobby || {})) {
      if (pose?.hitFlash && pose.hitFlash > Date.now()) {
        pulseRef.current = 1
      }
    }
  }, [lobby])

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
      cur.speaking = !!pose.speaking
      map.set(p.id, cur)
    }
    for (const id of map.keys()) if (!alive.has(id)) map.delete(id)
  }, [lobby, players, selfId])

  useEffect(() => {
    const me = selfRef.current
    if (spawnedRef.current) {
      callbacksRef.current.onPose?.({ x: me.x, y: me.y, dir: me.dir, speaking: (voiceRef.current || 0) > 0.06 })
    }
  }, [])

  useEffect(() => {
    const isTypingTarget = (el) => {
      if (!el || !(el instanceof Element)) return false
      const tag = el.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
      if (el.isContentEditable) return true
      return !!el.closest?.('input, textarea, select, [contenteditable="true"]')
    }
    const down = (e) => {
      if (!focused) return
      if (isTypingTarget(e.target) || isTypingTarget(document.activeElement)) {
        keysRef.current.clear()
        return
      }
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
      if (e.key === '1') applyLocalEmote('wave')
      if (e.key === '2') applyLocalEmote('bow')
      if (e.key === '3') applyLocalEmote('laugh')
      if (e.key === '4') applyLocalEmote('shock')
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
      const world = HANGOUT
      pulseRef.current = Math.max(0, pulseRef.current - dt * 1.8)
      const colliders = [...(world.colliders || []), ...propColliders(props)]

      if (sucking && !wasSuckingRef.current) {
        kickTowardHole(me, BH.x, BH.y, 140 + suck * 120)
        for (const peer of peersRef.current.values()) kickTowardHole(peer, BH.x, BH.y, 120 + suck * 100)
        if (!debrisSpawnedRef.current) {
          propsRef.current = spawnPortalDebris(BH.x, BH.y)
          debrisSpawnedRef.current = true
        }
      }
      if (!sucking && wasSuckingRef.current) {
        clearBodyVelocity(me)
        for (const peer of peersRef.current.values()) clearBodyVelocity(peer)
        propsRef.current = HANGOUT.makeProps(blackHoleX, blackHoleY)
        debrisSpawnedRef.current = false
      }
      wasSuckingRef.current = sucking

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
        suckLocal.current = applyBlackHolePull(me, BH.x, BH.y, dt, suck, 1, 3200)
        me.dir = dirFromDelta(BH.x - me.x, BH.y - me.y, me.dir)
        me.walk += dt * (2 + Math.hypot(me.vx, me.vy) * 0.004)
      }

      if (now - lastSend.current > 45) {
        lastSend.current = now
        callbacksRef.current.onPose?.({ x: me.x, y: me.y, dir: me.dir, speaking: (voiceRef.current || 0) > 0.06 })
      }

      for (const peer of peersRef.current.values()) {
        if (!sucking && peer.tx != null) {
          peer.x += (peer.tx - peer.x) * Math.min(1, dt * 28)
          peer.y += (peer.ty - peer.y) * Math.min(1, dt * 28)
        }
        if (peer.tDir != null) peer.dir = peer.tDir
        peer.walk = (peer.walk || 0) + dt
        if (sucking) {
          const deform = applyBlackHolePull(peer, BH.x, BH.y, dt, suck, 1.05, 3000)
          peer.dir = dirFromDelta(BH.x - peer.x, BH.y - peer.y, peer.dir || 'down')
          peer.stretchX = deform.stretchX
          peer.stretchY = deform.stretchY
          peer.spin = deform.spin
        } else {
          peer.stretchX = 1
          peer.stretchY = 1
          peer.spin = 0
        }
      }

      for (const p of props) {
        if (sucking) {
          applyBlackHolePull(p, BH.x, BH.y, dt, suck, p.mass || 1, 3600)
          p.rot = (p.rot || 0) + (p.vx * -0.002 + p.vy * 0.002) * dt * 8
        }
      }

      const t = now / 1000
      ctx.fillStyle = '#0a0a0e'
      ctx.fillRect(0, 0, WORLD.w, WORLD.h)
      drawHangoutRoom(ctx, t, { voiceLevel: voiceRef.current || 0, pulse: pulseRef.current })
      for (const p of props) drawPortalDebris(ctx, p, t)
      if (bhScale > 0.002) drawBlackHole(ctx, t, BH.x, BH.y, bhScale, suck, birth)

      const list = [...peersRef.current.entries()]
        .map(([id, pose]) => ({ id, pose, isSelf: false }))
        .concat([{ id: selfId, pose: me, isSelf: true }])
        .sort((a, b) => a.pose.y - b.pose.y)

      if (!sucking) {
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            drawNearnessBond(ctx, list[i].pose.x, list[i].pose.y, list[j].pose.x, list[j].pose.y)
          }
        }
      }

      const bubbles = new Map()
      const chatNow = Date.now()
      for (const m of chatRef.current || []) {
        if (!m?.id || !m.text) continue
        if (chatNow - (m.at || 0) > 5500) continue
        bubbles.set(m.id, m)
      }

      for (const { id, pose, isSelf } of list) {
        const pl = playersRef.current.find((x) => x.id === id)
        const look = resolvePlayerLook(pl?.avatar || pl?.vibe || 'aot-eren', id, playersRef.current)
        const sx = isSelf ? suckLocal.current.stretchX : pose.stretchX || 1
        const sy = isSelf ? suckLocal.current.stretchY : pose.stretchY || 1
        const bob = !sucking && (pose.walk || 0) < 0.15 ? Math.sin(t * 2.1 + id.length) * 1.1 : 0
        const speakLvl = isSelf ? (voiceRef.current || 0) : pose.speaking ? 0.45 : 0
        ctx.save()
        if (pose.spin) {
          ctx.translate(pose.x, pose.y)
          ctx.rotate(pose.spin * 0.12)
          ctx.translate(-pose.x, -pose.y)
        }
        if (speakLvl > 0.04) drawVoiceAura(ctx, pose.x, pose.y + bob, speakLvl, t)
        drawMonkTopDown(ctx, pose.x, pose.y + bob, look, pose.dir || 'down', pose.walk || 0, sx * CHAR_SCALE, sy * CHAR_SCALE)
        if (!sucking || suck < 0.9) {
          drawSocialNameplate(ctx, pose.x, pose.y + bob, pl?.name, {
            isSelf,
            speaking: speakLvl > 0.05,
            host: !!pl?.isHost,
            color: look.robe || '#d4a574',
          })
        }
        const wall = Date.now()
        const selfLobby = isSelf ? lobbyRef.current?.[selfId] : null
        const liveEmote =
          pose.emote && pose.emoteUntil > wall
            ? pose.emote
            : selfLobby?.emote && selfLobby.emoteUntil > wall
              ? selfLobby.emote
              : null
        if (liveEmote) {
          ctx.font = '22px serif'
          ctx.textAlign = 'center'
          ctx.fillText({ wave: '👋', bow: '🙇', laugh: '😆', shock: '😲' }[liveEmote] || '✨', pose.x, pose.y - 78 + bob)
        }
        const bubble = bubbles.get(id)
        if (bubble && (!sucking || suck < 0.5)) drawSpeechBubble(ctx, pose.x, pose.y + bob, bubble.text)
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
    else applyLocalEmote(kind)
    setActionMenu(null)
  }

  return (
    <div className="monk-lobby relative h-full w-full overflow-hidden bg-[#0c0e14]">
      <canvas ref={canvasRef} width={WORLD.w} height={WORLD.h} className="h-full w-full touch-none object-contain" tabIndex={0} />
      {chrome && (
      <div className="lobby-room-hud pointer-events-none absolute left-2 top-2 right-2 z-10 flex flex-wrap items-start justify-between gap-2">
        <div className="rounded-md border border-white/10 bg-black/55 px-2.5 py-1.5 backdrop-blur-sm">
          <p className="font-display text-sm text-fog" style={{ color: HANGOUT.accent }}>
            {HANGOUT.name}
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{HANGOUT.tagline}</p>
        </div>
        {!portalActive && !portalHold && (
          <div className="rounded-md border border-white/10 bg-black/55 px-2.5 py-1.5 text-right backdrop-blur-sm">
            <p className="text-[11px] text-fog">Waiting for the crew</p>
            <p className="text-[9px] uppercase tracking-[0.16em] text-muted">
              Move · chat · voice · host starts
            </p>
          </div>
        )}
      </div>
      )}
      {!portalActive && !portalHold && (
        <div className="emote-dock pointer-events-auto absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {[
            { k: 'wave', label: 'Wave', g: '👋' },
            { k: 'bow', label: 'Bow', g: '🙇' },
            { k: 'laugh', label: 'Laugh', g: '😆' },
            { k: 'shock', label: 'Gasp', g: '😲' },
          ].map((e) => (
            <button
              key={e.k}
              type="button"
              className="emote-chip"
              onClick={() => applyLocalEmote(e.k)}
              title={e.label}
            >
              <span aria-hidden>{e.g}</span>
              <span className="emote-chip-label">{e.label}</span>
            </button>
          ))}
        </div>
      )}
      {actionMenu && (
        <div className="absolute z-20 min-w-[140px] rounded-xl border border-amber/30 bg-[#1a100c]/95 p-2 shadow-xl" style={{ left: Math.min(window.innerWidth - 160, actionMenu.clientX - 70), top: Math.max(8, actionMenu.clientY - 120) }}>
          <p className="mb-2 px-2 text-[10px] uppercase tracking-widest text-muted">{actionMenu.targetName}</p>
          {['wave', 'bow', 'laugh', 'shock', 'smack'].map((k) => (
            <button key={k} type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm capitalize text-amber-100 hover:bg-white/10" onClick={() => runAction(k)}>
              {k === 'smack' ? 'nudge' : k}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
