/**
 * Global random Street View places — not a tiny curated loop.
 * Samples worldwide hubs, jitters, validates coverage, reverse-geocodes country.
 */
import { randomBytes, randomInt } from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const USED_FILE = join(__dirname, '..', 'data', 'used-places.json')

/** Regions with known Street View coverage — seeds only; each pick is jittered. */
const HUBS = [
  // Americas
  { lat: 40.71, lng: -74.01, w: 0.35 }, // NYC
  { lat: 34.05, lng: -118.25, w: 0.4 }, // LA
  { lat: 41.88, lng: -87.63, w: 0.25 }, // Chicago
  { lat: 29.76, lng: -95.37, w: 0.3 }, // Houston
  { lat: 33.45, lng: -112.07, w: 0.35 }, // Phoenix
  { lat: 39.74, lng: -104.99, w: 0.25 }, // Denver
  { lat: 47.61, lng: -122.33, w: 0.25 }, // Seattle
  { lat: 37.77, lng: -122.42, w: 0.2 }, // SF
  { lat: 25.76, lng: -80.19, w: 0.25 }, // Miami
  { lat: 42.36, lng: -71.06, w: 0.2 }, // Boston
  { lat: 38.91, lng: -77.04, w: 0.2 }, // DC
  { lat: 36.17, lng: -115.14, w: 0.25 }, // Vegas
  { lat: 45.52, lng: -122.68, w: 0.2 }, // Portland
  { lat: 32.72, lng: -117.16, w: 0.25 }, // San Diego
  { lat: 30.27, lng: -97.74, w: 0.25 }, // Austin
  { lat: 35.15, lng: -90.05, w: 0.2 }, // Memphis
  { lat: 39.1, lng: -94.58, w: 0.2 }, // Kansas City
  { lat: 44.98, lng: -93.27, w: 0.2 }, // Minneapolis
  { lat: 43.65, lng: -79.38, w: 0.25 }, // Toronto
  { lat: 45.5, lng: -73.57, w: 0.2 }, // Montreal
  { lat: 49.28, lng: -123.12, w: 0.2 }, // Vancouver
  { lat: 51.05, lng: -114.07, w: 0.2 }, // Calgary
  { lat: 19.43, lng: -99.13, w: 0.3 }, // Mexico City
  { lat: 20.67, lng: -103.35, w: 0.2 }, // Guadalajara
  { lat: 25.69, lng: -100.32, w: 0.2 }, // Monterrey
  { lat: 21.16, lng: -86.85, w: 0.15 }, // Cancun
  { lat: 23.11, lng: -82.37, w: 0.15 }, // Havana
  { lat: 18.47, lng: -69.9, w: 0.15 }, // Santo Domingo
  { lat: 9.93, lng: -84.09, w: 0.15 }, // San Jose CR
  { lat: 8.98, lng: -79.52, w: 0.15 }, // Panama
  { lat: 4.71, lng: -74.07, w: 0.25 }, // Bogota
  { lat: 6.25, lng: -75.56, w: 0.2 }, // Medellin
  { lat: -12.05, lng: -77.04, w: 0.2 }, // Lima
  { lat: -16.5, lng: -68.15, w: 0.15 }, // La Paz
  { lat: -33.45, lng: -70.67, w: 0.25 }, // Santiago
  { lat: -34.6, lng: -58.38, w: 0.3 }, // Buenos Aires
  { lat: -31.42, lng: -64.18, w: 0.2 }, // Cordoba AR
  { lat: -25.26, lng: -57.58, w: 0.15 }, // Asuncion
  { lat: -22.91, lng: -43.17, w: 0.25 }, // Rio
  { lat: -23.55, lng: -46.63, w: 0.3 }, // Sao Paulo
  { lat: -15.79, lng: -47.88, w: 0.2 }, // Brasilia
  { lat: -3.12, lng: -60.02, w: 0.2 }, // Manaus
  { lat: -8.05, lng: -34.88, w: 0.2 }, // Recife
  { lat: -30.03, lng: -51.23, w: 0.2 }, // Porto Alegre
  // Europe
  { lat: 51.51, lng: -0.13, w: 0.3 }, // London
  { lat: 53.48, lng: -2.24, w: 0.2 }, // Manchester
  { lat: 55.95, lng: -3.19, w: 0.15 }, // Edinburgh
  { lat: 53.35, lng: -6.26, w: 0.15 }, // Dublin
  { lat: 48.86, lng: 2.35, w: 0.25 }, // Paris
  { lat: 45.76, lng: 4.84, w: 0.15 }, // Lyon
  { lat: 43.3, lng: 5.37, w: 0.15 }, // Marseille
  { lat: 50.85, lng: 4.35, w: 0.15 }, // Brussels
  { lat: 52.37, lng: 4.9, w: 0.2 }, // Amsterdam
  { lat: 52.52, lng: 13.41, w: 0.25 }, // Berlin
  { lat: 48.14, lng: 11.58, w: 0.2 }, // Munich
  { lat: 50.11, lng: 8.68, w: 0.15 }, // Frankfurt
  { lat: 53.55, lng: 9.99, w: 0.15 }, // Hamburg
  { lat: 47.38, lng: 8.54, w: 0.12 }, // Zurich
  { lat: 48.21, lng: 16.37, w: 0.15 }, // Vienna
  { lat: 50.08, lng: 14.42, w: 0.15 }, // Prague
  { lat: 47.5, lng: 19.04, w: 0.15 }, // Budapest
  { lat: 52.23, lng: 21.01, w: 0.2 }, // Warsaw
  { lat: 50.06, lng: 19.94, w: 0.15 }, // Krakow
  { lat: 41.9, lng: 12.5, w: 0.2 }, // Rome
  { lat: 45.46, lng: 9.19, w: 0.2 }, // Milan
  { lat: 40.85, lng: 14.27, w: 0.15 }, // Naples
  { lat: 43.77, lng: 11.25, w: 0.12 }, // Florence
  { lat: 45.44, lng: 12.34, w: 0.1 }, // Venice
  { lat: 41.39, lng: 2.17, w: 0.2 }, // Barcelona
  { lat: 40.42, lng: -3.7, w: 0.25 }, // Madrid
  { lat: 37.39, lng: -5.99, w: 0.15 }, // Seville
  { lat: 39.47, lng: -0.38, w: 0.15 }, // Valencia
  { lat: 38.72, lng: -9.14, w: 0.15 }, // Lisbon
  { lat: 41.15, lng: -8.61, w: 0.12 }, // Porto
  { lat: 37.98, lng: 23.73, w: 0.15 }, // Athens
  { lat: 41.01, lng: 28.98, w: 0.25 }, // Istanbul
  { lat: 59.33, lng: 18.07, w: 0.15 }, // Stockholm
  { lat: 59.91, lng: 10.75, w: 0.15 }, // Oslo
  { lat: 55.68, lng: 12.57, w: 0.15 }, // Copenhagen
  { lat: 60.17, lng: 24.94, w: 0.12 }, // Helsinki
  { lat: 64.15, lng: -21.94, w: 0.1 }, // Reykjavik
  { lat: 55.75, lng: 37.62, w: 0.25 }, // Moscow
  { lat: 59.93, lng: 30.32, w: 0.2 }, // St Petersburg
  { lat: 50.45, lng: 30.52, w: 0.2 }, // Kyiv
  { lat: 44.43, lng: 26.1, w: 0.15 }, // Bucharest
  { lat: 42.7, lng: 23.32, w: 0.12 }, // Sofia
  { lat: 44.8, lng: 20.47, w: 0.15 }, // Belgrade
  { lat: 45.81, lng: 15.98, w: 0.12 }, // Zagreb
  { lat: 46.05, lng: 14.51, w: 0.1 }, // Ljubljana
  // Africa / Middle East
  { lat: 30.04, lng: 31.24, w: 0.2 }, // Cairo
  { lat: 33.57, lng: -7.59, w: 0.15 }, // Casablanca
  { lat: 31.63, lng: -7.98, w: 0.12 }, // Marrakech
  { lat: 36.75, lng: 3.06, w: 0.15 }, // Algiers
  { lat: 36.81, lng: 10.18, w: 0.12 }, // Tunis
  { lat: -26.2, lng: 28.04, w: 0.25 }, // Johannesburg
  { lat: -33.92, lng: 18.42, w: 0.2 }, // Cape Town
  { lat: -29.86, lng: 31.02, w: 0.15 }, // Durban
  { lat: -1.29, lng: 36.82, w: 0.15 }, // Nairobi
  { lat: 6.52, lng: 3.38, w: 0.2 }, // Lagos
  { lat: 5.6, lng: -0.19, w: 0.12 }, // Accra
  { lat: -15.42, lng: 28.28, w: 0.12 }, // Lusaka
  { lat: -17.83, lng: 31.05, w: 0.12 }, // Harare
  { lat: 25.2, lng: 55.27, w: 0.2 }, // Dubai
  { lat: 24.45, lng: 54.38, w: 0.15 }, // Abu Dhabi
  { lat: 24.71, lng: 46.68, w: 0.2 }, // Riyadh
  { lat: 21.49, lng: 39.19, w: 0.15 }, // Jeddah
  { lat: 31.95, lng: 35.91, w: 0.12 }, // Amman
  { lat: 33.89, lng: 35.5, w: 0.12 }, // Beirut
  { lat: 32.09, lng: 34.78, w: 0.15 }, // Tel Aviv
  { lat: 31.77, lng: 35.21, w: 0.1 }, // Jerusalem
  // Asia
  { lat: 35.68, lng: 139.76, w: 0.3 }, // Tokyo
  { lat: 34.69, lng: 135.5, w: 0.2 }, // Osaka
  { lat: 35.01, lng: 135.77, w: 0.15 }, // Kyoto
  { lat: 43.06, lng: 141.35, w: 0.15 }, // Sapporo
  { lat: 33.59, lng: 130.4, w: 0.15 }, // Fukuoka
  { lat: 37.57, lng: 126.98, w: 0.25 }, // Seoul
  { lat: 35.18, lng: 129.08, w: 0.15 }, // Busan
  { lat: 39.9, lng: 116.4, w: 0.3 }, // Beijing
  { lat: 31.23, lng: 121.47, w: 0.3 }, // Shanghai
  { lat: 23.13, lng: 113.26, w: 0.25 }, // Guangzhou
  { lat: 22.54, lng: 114.06, w: 0.2 }, // Shenzhen
  { lat: 30.57, lng: 104.07, w: 0.2 }, // Chengdu
  { lat: 22.28, lng: 114.16, w: 0.12 }, // Hong Kong
  { lat: 25.03, lng: 121.57, w: 0.15 }, // Taipei
  { lat: 1.35, lng: 103.82, w: 0.15 }, // Singapore
  { lat: 3.14, lng: 101.69, w: 0.2 }, // KL
  { lat: 13.76, lng: 100.5, w: 0.25 }, // Bangkok
  { lat: 18.79, lng: 98.99, w: 0.12 }, // Chiang Mai
  { lat: 10.82, lng: 106.63, w: 0.2 }, // HCMC
  { lat: 21.03, lng: 105.85, w: 0.15 }, // Hanoi
  { lat: 14.6, lng: 120.98, w: 0.2 }, // Manila
  { lat: -6.21, lng: 106.85, w: 0.25 }, // Jakarta
  { lat: -8.67, lng: 115.21, w: 0.15 }, // Denpasar
  { lat: -7.8, lng: 110.36, w: 0.15 }, // Yogyakarta
  { lat: 19.08, lng: 72.88, w: 0.25 }, // Mumbai
  { lat: 28.61, lng: 77.21, w: 0.25 }, // Delhi
  { lat: 12.97, lng: 77.59, w: 0.2 }, // Bangalore
  { lat: 22.57, lng: 88.36, w: 0.2 }, // Kolkata
  { lat: 13.08, lng: 80.27, w: 0.2 }, // Chennai
  { lat: 18.52, lng: 73.86, w: 0.15 }, // Pune
  { lat: 26.91, lng: 75.79, w: 0.15 }, // Jaipur
  { lat: 27.72, lng: 85.32, w: 0.12 }, // Kathmandu
  { lat: 23.81, lng: 90.41, w: 0.15 }, // Dhaka
  { lat: 6.93, lng: 79.85, w: 0.12 }, // Colombo
  { lat: 33.68, lng: 73.05, w: 0.15 }, // Islamabad
  { lat: 24.86, lng: 67.0, w: 0.2 }, // Karachi
  { lat: 41.3, lng: 69.24, w: 0.15 }, // Tashkent
  { lat: 43.24, lng: 76.91, w: 0.15 }, // Almaty
  { lat: 41.31, lng: 69.28, w: 0.1 },
  { lat: 55.0, lng: 82.9, w: 0.15 }, // Novosibirsk
  { lat: 56.84, lng: 60.6, w: 0.12 }, // Yekaterinburg
  // Oceania
  { lat: -33.87, lng: 151.21, w: 0.25 }, // Sydney
  { lat: -37.81, lng: 144.96, w: 0.25 }, // Melbourne
  { lat: -27.47, lng: 153.03, w: 0.2 }, // Brisbane
  { lat: -31.95, lng: 115.86, w: 0.2 }, // Perth
  { lat: -34.93, lng: 138.6, w: 0.15 }, // Adelaide
  { lat: -42.88, lng: 147.33, w: 0.1 }, // Hobart
  { lat: -36.85, lng: 174.76, w: 0.15 }, // Auckland
  { lat: -41.29, lng: 174.78, w: 0.12 }, // Wellington
  { lat: -45.03, lng: 168.66, w: 0.1 }, // Queenstown
  { lat: -17.71, lng: 178.07, w: 0.1 }, // Fiji-ish
]

/** @type {Set<string>} */
const usedKeys = new Set()
let usedLoaded = false

function fingerprint(lat, lng) {
  // ~110m grid — same street corner won't reappear
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
    // Cap memory — keep most recent ~8000 fingerprints
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

function randHubPoint() {
  const hub = HUBS[randomInt(0, HUBS.length)]
  const jitter = hub.w * (0.35 + Math.random() * 0.65)
  const lat = hub.lat + (Math.random() * 2 - 1) * jitter
  const lng = hub.lng + (Math.random() * 2 - 1) * jitter * 1.2
  return {
    lat: Math.max(-85, Math.min(85, lat)),
    lng: ((lng + 540) % 360) - 180,
  }
}

async function streetViewMeta(lat, lng, apiKey) {
  if (!apiKey) return null
  const url = new URL('https://maps.googleapis.com/maps/api/streetview/metadata')
  url.searchParams.set('location', `${lat},${lng}`)
  url.searchParams.set('source', 'outdoor')
  url.searchParams.set('radius', '5000')
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

/**
 * Pick `count` unique worldwide places. Never reuses a recent fingerprint.
 * @param {number} count
 * @param {string} apiKey
 */
export async function pickGlobalPlaces(count, apiKey = '') {
  await loadUsed()
  const picks = []
  const sessionKeys = new Set()
  const maxAttempts = count * 40

  for (let attempt = 0; attempt < maxAttempts && picks.length < count; attempt++) {
    const seed = randHubPoint()
    let lat = seed.lat
    let lng = seed.lng
    let panoId = ''

    if (apiKey) {
      const meta = await streetViewMeta(seed.lat, seed.lng, apiKey)
      if (!meta) continue
      lat = meta.lat
      lng = meta.lng
      panoId = meta.panoId
    }

    const key = panoId ? `p:${panoId}` : fingerprint(lat, lng)
    if (usedKeys.has(key) || sessionKeys.has(key)) continue
    // Also block near-duplicates by grid even when we have pano
    const grid = fingerprint(lat, lng)
    if (usedKeys.has(grid) || sessionKeys.has(grid)) continue

    const geo = await reverseGeocode(lat, lng)
    // Skip ocean / empty reverse results when possible
    if (!geo.country || geo.country === 'Unknown') {
      if (apiKey) continue
    }

    sessionKeys.add(key)
    sessionKeys.add(grid)
    usedKeys.add(key)
    usedKeys.add(grid)

    picks.push({
      id: `rnd-${randomBytes(8).toString('hex')}`,
      lat,
      lng,
      country: geo.country,
      city: geo.city,
      code: '',
      biome: 'global-random',
      hint: '',
    })

    // Be kind to Nominatim rate limits
    await new Promise((r) => setTimeout(r, 200))
  }

  // If we somehow couldn't fill (API issues), pad with unused hub centers
  while (picks.length < count) {
    const hub = HUBS[randomInt(0, HUBS.length)]
    const grid = fingerprint(hub.lat, hub.lng)
    if (sessionKeys.has(grid)) {
      // tiny nudge
      const lat = hub.lat + (Math.random() - 0.5) * 0.08
      const lng = hub.lng + (Math.random() - 0.5) * 0.08
      const g2 = fingerprint(lat, lng)
      if (sessionKeys.has(g2)) continue
      sessionKeys.add(g2)
      usedKeys.add(g2)
      const geo = await reverseGeocode(lat, lng)
      picks.push({
        id: `rnd-${randomBytes(8).toString('hex')}`,
        lat,
        lng,
        country: geo.country || 'Unknown',
        city: geo.city || '',
        code: '',
        biome: 'global-random',
        hint: '',
      })
      await new Promise((r) => setTimeout(r, 150))
      continue
    }
    sessionKeys.add(grid)
    usedKeys.add(grid)
    const geo = await reverseGeocode(hub.lat, hub.lng)
    picks.push({
      id: `rnd-${randomBytes(8).toString('hex')}`,
      lat: hub.lat,
      lng: hub.lng,
      country: geo.country || 'Unknown',
      city: geo.city || '',
      code: '',
      biome: 'global-random',
      hint: '',
    })
    await new Promise((r) => setTimeout(r, 150))
  }

  void persistUsed()
  return picks
}
