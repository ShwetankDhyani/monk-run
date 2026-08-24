import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, CircleMarker, Polyline, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { COUNTRIES, MONK_VIBES } from '../data/locations.js'

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
}) {
  const [filter, setFilter] = useState('')
  const countries = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return COUNTRIES
    return COUNTRIES.filter((c) => c.toLowerCase().includes(q))
  }, [filter])

  const center = guess ? [guess.lat, guess.lng] : [20, 0]

  return (
    <div className="flex h-full min-h-[280px] flex-col gap-2">
      {mode === 'guess' && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter countries…"
            className="input-mystic min-w-[140px] flex-1"
            disabled={locked}
          />
          <select
            className="input-mystic min-w-[160px] flex-[2]"
            value={country}
            disabled={locked}
            onChange={(e) => onCountry?.(e.target.value)}
          >
            <option value="">Country assist (optional)</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="relative min-h-[240px] flex-1 overflow-hidden rounded-xl border border-saffron/30 shadow-[0_0_40px_rgba(244,162,97,0.12)]">
        <MapContainer
          center={center}
          zoom={guess ? 3 : 1}
          className="h-full w-full bg-[#0a0614]"
          scrollWheelZoom
          worldCopyJump
        >
          <TileLayer
            attribution="&copy; CARTO"
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {mode === 'guess' && <ClickDrop enabled={!locked} onDrop={onGuess} />}
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
                const vibe = MONK_VIBES.find((v) => v.id === r.vibe) || MONK_VIBES[0]
                return (
                  <Marker key={`m-${r.playerId}`} position={[r.lat, r.lng]} icon={pinIcon(vibe.color)} />
                )
              })}
              {revealResults.map((r) => {
                if (r.lat == null) return null
                const vibe = MONK_VIBES.find((v) => v.id === r.vibe) || MONK_VIBES[0]
                return (
                  <Polyline
                    key={`l-${r.playerId}`}
                    positions={[
                      [r.lat, r.lng],
                      [truth.lat, truth.lng],
                    ]}
                    pathOptions={{
                      color: vibe.color,
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
          <div className="pointer-events-none absolute inset-x-0 top-3 text-center">
            <span className="rounded-full bg-black/55 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-saffron">
              tap the map to drop your pin
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
