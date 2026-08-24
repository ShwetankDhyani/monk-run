export function createInput() {
  const keys = new Set()
  const pointer = { x: 0, y: 0, down: false, active: false }
  let chantHeld = false

  function onKey(e, down) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault()
    }
    if (down) keys.add(e.code)
    else keys.delete(e.code)
    if (e.code === 'Space') chantHeld = down
  }

  function normPointer(clientX, clientY) {
    const nx = (clientX / window.innerWidth) * 2 - 1
    const ny = (clientY / window.innerHeight) * 2 - 1
    pointer.x = Math.max(-1, Math.min(1, nx))
    pointer.y = Math.max(-1, Math.min(1, ny))
    pointer.active = true
  }

  window.addEventListener('keydown', (e) => onKey(e, true), { passive: false })
  window.addEventListener('keyup', (e) => onKey(e, false), { passive: false })

  window.addEventListener('pointermove', (e) => {
    normPointer(e.clientX, e.clientY)
  })
  window.addEventListener('pointerdown', (e) => {
    pointer.down = true
    chantHeld = true
    normPointer(e.clientX, e.clientY)
  })
  window.addEventListener('pointerup', () => {
    pointer.down = false
    if (![...keys].includes('Space')) chantHeld = false
  })
  window.addEventListener('pointercancel', () => {
    pointer.down = false
    chantHeld = false
  })

  function sample() {
    let dx = 0
    let dy = 0
    if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1
    if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1
    if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1
    if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1
    const len = Math.hypot(dx, dy) || 1
    return {
      moveX: dx / len,
      moveY: dy / len,
      lookX: pointer.x,
      lookY: pointer.y,
      chant: chantHeld || pointer.down,
      pointerDown: pointer.down,
    }
  }

  return { sample, pointer }
}
