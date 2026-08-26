import { useEffect, useRef, useState } from 'react'
import { isSfxMuted, setSfxMuted, sfx } from '../lib/sfx.js'
import { COPY } from '../copy.js'

/**
 * Cinematic title-screen backdrop + HUD chrome for the landing.
 * Parallax layers, hex field, continent silhouette, embers, ticking coords.
 */
export function LandingVoid({ soundLabel = 'Sound' }) {
  const stageRef = useRef(null)
  const [soundOn, setSoundOn] = useState(() => !isSfxMuted())
  const [lat, setLat] = useState('00.0000')
  const [lng, setLng] = useState('00.0000')

  useEffect(() => {
    const el = stageRef.current
    if (!el) return undefined
    const reduce =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.reduceMotion === '1'

    const layers = el.querySelectorAll('.landing-layer[data-depth]')
    const apply = (px, py) => {
      layers.forEach((l) => {
        const d = Number(l.dataset.depth) || 0
        l.style.transform = `translate3d(${px * d}px, ${py * d}px, 0)`
      })
    }

    if (reduce) return undefined

    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      apply(px, py)
    }
    const onLeave = () => apply(0, 0)
    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  useEffect(() => {
    const reduce =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.reduceMotion === '1'
    if (reduce) return undefined

    const fmt = (n) => `${n >= 0 ? '' : '−'}${Math.abs(n).toFixed(4)}`
    const id = window.setInterval(() => {
      setLat(fmt(Math.random() * 160 - 80))
      setLng(fmt(Math.random() * 340 - 170))
    }, 1400)
    return () => window.clearInterval(id)
  }, [])

  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    setSfxMuted(!next)
    if (next) sfx.ui()
  }

  const emberCount = typeof window !== 'undefined' && window.innerWidth < 640 ? 12 : 22

  return (
    <div className="landing-void" ref={stageRef} aria-hidden="false">
      <div className="landing-layer landing-layer-bg" data-depth="6" aria-hidden="true" />
      <div className="landing-layer landing-layer-hex" data-depth="18" aria-hidden="true" />
      <div className="landing-layer landing-layer-silhouette" data-depth="10" aria-hidden="true">
        <svg viewBox="0 0 1600 420" preserveAspectRatio="none">
          <g fill="#0c130d" opacity=".85">
            <ellipse cx="150" cy="470" rx="190" ry="140" />
            <ellipse cx="270" cy="560" rx="80" ry="150" />
            <ellipse cx="640" cy="500" rx="110" ry="160" />
            <ellipse cx="600" cy="380" rx="150" ry="80" />
            <ellipse cx="980" cy="440" rx="260" ry="180" />
            <ellipse cx="1290" cy="560" rx="110" ry="80" />
          </g>
          <g fill="#080c08" opacity=".9">
            <ellipse cx="120" cy="520" rx="150" ry="110" />
            <ellipse cx="660" cy="560" rx="120" ry="120" />
            <ellipse cx="1020" cy="510" rx="220" ry="140" />
            <ellipse cx="1320" cy="600" rx="90" ry="60" />
          </g>
          <path d="M-40,300 Q 400,180 800,220 T 1640,140" fill="none" stroke="#2b4432" strokeWidth="1" opacity=".5" />
          <path d="M-40,360 Q 400,260 800,290 T 1640,220" fill="none" stroke="#2b4432" strokeWidth="1" opacity=".35" />
        </svg>
      </div>

      <div className="landing-embers" aria-hidden="true">
        {Array.from({ length: emberCount }, (_, i) => {
          const left = (i * 37 + 11) % 100
          const dur = 9 + (i % 10)
          const delay = (i * 0.7) % 14
          const drift = ((i * 13) % 60) - 30
          const size = 2 + (i % 3) * 0.8
          const teal = i % 5 === 0
          return (
            <span
              key={i}
              className={`landing-ember${teal ? ' landing-ember--teal' : ''}`}
              style={{
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                ['--drift']: `${drift}px`,
                animationDuration: `${dur}s, ${1.6 + (i % 4) * 0.4}s`,
                animationDelay: `${delay}s, ${(i % 5) * 0.35}s`,
              }}
            />
          )
        })}
      </div>

      <div className="landing-layer landing-layer-vignette" aria-hidden="true" />
      <div className="landing-layer landing-layer-grain" aria-hidden="true" />

      <div className="landing-hud">
        <div className="landing-bar landing-bar--top" />
        <div className="landing-bar landing-bar--bottom" />
        <div className="landing-corner landing-corner--tl">
          <span className="landing-corner-dot" />
          {COPY.landing.hudLive}
        </div>
        <div className="landing-corner landing-corner--tr">
          <button
            type="button"
            className="landing-sound"
            style={{ opacity: soundOn ? 1 : 0.5 }}
            aria-label={soundLabel}
            aria-pressed={soundOn}
            onClick={toggleSound}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M11 5 6 9H2v6h4l5 4V5Z" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08" />
            </svg>
            {soundLabel}
          </button>
        </div>
        <div className="landing-corner landing-corner--bl">
          <span>
            monk<span className="landing-corner-gold">.</span>run
          </span>
          <span className="landing-build">{COPY.landing.hudBuild}</span>
        </div>
        <div className="landing-corner landing-corner--br">
          <span className="landing-coord">
            <span className="landing-coord-lbl">lat</span> {lat}
          </span>
          <span className="landing-coord">
            <span className="landing-coord-lbl">lng</span> {lng}
          </span>
        </div>
      </div>
    </div>
  )
}

export function LandingEmblem() {
  return (
    <div className="landing-emblem" aria-hidden="true">
      <svg viewBox="0 0 150 150" fill="none">
        <circle className="landing-emblem-ring" cx="75" cy="75" r="68" stroke="#4d7358" strokeWidth="1" strokeDasharray="1 7" opacity=".65" />
        <defs>
          <clipPath id="landingGlobeClip">
            <circle cx="75" cy="75" r="50" />
          </clipPath>
          <radialGradient id="landingGlobeFill" cx="38%" cy="34%" r="75%">
            <stop offset="0" stopColor="#2a4030" />
            <stop offset="1" stopColor="#0c130d" />
          </radialGradient>
        </defs>
        <circle className="landing-emblem-globe" cx="75" cy="75" r="50" fill="url(#landingGlobeFill)" />
        <g className="landing-emblem-globe" clipPath="url(#landingGlobeClip)" stroke="#4d7358" strokeWidth="1" opacity=".85">
          <line x1="25" y1="75" x2="125" y2="75" />
          <ellipse cx="75" cy="75" rx="17" ry="50" />
          <ellipse cx="75" cy="75" rx="17" ry="50" transform="rotate(60 75 75)" />
          <ellipse cx="75" cy="75" rx="17" ry="50" transform="rotate(120 75 75)" />
          <ellipse cx="75" cy="52" rx="46" ry="9" />
          <ellipse cx="75" cy="98" rx="46" ry="9" />
        </g>
        <circle className="landing-emblem-globe" cx="75" cy="75" r="50" stroke="#8fc198" strokeWidth="1.4" />
        <g className="landing-emblem-pin">
          <path
            d="M0,-16 C7,-16 12,-11 12,-4 C12,4 0,17 0,17 C0,17 -12,4 -12,-4 C-12,-11 -7,-16 0,-16 Z"
            transform="translate(97,44)"
            fill="#f0cd82"
            stroke="#1b1406"
            strokeWidth="1.2"
          />
          <circle cx="97" cy="28" r="2.6" fill="#1b1406" />
        </g>
        <ellipse className="landing-emblem-pulse" cx="97" cy="60" rx="7" ry="3" fill="none" stroke="#f0cd82" strokeWidth="1.3" />
      </svg>
    </div>
  )
}
