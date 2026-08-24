export function createInput() {
  const keys = new Set()
  const pointer = { x: 0, y: 0, down: false }
  let chantPressed = false
  let chantJust = false
  let dashJust = false
  let restartJust = false

  function onKey(e, down) {
    const block = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
    if (block.includes(e.code)) e.preventDefault()

    if (down) {
      if (!keys.has(e.code)) {
        if (e.code === 'Space') {
          chantJust = true
          chantPressed = true
        }
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyE') {
          dashJust = true
        }
        if (e.code === 'KeyR' || e.code === 'Enter') restartJust = true
      }
      keys.add(e.code)
    } else {
      keys.delete(e.code)
      if (e.code === 'Space') chantPressed = false
    }
  }

  window.addEventListener('keydown', (e) => onKey(e, true), { passive: false })
  window.addEventListener('keyup', (e) => onKey(e, false), { passive: false })

  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX
    pointer.y = e.clientY
  })
  window.addEventListener('pointerdown', (e) => {
    if (e.target && (e.target.id === 'awaken' || e.target.closest?.('#veil'))) return
    pointer.down = true
    pointer.x = e.clientX
    pointer.y = e.clientY
    dashJust = true
  })
  window.addEventListener('pointerup', () => {
    pointer.down = false
  })

  function sample() {
    let mx = 0
    let my = 0
    if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1
    if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1
    if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1
    if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1
    const len = Math.hypot(mx, my) || 1

    const out = {
      thrustX: mx / len,
      thrustY: my / len,
      thrusting: mx !== 0 || my !== 0,
      chantHeld: chantPressed || keys.has('Space'),
      chantJust,
      dashJust,
      restartJust,
      pointerX: pointer.x,
      pointerY: pointer.y,
    }
    chantJust = false
    dashJust = false
    restartJust = false
    return out
  }

  return { sample }
}
