import { useEffect, useRef } from 'react'
import { MONK_VIBES } from '../data/locations.js'

const EMOTES = { happy: '🙏', sad: '😢', angry: '😠', kiss: '😊' }

const ROOM = { w: 920, h: 520, pad: 56 }

/**
 * Temple hall lobby — warm stone monastery, robed monks, portal suck-in.
 */
export default function MonkLobby({
  selfId,
  players = [],
  lobby = {},
  onPose,
  onSmack,
  onEmote,
  countdownSec = null,
  portalForce = false,
  focused = true,
}) {
  const canvasRef = useRef(null)
  const apiRef = useRef({})
  const localRef = useRef({
    x: 460,
    y: 310,
    vx: 0,
    vy: 0,
    facing: 1,
    walk: 0,
    scale: 1,
    spin: 0,
  })
  const fxRef = useRef({
    incense: [],
    dust: [],
    portal: { open: 0, swirl: 0, particles: [] },
    remoteMotion: {},
  })

  useEffect(() => {
    apiRef.current = { onPose, onSmack, onEmote, selfId, players, lobby, countdownSec, portalForce }
  }, [onPose, onSmack, onEmote, selfId, players, lobby, countdownSec, portalForce])

  useEffect(() => {
    const spawn = lobby?.[selfId]
    if (spawn) {
      localRef.current.x = 460 + spawn.x * 68
      localRef.current.y = 310 + spawn.z * 52
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
    let t0 = performance.now()

    // seed ambient particles
    const fx = fxRef.current
    if (!fx.incense.length) {
      for (let i = 0; i < 28; i++) {
        fx.incense.push({
          x: 0.35 + Math.random() * 0.3,
          y: 0.55 + Math.random() * 0.2,
          life: Math.random(),
          speed: 0.04 + Math.random() * 0.06,
          wobble: Math.random() * Math.PI * 2,
        })
      }
      for (let i = 0; i < 40; i++) {
        fx.dust.push({
          x: Math.random(),
          y: Math.random(),
          r: 0.4 + Math.random() * 1.2,
          a: 0.08 + Math.random() * 0.18,
          drift: (Math.random() - 0.5) * 0.02,
        })
      }
    }

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
      const { selfId: sid, lobby: lb, onSmack: smack, countdownSec: cd, portalForce: pf } = apiRef.current
      if (cd != null || pf) return
      const me = localRef.current
      let best = null
      let bestD = 72
      for (const [id, pose] of Object.entries(lb || {})) {
        if (id === sid) continue
        const px = 460 + (pose.x || 0) * 68
        const py = 310 + (pose.z || 0) * 52
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

    function roomOrigin(w, h) {
      return { rx: (w - ROOM.w) / 2, ry: (h - ROOM.h) / 2 }
    }

    function drawTemple(w, h, time) {
      const { rx, ry } = roomOrigin(w, h)
      const cx = rx + ROOM.w / 2
      const cy = ry + ROOM.h / 2 + 10

      // hall backdrop — warm dusk courtyard beyond
      const sky = ctx.createLinearGradient(0, 0, 0, h)
      sky.addColorStop(0, '#1a1410')
      sky.addColorStop(0.45, '#2c2118')
      sky.addColorStop(1, '#0c0a08')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, h)

      // soft mountain silhouettes
      ctx.fillStyle = 'rgba(40, 32, 24, 0.9)'
      ctx.beginPath()
      ctx.moveTo(0, h * 0.42)
      ctx.quadraticCurveTo(w * 0.2, h * 0.28, w * 0.38, h * 0.4)
      ctx.quadraticCurveTo(w * 0.55, h * 0.22, w * 0.72, h * 0.38)
      ctx.quadraticCurveTo(w * 0.88, h * 0.3, w, h * 0.4)
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.fill()

      // outer stone walls
      roundRect(ctx, rx - 18, ry - 22, ROOM.w + 36, ROOM.h + 44, 18)
      const wall = ctx.createLinearGradient(rx, ry, rx, ry + ROOM.h)
      wall.addColorStop(0, '#5c4634')
      wall.addColorStop(0.5, '#3d2e22')
      wall.addColorStop(1, '#2a1f18')
      ctx.fillStyle = wall
      ctx.fill()

      // wooden floor with perspective planks
      roundRect(ctx, rx, ry, ROOM.w, ROOM.h, 14)
      const floor = ctx.createLinearGradient(rx, ry, rx, ry + ROOM.h)
      floor.addColorStop(0, '#6b4f35')
      floor.addColorStop(0.55, '#4a3524')
      floor.addColorStop(1, '#2f2218')
      ctx.fillStyle = floor
      ctx.fill()

      ctx.save()
      ctx.beginPath()
      roundRect(ctx, rx, ry, ROOM.w, ROOM.h, 14)
      ctx.clip()

      // floor planks
      for (let i = 0; i < 18; i++) {
        const y = ry + 20 + i * 28
        const shade = i % 2 === 0 ? 'rgba(0,0,0,0.08)' : 'rgba(255,220,160,0.04)'
        ctx.fillStyle = shade
        ctx.fillRect(rx, y, ROOM.w, 28)
        ctx.strokeStyle = 'rgba(20,12,8,0.35)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(rx + 8, y)
        ctx.lineTo(rx + ROOM.w - 8, y)
        ctx.stroke()
      }

      // center meditation carpet
      ctx.fillStyle = 'rgba(140, 40, 30, 0.55)'
      ctx.beginPath()
      ctx.ellipse(cx, cy + 30, 160, 72, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(212, 160, 70, 0.45)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.ellipse(cx, cy + 30, 148, 62, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(212, 160, 70, 0.2)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.ellipse(cx, cy + 30, 90, 38, 0, 0, Math.PI * 2)
      ctx.stroke()

      // windows with misty light
      for (let i = 0; i < 4; i++) {
        const wx = rx + 70 + i * 210
        const wy = ry + 22
        roundRect(ctx, wx, wy, 150, 70, 6)
        const g = ctx.createLinearGradient(wx, wy, wx, wy + 70)
        g.addColorStop(0, '#c4a574')
        g.addColorStop(0.4, '#8a9aaa')
        g.addColorStop(1, '#5a6a78')
        ctx.fillStyle = g
        ctx.fill()
        // light shafts
        const shaft = ctx.createLinearGradient(wx + 75, wy + 70, wx + 75, wy + 220)
        shaft.addColorStop(0, 'rgba(255, 210, 140, 0.18)')
        shaft.addColorStop(1, 'rgba(255, 210, 140, 0)')
        ctx.fillStyle = shaft
        ctx.beginPath()
        ctx.moveTo(wx + 20, wy + 70)
        ctx.lineTo(wx + 130, wy + 70)
        ctx.lineTo(wx + 160, wy + 220)
        ctx.lineTo(wx - 10, wy + 220)
        ctx.fill()
      }

      // pillars
      for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          const px = cx + side * (160 + i * 10)
          const py = ry + 110 + i * 110
          drawPillar(ctx, px + side * (i * 55), py)
        }
      }
      drawPillar(ctx, rx + 48, ry + 180)
      drawPillar(ctx, rx + ROOM.w - 48, ry + 180)
      drawPillar(ctx, rx + 48, ry + 360)
      drawPillar(ctx, rx + ROOM.w - 48, ry + 360)

      // altar
      const ax = cx
      const ay = ry + 118
      ctx.fillStyle = '#2a1c12'
      roundRect(ctx, ax - 70, ay, 140, 28, 4)
      ctx.fill()
      ctx.fillStyle = '#5a4030'
      roundRect(ctx, ax - 58, ay - 18, 116, 22, 3)
      ctx.fill()
      // candles
      for (const dx of [-36, 0, 36]) {
        const flicker = 0.7 + Math.sin(time * 6 + dx) * 0.15
        ctx.fillStyle = '#e8dcc8'
        ctx.fillRect(ax + dx - 3, ay - 36, 6, 18)
        ctx.fillStyle = `rgba(255, 170, 60, ${flicker})`
        ctx.beginPath()
        ctx.ellipse(ax + dx, ay - 42, 5, 7, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `rgba(255, 220, 120, ${flicker * 0.35})`
        ctx.beginPath()
        ctx.arc(ax + dx, ay - 42, 14, 0, Math.PI * 2)
        ctx.fill()
      }

      // zabuton cushions
      const cushions = [
        [rx + 120, ry + ROOM.h - 100],
        [rx + 240, ry + ROOM.h - 90],
        [rx + ROOM.w - 240, ry + ROOM.h - 90],
        [rx + ROOM.w - 120, ry + ROOM.h - 100],
        [rx + 160, ry + 250],
        [rx + ROOM.w - 160, ry + 250],
      ]
      for (const [zx, zy] of cushions) {
        ctx.fillStyle = 'rgba(90, 30, 24, 0.85)'
        ctx.beginPath()
        ctx.ellipse(zx, zy, 38, 18, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(160, 70, 50, 0.5)'
        ctx.beginPath()
        ctx.ellipse(zx, zy - 4, 28, 12, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // hanging lanterns
      for (let i = 0; i < 5; i++) {
        const lx = rx + 100 + i * 180
        const sway = Math.sin(time * 1.2 + i) * 3
        ctx.strokeStyle = 'rgba(40, 24, 12, 0.6)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(lx, ry)
        ctx.lineTo(lx + sway, ry + 36)
        ctx.stroke()
        ctx.fillStyle = '#8b3a2a'
        roundRect(ctx, lx + sway - 10, ry + 34, 20, 26, 4)
        ctx.fill()
        ctx.fillStyle = `rgba(255, 180, 80, ${0.35 + Math.sin(time * 4 + i) * 0.1})`
        ctx.beginPath()
        ctx.arc(lx + sway, ry + 48, 16, 0, Math.PI * 2)
        ctx.fill()
      }

      // incense smoke
      for (const p of fx.incense) {
        p.life += p.speed * 0.016
        if (p.life > 1) {
          p.life = 0
          p.x = 0.42 + Math.random() * 0.16
          p.y = 0.28 + Math.random() * 0.08
        }
        const ix = rx + p.x * ROOM.w + Math.sin(time * 2 + p.wobble) * 8
        const iy = ry + p.y * ROOM.h - p.life * 90
        ctx.fillStyle = `rgba(220, 200, 170, ${(1 - p.life) * 0.22})`
        ctx.beginPath()
        ctx.ellipse(ix, iy, 6 + p.life * 10, 4 + p.life * 6, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // dust motes in light
      for (const d of fx.dust) {
        d.x += d.drift * 0.016
        d.y -= 0.008 * 0.016
        if (d.y < 0) d.y = 1
        if (d.x < 0) d.x = 1
        if (d.x > 1) d.x = 0
        ctx.fillStyle = `rgba(255, 230, 180, ${d.a})`
        ctx.beginPath()
        ctx.arc(rx + d.x * ROOM.w, ry + d.y * ROOM.h, d.r, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()

      // plaque
      ctx.fillStyle = 'rgba(20, 14, 10, 0.72)'
      roundRect(ctx, cx - 100, ry + ROOM.h - 42, 200, 30, 8)
      ctx.fill()
      ctx.fillStyle = '#e8d5b5'
      ctx.font = '600 13px Syne, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('TEMPLE LOBBY', cx, ry + ROOM.h - 22)

      return { rx, ry, cx, cy }
    }

    function drawPillar(ctx, x, y) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.beginPath()
      ctx.ellipse(x, y + 48, 18, 8, 0, 0, Math.PI * 2)
      ctx.fill()
      const g = ctx.createLinearGradient(x - 14, y - 60, x + 14, y + 48)
      g.addColorStop(0, '#8a6a48')
      g.addColorStop(0.4, '#5c4030')
      g.addColorStop(1, '#3a2818')
      ctx.fillStyle = g
      roundRect(ctx, x - 12, y - 60, 24, 108, 4)
      ctx.fill()
      ctx.fillStyle = '#6b4e34'
      roundRect(ctx, x - 16, y - 68, 32, 14, 3)
      ctx.fill()
      roundRect(ctx, x - 16, y + 40, 32, 12, 3)
      ctx.fill()
    }

    function drawMonk(px, py, player, pose, isSelf, motion = {}) {
      const vibe = MONK_VIBES.find((v) => v.id === player.vibe) || MONK_VIBES[0]
      const hit = pose?.hitFlash > Date.now()
      const bounce = (motion.walk || 0) % (Math.PI * 2)
      const bob = Math.sin(bounce) * 2.2
      const scale = motion.scale ?? 1
      const spin = motion.spin || 0
      const facing = motion.facing ?? (pose?.yaw != null ? (Math.cos(pose.yaw) >= 0 ? 1 : -1) : 1)

      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(spin)
      ctx.scale(scale, scale)

      // shadow
      ctx.fillStyle = `rgba(0,0,0,${0.28 * Math.min(1, scale)})`
      ctx.beginPath()
      ctx.ellipse(0, 20, 18 / Math.max(0.4, scale), 7 / Math.max(0.4, scale), 0, 0, Math.PI * 2)
      ctx.fill()

      const y = bob + (hit ? Math.sin(Date.now() / 28) * 3 : 0)

      // legs under robe
      ctx.strokeStyle = shade(vibe.color, -40)
      ctx.lineWidth = 5
      ctx.lineCap = 'round'
      const stride = Math.sin(bounce) * 5
      ctx.beginPath()
      ctx.moveTo(-6, 6 + y)
      ctx.lineTo(-6 - stride * 0.3, 18 + y)
      ctx.moveTo(6, 6 + y)
      ctx.lineTo(6 + stride * 0.3, 18 + y)
      ctx.stroke()

      // robe body
      const robe = ctx.createLinearGradient(-16, -20 + y, 16, 22 + y)
      robe.addColorStop(0, hit ? '#fff6e8' : shade(vibe.color, 25))
      robe.addColorStop(0.45, hit ? '#ffffff' : vibe.color)
      robe.addColorStop(1, shade(vibe.color, -35))
      ctx.fillStyle = robe
      ctx.beginPath()
      ctx.moveTo(0, -18 + y)
      ctx.quadraticCurveTo(18, -8 + y, 16, 8 + y)
      ctx.quadraticCurveTo(14, 20 + y, 0, 22 + y)
      ctx.quadraticCurveTo(-14, 20 + y, -16, 8 + y)
      ctx.quadraticCurveTo(-18, -8 + y, 0, -18 + y)
      ctx.fill()

      // sash
      ctx.strokeStyle = shade(vibe.accent || vibe.color, -20)
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(-12, -2 + y)
      ctx.quadraticCurveTo(0, 4 + y, 12, -2 + y)
      ctx.stroke()

      // head (shaved)
      const skin = '#d4a574'
      ctx.fillStyle = skin
      ctx.beginPath()
      ctx.ellipse(facing * 1, -26 + y, 11, 12, 0, 0, Math.PI * 2)
      ctx.fill()
      // scalp sheen
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.beginPath()
      ctx.ellipse(facing * 1 - 3, -30 + y, 4, 3, -0.4, 0, Math.PI * 2)
      ctx.fill()
      // ear
      ctx.fillStyle = shade(skin, -15)
      ctx.beginPath()
      ctx.ellipse(facing * 11, -26 + y, 2.5, 3.5, 0, 0, Math.PI * 2)
      ctx.fill()
      // eyes
      ctx.fillStyle = '#2a1810'
      ctx.beginPath()
      ctx.arc(facing * 1 - 3.5, -26 + y, 1.2, 0, Math.PI * 2)
      ctx.arc(facing * 1 + 3.5, -26 + y, 1.2, 0, Math.PI * 2)
      ctx.fill()
      // calm smile
      ctx.strokeStyle = 'rgba(60,30,20,0.45)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(facing * 1, -22 + y, 3.5, 0.15, Math.PI - 0.15)
      ctx.stroke()

      // arms in sleeves
      ctx.fillStyle = shade(vibe.color, -10)
      ctx.beginPath()
      ctx.ellipse(-14, -4 + y, 7, 10, -0.4, 0, Math.PI * 2)
      ctx.ellipse(14, -4 + y, 7, 10, 0.4, 0, Math.PI * 2)
      ctx.fill()

      // name plate
      ctx.fillStyle = 'rgba(20,12,8,0.65)'
      roundRect(ctx, -36, -52 + y, 72, 16, 6)
      ctx.fill()
      ctx.fillStyle = '#f3e6d0'
      ctx.font = '600 11px Syne, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(player.name + (isSelf ? ' · you' : ''), 0, -41 + y)

      const emoteOn = pose?.emoteUntil > Date.now() && pose?.emote
      if (emoteOn) {
        ctx.font = '20px serif'
        ctx.fillText(EMOTES[pose.emote] || '🙏', 0, -60 + y)
      }

      if (player.ready) {
        ctx.fillStyle = '#34d399'
        ctx.beginPath()
        ctx.arc(28, -28 + y, 4.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      ctx.restore()
    }

    function updatePortal(dt, time, cx, cy, suckT) {
      const portal = fx.portal
      // open: 0→1 as countdown progresses / portalForce
      const targetOpen = suckT > 0 ? Math.min(1, suckT * 1.35) : 0
      portal.open += (targetOpen - portal.open) * Math.min(1, dt * 3.2)
      portal.swirl += dt * (1.8 + portal.open * 6)

      // maintain orbiting particles
      while (portal.particles.length < 90 * portal.open + 8) {
        const a = Math.random() * Math.PI * 2
        const r = 40 + Math.random() * 160
        portal.particles.push({
          a,
          r,
          z: Math.random(),
          speed: 1.2 + Math.random() * 2.4,
          size: 1 + Math.random() * 2.5,
          hue: Math.random(),
        })
      }
      // trim when closing
      if (portal.open < 0.05 && portal.particles.length > 12) {
        portal.particles.length = 12
      }

      for (const p of portal.particles) {
        p.a += p.speed * dt * (0.8 + suckT * 2.5)
        // spiral inward when sucking hard
        const pull = 8 + suckT * 140
        p.r += (18 + p.z * 30 - p.r) * dt * 0.4 - pull * dt * (0.15 + suckT)
        if (p.r < 8) {
          p.r = 50 + Math.random() * 140
          p.a = Math.random() * Math.PI * 2
        }
      }
      return portal
    }

    function drawPortal(ctx, cx, cy, portal, suckT, time) {
      if (portal.open < 0.02) return
      const R = 30 + portal.open * 86
      const shake =
        suckT > 0.5 ? Math.sin(time * 48) * (suckT - 0.5) * 5 + Math.cos(time * 37) * (suckT - 0.5) * 3 : 0
      const px = cx + shake
      const py = cy + shake * 0.6
      ctx.save()

      // floor scorch / shadow under portal
      ctx.fillStyle = `rgba(0,0,0,${0.25 + portal.open * 0.35})`
      ctx.beginPath()
      ctx.ellipse(px, py + 14, R * 1.45, R * 0.38, 0, 0, Math.PI * 2)
      ctx.fill()

      // gravitational lensing rings
      for (let i = 0; i < 4; i++) {
        const rr = R * (1.15 + i * 0.22 + Math.sin(time * 3 + i) * 0.03)
        ctx.strokeStyle = `rgba(255, 190, 110, ${(0.08 + portal.open * 0.12) * (1 - i * 0.18)})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.ellipse(px, py, rr, rr * 0.55, time * 0.2 + i, 0, Math.PI * 2)
        ctx.stroke()
      }

      // outer glow
      const glow = ctx.createRadialGradient(px, py, R * 0.15, px, py, R * 2.4)
      glow.addColorStop(0, `rgba(255, 200, 90, ${0.4 * portal.open})`)
      glow.addColorStop(0.25, `rgba(255, 100, 40, ${0.22 * portal.open})`)
      glow.addColorStop(0.55, `rgba(80, 30, 120, ${0.16 * portal.open})`)
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(px, py, R * 2.4, 0, Math.PI * 2)
      ctx.fill()

      // event horizon disc
      const disc = ctx.createRadialGradient(px - R * 0.22, py - R * 0.28, 2, px, py, R)
      disc.addColorStop(0, `rgba(255, 248, 220, ${0.98 * portal.open})`)
      disc.addColorStop(0.12, `rgba(255, 190, 80, ${0.9 * portal.open})`)
      disc.addColorStop(0.32, `rgba(220, 60, 40, ${0.92 * portal.open})`)
      disc.addColorStop(0.55, `rgba(40, 10, 60, ${0.96 * portal.open})`)
      disc.addColorStop(0.82, `rgba(5, 2, 12, ${0.99 * portal.open})`)
      disc.addColorStop(1, `rgba(0, 0, 0, ${portal.open})`)
      ctx.fillStyle = disc
      ctx.beginPath()
      ctx.arc(px, py, R, 0, Math.PI * 2)
      ctx.fill()

      // accretion bands
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(portal.swirl * 0.45)
      for (let i = 0; i < 6; i++) {
        ctx.rotate(0.48)
        ctx.strokeStyle = `rgba(255, ${130 + i * 18}, ${40 + i * 10}, ${0.1 + portal.open * 0.22})`
        ctx.lineWidth = 1.8 + i * 0.35
        ctx.beginPath()
        ctx.ellipse(0, 0, R * (0.5 + i * 0.11), R * (0.18 + i * 0.045), i * 0.35, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()

      // particles
      for (const p of portal.particles) {
        const x = px + Math.cos(p.a + portal.swirl) * p.r
        const y = py + Math.sin(p.a + portal.swirl) * p.r * 0.58
        const a = (0.25 + p.z * 0.55) * portal.open
        ctx.fillStyle =
          p.hue > 0.55
            ? `rgba(255, 230, 150, ${a})`
            : p.hue > 0.28
              ? `rgba(255, 110, 50, ${a})`
              : `rgba(140, 70, 255, ${a * 0.75})`
        ctx.beginPath()
        ctx.arc(x, y, p.size * (0.55 + portal.open), 0, Math.PI * 2)
        ctx.fill()
        if (suckT > 0.35) {
          const nx = (px - x) * 0.22 * suckT
          const ny = (py - y) * 0.22 * suckT
          ctx.strokeStyle = `rgba(255, 210, 130, ${a * 0.55})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + nx, y + ny)
          ctx.stroke()
        }
      }

      // photon ring
      ctx.strokeStyle = `rgba(255, 240, 200, ${0.35 + Math.sin(time * 8) * 0.15})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(px, py, R * 0.92, 0, Math.PI * 2)
      ctx.stroke()

      // core spark
      ctx.fillStyle = `rgba(255,255,250,${0.55 + Math.sin(time * 12) * 0.25})`
      ctx.beginPath()
      ctx.arc(px, py, 3.5 + suckT * 10, 0, Math.PI * 2)
      ctx.fill()

      // vignette pull when hard suck
      if (suckT > 0.5) {
        const v = ctx.createRadialGradient(px, py, R * 0.8, px, py, Math.max(cx, cy) * 1.5)
        v.addColorStop(0, 'rgba(0,0,0,0)')
        v.addColorStop(0.65, `rgba(10, 4, 0, ${(suckT - 0.5) * 0.55})`)
        v.addColorStop(1, `rgba(0,0,0,${(suckT - 0.5) * 1.5})`)
        ctx.fillStyle = v
        ctx.fillRect(px - 2400, py - 2400, 4800, 4800)
      }

      ctx.restore()
    }

    function applySuck(body, cx, cy, dt, suckT) {
      if (suckT <= 0) return
      const dx = cx - body.x
      const dy = cy - body.y
      const dist = Math.hypot(dx, dy) || 1
      const nx = dx / dist
      const ny = dy / dist
      // tangential swirl (orbital angular momentum before fall-in)
      const tx = -ny
      const ty = nx
      // softened inverse-square gravity + constant terminal pull
      const g = (120 + suckT * suckT * 1400) / (dist * dist * 0.00035 + dist * 0.08 + 1)
      const swirl = (55 + suckT * 280) * (dist / (dist + 40))
      body.vx = (body.vx || 0) + nx * g * dt + tx * swirl * dt
      body.vy = (body.vy || 0) + ny * g * dt + ty * swirl * dt
      // air drag fades as you near the horizon (free-fall feel)
      const damp = 1 - Math.min(0.94, 0.28 + suckT * 0.55 * (1 - Math.min(1, dist / 220)))
      body.vx *= Math.pow(damp, dt * 60)
      body.vy *= Math.pow(damp, dt * 60)
      // velocity cap so frames stay stable
      const spd = Math.hypot(body.vx, body.vy)
      const maxSpd = 80 + suckT * 520
      if (spd > maxSpd) {
        body.vx = (body.vx / spd) * maxSpd
        body.vy = (body.vy / spd) * maxSpd
      }
      body.x += body.vx * dt
      body.y += body.vy * dt
      const spinDir = Math.sign(tx * body.vx + ty * body.vy || body.vx || 1)
      body.spin = (body.spin || 0) + suckT * suckT * dt * 10 * spinDir
      const targetScale = Math.max(0.06, Math.min(1, (dist - 10) / 200))
      body.scale = (body.scale ?? 1) + (targetScale - (body.scale ?? 1)) * Math.min(1, dt * 5)
      if (dist < 26 + suckT * 36) {
        body.scale *= 1 - dt * 4.2 * suckT
        body.x += nx * 55 * dt * suckT
        body.y += ny * 55 * dt * suckT
      }
    }

    function frame(now) {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const time = (now - t0) / 1000
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const me = localRef.current
      const cd = apiRef.current.countdownSec
      const portalForce = apiRef.current.portalForce
      // suck intensity 0→1: portal opens early, gravity ramps hard in the final stretch
      let suckT = 0
      if (portalForce) suckT = 1
      else if (cd != null && cd >= 0) {
        const progress = Math.max(0, Math.min(1, 1 - cd / 7))
        // open phase (0–0.4 progress) then escalating pull
        suckT = progress < 0.35 ? progress * 0.55 : 0.19 + ((progress - 0.35) / 0.65) * 0.81
        if (cd <= 1) suckT = Math.min(1, suckT + 0.2)
        if (cd === 0) suckT = 1
      }

      const canWalk = focused && suckT < 0.35

      if (canWalk) {
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
          me.vx = mx * 200
          me.vy = my * 200
          me.walk += dt * 10
        } else {
          me.vx *= Math.pow(0.02, dt)
          me.vy *= Math.pow(0.02, dt)
          me.walk *= 0.9
        }
        me.x += me.vx * dt
        me.y += me.vy * dt
        const { rx, ry } = roomOrigin(w, h)
        me.x = Math.max(rx + ROOM.pad, Math.min(rx + ROOM.w - ROOM.pad, me.x))
        me.y = Math.max(ry + ROOM.pad + 50, Math.min(ry + ROOM.h - ROOM.pad, me.y))
        me.scale += (1 - me.scale) * Math.min(1, dt * 5)
        me.spin *= Math.pow(0.05, dt)

        const server = apiRef.current.lobby?.[apiRef.current.selfId]
        if (server?.hitFlash > Date.now()) {
          const sx = 460 + server.x * 68
          const sy = 310 + server.z * 52
          me.x += (sx - me.x) * Math.min(1, dt * 8)
          me.y += (sy - me.y) * Math.min(1, dt * 8)
        }

        poseAcc += dt
        if (poseAcc > 0.05) {
          poseAcc = 0
          apiRef.current.onPose?.({
            x: (me.x - 460) / 68,
            y: 0,
            z: (me.y - 310) / 52,
            yaw: me.facing >= 0 ? 0 : Math.PI,
          })
        }
      }

      const room = drawTemple(w, h, time)
      const { cx, cy } = room

      if (suckT > 0) {
        applySuck(me, cx, cy, dt, suckT)
      }

      const portal = updatePortal(dt, time, cx, cy, suckT)
      // draw portal under monks when opening, then over as it intensifies
      if (suckT < 0.7) drawPortal(ctx, cx, cy, portal, suckT, time)

      if (flash > 0) flash = Math.max(0, flash - dt * 3)

      const { players: plist, lobby: lb, selfId: sid } = apiRef.current
      const motions = fx.remoteMotion

      for (const p of plist || []) {
        if (p.id === sid) continue
        const pose = lb?.[p.id]
        const tx = 460 + (pose?.x || 0) * 68
        const ty = 310 + (pose?.z || 0) * 52
        if (!motions[p.id]) {
          motions[p.id] = { x: tx, y: ty, vx: 0, vy: 0, walk: 0, scale: 1, spin: 0, facing: 1 }
        }
        const m = motions[p.id]
        if (suckT < 0.35) {
          const dx = tx - m.x
          const dy = ty - m.y
          if (Math.hypot(dx, dy) > 1) {
            m.walk += dt * 10
            m.facing = dx >= 0 ? 1 : -1
          }
          m.x += dx * Math.min(1, dt * 8)
          m.y += dy * Math.min(1, dt * 8)
          m.scale += (1 - m.scale) * Math.min(1, dt * 5)
          m.spin *= 0.9
        } else {
          applySuck(m, cx, cy, dt, suckT)
          m.walk += dt * 14 * suckT
        }
        drawMonk(m.x, m.y, p, pose, false, m)
      }

      const selfPlayer = (plist || []).find((p) => p.id === sid)
      if (selfPlayer) {
        drawMonk(me.x, me.y, selfPlayer, lb?.[sid], true, me)
      }

      if (suckT >= 0.7) drawPortal(ctx, cx, cy, portal, suckT, time)

      if (flash > 0) {
        ctx.fillStyle = `rgba(251,113,133,${flash * 0.18})`
        ctx.fillRect(0, 0, w, h)
      }

      // white-out at peak suck
      if (suckT > 0.85) {
        ctx.fillStyle = `rgba(255, 245, 220, ${(suckT - 0.85) * 3.2})`
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

  const showCount = countdownSec != null && countdownSec > 0 && countdownSec <= 5

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-2xl border border-[#5c4634]/40 bg-[#1a1410]">
      <canvas ref={canvasRef} className="block h-full w-full" />
      {showCount && (
        <div className="pointer-events-none absolute inset-x-0 top-6 z-10 flex justify-center">
          <p
            className="font-display text-6xl font-extrabold tabular-nums text-[#f3e6d0] drop-shadow-[0_4px_24px_rgba(255,140,40,0.55)] md:text-7xl"
            key={countdownSec}
            style={{ animation: 'monk-count-pop 0.45s ease-out' }}
          >
            {countdownSec}
          </p>
        </div>
      )}
      {countdownSec === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <p className="font-display text-4xl font-extrabold tracking-[0.2em] text-[#ffe6b8] md:text-5xl">
            ENTER
          </p>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-xl bg-black/50 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#e8d5b5]/85">
        WASD walk · click / space nudge · 1–4 emotes
      </div>
    </div>
  )
}

function shade(hex, amount) {
  const n = hex.replace('#', '')
  const num = parseInt(n.length === 3 ? n.split('').map((c) => c + c).join('') : n, 16)
  const r = Math.min(255, Math.max(0, ((num >> 16) & 255) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + amount))
  const b = Math.min(255, Math.max(0, (num & 255) + amount))
  return `rgb(${r},${g},${b})`
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
