import { useEffect, useMemo, useState } from 'react'
import { getMapsApiKey, loadGoogleMaps } from '../lib/maps.js'

/**
 * Street panorama with aggressive fallbacks:
 * 1) Official Google Street View JS API when VITE_GOOGLE_MAPS_API_KEY is set
 * 2) Keyless Street View embed iframe
 * 3) Auto-fallback to satellite after a few seconds if the embed stays blank/blocked
 */
export default function StreetView({ location, interactive = true }) {
  const [mode, setMode] = useState('loading') // loading | api | embed | fallback
  const [error, setError] = useState('')
  const key = getMapsApiKey()

  const embedSrc = useMemo(() => {
    if (!location) return ''
    const { lat, lng } = location
    // cbll + layer=c street-view embed (works without an API key in most browsers)
    return `https://www.google.com/maps?layer=c&cbll=${lat},${lng}&cbp=12,0,0,0,0&hl=en&output=svembed`
  }, [location?.lat, location?.lng])

  const mapsLink = useMemo(() => {
    if (!location) return ''
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lng}`
  }, [location?.lat, location?.lng])

  const satSrc = useMemo(() => {
    if (!location) return ''
    return `https://maps.google.com/maps?q=${location.lat},${location.lng}&z=16&t=k&output=embed`
  }, [location?.lat, location?.lng])

  // Official API path
  useEffect(() => {
    let cancelled = false
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
        const pano = new maps.StreetViewPanorama(el, {
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
            setError('No Street View coverage — using map.')
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
    }
  }, [location?.id, location?.lat, location?.lng, key])

  // If the keyless embed is still up after a few seconds, keep it — but offer
  // an automatic satellite underlay so the left pane is never blank.
  useEffect(() => {
    if (mode !== 'embed') return undefined
    const t = setTimeout(() => {
      // Don't force-switch (user may have a working embed); just surface the tip.
      setError((e) => e || 'If this looks blank, hit satellite below.')
    }, 3500)
    return () => clearTimeout(t)
  }, [mode, location?.id])

  if (!location) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-ink">
        <p className="font-mono text-xs tracking-widest text-sky">NO LOCATION LOADED</p>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 h-full min-h-[50vh] w-full overflow-hidden bg-ink">
      {/* Satellite always underneath so the pane is never empty if SV fails */}
      {(mode === 'embed' || mode === 'fallback') && (
        <iframe
          title="Satellite"
          src={satSrc}
          className={`absolute inset-0 h-full w-full border-0 ${mode === 'fallback' ? 'opacity-100' : 'opacity-40'}`}
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}

      <div
        id="sv-api-host"
        className={`absolute inset-0 ${mode === 'api' ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

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

      {mode === 'loading' && (
        <div className="absolute inset-0 grid place-items-center bg-ink">
          <p className="animate-pulse font-mono text-xs tracking-widest text-sky">LOADING STREET VIEW…</p>
        </div>
      )}

      {mode === 'fallback' && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 pt-16">
          <p className="font-display text-lg text-fog">Street View blocked — showing satellite</p>
          <p className="mt-1 text-sm text-muted">
            Open the panorama in a new tab, or set <code className="text-sky">VITE_GOOGLE_MAPS_API_KEY</code>.
          </p>
          <a href={mapsLink} target="_blank" rel="noreferrer" className="btn btn-primary mt-3 inline-flex">
            Open Street View ↗
          </a>
        </div>
      )}

      {(mode === 'embed' || mode === 'fallback') && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex gap-2">
          <span className="rounded-full bg-black/55 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white/80">
            {mode === 'fallback' ? 'Satellite' : 'Street View'}
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
          Blank? Switch to satellite
        </button>
      )}

      {!interactive && <div className="absolute inset-0 z-[5]" />}
    </div>
  )
}
