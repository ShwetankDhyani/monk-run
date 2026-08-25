import { COPY } from '../copy.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, CircleMarker, Polyline, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { COUNTRIES } from '../data/countries.js'
import { resolvePlayerLook } from '../data/avatars.js'
import { normalizeCountryName, searchPlace } from '../lib/geocode.js'

const pinIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 14px ${color}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })

function ClickDrop({ enabled, onDrop }) {
  useMapEvents({
    click(e) {
      if (!enabled) return
      onDrop({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function InvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const kick = () => map.invalidateSize()
    kick()
    const t1 = setTimeout(kick, 50)
    const t2 = setTimeout(kick, 250)
    const t3 = setTimeout(kick, 600)
    window.addEventListener('resize', kick)
    window.visualViewport?.addEventListener('resize', kick)
    window.addEventListener('monk-play-layout', kick)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      window.removeEventListener('resize', kick)
      window.visualViewport?.removeEventListener('resize', kick)
      window.removeEventListener('monk-play-layout', kick)
    }
  }, [map])
  return null
}

function FlyToGuess({ guess }) {
  const map = useMap()
  useEffect(() => {
    if (!guess) return
    map.flyTo([guess.lat, guess.lng], Math.max(map.getZoom(), 5), { duration: 0.9 })
  }, [map, guess?.lat, guess?.lng])
  return null
}

function FitReveal({ truth, guesses }) {
  const map = useMap()
  useEffect(() => {
    if (!truth) return
    const pts = [[truth.lat, truth.lng]]
    for (const g of guesses || []) {
      if (g.lat != null) pts.push([g.lat, g.lng])
    }
    try {
      map.fitBounds(pts, { padding: [48, 48], maxZoom: 5 })
    } catch {
      map.setView([truth.lat, truth.lng], 2)
    }
  }, [map, truth, guesses])
  return null
}

export default function GuessMap({
  mode = 'guess',
  guess,
  onGuess,
  truth,
  revealResults = [],
  selfId,
  locked = false,
  country = '',
  onCountry,
  tall = false,
  onPinFocus,
}) {
  const [countryFilter, setCountryFilter] = useState('')
  const [placeQuery, setPlaceQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const mapSurfaceRef = useRef(null)

  const focusPinMap = () => {
    onPinFocus?.()
    // Keep the Leaflet surface on-screen after keyboard / layout shifts
    requestAnimationFrame(() => {
      mapSurfaceRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }

  const filteredCountries = useMemo(() => {
    const q = countryFilter.trim().toLowerCase()
    if (!q) return COUNTRIES
    return COUNTRIES.filter((c) => c.toLowerCase().includes(q))
  }, [countryFilter])

  const runPlaceSearch = async (e) => {
    e?.preventDefault?.()
    const q = placeQuery.trim()
    if (!q || locked) return
    setSearchError('')
    setSearching(true)
    try {
      const hit = await searchPlace(q)
      if (!hit) {
        setSearchError(COPY.map.noPlace)
        return
      }
      onGuess?.({ lat: hit.lat, lng: hit.lng })
      focusPinMap()
      const matched = normalizeCountryName(hit.country, COUNTRIES)
      if (matched) onCountry?.(matched)
    } catch (err) {
      setSearchError(err?.message || COPY.map.searchFailed)
    } finally {
      setSearching(false)
    }
  }

  const center = guess ? [guess.lat, guess.lng] : [20, 0]
  const mapH = tall ? 'min-h-[100px] flex-1 overflow-hidden' : 'h-[280px]'

  return (
    <div className={`guess-map flex flex-col gap-2 ${tall ? 'h-full min-h-0' : ''}`}>
      {mode === 'guess' && (
        <div className="guess-map-controls flex shrink-0 flex-col gap-2">
          <form className="flex flex-wrap items-center gap-2" onSubmit={runPlaceSearch}>
            <input
              value={placeQuery}
              onChange={(e) => {
                setPlaceQuery(e.target.value)
                setSearchError('')
              }}
              placeholder={COPY.map.searchPlaceholder}
              className="input-clean min-w-[120px] flex-[2]"
              disabled={locked || searching}
              onFocus={focusPinMap}
            />
            <button
              type="submit"
              className="btn btn-ghost shrink-0 !px-3"
              disabled={locked || searching || placeQuery.trim().length < 2}
            >
              {searching ? '…' : 'Pin'}
            </button>
          </form>
          {searchError && <p className="text-[11px] text-coral">{searchError}</p>}
          <div className="guess-map-countries flex flex-wrap items-center gap-2">
            <input
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              placeholder={COPY.map.filterCountries}
              className="input-clean min-w-[100px] flex-1"
              disabled={locked}
            />
            <select
              className="input-clean min-w-[120px] flex-[2]"
              value={country}
              disabled={locked}
              onChange={(e) => onCountry?.(e.target.value)}
            >
              <option value="">{COPY.map.countryOptional}</option>
              {filteredCountries.length === 0 ? (
                <option value="" disabled>
                  No countries match
                </option>
              ) : (
                filteredCountries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))
              )}
            </select>
          </div>
          <p className="guess-map-hint text-[11px] text-muted">
            Search a city to drop a pin, or click the map directly.
            {countryFilter.trim() && filteredCountries.length > 0 && (
              <span className="text-sky"> · {filteredCountries.length} countries</span>
            )}
          </p>
        </div>
      )}

            <div
        ref={mapSurfaceRef}
        className={`guess-map-surface relative ${mapH} w-full overflow-hidden rounded-xl border border-sky/40 bg-slate-900 shadow-[0_0_40px_rgba(56,189,248,0.15)]`}
        onContextMenu={mode === 'guess' ? (e) => e.preventDefault() : undefined}
        onPointerDown={() => { if (mode === 'guess' && !locked) focusPinMap() }}
      >
        <MapContainer
          center={center}
          zoom={guess ? 4 : 2}
          className="h-full w-full"
          style={{ height: '100%', width: '100%', background: '#0b1220' }}
          scrollWheelZoom
          worldCopyJump
        >
          <InvalidateSize />
          <TileLayer
            attribution="&copy; OpenStreetMap &copy; CARTO"
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {mode === 'guess' && <ClickDrop enabled={!locked} onDrop={(pt) => { onGuess?.(pt); focusPinMap() }} />}
          {mode === 'guess' && guess && <FlyToGuess guess={guess} />}
          {mode === 'guess' && guess && (
            <Marker position={[guess.lat, guess.lng]} icon={pinIcon('#00e5ff')} />
          )}
          {mode === 'reveal' && truth && (
            <>
              <FitReveal truth={truth} guesses={revealResults} />
              <CircleMarker
                center={[truth.lat, truth.lng]}
                pathOptions={{ color: '#80ff72', fillColor: '#80ff72', fillOpacity: 0.9 }}
                radius={9}
              />
              {revealResults.map((r) => {
                if (r.lat == null) return null
                const look = resolvePlayerLook(r.avatar || r.vibe, r.playerId, revealResults.map((x) => ({ id: x.playerId, avatar: x.avatar, vibe: x.vibe })))
                return (
                  <Marker key={`m-${r.playerId}`} position={[r.lat, r.lng]} icon={pinIcon(look.robe)} />
                )
              })}
              {revealResults.map((r) => {
                if (r.lat == null) return null
                const look = resolvePlayerLook(r.avatar || r.vibe, r.playerId, revealResults.map((x) => ({ id: x.playerId, avatar: x.avatar, vibe: x.vibe })))
                return (
                  <Polyline
                    key={`l-${r.playerId}`}
                    positions={[
                      [r.lat, r.lng],
                      [truth.lat, truth.lng],
                    ]}
                    pathOptions={{
                      color: look.robe,
                      weight: r.playerId === selfId ? 3 : 1.5,
                      opacity: 0.8,
                      dashArray: r.playerId === selfId ? undefined : '6 8',
                    }}
                  />
                )
              })}
            </>
          )}
        </MapContainer>
        {mode === 'guess' && !guess && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] text-center">
            <span className="rounded-full bg-sky px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-ink shadow-lg">
              search or click the map
            </span>
          </div>
        )}
        {mode === 'guess' && guess && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] text-center">
            <span className="rounded-full bg-mint/90 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-ink shadow-lg">
              pin set — lock guess
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
