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

/** One globe only — Leaflet otherwise repeats the world sideways. */
const WORLD_BOUNDS = L.latLngBounds([-85, -180], [85, 180])

function wrapLng(lng) {
  const x = ((((Number(lng) + 180) % 360) + 360) % 360) - 180
  return x === -180 ? 180 : x
}

function normLatLng(lat, lng) {
  return [Number(lat), wrapLng(lng)]
}

/**
 * Reveal line(s) that never leave longitude [-180, 180].
 * If the shortest path crosses the antimeridian, return two segments
 * clipped at ±180 — never park a pin or line in the empty gutter beside the globe.
 */
function revealSegments(a, b) {
  const p1 = normLatLng(a[0], a[1])
  const p2 = normLatLng(b[0], b[1])
  const lat1 = p1[0]
  const lng1 = p1[1]
  const lat2 = p2[0]
  const lng2 = p2[1]
  const dl = lng2 - lng1
  if (Math.abs(dl) <= 180) return [[p1, p2]]

  // Shorter route crosses the date line — split at the edge of the single world
  const lng2s = lng2 - Math.sign(dl) * 360
  const edge = lng2s > lng1 ? 180 : -180
  const t = (edge - lng1) / (lng2s - lng1)
  const latEdge = lat1 + t * (lat2 - lat1)
  return [
    [p1, [latEdge, edge]],
    [[latEdge, -edge], p2],
  ]
}

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

function SingleWorld() {
  const map = useMap()
  useEffect(() => {
    map.options.worldCopyJump = false
    map.setMaxBounds(WORLD_BOUNDS)
    // Keep zoom high enough that one world fills the pane — no empty side gutters
    // that look like "masks" over phantom wrapped copies.
    const clampMinZoom = () => {
      const w = map.getSize()?.x || 0
      if (w < 64) return
      const minZ = Math.max(1, Math.log2(w / 256))
      if (Math.abs((map.getMinZoom?.() ?? 0) - minZ) > 0.01) {
        map.setMinZoom(minZ)
      }
      if (map.getZoom() < minZ) map.setZoom(minZ)
    }
    clampMinZoom()
    map.on('resize', clampMinZoom)
    return () => {
      map.off('resize', clampMinZoom)
    }
  }, [map])
  return null
}

function FlyToGuess({ guess }) {
  const map = useMap()
  useEffect(() => {
    if (!guess) return
    map.flyTo(normLatLng(guess.lat, guess.lng), Math.max(map.getZoom(), 5), { duration: 0.9 })
  }, [map, guess?.lat, guess?.lng])
  return null
}

function FitReveal({ truth, guesses }) {
  const map = useMap()
  useEffect(() => {
    if (!truth) return
    // Only in-range coordinates — never fitBounds to lng outside [-180, 180]
    const pts = [normLatLng(truth.lat, truth.lng)]
    for (const g of guesses || []) {
      if (g.lat == null) continue
      pts.push(normLatLng(g.lat, g.lng))
    }
    try {
      map.fitBounds(pts, { padding: [48, 48], maxZoom: 5 })
      const minZ = map.getMinZoom()
      if (map.getZoom() < minZ) map.setZoom(minZ)
    } catch {
      map.setView(normLatLng(truth.lat, truth.lng), Math.max(2, map.getMinZoom()))
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
          minZoom={1}
          maxBounds={WORLD_BOUNDS}
          maxBoundsViscosity={1}
          worldCopyJump={false}
          className="h-full w-full"
          style={{ height: '100%', width: '100%', background: '#0b1220' }}
          scrollWheelZoom
        >
          <SingleWorld />
          <InvalidateSize />
          <TileLayer
            attribution="&copy; OpenStreetMap &copy; CARTO"
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            noWrap
            bounds={[[-85, -180], [85, 180]]}
          />
          {mode === 'guess' && (
            <ClickDrop
              enabled={!locked}
              onDrop={(pt) => {
                onGuess?.({ lat: pt.lat, lng: wrapLng(pt.lng) })
                focusPinMap()
              }}
            />
          )}
          {mode === 'guess' && guess && <FlyToGuess guess={guess} />}
          {mode === 'guess' && guess && (
            <Marker position={normLatLng(guess.lat, guess.lng)} icon={pinIcon('#00e5ff')} />
          )}
          {mode === 'reveal' && truth && (
            <>
              <FitReveal truth={truth} guesses={revealResults} />
              <CircleMarker
                center={normLatLng(truth.lat, truth.lng)}
                pathOptions={{ color: '#80ff72', fillColor: '#80ff72', fillOpacity: 0.9 }}
                radius={9}
              />
                            {revealResults.flatMap((r) => {
                if (r.lat == null) return []
                const look = resolvePlayerLook(r.avatar || r.vibe, r.playerId, revealResults.map((x) => ({ id: x.playerId, avatar: x.avatar, vibe: x.vibe })))
                return revealSegments([r.lat, r.lng], [truth.lat, truth.lng]).map((seg, i) => (
                  <Polyline
                    key={`l-${r.playerId}-${i}`}
                    positions={seg}
                    pathOptions={{
                      color: look.robe,
                      weight: r.playerId === selfId ? 3 : 1.5,
                      opacity: 0.8,
                      dashArray: r.playerId === selfId ? undefined : '6 8',
                    }}
                  />
                ))
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
