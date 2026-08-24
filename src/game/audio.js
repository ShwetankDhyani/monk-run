export function createAudio() {
  let ctx = null
  let master = null
  let chantGain = null
  let droneOsc = []
  let lfo = null
  let noiseSrc = null
  let started = false
  let analyser = null
  let data = null

  function ensure() {
    if (ctx) return
    const AC = window.AudioContext || window.webkitAudioContext
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.0
    master.connect(ctx.destination)

    chantGain = ctx.createGain()
    chantGain.gain.value = 0.0
    chantGain.connect(master)

    analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    master.connect(analyser)
    data = new Uint8Array(analyser.frequencyBinCount)
  }

  function makeDrone(freq, type, gainVal, detune = 0) {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    osc.detune.value = detune
    g.gain.value = gainVal
    osc.connect(g)
    g.connect(master)
    osc.start()
    return { osc, g }
  }

  async function start() {
    ensure()
    if (started) {
      if (ctx.state === 'suspended') await ctx.resume()
      return
    }
    started = true
    if (ctx.state === 'suspended') await ctx.resume()

    // Deep ritual drones
    droneOsc = [
      makeDrone(55, 'sine', 0.12),
      makeDrone(82.5, 'triangle', 0.05, 7),
      makeDrone(110, 'sine', 0.04, -5),
      makeDrone(165, 'sawtooth', 0.015, 12),
    ]

    // Breathing LFO on drone amplitude
    lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.value = 0.12
    lfoGain.gain.value = 0.04
    lfo.connect(lfoGain)
    lfoGain.connect(droneOsc[0].g.gain)
    lfo.start()

    // Soft noise pad (filtered)
    const bufferSize = 2 * ctx.sampleRate
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const out = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      out[i] = (Math.random() * 2 - 1) * 0.35
    }
    noiseSrc = ctx.createBufferSource()
    noiseSrc.buffer = buffer
    noiseSrc.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 420
    filter.Q.value = 0.7
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.03
    noiseSrc.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(master)
    noiseSrc.start()

    // Fade in
    const now = ctx.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(0.001, now)
    master.gain.exponentialRampToValueAtTime(0.55, now + 2.2)
  }

  function setChant(amount, lookMag = 0) {
    if (!ctx || !chantGain) return
    const now = ctx.currentTime
    const target = Math.max(0.0001, amount * 0.28 + lookMag * 0.04)
    chantGain.gain.setTargetAtTime(target, now, 0.08)

    // Modulate drone pitch with look / chant
    for (let i = 0; i < droneOsc.length; i++) {
      const base = [55, 82.5, 110, 165][i]
      const bend = 1 + amount * 0.08 + lookMag * 0.04 * (i + 1) * 0.15
      droneOsc[i].osc.frequency.setTargetAtTime(base * bend, now, 0.12)
    }
    if (lfo) {
      lfo.frequency.setTargetAtTime(0.12 + amount * 0.35, now, 0.1)
    }
  }

  function pulse(intensity = 1) {
    if (!ctx || !started) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(220 + intensity * 180, now)
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.9)
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.2 * intensity, now + 0.04)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.1)
    osc.connect(g)
    g.connect(chantGain)
    osc.start(now)
    osc.stop(now + 1.2)

    // Harmonic shimmer
    const o2 = ctx.createOscillator()
    const g2 = ctx.createGain()
    o2.type = 'triangle'
    o2.frequency.value = 440 * (1 + intensity * 0.5)
    g2.gain.setValueAtTime(0.0001, now)
    g2.gain.exponentialRampToValueAtTime(0.08 * intensity, now + 0.02)
    g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)
    o2.connect(g2)
    g2.connect(master)
    o2.start(now)
    o2.stop(now + 0.6)
  }

  function getEnergy() {
    if (!analyser || !data) return 0
    analyser.getByteFrequencyData(data)
    let sum = 0
    for (let i = 0; i < data.length; i++) sum += data[i]
    return sum / (data.length * 255)
  }

  function sutraTone(layer) {
    if (!ctx || !started) return
    const now = ctx.currentTime
    const freqs = [261.63, 329.63, 392.0, 523.25, 659.25, 784.0, 987.77, 1046.5]
    const f = freqs[layer % freqs.length]
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(f, now)
    osc.frequency.exponentialRampToValueAtTime(f * 2.02, now + 0.35)
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.18, now + 0.03)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4)
    osc.connect(g)
    g.connect(master)
    osc.start(now)
    osc.stop(now + 1.5)
  }

  return { start, setChant, pulse, getEnergy, sutraTone, get context() { return ctx } }
}
