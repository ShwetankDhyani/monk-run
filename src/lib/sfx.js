/**
 * Lightweight Web Audio SFX — no asset downloads, instant, muteable.
 * Studio audio pass: UI confirmations + round punctuation.
 */

let ctx = null
let master = null
let muted = localStorage.getItem('monk-mute-sfx') === '1'
let volume = Number(localStorage.getItem('monk-sfx-vol') || '0.45')

function ensure() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : volume
    master.connect(ctx.destination)
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

export function setSfxVolume(v) {
  volume = Math.max(0, Math.min(1, Number(v) || 0))
  localStorage.setItem('monk-sfx-vol', String(volume))
  if (master && !muted) master.gain.value = volume
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
}
