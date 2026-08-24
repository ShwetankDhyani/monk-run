const REALM_NAMES = [
  'ROOT SILENCE',
  'SAFFRON WHEEL',
  'CYAN SANGHA',
  'ACID STUPA',
  'EMBER KOAN',
  'ORBIT MANTRA',
  'FRACTAL ROBE',
  'VOID BELL',
]

const TINTS = [
  [1.0, 0.95, 0.9],
  [1.1, 0.9, 0.7],
  [0.75, 1.05, 1.15],
  [0.85, 1.15, 0.8],
  [1.15, 0.75, 0.85],
  [0.9, 1.0, 1.1],
  [1.05, 0.95, 0.75],
  [0.95, 0.9, 1.2],
]

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v))
}

function rand(a, b) {
  return a + Math.random() * (b - a)
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by)
}

/**
 * Concrete arcade loop:
 * - Thrust-navigate a mote with momentum
 * - Collect all consciousness nodes
 * - Avoid collapsing dimension voids (lose a life on hit)
 * - After nodes are cleared, open a beat-synced portal by chanting ON the pulse
 * - Enter portal to next realm; clear realm 8 to win
 * - Score from nodes, combos, beat accuracy, time bonus
 */
export function createGame(audio) {
  const mode = {
    MENU: 'menu',
    PLAY: 'play',
    CLEAR: 'clear',
    OVER: 'over',
    WIN: 'win',
  }

  let phase = mode.MENU
  let realm = 0
  let score = 0
  let lives = 3
  let combo = 0
  let bestCombo = 0
  let nodesLeft = 0
  let nodesTotal = 0
  let timeLeft = 60
  let message = ''
  let messageT = 0
  let clearTimer = 0
  let invuln = 0
  let portalReady = false
  let portalOpen = false
  let beatFlash = 0
  let lastInWindow = false
  let chantLock = 0
  let particles = []
  let shake = 0

  const player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    r: 14,
    angle: 0,
    dashCd: 0,
    shield: 0,
  }

  let nodes = []
  let hazards = []
  let portal = { x: 0, y: 0, r: 36, pulse: 0 }
  let cssW = 800
  let cssH = 600

  function flash(text, dur = 2) {
    message = text
    messageT = dur
  }

  function spawnParticles(x, y, n, speed, hue) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = rand(0.4, 1.4) * speed
      particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.35, 1.1),
        max: 1,
        size: rand(2, 5),
        hue,
      })
    }
  }

  function placeAway(minDist, fromList, margin = 70) {
    for (let tries = 0; tries < 80; tries++) {
      const x = rand(margin, cssW - margin)
      const y = rand(margin, cssH - margin)
      let ok = dist(x, y, player.x, player.y) > minDist
      if (ok) {
        for (const o of fromList) {
          if (dist(x, y, o.x, o.y) < minDist * 0.7) {
            ok = false
            break
          }
        }
      }
      if (ok) return { x, y }
    }
    return { x: rand(margin, cssW - margin), y: rand(margin, cssH - margin) }
  }

  function buildRealm(index) {
    realm = index
    nodes = []
    hazards = []
    particles = []
    portalReady = false
    portalOpen = false
    invuln = 1.2
    player.vx = 0
    player.vy = 0
    player.x = cssW * 0.5
    player.y = cssH * 0.5
    player.dashCd = 0
    player.shield = 0
    combo = 0

    nodesTotal = 4 + index
    nodesLeft = nodesTotal
    timeLeft = 55 + index * 5

    for (let i = 0; i < nodesTotal; i++) {
      const p = placeAway(110, nodes)
      nodes.push({
        x: p.x,
        y: p.y,
        r: 12,
        phase: rand(0, Math.PI * 2),
        taken: false,
        worth: 100 + index * 25,
      })
    }

    const hazardCount = 2 + Math.floor(index * 1.25)
    for (let i = 0; i < hazardCount; i++) {
      const p = placeAway(160, [...hazards, ...nodes])
      const orbit = Math.random() > 0.45
      hazards.push({
        x: p.x,
        y: p.y,
        r: rand(22, 34) + index * 1.5,
        vx: rand(-40, 40) * (1 + index * 0.12),
        vy: rand(-40, 40) * (1 + index * 0.12),
        phase: rand(0, Math.PI * 2),
        orbit,
        ox: p.x,
        oy: p.y,
        orbitR: rand(40, 110),
        orbitSp: rand(0.4, 1.1) * (Math.random() > 0.5 ? 1 : -1),
        collapse: rand(0, Math.PI * 2),
      })
    }

    portal.x = cssW * 0.5
    portal.y = cssH * 0.18
    portal.pulse = 0

    audio.setTempo(88 + index * 8)
    flash(`REALM ${index + 1} · ${REALM_NAMES[index]}`, 2.4)
  }

  function startRun() {
    score = 0
    lives = 3
    bestCombo = 0
    phase = mode.PLAY
    buildRealm(0)
  }

  function resize(w, h) {
    const sx = w / cssW
    const sy = h / cssH
    cssW = w
    cssH = h
    if (!Number.isFinite(sx) || !Number.isFinite(sy)) return
    player.x *= sx
    player.y *= sy
    for (const n of nodes) {
      n.x *= sx
      n.y *= sy
    }
    for (const hzd of hazards) {
      hzd.x *= sx
      hzd.y *= sy
      hzd.ox *= sx
      hzd.oy *= sy
      hzd.orbitR *= (sx + sy) * 0.5
    }
    portal.x *= sx
    portal.y *= sy
  }

  function killPlayer() {
    if (invuln > 0 || player.shield > 0) return false
    lives -= 1
    combo = 0
    invuln = 2
    shake = 12
    audio.hurt()
    spawnParticles(player.x, player.y, 40, 2.2, 0.9)
    player.vx *= -0.4
    player.vy *= -0.4
    flash(lives > 0 ? `EGO FRACTURE · ${lives} LEFT` : 'DISSOLVED', 1.6)
    if (lives <= 0) {
      phase = mode.OVER
      audio.gameOver()
    }
    return true
  }

  function update(dt, input, beat) {
    if (messageT > 0) messageT -= dt
    if (beatFlash > 0) beatFlash -= dt
    if (shake > 0) shake -= dt * 30
    if (invuln > 0) invuln -= dt
    if (chantLock > 0) chantLock -= dt
    if (player.dashCd > 0) player.dashCd -= dt
    if (player.shield > 0) player.shield -= dt

    if (beat.beat) beatFlash = 0.12
    lastInWindow = beat.inWindow

    // particle sim always
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life -= dt
      p.x += p.vx * 70 * dt
      p.y += p.vy * 70 * dt
      if (p.life <= 0) particles.splice(i, 1)
    }

    if (phase === mode.CLEAR) {
      clearTimer -= dt
      if (clearTimer <= 0) {
        if (realm >= 7) {
          phase = mode.WIN
          audio.win()
          flash('THE VOID ACCEPTS YOU', 99)
        } else {
          buildRealm(realm + 1)
          phase = mode.PLAY
        }
      }
      return snapshot(beat)
    }

    if (phase !== mode.PLAY) return snapshot(beat)

    timeLeft -= dt
    if (timeLeft <= 0) {
      flash('TIME COLLAPSED')
      lives = 0
      phase = mode.OVER
      audio.gameOver()
      return snapshot(beat)
    }

    // --- Player physics ---
    const thrust = 320 + realm * 12
    const drag = 0.90
    if (input.thrusting) {
      player.vx += input.thrustX * thrust * dt
      player.vy += input.thrustY * thrust * dt
      player.angle = Math.atan2(input.thrustY, input.thrustX)
      spawnParticles(player.x, player.y, 1, 0.5, 0.2)
    }
    // Soft gravity wells from hazards (non-Euclidean pull)
    for (const h of hazards) {
      const d = dist(player.x, player.y, h.x, h.y) || 1
      const pull = (900 + realm * 80) / (d * d)
      if (d < 220) {
        player.vx += ((h.x - player.x) / d) * pull * dt * 18
        player.vy += ((h.y - player.y) / d) * pull * dt * 18
      }
    }

    if (input.dashJust && player.dashCd <= 0) {
      const dx = input.thrusting ? input.thrustX : Math.cos(player.angle)
      const dy = input.thrusting ? input.thrustY : Math.sin(player.angle)
      player.vx += dx * 420
      player.vy += dy * 420
      player.dashCd = 0.85
      player.shield = 0.25
      audio.dash()
      spawnParticles(player.x, player.y, 18, 1.8, 0.55)
    }

    player.vx *= Math.pow(drag, dt * 60)
    player.vy *= Math.pow(drag, dt * 60)
    const maxSp = 340 + realm * 20
    const sp = Math.hypot(player.vx, player.vy)
    if (sp > maxSp) {
      player.vx = (player.vx / sp) * maxSp
      player.vy = (player.vy / sp) * maxSp
    }
    player.x += player.vx * dt
    player.y += player.vy * dt
    player.x = clamp(player.x, player.r, cssW - player.r)
    player.y = clamp(player.y, player.r, cssH - player.r)

    // Bounce edges softly
    if (player.x <= player.r || player.x >= cssW - player.r) player.vx *= -0.55
    if (player.y <= player.r || player.y >= cssH - player.r) player.vy *= -0.55

    // --- Hazards ---
    for (const h of hazards) {
      h.collapse += dt * (1.2 + realm * 0.15)
      h.rBase = h.r
      const breathe = 1 + 0.15 * Math.sin(h.collapse)
      h.drawR = h.r * breathe
      if (h.orbit) {
        h.phase += dt * h.orbitSp
        h.x = h.ox + Math.cos(h.phase) * h.orbitR
        h.y = h.oy + Math.sin(h.phase) * h.orbitR * 0.75
      } else {
        h.x += h.vx * dt
        h.y += h.vy * dt
        if (h.x < h.r || h.x > cssW - h.r) h.vx *= -1
        if (h.y < h.r || h.y > cssH - h.r) h.vy *= -1
        // Slowly chase player on higher realms
        if (realm >= 2) {
          const d = dist(player.x, player.y, h.x, h.y) || 1
          h.vx += ((player.x - h.x) / d) * (20 + realm * 6) * dt
          h.vy += ((player.y - h.y) / d) * (20 + realm * 6) * dt
        }
      }
      if (dist(player.x, player.y, h.x, h.y) < player.r + h.drawR * 0.72) {
        killPlayer()
      }
    }

    // --- Nodes ---
    for (const n of nodes) {
      if (n.taken) continue
      n.phase += dt * 2.4
      // Nodes gently drift
      n.x += Math.sin(n.phase) * 10 * dt
      n.y += Math.cos(n.phase * 0.8) * 10 * dt
      n.x = clamp(n.x, 40, cssW - 40)
      n.y = clamp(n.y, 40, cssH - 40)
      if (dist(player.x, player.y, n.x, n.y) < player.r + n.r + 4) {
        n.taken = true
        nodesLeft--
        combo++
        bestCombo = Math.max(bestCombo, combo)
        const gained = Math.floor(n.worth * (1 + combo * 0.15))
        score += gained
        audio.collect()
        spawnParticles(n.x, n.y, 28, 1.6, 0.35)
        flash(`+${gained} · COMBO x${combo}`, 1.1)
        if (nodesLeft <= 0) {
          portalReady = true
          flash('CHANT ON THE BEAT TO OPEN THE PORTAL', 3)
        }
      }
    }
    nodes = nodes.filter((n) => !n.taken)

    // --- Rhythm portal ---
    if (portalReady) {
      portal.pulse += dt
      // Reposition portal slowly so player must navigate
      portal.x = cssW * 0.5 + Math.sin(portal.pulse * 0.55) * cssW * 0.28
      portal.y = cssH * 0.22 + Math.cos(portal.pulse * 0.4) * cssH * 0.08

      if (input.chantJust && chantLock <= 0) {
        chantLock = 0.2
        if (beat.inWindow) {
          if (!portalOpen) {
            portalOpen = true
            score += 250 + realm * 50
            audio.portalOpen()
            spawnParticles(portal.x, portal.y, 50, 2, 0.15)
            flash('PORTAL STABILIZED', 1.5)
          } else {
            // Maintain portal — shield boost
            player.shield = Math.max(player.shield, 0.4)
            score += 25
          }
        } else {
          audio.missBeat()
          combo = 0
          // Missing collapses portal briefly if open
          if (portalOpen) {
            portalOpen = false
            flash('OFFBEAT · PORTAL FLICKERS', 1.2)
            shake = 6
          } else {
            flash('OFFBEAT · WAIT FOR THE PULSE', 1)
          }
        }
      }

      if (portalOpen && dist(player.x, player.y, portal.x, portal.y) < player.r + portal.r) {
        const timeBonus = Math.floor(timeLeft * (8 + realm * 2))
        score += 500 + realm * 150 + timeBonus
        phase = mode.CLEAR
        clearTimer = 1.8
        audio.levelClear()
        spawnParticles(portal.x, portal.y, 80, 2.5, 0.5)
        flash(`REALM CLEAR · +${500 + realm * 150 + timeBonus}`, 1.8)
      }
    }

    // Holding chant near beat window gives mild drag reduction (skill expression)
    if (input.chantHeld && beat.inWindow) {
      player.shield = Math.max(player.shield, 0.05)
    }

    audio.setIntensity(realm, input.chantHeld ? 1 : 0)

    return snapshot(beat)
  }

  function snapshot(beat) {
    return {
      phase,
      realm,
      realmName: REALM_NAMES[realm] || '',
      score,
      lives,
      combo,
      bestCombo,
      nodesLeft,
      nodesTotal,
      timeLeft,
      message,
      messageT,
      portalReady,
      portalOpen,
      beatPhase: beat.phase,
      inWindow: beat.inWindow,
      beatFlash,
      invuln,
      tint: TINTS[realm] || TINTS[0],
      player: { ...player },
      nodes: nodes.map((n) => ({ ...n })),
      hazards: hazards.map((h) => ({ ...h })),
      portal: { ...portal },
      particles: particles.map((p) => ({ ...p })),
      shake,
      cssW,
      cssH,
    }
  }

  function draw(ctx, dpr, snap) {
    const w = snap.cssW
    const h = snap.cssH
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const sx = snap.shake > 0 ? rand(-snap.shake, snap.shake) * 0.35 : 0
    const sy = snap.shake > 0 ? rand(-snap.shake, snap.shake) * 0.35 : 0
    ctx.save()
    ctx.translate(sx, sy)

    // Beat ring (rhythm UI — essential mechanic feedback)
    if (snap.phase === mode.PLAY || snap.phase === mode.CLEAR) {
      const cx = w * 0.5
      const cy = 36
      const br = 16
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(245,240,255,0.2)'
      ctx.lineWidth = 2
      ctx.arc(cx, cy, br, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.strokeStyle = snap.inWindow
        ? 'rgba(128,255,114,0.95)'
        : 'rgba(0,229,255,0.7)'
      ctx.lineWidth = 3
      ctx.arc(cx, cy, br, -Math.PI / 2, -Math.PI / 2 + snap.beatPhase * Math.PI * 2)
      ctx.stroke()
      if (snap.beatFlash > 0) {
        ctx.beginPath()
        ctx.fillStyle = `rgba(244,162,97,${snap.beatFlash * 4})`
        ctx.arc(cx, cy, br + 6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = 'rgba(245,240,255,0.45)'
      ctx.font = '500 10px "IBM Plex Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(snap.portalReady ? 'SPACE ON BEAT' : 'PULSE', cx, cy + 32)
    }

    // Hazards — collapsing dimensions
    for (const hz of snap.hazards) {
      const R = hz.drawR || hz.r
      const g = ctx.createRadialGradient(hz.x, hz.y, 0, hz.x, hz.y, R * 1.4)
      g.addColorStop(0, 'rgba(5,2,8,0.95)')
      g.addColorStop(0.45, 'rgba(255,77,109,0.55)')
      g.addColorStop(1, 'rgba(255,77,109,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(hz.x, hz.y, R * 1.4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,77,109,0.75)'
      ctx.lineWidth = 2
      ctx.beginPath()
      // jagged ring
      for (let i = 0; i <= 18; i++) {
        const a = (i / 18) * Math.PI * 2
        const jag = R * (0.85 + 0.2 * Math.sin(a * 5 + (hz.collapse || 0)))
        const x = hz.x + Math.cos(a) * jag
        const y = hz.y + Math.sin(a) * jag
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
    }

    // Portal
    if (snap.portalReady) {
      const p = snap.portal
      const open = snap.portalOpen
      const pr = p.r * (open ? 1 + 0.08 * Math.sin(p.pulse * 6) : 0.7)
      const pg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pr * 2)
      pg.addColorStop(0, open ? 'rgba(128,255,114,0.85)' : 'rgba(0,229,255,0.25)')
      pg.addColorStop(0.5, open ? 'rgba(0,229,255,0.45)' : 'rgba(244,162,97,0.15)')
      pg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = pg
      ctx.beginPath()
      ctx.arc(p.x, p.y, pr * 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = open ? 'rgba(128,255,114,0.95)' : 'rgba(245,240,255,0.3)'
      ctx.lineWidth = open ? 3 : 1.5
      ctx.setLineDash(open ? [] : [6, 8])
      ctx.beginPath()
      ctx.arc(p.x, p.y, pr, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = open ? 'rgba(128,255,114,0.9)' : 'rgba(245,240,255,0.4)'
      ctx.font = '700 11px Syne, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(open ? 'ENTER' : 'LOCKED', p.x, p.y + 4)
    }

    // Nodes
    for (const n of snap.nodes) {
      const pulse = 0.75 + 0.25 * Math.sin(n.phase)
      const ng = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 2.4)
      ng.addColorStop(0, `rgba(255,246,232,${0.9 * pulse})`)
      ng.addColorStop(0.35, `rgba(244,162,97,${0.7 * pulse})`)
      ng.addColorStop(1, 'rgba(244,162,97,0)')
      ctx.fillStyle = ng
      ctx.beginPath()
      ctx.arc(n.x, n.y, n.r * 2.4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = `rgba(0,229,255,${0.6 + 0.4 * pulse})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Particles
    for (const p of snap.particles) {
      const a = Math.max(0, p.life / (p.max || 1))
      const r = p.hue < 0.33 ? 244 : p.hue < 0.66 ? 0 : 255
      const g = p.hue < 0.33 ? 162 : p.hue < 0.66 ? 229 : 77
      const b = p.hue < 0.33 ? 97 : p.hue < 0.66 ? 255 : 109
      ctx.fillStyle = `rgba(${r},${g},${b},${a * 0.9})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * (0.5 + a), 0, Math.PI * 2)
      ctx.fill()
    }

    // Player mote
    if (snap.phase === mode.PLAY || snap.phase === mode.CLEAR) {
      const pl = snap.player
      const blink = snap.invuln > 0 && Math.floor(snap.invuln * 12) % 2 === 0
      if (!blink) {
        if (pl.shield > 0) {
          ctx.strokeStyle = `rgba(128,255,114,${0.4 + pl.shield})`
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(pl.x, pl.y, pl.r + 8, 0, Math.PI * 2)
          ctx.stroke()
        }
        const body = ctx.createRadialGradient(pl.x, pl.y, 0, pl.x, pl.y, pl.r * 2)
        body.addColorStop(0, '#fff6e8')
        body.addColorStop(0.4, '#00e5ff')
        body.addColorStop(1, 'rgba(0,229,255,0)')
        ctx.fillStyle = body
        ctx.beginPath()
        ctx.arc(pl.x, pl.y, pl.r * 1.8, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#f4a261'
        ctx.beginPath()
        ctx.arc(pl.x, pl.y, pl.r * 0.55, 0, Math.PI * 2)
        ctx.fill()
        // thrust nose
        ctx.strokeStyle = 'rgba(128,255,114,0.85)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(pl.x, pl.y)
        ctx.lineTo(pl.x + Math.cos(pl.angle) * (pl.r + 10), pl.y + Math.sin(pl.angle) * (pl.r + 10))
        ctx.stroke()
      }
    }

    ctx.restore()

    // HUD — score / lives / objective (real game chrome)
    drawChrome(ctx, snap, w, h)

    // End screens
    if (snap.phase === mode.OVER || snap.phase === mode.WIN) {
      ctx.fillStyle = 'rgba(5,2,8,0.55)'
      ctx.fillRect(0, 0, w, h)
      ctx.textAlign = 'center'
      ctx.font = '800 42px Syne, sans-serif'
      ctx.fillStyle = snap.phase === mode.WIN ? '#80ff72' : '#ff4d6d'
      ctx.fillText(snap.phase === mode.WIN ? 'AWAKENED' : 'EGO DEATH', w * 0.5, h * 0.42)
      ctx.font = '500 16px "IBM Plex Mono", monospace'
      ctx.fillStyle = 'rgba(245,240,255,0.85)'
      ctx.fillText(`SCORE ${snap.score}`, w * 0.5, h * 0.5)
      ctx.fillText(`BEST COMBO x${snap.bestCombo}`, w * 0.5, h * 0.5 + 28)
      ctx.fillStyle = 'rgba(244,162,97,0.9)'
      ctx.font = '700 14px Syne, sans-serif'
      ctx.fillText('PRESS R / ENTER TO REINCARNATE', w * 0.5, h * 0.5 + 70)
    }
  }

  function drawChrome(ctx, snap, w, h) {
    // Top bar
    ctx.textAlign = 'left'
    ctx.font = '800 18px Syne, sans-serif'
    ctx.fillStyle = 'rgba(244,162,97,0.85)'
    ctx.fillText('monk.run', 16, 28)

    ctx.textAlign = 'right'
    ctx.font = '700 18px "IBM Plex Mono", monospace'
    ctx.fillStyle = '#80ff72'
    ctx.fillText(String(snap.score).padStart(6, '0'), w - 16, 28)

    ctx.textAlign = 'center'
    ctx.font = '500 11px "IBM Plex Mono", monospace'
    ctx.fillStyle = 'rgba(245,240,255,0.55)'
    if (snap.phase === mode.PLAY) {
      ctx.fillText(
        `REALM ${snap.realm + 1}/8  ·  NODES ${snap.nodesTotal - snap.nodesLeft}/${snap.nodesTotal}  ·  ${Math.ceil(snap.timeLeft)}s`,
        w * 0.5,
        h - 18,
      )
    }

    // Lives
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < snap.lives ? '#ff4d6d' : 'rgba(255,77,109,0.2)'
      ctx.beginPath()
      ctx.arc(16 + i * 18, 48, 5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Combo
    if (snap.combo > 1 && snap.phase === mode.PLAY) {
      ctx.textAlign = 'left'
      ctx.fillStyle = '#00e5ff'
      ctx.font = '700 13px Syne, sans-serif'
      ctx.fillText(`COMBO x${snap.combo}`, 16, 72)
    }

    // Objective banner
    if (snap.messageT > 0 && snap.message) {
      ctx.textAlign = 'center'
      ctx.font = '700 15px Syne, sans-serif'
      ctx.fillStyle = `rgba(128,255,114,${clamp(snap.messageT, 0, 1)})`
      ctx.fillText(snap.message, w * 0.5, h * 0.12)
    }

    // Controls reminder (play only, subtle)
    if (snap.phase === mode.PLAY && snap.realm === 0 && snap.timeLeft > 50) {
      ctx.textAlign = 'center'
      ctx.font = '500 10px "IBM Plex Mono", monospace'
      ctx.fillStyle = 'rgba(245,240,255,0.35)'
      ctx.fillText('WASD THRUST · CLICK/SHIFT DASH · SPACE CHANT ON BEAT', w * 0.5, h - 36)
    }
  }

  return {
    mode,
    startRun,
    resize,
    update,
    draw,
    getPhase: () => phase,
    tryRestart(input) {
      if (
        (phase === mode.OVER || phase === mode.WIN || phase === mode.MENU) &&
        input.restartJust
      ) {
        startRun()
        return true
      }
      return false
    },
  }
}

export { REALM_NAMES, TINTS }
