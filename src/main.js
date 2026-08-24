import './style.css'
import { createRenderer } from './game/renderer.js'
import { createAudio } from './game/audio.js'
import { createInput } from './game/input.js'
import { createWorld } from './game/world.js'

const glCanvas = document.getElementById('gl')
const hudCanvas = document.getElementById('hud')
const veil = document.getElementById('veil')
const awakenBtn = document.getElementById('awaken')
const toastEl = document.getElementById('toast')

const audio = createAudio()
const input = createInput()
const world = createWorld()

let renderer
try {
  renderer = createRenderer(glCanvas)
} catch (err) {
  veil.innerHTML = `<div class="veil-inner"><h1 class="brand">monk.run</h1><p class="mantra">webgl2 required for the void</p></div>`
  throw err
}

const hudCtx = hudCanvas.getContext('2d')

const state = {
  time: 0,
  lookX: 0,
  lookY: 0,
  targetLookX: 0,
  targetLookY: 0,
  chant: 0,
  depth: 0,
  bloom: 1,
  warp: 0,
  tint: [1, 1, 1],
  awake: false,
  openingHook: 0,
  onSutra: null,
}

let last = performance.now()
let smoothMoveX = 0
let smoothMoveY = 0

function resizeHud() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = Math.floor(window.innerWidth * dpr)
  const h = Math.floor(window.innerHeight * dpr)
  if (hudCanvas.width !== w || hudCanvas.height !== h) {
    hudCanvas.width = w
    hudCanvas.height = h
  }
}

function setToast(text, show) {
  if (show) {
    toastEl.textContent = text
    toastEl.classList.add('show')
  } else {
    toastEl.classList.remove('show')
  }
}

async function awaken() {
  if (state.awake) return
  state.awake = true
  await audio.start()
  audio.pulse(1.2)
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  world.resetOpening(window.innerWidth, window.innerHeight, dpr)
  world.showToast('THE MANDALA OPENS', 3)
  // Viral first-breath: forced bloom + warp + chant swell
  state.bloom = 1.85
  state.warp = 1
  state.chant = 1
  state.openingHook = 5
  veil.classList.add('gone')
}

awakenBtn.addEventListener('click', awaken)
awakenBtn.addEventListener('pointerdown', (e) => e.stopPropagation())

// Also allow Enter / Space on veil
window.addEventListener('keydown', (e) => {
  if (!state.awake && (e.code === 'Enter' || e.code === 'Space')) {
    e.preventDefault()
    awaken()
  }
})

state.onSutra = (layer) => {
  audio.sutraTone(layer)
  audio.pulse(0.7 + layer * 0.08)
  state.warp = Math.min(1, state.warp + 0.25)
  state.bloom = Math.min(1.5, state.bloom + 0.35)
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  state.time += dt

  resizeHud()
  renderer.resize()

  const sample = input.sample()

  // Smooth look — gravity bends toward pointer
  state.targetLookX = sample.lookX
  state.targetLookY = sample.lookY
  // Keyboard drift warps look space (non-Euclidean slide)
  smoothMoveX += (sample.moveX - smoothMoveX) * (1 - Math.exp(-4 * dt))
  smoothMoveY += (sample.moveY - smoothMoveY) * (1 - Math.exp(-4 * dt))
  state.targetLookX += smoothMoveX * 0.35
  state.targetLookY += smoothMoveY * 0.35

  const lookLerp = 1 - Math.exp(-5 * dt)
  state.lookX += (state.targetLookX - state.lookX) * lookLerp
  state.lookY += (state.targetLookY - state.lookY) * lookLerp
  state.lookX = Math.max(-1.2, Math.min(1.2, state.lookX))
  state.lookY = Math.max(-1.2, Math.min(1.2, state.lookY))

  const chantTarget = sample.chant && state.awake ? 1 : 0
  // Opening hook overrides player chant for the first spectacular seconds
  if (state.openingHook > 0) {
    state.openingHook -= dt
    const k = Math.max(0, state.openingHook / 5)
    state.chant = Math.max(state.chant, 0.55 + k * 0.45)
    state.bloom = Math.max(state.bloom, 0.8 + k * 1.0)
    state.warp = Math.max(state.warp, k * 0.85)
    // Spiral the gaze for the camera-ready moment
    const spin = (5 - state.openingHook) * 1.8
    state.lookX = Math.sin(spin) * (0.15 + k * 0.35)
    state.lookY = Math.cos(spin * 1.1) * (0.12 + k * 0.3)
    if (Math.random() < 0.08) audio.pulse(0.35 + k * 0.4)
  } else {
    state.chant += (chantTarget - state.chant) * (1 - Math.exp(-6 * dt))
  }

  // Opening bloom decays into living breath (hold spectacle during hook)
  if (state.openingHook <= 0) {
    const breath = 0.15 + 0.1 * Math.sin(state.time * 0.7)
    state.bloom += (breath - state.bloom) * (1 - Math.exp(-0.6 * dt))
    state.warp += (0 - state.warp) * (1 - Math.exp(-0.35 * dt))
  } else {
    state.warp += (0 - state.warp) * (1 - Math.exp(-0.15 * dt))
  }

  const lookMag = Math.hypot(state.lookX, state.lookY)
  if (state.awake) {
    audio.setChant(state.chant, lookMag)
    const energy = audio.getEnergy()
    state.bloom += energy * 0.15 * dt
  }

  let meta = {
    layer: 0,
    sutrasCollected: 0,
    toastText: '',
    toastVisible: false,
    layerName: 'ROOT SILENCE',
    tint: [1, 1, 1],
  }

  if (state.awake) {
    meta = world.update(dt, {
      lookX: state.lookX,
      lookY: state.lookY,
      chant: state.chant,
      time: state.time,
      onSutra: state.onSutra,
    }, hudCanvas)
    state.depth = meta.layer + state.chant * 0.5 + lookMag * 0.3
    state.tint = meta.tint
  } else {
    // Idle preview trip on veil
    state.lookX = Math.sin(state.time * 0.25) * 0.25
    state.lookY = Math.cos(state.time * 0.2) * 0.2
    state.chant = 0.15 + 0.1 * Math.sin(state.time * 0.8)
    state.depth = 0.5 + 0.5 * Math.sin(state.time * 0.15)
    state.bloom = 0.6 + 0.2 * Math.sin(state.time * 0.5)
  }

  renderer.draw(state)

  if (state.awake) {
    world.drawHud(hudCtx, hudCanvas, meta, {
      lookX: state.lookX,
      lookY: state.lookY,
      chant: state.chant,
      time: state.time,
    })
    setToast(meta.toastText, meta.toastVisible)
  } else {
    hudCtx.setTransform(1, 0, 0, 1, 0, 0)
    hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height)
  }

  requestAnimationFrame(frame)
}

renderer.resize()
resizeHud()
requestAnimationFrame(frame)
