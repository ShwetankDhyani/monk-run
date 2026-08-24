import './style.css'
import { createRenderer } from './game/renderer.js'
import { createAudio } from './game/audio.js'
import { createInput } from './game/input.js'
import { createGame } from './game/game.js'

const glCanvas = document.getElementById('gl')
const hudCanvas = document.getElementById('hud')
const veil = document.getElementById('veil')
const awakenBtn = document.getElementById('awaken')

const audio = createAudio()
const input = createInput()
const game = createGame(audio)

let renderer
try {
  renderer = createRenderer(glCanvas)
} catch (err) {
  veil.innerHTML =
    '<div class="veil-inner"><h1 class="brand">monk.run</h1><p class="mantra">webgl2 required for the void</p></div>'
  throw err
}

const hudCtx = hudCanvas.getContext('2d')

const fx = {
  time: 0,
  lookX: 0,
  lookY: 0,
  chant: 0,
  depth: 0,
  bloom: 0.55,
  warp: 0,
  tint: [1, 1, 1],
}

let last = performance.now()
let cssW = window.innerWidth
let cssH = window.innerHeight
let started = false

function resizeAll() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = Math.floor(window.innerWidth * dpr)
  const h = Math.floor(window.innerHeight * dpr)
  if (hudCanvas.width !== w || hudCanvas.height !== h) {
    hudCanvas.width = w
    hudCanvas.height = h
  }
  const nextW = window.innerWidth
  const nextH = window.innerHeight
  if (started && (nextW !== cssW || nextH !== cssH)) {
    game.resize(nextW, nextH)
  }
  cssW = nextW
  cssH = nextH
  renderer.resize()
}

async function awaken() {
  if (started) return
  started = true
  await audio.start()
  game.resize(window.innerWidth, window.innerHeight)
  game.startRun()
  fx.bloom = 1.4
  fx.warp = 0.8
  veil.classList.add('gone')
}

awakenBtn.addEventListener('click', awaken)
awakenBtn.addEventListener('pointerdown', (e) => e.stopPropagation())

window.addEventListener('keydown', (e) => {
  if (!started && (e.code === 'Enter' || e.code === 'Space')) {
    e.preventDefault()
    awaken()
  }
})

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  fx.time += dt
  resizeAll()

  const sample = input.sample()
  const beat = audio.tick()

  if (started) {
    game.tryRestart(sample)
    const snap = game.update(dt, sample, beat)

    // Drive psychedelic backdrop from real game state
    fx.lookX = (snap.player.x / snap.cssW) * 2 - 1
    fx.lookY = (snap.player.y / snap.cssH) * 2 - 1
    fx.chant = sample.chantHeld ? 0.7 : snap.portalOpen ? 0.45 : 0.15
    fx.depth = snap.realm + (snap.portalReady ? 0.5 : 0)
    fx.tint = snap.tint
    fx.warp += ((snap.shake > 0 ? 0.7 : snap.portalOpen ? 0.35 : 0.1) - fx.warp) * 0.08
    const breath = 0.2 + 0.12 * Math.sin(fx.time * 0.7) + (beat.beat ? 0.25 : 0)
    fx.bloom += (breath - fx.bloom) * 0.1
    if (snap.phase === 'over') fx.chant = 0.9
    if (snap.phase === 'win') {
      fx.bloom = 1.2
      fx.warp = 0.6
    }

    renderer.draw(fx)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    game.draw(hudCtx, dpr, snap)
  } else {
    fx.lookX = Math.sin(fx.time * 0.25) * 0.3
    fx.lookY = Math.cos(fx.time * 0.2) * 0.25
    fx.chant = 0.2 + 0.1 * Math.sin(fx.time)
    fx.depth = 0.4
    fx.bloom = 0.55 + 0.15 * Math.sin(fx.time * 0.5)
    renderer.draw(fx)
    hudCtx.setTransform(1, 0, 0, 1, 0, 0)
    hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height)
  }

  requestAnimationFrame(frame)
}

resizeAll()
requestAnimationFrame(frame)
