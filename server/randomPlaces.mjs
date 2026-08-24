/**
 * Global Street View places — verified panoramas only (no blind jitter).
 * Without GOOGLE_MAPS_API_KEY: exact verified coords.
 * With key: hub jitter + Street View Metadata snap; verified pool as fallback.
 */
import { randomBytes, randomInt } from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { VERIFIED_PLACES } from './verifiedPlaces.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const USED_FILE = join(__dirname, '..', 'data', 'used-places.json')

/** Urban hubs for metadata-snapped random picks (API key required). */
const HUBS = [
  { lat: 40.71, lng: -74.01, w: 0.08, country: 'United States', city: 'New York' },
  { lat: 34.05, lng: -118.25, w: 0.1, country: 'United States', city: 'Los Angeles' },
  { lat: 41.88, lng: -87.63, w: 0.06, country: 'United States', city: 'Chicago' },
  { lat: 37.77, lng: -122.42, w: 0.05, country: 'United States', city: 'San Francisco' },
  { lat: 25.76, lng: -80.19, w: 0.05, country: 'United States', city: 'Miami' },
  { lat: 47.61, lng: -122.33, w: 0.05, country: 'United States', city: 'Seattle' },
  { lat: 43.65, lng: -79.38, w: 0.05, country: 'Canada', city: 'Toronto' },
  { lat: 49.28, lng: -123.12, w: 0.04, country: 'Canada', city: 'Vancouver' },
  { lat: 19.43, lng: -99.13, w: 0.08, country: 'Mexico', city: 'Mexico City' },
  { lat: -34.6, lng: -58.38, w: 0.08, country: 'Argentina', city: 'Buenos Aires' },
  { lat: -22.91, lng: -43.17, w: 0.06, country: 'Brazil', city: 'Rio de Janeiro' },
  { lat: -23.55, lng: -46.63, w: 0.08, country: 'Brazil', city: 'São Paulo' },
  { lat: -33.45, lng: -70.67, w: 0.05, country: 'Chile', city: 'Santiago' },
  { lat: -12.05, lng: -77.04, w: 0.04, country: 'Peru', city: 'Lima' },
  { lat: 4.71, lng: -74.07, w: 0.05, country: 'Colombia', city: 'Bogotá' },
  { lat: 51.51, lng: -0.13, w: 0.08, country: 'United Kingdom', city: 'London' },
  { lat: 48.86, lng: 2.35, w: 0.06, country: 'France', city: 'Paris' },
  { lat: 52.37, lng: 4.9, w: 0.04, country: 'Netherlands', city: 'Amsterdam' },
  { lat: 52.52, lng: 13.41, w: 0.06, country: 'Germany', city: 'Berlin' },
  { lat: 41.9, lng: 12.5, w: 0.05, country: 'Italy', city: 'Rome' },
  { lat: 45.46, lng: 9.19, w: 0.04, country: 'Italy', city: 'Milan' },
  { lat: 41.39, lng: 2.17, w: 0.05, country: 'Spain', city: 'Barcelona' },
  { lat: 40.42, lng: -3.7, w: 0.05, country: 'Spain', city: 'Madrid' },
  { lat: 38.72, lng: -9.14, w: 0.04, country: 'Portugal', city: 'Lisbon' },
  { lat: 52.23, lng: 21.01, w: 0.04, country: 'Poland', city: 'Warsaw' },
  { lat: 50.08, lng: 14.42, w: 0.04, country: 'Czechia', city: 'Prague' },
  { lat: 47.5, lng: 19.04, w: 0.04, country: 'Hungary', city: 'Budapest' },
  { lat: 41.01, lng: 28.98, w: 0.06, country: 'Turkey', city: 'Istanbul' },
  { lat: 59.33, lng: 18.07, w: 0.04, country: 'Sweden', city: 'Stockholm' },
  { lat: 55.68, lng: 12.57, w: 0.03, country: 'Denmark', city: 'Copenhagen' },
  { lat: 30.04, lng: 31.24, w: 0.05, country: 'Egypt', city: 'Cairo' },
  { lat: 31.63, lng: -7.98, w: 0.03, country: 'Morocco', city: 'Marrakech' },
  { lat: -33.92, lng: 18.42, w: 0.04, country: 'South Africa', city: 'Cape Town' },
  { lat: -26.2, lng: 28.04, w: 0.04, country: 'South Africa', city: 'Johannesburg' },
  { lat: 25.2, lng: 55.27, w: 0.05, country: 'United Arab Emirates', city: 'Dubai' },
  { lat: 35.68, lng: 139.76, w: 0.08, country: 'Japan', city: 'Tokyo' },
  { lat: 34.69, lng: 135.5, w: 0.04, country: 'Japan', city: 'Osaka' },
  { lat: 37.57, lng: 126.98, w: 0.05, country: 'South Korea', city: 'Seoul' },
  { lat: 31.23, lng: 121.47, w: 0.06, country: 'China', city: 'Shanghai' },
  { lat: 39.9, lng: 116.4, w: 0.06, country: 'China', city: 'Beijing' },
  { lat: 22.28, lng: 114.16, w: 0.03, country: 'Hong Kong', city: 'Hong Kong' },
  { lat: 1.35, lng: 103.82, w: 0.03, country: 'Singapore', city: 'Singapore' },
  { lat: 13.76, lng: 100.5, w: 0.05, country: 'Thailand', city: 'Bangkok' },
  { lat: 19.08, lng: 72.88, w: 0.05, country: 'India', city: 'Mumbai' },
  { lat: 28.61, lng: 77.21, w: 0.05, country: 'India', city: 'Delhi' },
  { lat: -33.87, lng: 151.21, w: 0.05, country: 'Australia', city: 'Sydney' },
  { lat: -37.81, lng: 144.96, w: 0.05, country: 'Australia', city: 'Melbourne' },
  { lat: -36.85, lng: 174.76, w: 0.03, country: 'New Zealand', city: 'Auckland' },
]

/** @type {Set<string>} */
const usedKeys = new Set()
let usedLoaded = false

function fingerprint(lat, lng) {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`
}

async function loadUsed() {
  if (usedLoaded) return
  usedLoaded = true
  try {
    if (!existsSync(USED_FILE)) return
    const raw = JSON.parse(await readFile(USED_FILE, 'utf8'))
    if (Array.isArray(raw)) for (const k of raw) usedKeys.add(k)
  } catch {
    /* ignore */
  }
}

async function persistUsed() {
  try {
    const dir = dirname(USED_FILE)
    if (!existsSync(dir)) await mkdir(dir, { recursive: true })
    const arr = [...usedKeys]
    const trimmed = arr.length > 8000 ? arr.slice(arr.length - 8000) : arr
    if (trimmed.length < usedKeys.size) {
      usedKeys.clear()
      for (const k of trimmed) usedKeys.add(k)
    }
    await writeFile(USED_FILE, JSON.stringify(trimmed))
  } catch {
    /* ignore */
  }
}

function markUsed(keys, sessionKeys) {
  for (const k of keys) {
    sessionKeys.add(k)
    usedKeys.add(k)
  }
}

function placeKeys(lat, lng, panoId = '', id = '') {
  const keys = [fingerprint(lat, lng)]
  if (panoId) keys.push(`p:${panoId}`)
  if (id) keys.push(`id:${id}`)
  return keys
}

function isUsed(keys, sessionKeys) {
  return keys.some((k) => usedKeys.has(k) || sessionKeys.has(k))
}

function toPick(base, lat, lng, { needsGeocode = false } = {}) {
  return {
    id: base.id || `rnd-${randomBytes(8).toString('hex')}`,
    lat,
    lng,
    country: base.country || 'Unknown',
    city: base.city || '',
    code: base.code || '',
    biome: base.biome || 'verified',
    hint: base.hint || '',
    needsGeocode,
  }
}

async function streetViewMeta(lat, lng, apiKey) {
  if (!apiKey) return null
  const url = new URL('https://maps.googleapis.com/maps/api/streetview/metadata')
  url.searchParams.set('location', `${lat},${lng}`)
  url.searchParams.set('source', 'outdoor')
  url.searchParams.set('radius', '2500')
  url.searchParams.set('key', apiKey)
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  if (data.status !== 'OK' || !data.location) return null
  return {
    lat: data.location.lat,
    lng: data.location.lng,
    panoId: data.pano_id || '',
  }
}

async function reverseGeocode(lat, lng) {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lng))
    url.searchParams.set('format', 'json')
    url.searchParams.set('zoom', '10')
    url.searchParams.set('addressdetails', '1')
    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en',
        'User-Agent': 'monk.run/1.0 (party geoguessr)',
      },
    })
    if (!res.ok) return { country: 'Unknown', city: '' }
    const data = await res.json()
    const a = data.address || {}
    const country = a.country || 'Unknown'
    const city = a.city || a.town || a.village || a.municipality || a.county || a.state || ''
    return { country, city }
  } catch {
    return { country: 'Unknown', city: '' }
  }
}

/** Fisher–Yates shuffle copy. */
function shuffled(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Pick from exact verified panoramas (safe without Maps API key).
 */
function pickFromVerified(count, sessionKeys) {
  const picks = []
  const pool = shuffled(VERIFIED_PLACES)

  for (const place of pool) {
    if (picks.length >= count) break
    const keys = placeKeys(place.lat, place.lng, '', place.id)
    if (isUsed(keys, sessionKeys)) continue
    markUsed(keys, sessionKeys)
    picks.push(toPick(place, place.lat, place.lng))
  }

  // If used-history exhausted the pool, allow reuse of oldest unused-in-session
  if (picks.length < count) {
    for (const place of pool) {
      if (picks.length >= count) break
      const keys = placeKeys(place.lat, place.lng, '', place.id)
      if (keys.some((k) => sessionKeys.has(k))) continue
      markUsed(keys, sessionKeys)
      picks.push(toPick(place, place.lat, place.lng))
    }
  }

  return picks
}

/**
 * With API key: jitter near hubs, snap to nearest outdoor panorama via Metadata API.
 * Never returns a point that failed metadata. Falls back to verified pool.
 */
async function pickWithMetadata(count, apiKey, sessionKeys) {
  const picks = []
  const maxAttempts = count * 40

  for (let attempt = 0; attempt < maxAttempts && picks.length < count; attempt++) {
    const hub = HUBS[randomInt(0, HUBS.length)]
    const jitter = (hub.w || 0.05) * (0.4 + Math.random() * 0.6)
    let lat = hub.lat + (Math.random() * 2 - 1) * jitter
    let lng = hub.lng + (Math.random() * 2 - 1) * jitter * 1.15
    lat = Math.max(-85, Math.min(85, lat))
    lng = ((lng + 540) % 360) - 180

    let meta
    try {
      meta = await streetViewMeta(lat, lng, apiKey)
    } catch {
      continue
    }
    if (!meta) continue

    lat = meta.lat
    lng = meta.lng
    const keys = placeKeys(lat, lng, meta.panoId)
    if (isUsed(keys, sessionKeys)) continue

    markUsed(keys, sessionKeys)
    picks.push(
      toPick(
        { country: hub.country, city: hub.city, biome: 'global-random' },
        lat,
        lng,
        { needsGeocode: true },
      ),
    )
  }

  if (picks.length < count) {
    const more = pickFromVerified(count - picks.length, sessionKeys)
    picks.push(...more)
  }
  return picks
}

/**
 * Pick `count` unique worldwide places with guaranteed Street View coverage.
 * @param {number} count
 * @param {string} apiKey
 */
export async function pickGlobalPlaces(count, apiKey = '') {
  await loadUsed()
  const sessionKeys = new Set()
  const n = Math.max(1, Math.min(20, Number(count) || 5))

  // Without a Maps key we cannot validate coverage — only use exact verified coords.
  const picks = apiKey
    ? await pickWithMetadata(n, apiKey, sessionKeys)
    : pickFromVerified(n, sessionKeys)

  void persistUsed()
  return picks
}

/** Refine country/city at reveal time (keeps PLAY instant). */
export async function enrichPlace(loc) {
  if (!loc) return loc
  if (!loc.needsGeocode && loc.country && loc.country !== 'Unknown') return loc
  try {
    const geo = await reverseGeocode(loc.lat, loc.lng)
    if (geo.country && geo.country !== 'Unknown') loc.country = geo.country
    if (geo.city) loc.city = geo.city
  } catch {
    /* keep labels */
  }
  loc.needsGeocode = false
  return loc
}
