const EARTH_RADIUS_KM = 6371

export function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** 5000 at 0km, asymptotic toward 0 past ~10,000km. */
export function scoreFromDistanceKm(km) {
  if (!Number.isFinite(km) || km < 0) return 0
  if (km < 0.025) return 5000
  return Math.max(0, Math.min(5000, Math.round(5000 * Math.exp(-km / 2000))))
}

export function gradeFromScore(score) {
  if (score >= 4800) return 'ENLIGHTENED'
  if (score >= 4000) return 'AWAKENED'
  if (score >= 2500) return 'SEEKING'
  if (score >= 1000) return 'LOST'
  return 'DISSOLVED'
}

export function formatKm(km) {
  if (km == null || !Number.isFinite(km)) return '—'
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 100) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

/** 6-digit room PIN (e.g. "482913"). */
export function makeRoomCode() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000
  return String(n).padStart(6, '0')
}

export function normalizeRoomPin(raw) {
  return String(raw || '').replace(/\D/g, '').slice(0, 6)
}
