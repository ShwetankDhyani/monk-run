import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { MONK_VIBES } from '../data/locations.js'

const EMOTES = {
  happy: '😄',
  sad: '😢',
  angry: '😠',
  kiss: '😘',
}

/**
 * Shared low-poly helicopter cabin lobby.
 * WASD/arrows move · Space/click nearby player to smack · 1–4 emotes
 */
export default function CabinLobby({
  selfId,
  players,
  lobby,
  onPose,
  onSmack,
  onEmote,
  countdownSec = null,
  focused = true,
}) {
  const mountRef = useRef(null)
  const apiRef = useRef({})

  useEffect(() => {
    apiRef.current = { onPose, onSmack, onEmote, selfId, players, lobby }
  }, [onPose, onSmack, onEmote, selfId, players, lobby])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0c1220')
    scene.fog = new THREE.Fog('#0c1220', 12, 28)

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80)
    camera.position.set(0, 5.5, 8)

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.shadowMap.enabled = true
    mount.appendChild(renderer.domElement)

    // Lights
    scene.add(new THREE.AmbientLight(0xb0c4de, 0.55))
    const sun = new THREE.DirectionalLight(0xffe6c8, 1.05)
    sun.position.set(4, 10, 6)
    sun.castShadow = true
    scene.add(sun)
    const cabinLight = new THREE.PointLight(0x7dd3fc, 0.8, 14)
    cabinLight.position.set(0, 2.4, 0)
    scene.add(cabinLight)

    // Cabin shell
    const cabin = new THREE.Group()
    scene.add(cabin)

    const floorMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.85 })
    const wallMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.7, metalness: 0.15 })
    const accentMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.4, metalness: 0.3 })
    const glassMat = new THREE.MeshStandardMaterial({
      color: '#7dd3fc',
      transparent: true,
      opacity: 0.22,
      roughness: 0.1,
      metalness: 0.6,
    })

    const floor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 10), floorMat)
    floor.position.y = -0.1
    floor.receiveShadow = true
    cabin.add(floor)

    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(8, 0.15, 10), wallMat)
    ceiling.position.y = 3.1
    cabin.add(ceiling)

    ;[
      [0, 1.5, -5, 8, 3.2, 0.2],
      [0, 1.5, 5, 8, 3.2, 0.2],
      [-4, 1.5, 0, 0.2, 3.2, 10],
      [4, 1.5, 0, 0.2, 3.2, 10],
    ].forEach(([x, y, z, w, h, d]) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat)
      wall.position.set(x, y, z)
      wall.castShadow = true
      cabin.add(wall)
    })

    // Cockpit glass nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 0.15), glassMat)
    nose.position.set(0, 1.8, -4.85)
    cabin.add(nose)

    // Seats
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const seat = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.45, 0.9),
          new THREE.MeshStandardMaterial({ color: '#0f766e', roughness: 0.9 }),
        )
        seat.position.set(col === 0 ? -1.6 : 1.6, 0.35, row === 0 ? 1.2 : -1.4)
        seat.castShadow = true
        cabin.add(seat)
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.15), accentMat)
        back.position.set(seat.position.x, 0.9, seat.position.z + 0.4)
        cabin.add(back)
      }
    }

    // Rotor suggestion outside
    const rotor = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.08, 0.35),
      new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.7 }),
    )
    rotor.position.set(0, 3.6, 0)
    scene.add(rotor)

    // Sky window glow strips
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 0.12, 0.12),
      new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0284c8', emissiveIntensity: 0.8 }),
    )
    strip.position.set(0, 2.7, 0)
    cabin.add(strip)

    const avatarGroup = new THREE.Group()
    scene.add(avatarGroup)
    const avatars = new Map()

    function makeAvatar(player) {
      const vibe = MONK_VIBES.find((v) => v.id === player.vibe) || MONK_VIBES[0]
      const g = new THREE.Group()
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.28, 0.55, 4, 8),
        new THREE.MeshStandardMaterial({ color: vibe.color, roughness: 0.45 }),
      )
      body.position.y = 0.7
      body.castShadow = true
      g.add(body)
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 16, 12),
        new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.5 }),
      )
      head.position.y = 1.35
      g.add(head)
      const label = document.createElement('div')
      label.className = 'avatar-label'
      label.innerHTML = `<span class="avatar-name"></span><span class="avatar-emote"></span>`
      label.style.cssText =
        'position:absolute;transform:translate(-50%,-100%);pointer-events:none;text-align:center;white-space:nowrap;'
      mount.appendChild(label)
      avatars.set(player.id, { group: g, body, head, label, vibe })
      avatarGroup.add(g)
      return avatars.get(player.id)
    }

    function removeAvatar(id) {
      const a = avatars.get(id)
      if (!a) return
      avatarGroup.remove(a.group)
      a.label.remove()
      avatars.delete(id)
    }

    const keys = new Set()
    const onKeyDown = (e) => {
      if (!focused) return
      keys.add(e.code)
      if (e.code === 'Digit1') apiRef.current.onEmote?.('happy')
      if (e.code === 'Digit2') apiRef.current.onEmote?.('sad')
      if (e.code === 'Digit3') apiRef.current.onEmote?.('angry')
      if (e.code === 'Digit4') apiRef.current.onEmote?.('kiss')
      if (e.code === 'Space') {
        e.preventDefault()
        trySmack()
      }
    }
    const onKeyUp = (e) => keys.delete(e.code)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    function trySmack() {
      const { selfId: sid, lobby: lb, onSmack: smack } = apiRef.current
      const me = lb?.[sid]
      if (!me) return
      let best = null
      let bestD = 2.2
      for (const [id, pose] of Object.entries(lb || {})) {
        if (id === sid) continue
        const d = Math.hypot(pose.x - me.x, pose.z - me.z)
        if (d < bestD) {
          bestD = d
          best = id
        }
      }
      if (best) smack?.(best)
    }

    const clock = new THREE.Clock()
    let poseAcc = 0
    const local = { x: 0, y: 0, z: 2, yaw: Math.PI }

    const initPose = apiRef.current.lobby?.[apiRef.current.selfId]
    if (initPose) {
      local.x = initPose.x
      local.z = initPose.z
      local.yaw = initPose.yaw ?? Math.PI
    }

    function resize() {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / Math.max(h, 1)
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    let raf = 0
    const tmp = new THREE.Vector3()

    function frame() {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, clock.getDelta())
      rotor.rotation.y += dt * 14

      const { selfId: sid, players: plist, lobby: lb } = apiRef.current

      // Local movement
      if (focused) {
        let mx = 0
        let mz = 0
        if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1
        if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1
        if (keys.has('KeyW') || keys.has('ArrowUp')) mz -= 1
        if (keys.has('KeyS') || keys.has('ArrowDown')) mz += 1
        if (mx || mz) {
          const len = Math.hypot(mx, mz) || 1
          mx /= len
          mz /= len
          local.yaw = Math.atan2(mx, mz)
          local.x = Math.max(-3.2, Math.min(3.2, local.x + mx * 3.6 * dt))
          local.z = Math.max(-3.5, Math.min(3.5, local.z + mz * 3.6 * dt))
        }
        // External smack knockback from server pose
        const serverPose = lb?.[sid]
        if (serverPose?.hitFlash && serverPose.hitFlash > Date.now()) {
          local.x += (serverPose.x - local.x) * Math.min(1, dt * 8)
          local.z += (serverPose.z - local.z) * Math.min(1, dt * 8)
        }
        poseAcc += dt
        if (poseAcc > 0.05) {
          poseAcc = 0
          apiRef.current.onPose?.({ x: local.x, y: 0, z: local.z, yaw: local.yaw })
        }
      }

      // Sync avatars
      const liveIds = new Set((plist || []).map((p) => p.id))
      for (const id of [...avatars.keys()]) {
        if (!liveIds.has(id)) removeAvatar(id)
      }
      for (const p of plist || []) {
        if (!avatars.has(p.id)) makeAvatar(p)
        const a = avatars.get(p.id)
        const pose = p.id === sid ? local : lb?.[p.id] || { x: 0, z: 0, yaw: 0 }
        const hit = lb?.[p.id]?.hitFlash > Date.now()
        a.group.position.x = THREE.MathUtils.lerp(a.group.position.x, pose.x, 0.2)
        a.group.position.z = THREE.MathUtils.lerp(a.group.position.z, pose.z, 0.2)
        a.group.rotation.y = pose.yaw ?? 0
        a.body.material.emissive = new THREE.Color(hit ? '#ffffff' : '#000000')
        a.body.material.emissiveIntensity = hit ? 0.55 : 0
        const bounce = hit ? Math.sin(Date.now() / 40) * 0.08 : 0
        a.group.position.y = bounce

        const emote = lb?.[p.id]?.emote
        const emoteOn = lb?.[p.id]?.emoteUntil > Date.now()
        a.label.querySelector('.avatar-name').textContent = p.name
        a.label.querySelector('.avatar-emote').textContent = emoteOn ? EMOTES[emote] || '' : ''
        a.label.querySelector('.avatar-name').style.color = a.vibe.color

        tmp.set(a.group.position.x, 1.8, a.group.position.z)
        tmp.project(camera)
        const x = (tmp.x * 0.5 + 0.5) * mount.clientWidth
        const y = (-tmp.y * 0.5 + 0.5) * mount.clientHeight
        a.label.style.left = `${x}px`
        a.label.style.top = `${y}px`
        a.label.style.display = tmp.z > 1 ? 'none' : 'block'
      }

      // Camera follows self softly
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, local.x * 0.35, 0.05)
      camera.lookAt(local.x * 0.2, 1.2, local.z - 0.5)

      renderer.render(scene, camera)
    }
    frame()

    mount.addEventListener('click', () => {
      if (focused) trySmack()
    })

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      for (const id of [...avatars.keys()]) removeAvatar(id)
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [focused])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-950">
      <div ref={mountRef} className="absolute inset-0" />
      {countdownSec != null && countdownSec >= 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-black/35">
          <p className="font-display text-7xl font-extrabold text-white drop-shadow-lg md:text-9xl">
            {countdownSec === 0 ? 'JUMP!' : countdownSec}
          </p>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-xl bg-black/45 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-white/70 backdrop-blur">
        WASD move · click/space smack · 1–4 emotes
      </div>
    </div>
  )
}

export { EMOTES }
