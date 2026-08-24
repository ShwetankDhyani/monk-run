export function createAudio() {
  let ctx = null
  let master = null
  let started = false
  let beatInterval = 0.75
  let nextBeat = 0
  let beatIndex = 0
  let onBeatCb = null
  let drones = []
  let filter = null

  function ensure() {
    if (ctx) return
    const AC = window.AudioContext || window.webkitAudioContext
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.001
    master.connect(ctx.destination)
  }

  function tone(freq, dur, type = 'sine', gain = 0.15, when = 0) {
    if (!ctx || !started) return
    const t = ctx.currentTime + when
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g)
    g.connect(master)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  }

  async function start() {
    ensure()
    if (started) {
      if (ctx.state === 'suspended') await ctx.resume()
      return
    }
    started = true
    if (ctx.state === 'suspended') await ctx.resume()

    filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900
    filter.connect(master)

    const specs = [
      [55, 'sine', 0.1],
      [82.5, 'triangle', 0.04],
      [110, 'sine', 0.03],
    ]
    drones = specs.map(([f, type, g]) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = f
      gain.gain.value = g
      osc.connect(gain)
      gain.connect(filter)
      osc.start()
      return { osc, gain, base: f }
    })

    const now = ctx.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(0.001, now)
    master.gain.exponentialRampToValueAtTime(0.5, now + 1.2)
    nextBeat = now + 0.4
  }

  function setTempo(bpm) {
    beatInterval = 60 / Math.max(60, bpm)
  }

  function setIntensity(level, chant) {
    if (!filter || !ctx) return
    const now = ctx.currentTime
    filter.frequency.setTargetAtTime(700 + level * 80 + chant * 600, now, 0.15)
    for (const d of drones) {
      d.osc.frequency.setTargetAtTime(d.base * (1 + chant * 0.06 + level * 0.01), now, 0.2)
    }
  }

  function tick() {
    if (!ctx || !started) return { beat: false, phase: 0, inWindow: false }
    const now = ctx.currentTime
    let beat = false
    while (now >= nextBeat) {
      beat = true
      beatIndex++
      // metronome click — soft, audible for rhythm portal
      tone(beatIndex % 4 === 0 ? 660 : 440, 0.06, 'sine', beatIndex % 4 === 0 ? 0.09 : 0.045)
      nextBeat += beatInterval
      if (onBeatCb) onBeatCb(beatIndex)
    }
    const prev = nextBeat - beatInterval
    const phase = (now - prev) / beatInterval
    const dist = Math.min(phase, 1 - phase)
    const inWindow = dist < 0.18
    return { beat, phase, inWindow, beatIndex }
  }

  function collect() {
    tone(523.25, 0.18, 'sine', 0.16)
    tone(783.99, 0.25, 'triangle', 0.08, 0.04)
  }

  function hurt() {
    tone(90, 0.35, 'sawtooth', 0.12)
    tone(60, 0.5, 'sine', 0.1, 0.02)
  }

  function portalOpen() {
    tone(220, 0.4, 'sine', 0.12)
    tone(330, 0.45, 'triangle', 0.1, 0.05)
    tone(440, 0.5, 'sine', 0.08, 0.1)
  }

  function levelClear() {
    ;[261.63, 329.63, 392, 523.25].forEach((f, i) => tone(f, 0.35, 'sine', 0.1, i * 0.08))
  }

  function gameOver() {
    tone(200, 0.5, 'sawtooth', 0.1)
    tone(150, 0.7, 'sine', 0.12, 0.1)
    tone(80, 1.0, 'triangle', 0.1, 0.2)
  }

  function win() {
    ;[261.63, 329.63, 392, 523.25, 659.25, 784].forEach((f, i) =>
      tone(f, 0.4, 'sine', 0.09, i * 0.1),
    )
  }

  function dash() {
    tone(180, 0.12, 'square', 0.06)
    tone(360, 0.18, 'sine', 0.07, 0.02)
  }

  function missBeat() {
    tone(140, 0.12, 'triangle', 0.05)
  }

  function onBeat(cb) {
    onBeatCb = cb
  }

  return {
    start,
    setTempo,
    setIntensity,
    tick,
    collect,
    hurt,
    portalOpen,
    levelClear,
    gameOver,
    win,
    dash,
    missBeat,
    onBeat,
    get context() {
      return ctx
    },
  }
}
