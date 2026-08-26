import { useEffect, useRef } from 'react'

/**
 * Full-bleed temple void — the landing’s dominant visual plane.
 * Black-hole rift, brass rings, jade breath. Brand sits on top in App.
 */
export function LandingVoid() {
  const rootRef = useRef(null)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return undefined
    const reduce =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.reduceMotion === '1'
    if (reduce) return undefined

    let raf = 0
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--px', x.toFixed(3))
        el.style.setProperty('--py', y.toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="landing-void" ref={rootRef} aria-hidden="true">
      <div className="landing-void-depth" />
      <div className="landing-void-nebula" />
      <div className="landing-void-pillars" />
      <div className="landing-void-horizon" />
      <div className="landing-void-rift">
        <div className="landing-void-core" />
        <div className="landing-void-ring landing-void-ring--a" />
        <div className="landing-void-ring landing-void-ring--b" />
        <div className="landing-void-ring landing-void-ring--c" />
        <div className="landing-void-halo" />
      </div>
      <div className="landing-void-rays" />
      <div className="landing-void-dust">
        <span /><span /><span /><span /><span /><span />
      </div>
      <div className="landing-void-grain" />
      <div className="landing-void-vignette" />
    </div>
  )
}
