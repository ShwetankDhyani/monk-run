/**
 * Fully random Street View places — every round is a unique snapped panorama.
 * No curated destination pool. Candidates are random; Street View Metadata API
 * snaps (or rejects) until a real outdoor pano is found.
 */
import { randomBytes, randomInt } from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const USED_FILE = join(__dirname, '..', 'data', 'used-places.json')

/**
 * Soft search regions only — never returned as destinations.
 * Random points inside these boxes raise hit-rate vs open ocean.
 */
const LAND_BOXES = [
  { minLat: 24, maxLat: 49, minLng: -125, maxLng: -66 }, // USA
  { minLat: 41, maxLat: 60, minLng: -130, maxLng: -52 }, // Canada
  { minLat: 14, maxLat: 32, minLng: -117, maxLng: -86 }, // Mexico / CA
  { minLat: -56, maxLat: 12, minLng: -81, maxLng: -34 }, // South America
  { minLat: 36, maxLat: 71, minLng: -10, maxLng: 40 }, // Europe
  { minLat: 35, maxLat: 60, minLng: 40, maxLng: 180 }, // Russia / Central Asia
  { minLat: -35, maxLat: 37, minLng: -18, maxLng: 52 }, // Africa
  { minLat: 12, maxLat: 42, minLng: 26, maxLng: 60 }, // Middle East
  { minLat: 5, maxLat: 55, minLng: 60, maxLng: 150 }, // South / East Asia
  { minLat: -10, maxLat: 28, minLng: 95, maxLng: 145 }, // SE Asia
  { minLat: -45, maxLat: -10, minLng: 112, maxLng: 155 }, // Australia
  { minLat: -47, maxLat: -34, minLng: 166, maxLng: 179 }, // New Zealand
  { minLat: 30, maxLat: 46, minLng: 130, maxLng: 146 }, // Japan / Korea
]

/** @type {Set<string>} */
const usedKeys = new Set()
let usedLoaded = false

/** Cached Maps key scraped from Google's public SV embed (metadata only). */
let scrapedKey = ''
let scrapedAt = 0

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

/**
 * Prefer env key; otherwise borrow the public key Google ships in SV embeds
 * (same key the browser embed uses) so we can validate coverage without setup.
 */
export async function resolveMapsKey(preferred = '') {
  const fromEnv = String(preferred || process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '').trim()
  if (fromEnv) return fromEnv
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
  return scrapedKey
}

/** Uniform random point inside a land box (search seed, not a destination). */
function randomLandPoint() {
  const box = LAND_BOXES[randomInt(0, LAND_BOXES.length)]
  const lat = box.minLat + Math.random() * (box.maxLat - box.minLat)
  const lng = box.minLng + Math.random() * (box.maxLng - box.minLng)
  return {
    lat: Math.max(-85, Math.min(85, lat)),
    lng: ((lng + 540) % 360) - 180,
  }
}

async function streetViewMeta(lat, lng, apiKey, radius = 10000) {
  const url = new URL('https://maps.googleapis.com/maps/api/streetview/metadata')
  url.searchParams.set('location', `${lat},${lng}`)
  url.searchParams.set('source', 'outdoor')
  url.searchParams.set('radius', String(radius))
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

/**
 * One fully random outdoor panorama (unique vs recent history).
 */
async function pickOneRandom(apiKey, sessionKeys) {
  const radii = [5000, 15000, 50000]
  const maxAttempts = 80

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const seed = randomLandPoint()
    const radius = radii[Math.min(radii.length - 1, Math.floor(attempt / 12))]
    let meta
    try {
      meta = await streetViewMeta(seed.lat, seed.lng, apiKey, radius)
    } catch {
      continue
    }
    if (!meta) continue
    if (isUsed(meta.panoId, meta.lat, meta.lng, sessionKeys)) continue

    markUsed(meta.panoId, meta.lat, meta.lng, sessionKeys)
    return {
      id: `rnd-${randomBytes(8).toString('hex')}`,
      lat: meta.lat,
      lng: meta.lng,
      panoId: meta.panoId,
      country: 'Unknown',
      city: '',
      code: '',
      biome: 'global-random',
      hint: '',
      needsGeocode: true,
    }
  }
  return null
}

/**
 * Pick `count` unique worldwide Street View places — fully random each time.
 * @param {number} count
 * @param {string} [mapsKey]
 */
export async function pickGlobalPlaces(count, mapsKey = '') {
  await loadUsed()
  const apiKey = await resolveMapsKey(mapsKey)
  const n = Math.max(1, Math.min(20, Number(count) || 5))
  const sessionKeys = new Set()
  const picks = []

  // Fetch rounds in parallel batches for speed
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

  void persistUsed()
  return picks.slice(0, n)
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
