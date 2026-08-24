import { useEffect, useRef } from 'react'
import { MONK_VIBES } from '../data/locations.js'

const EMOTES = { happy: '😄', sad: '😢', angry: '😠', kiss: '😘' }

const ROOM = { w: 960, h: 540, pad: 48 }

/**
 * Among Us–style 2D chopper lobby.
 * Top-down lounge: walk, bump/smack, emotes. No Three.js.
 */
export default function CabinLobby({
  selfId,
  players = [],
  lobby = {},
  onPose,
  onSmack,
  onEmote,
  countdownSec = null,
  focused = true,
}) {
  const canvasRef = useRef(null)
  const apiRef = useRef({})
  const localRef = useRef({ x: 480, y: 300, vx: 0, vy: 0, facing: 1 })

  useEffect(() => {
    apiRef.current = { onPose, onSmack, onEmote, selfId, players, lobby }
  }, [onPose, onSmack, onEmote, selfId, players, lobby])

  useEffect(() => {
    const spawn = lobby?.[selfId]
    if (spawn) {
      localRef.current.x = 480 + spawn.x * 70
      localRef.current.y = 300 + spawn.z * 55
    }
  }, [selfId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    const keys = new Set()
    let raf = 0
    let last = performance.now()
    let poseAcc = 0
    let flash = 0

    const onKeyDown = (e) => {
      if (!focused) return
      keys.add(e.code)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault()
      if (e.code === 'Digit1') apiRef.current.onEmote?.('happy')
      if (e.code === 'Digit2') apiRef.current.onEmote?.('sad')
      if (e.code === 'Digit3') apiRef.current.onEmote?.('angry')
      if (e.code === 'Digit4') apiRef.current.onEmote?.('kiss')
      if (e.code === 'Space') trySmack()
    }
    const onKeyUp = (e) => keys.delete(e.code)

    function trySmack() {
      const { selfId: sid, lobby: lb, onSmack: smack } = apiRef.current
      const me = localRef.current
      let best = null
      let bestD = 70
      for (const [id, pose] of Object.entries(lb || {})) {
        if (id === sid) continue
        const px = 480 + (pose.x || 0) * 70
        const py = 300 + (pose.z || 0) * 55
        const d = Math.hypot(px - me.x, py - me.y)
        if (d < bestD) {
          bestD = d
          best = id
        }
      }
      if (best) {
        smack?.(best)
        flash = 1
      }
    }

    function resize() {
      const parent = canvas.parentElement
      const w = parent?.clientWidth || 960
      const h = Math.max(parent?.clientHeight || 540, 360)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement || canvas)

    window.addEventListener('keydown', onKeyDown, { passive: false })
    window.addEventListener('keyup', onKeyUp)

    function drawRoom(w, h) {
      // carpet lounge
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(0, 0, w, h)

      const rx = (w - ROOM.w) / 2
      const ry = (h - ROOM.h) / 2

      // outer hull
      roundRect(ctx, rx - 16, ry - 16, ROOM.w + 32, ROOM.h + 32, 28)
      ctx.fillStyle = '#334155'
      ctx.fill()

      // floor
      roundRect(ctx, rx, ry, ROOM.w, ROOM.h, 22)
      ctx.fillStyle = '#0f766e'
      ctx.fill()

      // floor pattern
      ctx.save()
      ctx.beginPath()
      roundRect(ctx, rx, ry, ROOM.w, ROOM.h, 22)
      ctx.clip()
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 1
      for (let x = rx; x < rx + ROOM.w; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, ry)
        ctx.lineTo(x, ry + ROOM.h)
        ctx.stroke()
      }
      for (let y = ry; y < ry + ROOM.h; y += 40) {
        ctx.beginPath()
        ctx.moveTo(rx, y)
        ctx.lineTo(rx + ROOM.w, y)
        ctx.stroke()
      }
      ctx.restore()

      // windows (sky)
      for (let i = 0; i < 5; i++) {
        const wx = rx + 80 + i * 170
        const wy = ry + 28
        roundRect(ctx, wx, wy, 120, 54, 10)
        const g = ctx.createLinearGradient(wx, wy, wx, wy + 54)
        g.addColorStop(0, '#7dd3fc')
        g.addColorStop(1, '#38bdf8')
        ctx.fillStyle = g
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.35)'
        ctx.beginPath()
        ctx.ellipse(wx + 40, wy + 20, 28, 10, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // couches
      ctx.fillStyle = '#164e63'
      roundRect(ctx, rx + 60, ry + ROOM.h - 120, 200, 70, 12)
      ctx.fill()
      roundRect(ctx, rx + ROOM.w - 260, ry + ROOM.h - 120, 200, 70, 12)
      ctx.fill()

      // table
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.ellipse(rx + ROOM.w / 2, ry + ROOM.h / 2 + 20, 70, 36, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#92400e'
      ctx.beginPath()
      ctx.ellipse(rx + ROOM.w / 2, ry + ROOM.h / 2 + 20, 50, 24, 0, 0, Math.PI * 2)
      ctx.fill()

      // cockpit door
      ctx.fillStyle = '#475569'
      roundRect(ctx, rx + ROOM.w / 2 - 40, ry + ROOM.h - 36, 80, 36, 8)
      ctx.fill()
      ctx.fillStyle = '#94a3b8'
      ctx.font = '700 11px IBM Plex Mono, monospace'
      ctx.textAlign = 'center'
      ctx.fillText('COCKPIT', rx + ROOM.w / 2, ry + ROOM.h - 14)

      // title plaque
      ctx.fillStyle = 'rgba(15,23,42,0.7)'
      roundRect(ctx, rx + ROOM.w / 2 - 90, ry + 100, 180, 28, 8)
      ctx.fill()
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '700 12px Syne, sans-serif'
      ctx.fillText('MONK CHOPPER LOUNGE', rx + ROOM.w / 2, ry + 118)

      return { rx, ry }
    }

    function drawCrew(px, py, player, pose, isSelf) {
      const vibe = MONK_VIBES.find((v) => v.id === player.vibe) || MONK_VIBES[0]
      const hit = pose?.hitFlash > Date.now()
      const bounce = hit ? Math.sin(Date.now() / 30) * 4 : 0
      const facing = pose?.yaw != null ? (Math.cos(pose.yaw) >= 0 ? 1 : -1) : 1

      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.beginPath()
      ctx.ellipse(px, py + 22, 22, 8, 0, 0, Math.PI * 2)
      ctx.fill()

      // body (bean)
      ctx.fillStyle = hit ? '#ffffff' : vibe.color
      ctx.beginPath()
      ctx.ellipse(px, py - 6 + bounce, 20, 26, 0, 0, Math.PI * 2)
      ctx.fill()

      // visor
      ctx.fillStyle = '#0f172a'
      ctx.beginPath()
      ctx.ellipse(px + facing * 4, py - 12 + bounce, 12, 8, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#7dd3fc'
      ctx.beginPath()
      ctx.ellipse(px + facing * 4, py - 12 + bounce, 9, 5, 0, 0, Math.PI * 2)
      ctx.fill()

      // legs
      ctx.strokeStyle = vibe.color
      ctx.lineWidth = 6
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(px - 8, py + 14 + bounce)
      ctx.lineTo(px - 10, py + 24 + bounce)
      ctx.moveTo(px + 8, py + 14 + bounce)
      ctx.lineTo(px + 10, py + 24 + bounce)
      ctx.stroke()

      // name
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '700 12px Syne, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(player.name + (isSelf ? ' (you)' : ''), px, py - 42 + bounce)

      // emote
      const emoteOn = pose?.emoteUntil > Date.now() && pose?.emote
      if (emoteOn) {
        ctx.font = '22px serif'
        ctx.fillText(EMOTES[pose.emote] || '', px, py - 58 + bounce)
      }

      if (player.ready) {
        ctx.fillStyle = '#34d399'
        ctx.beginPath()
        ctx.arc(px + 18, py - 24 + bounce, 5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    function frame(now) {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const me = localRef.current

      if (focused) {
        let mx = 0
        let my = 0
        if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1
        if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1
        if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1
        if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1
        if (mx || my) {
          const len = Math.hypot(mx, my) || 1
          mx /= len
          my /= len
          me.facing = mx >= 0 ? 1 : -1
          me.x += mx * 220 * dt
          me.y += my * 220 * dt
        }
        // clamp to room
        const rx = (w - ROOM.w) / 2
        const ry = (h - ROOM.h) / 2
        me.x = Math.max(rx + ROOM.pad, Math.min(rx + ROOM.w - ROOM.pad, me.x))
        me.y = Math.max(ry + ROOM.pad + 40, Math.min(ry + ROOM.h - ROOM.pad, me.y))

        // knockback from server
        const server = apiRef.current.lobby?.[apiRef.current.selfId]
        if (server?.hitFlash > Date.now()) {
          const sx = 480 + server.x * 70
          const sy = 300 + server.z * 55
          me.x += (sx - me.x) * Math.min(1, dt * 8)
          me.y += (sy - me.y) * Math.min(1, dt * 8)
        }

        poseAcc += dt
        if (poseAcc > 0.05) {
          poseAcc = 0
          // map canvas coords back to lobby units used by peerRoom
          apiRef.current.onPose?.({
            x: (me.x - 480) / 70,
            y: 0,
            z: (me.y - 300) / 55,
            yaw: me.facing >= 0 ? 0 : Math.PI,
          })
        }
      }

      if (flash > 0) flash = Math.max(0, flash - dt * 3)

      drawRoom(w, h)

      // other players
      const { players: plist, lobby: lb, selfId: sid } = apiRef.current
      for (const p of plist || []) {
        if (p.id === sid) continue
        const pose = lb?.[p.id]
        const px = 480 + (pose?.x || 0) * 70
        const py = 300 + (pose?.z || 0) * 55
        drawCrew(px, py, p, pose, false)
      }

      // self on top
      const selfPlayer = (plist || []).find((p) => p.id === sid)
      if (selfPlayer) {
        drawCrew(me.x, me.y, selfPlayer, lb?.[sid], true)
      }

      if (flash > 0) {
        ctx.fillStyle = `rgba(251,113,133,${flash * 0.2})`
        ctx.fillRect(0, 0, w, h)
      }
    }
    raf = requestAnimationFrame(frame)

    canvas.addEventListener('click', trySmack)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('click', trySmack)
    }
  }, [focused])

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-2xl bg-slate-900">
      <canvas ref={canvasRef} className="block h-full w-full" />
      {countdownSec != null && countdownSec >= 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-black/55">
          <p className="font-display text-7xl font-extrabold text-white md:text-9xl">
            {countdownSec === 0 ? 'JUMP!' : countdownSec}
          </p>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-xl bg-black/55 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-white/80">
        WASD move · click/space smack · 1–4 emotes
      </div>
    </div>
  )
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

export { EMOTES }
