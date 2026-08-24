import { useEffect, useMemo, useState } from 'react'
import { getMapsApiKey, loadGoogleMaps } from '../lib/maps.js'

/**
 * Street panorama:
 * 1) Official Google Street View JS API when VITE_GOOGLE_MAPS_API_KEY is set
 * 2) Otherwise Google Maps svembed iframe (no key required in most browsers)
 * 3) Last resort: satellite + place card (still shows the real location context)
 */
export default function StreetView({ location, interactive = true }) {
  const [mode, setMode] = useState('loading') // loading | api | embed | fallback
  const [error, setError] = useState('')
  const key = getMapsApiKey()

  const embedSrc = useMemo(() => {
    if (!location) return ''
    const { lat, lng } = location
    return `https://maps.google.com/maps?q=&layer=c&cbll=${lat},${lng}&cbp=12,0,0,0,0&hl=en&output=svembed`
  }, [location?.lat, location?.lng])

  const mapsLink = useMemo(() => {
    if (!location) return ''
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lng}`
  }, [location?.lat, location?.lng])

  const satSrc = useMemo(() => {
    if (!location) return ''
    // Esri world imagery via OSM-static-style bbox approx using Google maps satellite embed-ish
    return `https://maps.google.com/maps?q=${location.lat},${location.lng}&z=16&t=k&output=embed`
  }, [location?.lat, location?.lng])

  useEffect(() => {
    let cancelled = false
    let pano = null
    let host = null

    if (!location) return undefined

    if (!key) {
      setMode('embed')
      setError('')
      return undefined
    }

    setMode('loading')
    host = document.getElementById('sv-api-host')

    loadGoogleMaps(key)
      .then((maps) => {
        if (cancelled || !host) return
        host.innerHTML = ''
        const el = document.createElement('div')
        el.style.cssText = 'width:100%;height:100%'
        host.appendChild(el)
        pano = new maps.StreetViewPanorama(el, {
          position: { lat: location.lat, lng: location.lng },
          pov: { heading: 20, pitch: 0 },
          zoom: 1,
          addressControl: false,
          linksControl: true,
          panControl: true,
          enableCloseButton: false,
          fullscreenControl: false,
          motionTracking: false,
          showRoadLabels: false,
          disableDefaultUI: false,
        })
        const svc = new maps.StreetViewService()
        svc.getPanorama({ location: { lat: location.lat, lng: location.lng }, radius: 1500 }, (data, status) => {
          if (cancelled) return
          if (status === maps.StreetViewStatus.OK && data?.location?.pano) {
            pano.setPano(data.location.pano)
            pano.setVisible(true)
            setMode('api')
            setError('')
          } else {
            setError('No coverage here — using map embed.')
            setMode('embed')
          }
        })
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Maps API failed')
        setMode('embed')
      })

    return () => {
      cancelled = true
      if (host) host.innerHTML = ''
      pano = null
    }
  }, [location?.id, location?.lat, location?.lng, key])

  if (!location) return null

  return (
    <div className="absolute inset-0 overflow-hidden bg-ink">
      {/* Official API mount */}
      <div
        id="sv-api-host"
        className={`absolute inset-0 ${mode === 'api' ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      {/* Keyless Street View embed */}
      {mode === 'embed' && (
        <iframe
          title="Street View"
          src={embedSrc}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; gyroscope; fullscreen"
          referrerPolicy="no-referrer-when-downgrade"
          onError={() => setMode('fallback')}
        />
      )}

      {/* Loading */}
      {mode === 'loading' && (
        <div className="absolute inset-0 grid place-items-center bg-ink">
          <p className="animate-pulse font-mono text-xs tracking-widest text-sky">LOADING STREET VIEW…</p>
        </div>
      )}

      {/* Soft fallback if embed blocked */}
      {mode === 'fallback' && (
        <div className="absolute inset-0 flex flex-col">
          <iframe title="Map" src={satSrc} className="h-full w-full flex-1 border-0" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
            <p className="font-display text-lg text-fog">Street View blocked by the browser</p>
            <p className="mt-1 text-sm text-muted">
              Open the panorama in a new tab, or add <code className="text-sky">VITE_GOOGLE_MAPS_API_KEY</code> for
              in-app Street View.
            </p>
            <a
              href={mapsLink}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary mt-3 inline-flex"
            >
              Open Street View ↗
            </a>
          </div>
        </div>
      )}

      {/* Embed chrome: if iframe shows a gray error page, user can bail out */}
      {mode === 'embed' && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex gap-2">
          <span className="rounded-full bg-black/55 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white/80">
            Street View
          </span>
          {error && (
            <span className="rounded-full bg-black/55 px-3 py-1 font-mono text-[10px] text-amber">{error}</span>
          )}
        </div>
      )}

      {mode === 'embed' && (
        <button
          type="button"
          className="btn btn-ghost pointer-events-auto absolute bottom-3 left-3 z-10 !bg-black/60"
          onClick={() => setMode('fallback')}
        >
          Map not loading? Try satellite
        </button>
      )}

      {!interactive && <div className="absolute inset-0 z-[5]" />}
    </div>
  )
}
