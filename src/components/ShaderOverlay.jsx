import { useEffect, useRef } from 'react'

/** Full-screen psychedelic post-process overlay (CRT + chromatic + fog). */
export default function ShaderOverlay({ intensity = 0.55, pulse = 0 }) {
  const ref = useRef(null)

  useEffect(() => {
    const c = ref.current
    if (!c) return undefined
    const ctx = c.getContext('2d')
    let raf = 0
    let t0 = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      c.width = Math.floor(window.innerWidth * dpr)
      c.height = Math.floor(window.innerHeight * dpr)
      c.style.width = '100%'
      c.style.height = '100%'
    }
    resize()
    window.addEventListener('resize', resize)

    const frame = (now) => {
      const t = (now - t0) / 1000
      const w = c.width
      const h = c.height
      ctx.clearRect(0, 0, w, h)

      // Vignette
      const g = ctx.createRadialGradient(w * 0.5, h * 0.45, h * 0.1, w * 0.5, h * 0.5, h * 0.75)
      g.addColorStop(0, 'rgba(0,0,0,0)')
      g.addColorStop(0.65, `rgba(7,4,15,${0.15 * intensity})`)
      g.addColorStop(1, `rgba(7,4,15,${0.72 * intensity})`)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      // Chromatic fringe bars
      ctx.globalCompositeOperation = 'screen'
      const shift = (2 + pulse * 4) * (window.devicePixelRatio || 1)
      ctx.fillStyle = `rgba(255,60,100,${0.035 * intensity})`
      ctx.fillRect(-shift, 0, w, h)
      ctx.fillStyle = `rgba(0,230,255,${0.035 * intensity})`
      ctx.fillRect(shift, 0, w, h)
      ctx.globalCompositeOperation = 'source-over'

      // Scanlines
      ctx.fillStyle = `rgba(0,0,0,${0.08 * intensity})`
      for (let y = 0; y < h; y += 3 * (window.devicePixelRatio || 1)) {
        ctx.fillRect(0, y, w, 1)
      }

      // Soft film grain
      if (intensity > 0.2) {
        ctx.fillStyle = `rgba(255,255,255,${0.02 * intensity})`
        for (let i = 0; i < 40; i++) {
          const x = Math.random() * w
          const y = Math.random() * h
          ctx.fillRect(x, y, 2, 2)
        }
      }

      // Breathing third-eye ring
      const breath = 0.5 + 0.5 * Math.sin(t * 1.2 + pulse)
      ctx.strokeStyle = `rgba(244,162,97,${0.08 + breath * 0.1 * intensity})`
      ctx.lineWidth = 2 * (window.devicePixelRatio || 1)
      ctx.beginPath()
      ctx.arc(w * 0.5, h * 0.42, (40 + breath * 18) * (window.devicePixelRatio || 1), 0, Math.PI * 2)
      ctx.stroke()

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [intensity, pulse])

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 z-[5]" />
}
