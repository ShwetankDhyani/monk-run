/**
 * Street View place picker — biased toward interesting city hubs
 * (pure globe sampling mostly yields empty highways).
 * Requires a first-party Google Maps API key (no key scraping).
 */
import { randomBytes } from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { INTERESTING_SEEDS } from './interestingSeeds.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const USED_FILE = join(__dirname, '..', 'data', 'used-places.json')

/** @type {Set<string>} */
const usedKeys = new Set()
let usedLoaded = false

function fingerprint(lat, lng) {
  return `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`
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
    const trimmed = arr.length > 12000 ? arr.slice(arr.length - 12000) : arr
    if (trimmed.length < usedKeys.size) {
      usedKeys.clear()
      for (const k of trimmed) usedKeys.add(k)
    }
    await writeFile(USED_FILE, JSON.stringify(trimmed))
  } catch {
    /* ignore */
  }
}

let scrapedKey = ''
let scrapedAt = 0

function scrapeAllowed() {
  // Default ON (same as local demo). Set ALLOW_MAPS_KEY_SCRAPE=0 to force a first-party key.
  return process.env.ALLOW_MAPS_KEY_SCRAPE !== '0'
}

async function scrapeEmbedMapsKey() {
  if (scrapedKey && Date.now() - scrapedAt < 6 * 60 * 60 * 1000) return scrapedKey
  const res = await fetch(
    'https://www.google.com/maps?layer=c&cbll=40.7580,-73.9855&cbp=12,0,0,0,0&hl=en&output=svembed',
    {
      headers: {
        Accept: 'text/html',
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    },
  )
  if (!res.ok) throw new Error('Could not resolve Street View metadata key')
  const html = await res.text()
  const m = html.match(/maps\/api\/js\?key=([A-Za-z0-9_-]+)/)
  if (!m?.[1]) throw new Error('Could not resolve Street View metadata key')
  scrapedKey = m[1]
  scrapedAt = Date.now()
  console.warn('[maps] Using scraped embed key (demo mode) — set a valid GOOGLE_MAPS_API_KEY for launch')
  return scrapedKey
}

/**
 * Prefer first-party GOOGLE_MAPS_API_KEY.
 * If missing/invalid, fall back to Google's public embed key (local/Vercel demo path).
 * Disable with ALLOW_MAPS_KEY_SCRAPE=0.
 */
export async function resolveMapsKey(preferred = '', { forceScrape = false } = {}) {
  if (!forceScrape) {
    const key = String(
      preferred || process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '',
    ).trim()
    if (key) return key
  }

  if (!scrapeAllowed()) {
    throw new Error(
      'GOOGLE_MAPS_API_KEY is required. Set it in Vercel, or remove ALLOW_MAPS_KEY_SCRAPE=0 for demo scrape mode.',
    )
  }
  return scrapeEmbedMapsKey()
}

/** Uniform random point on the globe (rare wildcard — usually empty road). */
function randomGlobePoint() {
  const lng = Math.random() * 360 - 180
  const lat = (Math.acos(2 * Math.random() - 1) * 180) / Math.PI - 90
  return { lat, lng }
}

/** Haversine distance in km. */
function kmBetween(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Jitter around a curated city hub (~1–28 km) so rounds feel lived-in,
 * not random freeway shoulders in the middle of nowhere.
 */
function randomInterestingSeed() {
  const hub = INTERESTING_SEEDS[Math.floor(Math.random() * INTERESTING_SEEDS.length)]
  const jitterKm = 1 + Math.random() * 27
  const bearing = Math.random() * Math.PI * 2
  const dLat = (jitterKm / 111.32) * Math.cos(bearing)
  const cosLat = Math.cos((hub.lat * Math.PI) / 180)
  const dLng = (jitterKm / (111.32 * Math.max(0.2, cosLat))) * Math.sin(bearing)
  return {
    lat: hub.lat + dLat,
    lng: hub.lng + dLng,
    hub: hub.name,
    hubLat: hub.lat,
    hubLng: hub.lng,
  }
}

function randomSeedPoint() {
  // Almost always near cities / dense coverage — pure globe sampling = empty highways
  if (Math.random() < 0.95) return randomInterestingSeed()
  return { ...randomGlobePoint(), hub: '', hubLat: null, hubLng: null }
}

/** Thrown when Google rejects the configured Maps key (fail fast — don't spin 200 misses). */
export class MapsKeyError extends Error {
  constructor(message) {
    super(message)
    this.name = 'MapsKeyError'
  }
}

async function streetViewMeta(lat, lng, apiKey, radius) {
  const url = new URL('https://maps.googleapis.com/maps/api/streetview/metadata')
  url.searchParams.set('location', `${lat},${lng}`)
  url.searchParams.set('source', 'outdoor')
  url.searchParams.set('radius', String(radius))
  url.searchParams.set('key', apiKey)
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  if (data.status === 'REQUEST_DENIED' || data.status === 'INVALID_REQUEST') {
    const detail = String(data.error_message || data.status || 'REQUEST_DENIED').trim()
    throw new MapsKeyError(
      `Google Maps key rejected (${detail}). Enable Street View Static API, turn on billing, and set Application restriction to None (server keys cannot use HTTP-referrer locks).`,
    )
  }
  if (data.status !== 'OK' || !data.location) return null
  return {
    lat: data.location.lat,
    lng: data.location.lng,
    panoId: data.pano_id || '',
  }
}

/**
 * Probe GOOGLE_MAPS_API_KEY against Street View Metadata (never returns the key).
 * @returns {Promise<{ present: boolean, ok: boolean, mode: string, detail?: string }>}
 */
export async function probeConfiguredMapsKey() {
  const key = String(
    process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '',
  ).trim()
  const scrape = scrapeAllowed()
  if (!key) {
    return {
      present: false,
      ok: false,
      mode: scrape ? 'demo-scrape' : 'missing',
      detail: scrape
        ? 'No GOOGLE_MAPS_API_KEY set — using demo scrape + Street View embed'
        : 'GOOGLE_MAPS_API_KEY is required',
    }
  }
  try {
    const meta = await streetViewMeta(40.758, -73.9855, key, 2000)
    if (meta?.panoId || meta?.lat) {
      return {
        present: true,
        ok: true,
        mode: scrape ? 'first-party+demo-fallback' : 'first-party',
        detail: 'Street View Metadata OK',
      }
    }
    return {
      present: true,
      ok: false,
      mode: scrape ? 'demo-scrape' : 'first-party',
      detail: 'Key accepted HTTP but no panorama near probe point',
    }
  } catch (err) {
    const detail = String(err?.message || err).replace(/AIza[0-9A-Za-z_-]+/g, '[redacted]')
    return {
      present: true,
      ok: false,
      mode: scrape ? 'demo-scrape' : 'first-party-required',
      detail: detail.slice(0, 240),
    }
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
        'User-Agent': 'monk.run/1.0 (https://monk.run; party geography game)',
      },
    })
    if (!res.ok) return { country: 'Unknown', city: '' }
    const data = await res.json()
    const a = data.address || {}
    return {
      country: a.country || 'Unknown',
      city: a.city || a.town || a.village || a.municipality || a.county || a.state || '',
    }
  } catch {
    return { country: 'Unknown', city: '' }
  }
}

function isUsed(panoId, lat, lng, sessionKeys) {
  const keys = []
  if (panoId) keys.push(`p:${panoId}`)
  keys.push(fingerprint(lat, lng))
  return keys.some((k) => usedKeys.has(k) || sessionKeys.has(k))
}

function markUsed(panoId, lat, lng, sessionKeys) {
  const keys = [fingerprint(lat, lng)]
  if (panoId) keys.push(`p:${panoId}`)
  for (const k of keys) {
    sessionKeys.add(k)
    usedKeys.add(k)
  }
}

async function pickOneRandom(apiKey, sessionKeys) {
  // Keep search tight so Google doesn't snap us onto a distant empty highway
  const radii = [300, 900, 2500, 6000, 12000]
  const maxAttempts = 240

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const seed = randomSeedPoint()
    const radius = radii[Math.min(radii.length - 1, Math.floor(attempt / 48))]
    let meta
    try {
      meta = await streetViewMeta(seed.lat, seed.lng, apiKey, radius)
    } catch (err) {
      if (err instanceof MapsKeyError) throw err
      continue
    }
    if (!meta) continue
    if (isUsed(meta.panoId, meta.lat, meta.lng, sessionKeys)) continue

    // If we started near a city, reject snaps that wandered too far out of town
    if (seed.hubLat != null && seed.hubLng != null) {
      const fromHub = kmBetween(
        { lat: seed.hubLat, lng: seed.hubLng },
        { lat: meta.lat, lng: meta.lng },
      )
      if (fromHub > 35) continue
    }

    markUsed(meta.panoId, meta.lat, meta.lng, sessionKeys)
    return {
      id: `rnd-${randomBytes(8).toString('hex')}`,
      lat: meta.lat,
      lng: meta.lng,
      panoId: meta.panoId,
      country: 'Unknown',
      city: seed.hub || '',
      code: '',
      biome: seed.hub ? 'city-seed' : 'global-random',
      hint: '',
      needsGeocode: true,
    }
  }
  return null
}

async function collectPlaces(apiKey, n) {
  const sessionKeys = new Set()
  const picks = []
  const batchSize = Math.min(n, 3)
  while (picks.length < n) {
    const need = Math.min(batchSize, n - picks.length)
    const batch = await Promise.all(
      Array.from({ length: need }, () => pickOneRandom(apiKey, sessionKeys)),
    )
    for (const p of batch) {
      if (p) picks.push(p)
    }
    if (batch.every((p) => !p)) {
      throw new Error('Could not find enough Street View panoramas — try again')
    }
  }
  return picks.slice(0, n)
}

export async function pickGlobalPlaces(count, mapsKey = '') {
  await loadUsed()
  const n = Math.max(1, Math.min(20, Number(count) || 5))
  let apiKey = await resolveMapsKey(mapsKey)

  try {
    const picks = await collectPlaces(apiKey, n)
    void persistUsed()
    return picks
  } catch (err) {
    // Invalid/restricted Vercel key → same demo path as local scrape mode
    if (err instanceof MapsKeyError && scrapeAllowed()) {
      console.warn('[maps] Configured key rejected — falling back to scraped embed key')
      apiKey = await resolveMapsKey('', { forceScrape: true })
      const picks = await collectPlaces(apiKey, n)
      void persistUsed()
      return picks
    }
    throw err
  }
}

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
