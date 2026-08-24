import { useEffect, useRef, useState } from 'react'
import { biomeColors, getMapsApiKey, loadGoogleMaps } from '../lib/maps.js'

/**
 * Street View when VITE_GOOGLE_MAPS_API_KEY is set.
 * Otherwise: immersive biome panorama fallback (still fully playable).
 */
export default function StreetView({ location, interactive = true }) {
  const hostRef = useRef(null)
  const panoRef = useRef(null)
  const [mode, setMode] = useState('loading') // loading | google | fallback
  const [error, setError] = useState('')
  const [yaw, setYaw] = useState(20)
  const drag = useRef(null)

  useEffect(() => {
    let cancelled = false
    const key = getMapsApiKey()
    if (!key) {
      setMode('fallback')
      return undefined
    }
    setMode('loading')
    loadGoogleMaps(key)
      .then((maps) => {
        if (cancelled || !hostRef.current || !location) return
        hostRef.current.innerHTML = ''
        const el = document.createElement('div')
        el.style.cssText = 'width:100%;height:100%'
        hostRef.current.appendChild(el)
        const pano = new maps.StreetViewPanorama(el, {
          position: { lat: location.lat, lng: location.lng },
          pov: { heading: 30, pitch: 0 },
          zoom: 1,
          addressControl: false,
          linksControl: true,
          panControl: false,
          enableCloseButton: false,
          fullscreenControl: false,
          motionTracking: false,
          showRoadLabels: false,
          disableDefaultUI: true,
        })
        panoRef.current = pano
        const svc = new maps.StreetViewService()
        svc.getPanorama({ location: { lat: location.lat, lng: location.lng }, radius: 1200 }, (data, status) => {
          if (cancelled) return
          if (status === maps.StreetViewStatus.OK && data?.location?.latLng) {
            pano.setPano(data.location.pano)
            pano.setVisible(true)
            setMode('google')
            setError('')
          } else {
            setError('No Street View coverage — astral fallback engaged.')
            setMode('fallback')
          }
        })
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Maps unavailable')
        setMode('fallback')
      })
    return () => {
      cancelled = true
      panoRef.current = null
      if (hostRef.current) hostRef.current.innerHTML = ''
    }
  }, [location?.id, location?.lat, location?.lng])

  useEffect(() => {
    if (mode !== 'fallback' || !interactive) return undefined
    const onMove = (e) => {
      if (!drag.current) return
      const x = e.touches ? e.touches[0].clientX : e.clientX
      const dx = x - drag.current.x
      drag.current.x = x
      setYaw((y) => y + dx * 0.25)
    }
    const onUp = () => {
      drag.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [mode, interactive])

  const colors = biomeColors(location?.biome)

  return (
    <div className="absolute inset-0 overflow-hidden bg-void">
      <div
        ref={hostRef}
        className={`absolute inset-0 ${mode === 'google' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {mode !== 'google' && location && (
        <div
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => {
            if (!interactive) return
            drag.current = { x: e.clientX }
          }}
          style={{
            background: `
              radial-gradient(ellipse 80% 55% at ${50 + Math.sin(yaw / 40) * 12}% 42%, ${colors[2]}55, transparent 55%),
              radial-gradient(ellipse 60% 40% at ${40 + Math.cos(yaw / 35) * 15}% 70%, ${colors[3]}40, transparent 50%),
              linear-gradient(${120 + yaw * 0.15}deg, ${colors[0]}, ${colors[1]}33 40%, ${colors[0]})
            `,
          }}
        >
          <div
            className="absolute inset-0 opacity-70"
            style={{
              transform: `translateX(${-yaw}px)`,
              backgroundImage: `
                repeating-linear-gradient(90deg, transparent 0 48px, ${colors[2]}14 48px 50px),
                repeating-linear-gradient(0deg, transparent 0 64px, ${colors[3]}10 64px 66px)
              `,
              width: '200%',
              left: '-20%',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute left-1/2 top-[38%] -translate-x-1/2 text-center pointer-events-none">
            <p className="font-display text-4xl md:text-6xl text-saffron/90 drop-shadow-[0_0_30px_rgba(244,162,97,0.45)]">
              ◎
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.35em] text-fog/70">
              astral projection · drag to look
            </p>
            <p className="mt-2 max-w-md px-4 font-mono text-xs text-cyan/80">{location.hint}</p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-fog/40">
              biome: {location.biome}
              {error ? ` · ${error}` : ' · offline street-view fallback'}
            </p>
          </div>
          {/* Fake horizon silhouettes */}
          <svg className="absolute bottom-[18%] left-0 w-[200%] h-32 opacity-40" style={{ transform: `translateX(${-yaw * 0.4}px)` }} viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path fill={colors[1]} fillOpacity="0.35" d="M0,80 L40,70 L80,85 L140,50 L200,75 L280,40 L360,70 L450,55 L520,80 L600,45 L700,70 L780,50 L860,75 L940,40 L1020,65 L1100,55 L1200,70 L1200,120 L0,120 Z" />
          </svg>
        </div>
      )}

      {mode === 'loading' && (
        <div className="absolute inset-0 grid place-items-center bg-void/80">
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-cyan animate-pulse">aligning street mantra…</p>
        </div>
      )}
    </div>
  )
}
