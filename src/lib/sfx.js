/**
 * Lightweight Web Audio — procedural SFX + expedition ambient loop.
 * Original compositions only (no licensed anime OST or samples).
 */

let ctx = null
let master = null
let ambientMaster = null
let muted = localStorage.getItem('monk-mute-sfx') === '1'
let ambientMuted = localStorage.getItem('monk-mute-ambient') === '1'
let volume = Number(localStorage.getItem('monk-sfx-vol') || '0.45')
/** @type {Array<{ stop: () => void }>} */
let ambientNodes = []

function ensure() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : volume
    master.connect(ctx.destination)

    ambientMaster = ctx.createGain()
    ambientMaster.gain.value = ambientMuted ? 0 : Math.min(0.38, volume * 0.55)
    ambientMaster.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function setSfxMuted(next) {
  muted = !!next
  localStorage.setItem('monk-mute-sfx', muted ? '1' : '0')
  if (master) master.gain.value = muted ? 0 : volume
}

export function isSfxMuted() {
  return muted
}

export function setAmbientMuted(next) {
  ambientMuted = !!next
  localStorage.setItem('monk-mute-ambient', ambientMuted ? '1' : '0')
  if (ambientMaster) ambientMaster.gain.value = ambientMuted ? 0 : Math.min(0.38, volume * 0.55)
  if (ambientMuted) stopAmbient()
}

export function isAmbientMuted() {
  return ambientMuted
}

export function setSfxVolume(v) {
  volume = Math.max(0, Math.min(1, Number(v) || 0))
  localStorage.setItem('monk-sfx-vol', String(volume))
  if (master && !muted) master.gain.value = volume
  if (ambientMaster && !ambientMuted) ambientMaster.gain.value = Math.min(0.38, volume * 0.55)
}

function tone(freq, dur = 0.08, type = 'sine', gain = 0.2, slideTo = null) {
  const c = ensure()
  if (!c || !master || muted) return
  const t0 = c.currentTime
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo != null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g)
  g.connect(master)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

/** Original low-tension expedition ambient — drone, wind, distant brass swell. */
export function startAmbient() {
  if (ambientMuted || ambientNodes.length) return
  const c = ensure()
  if (!c || !ambientMaster) return

  const t0 = c.currentTime + 0.05
  const stops = []

  function track(node) {
    stops.push(() => {
      try {
        node.stop?.()
      } catch {
        /* */
      }
      try {
        node.disconnect?.()
      } catch {
        /* */
      }
    })
    return node
  }

  // Wall-wind noise bed
  const windSrc = c.createBufferSource()
  const buf = c.createBuffer(1, c.sampleRate * 4, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.35
  windSrc.buffer = buf
  windSrc.loop = true
  const windFilter = c.createBiquadFilter()
  windFilter.type = 'bandpass'
  windFilter.frequency.value = 420
  windFilter.Q.value = 0.6
  const windGain = c.createGain()
  windGain.gain.value = 0.045
  windSrc.connect(windFilter)
  windFilter.connect(windGain)
  windGain.connect(ambientMaster)
  windSrc.start(t0)
  track(windSrc)

  // Slow filter sweep on wind
  const windLfo = c.createOscillator()
  windLfo.type = 'sine'
  windLfo.frequency.value = 0.04
  const windLfoGain = c.createGain()
  windLfoGain.gain.value = 180
  windLfo.connect(windLfoGain)
  windLfoGain.connect(windFilter.frequency)
  windLfo.start(t0)
  track(windLfo)

  // Deep wall drone (minor third)
  for (const [freq, gain] of [
    [55, 0.07],
    [69.3, 0.045],
    [82.5, 0.03],
  ]) {
    const osc = c.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const g = c.createGain()
    g.gain.value = gain
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 220
    osc.connect(lp)
    lp.connect(g)
    g.connect(ambientMaster)
    osc.start(t0)
    track(osc)
  }

  // Distant brass-like pad (filtered saw, very soft)
  const pad = c.createOscillator()
  pad.type = 'sawtooth'
  pad.frequency.value = 110
  const padFilter = c.createBiquadFilter()
  padFilter.type = 'lowpass'
  padFilter.frequency.value = 280
  const padGain = c.createGain()
  padGain.gain.setValueAtTime(0.0001, t0)
  padGain.gain.linearRampToValueAtTime(0.028, t0 + 8)
  padGain.gain.linearRampToValueAtTime(0.012, t0 + 24)
  padGain.gain.linearRampToValueAtTime(0.028, t0 + 40)
  pad.connect(padFilter)
  padFilter.connect(padGain)
  padGain.connect(ambientMaster)
  pad.start(t0)
  track(pad)

  // Subtle pulse — expedition heartbeat, not a copied motif
  const pulse = c.createOscillator()
  pulse.type = 'sine'
  pulse.frequency.value = 1.1
  const pulseDepth = c.createGain()
  pulseDepth.gain.value = 0.012
  pulse.connect(pulseDepth)
  pulseDepth.connect(padGain.gain)
  pulse.start(t0)
  track(pulse)

  ambientNodes = stops
}

export function stopAmbient() {
  for (const stop of ambientNodes) stop()
  ambientNodes = []
}

export const sfx = {
  ui() {
    tone(520, 0.05, 'triangle', 0.12)
  },
  join() {
    tone(320, 0.1, 'sine', 0.15, 640)
  },
  lock() {
    tone(180, 0.12, 'square', 0.08)
    setTimeout(() => tone(240, 0.08, 'square', 0.06), 60)
  },
  portal() {
    tone(90, 0.45, 'sawtooth', 0.1, 40)
    setTimeout(() => tone(130, 0.35, 'sawtooth', 0.06, 55), 120)
  },
  reveal() {
    tone(440, 0.1, 'sine', 0.14, 880)
    setTimeout(() => tone(660, 0.12, 'sine', 0.1), 90)
  },
  podium() {
    ;[523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.12), i * 120))
  },
  smack() {
    tone(120, 0.06, 'square', 0.1, 60)
  },
  tick() {
    tone(880, 0.03, 'sine', 0.05)
  },
  error() {
    tone(200, 0.15, 'sawtooth', 0.08, 100)
  },
  /** Wire reel swoosh — ODM-adjacent without samples */
  deploy() {
    tone(240, 0.18, 'sawtooth', 0.07, 680)
  },
}
