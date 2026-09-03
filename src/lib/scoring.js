const EARTH_RADIUS_KM = 6371

/** Classic GeoGuessr-style curve: 5000 at ≤25m, then 5000 × e^(−km / 2000). */
export const SCORING_POINTS = 'points'
/** Closest pin wins the round; match = most round wins (km tiebreak). */
export const SCORING_DISTANCE = 'distance'

export const SCORING_MODES = [SCORING_DISTANCE, SCORING_POINTS]

export function normalizeScoringMode(raw) {
  const s = String(raw || '').trim().toLowerCase()
  if (s === SCORING_POINTS || s === 'score' || s === 'classic') return SCORING_POINTS
  return SCORING_DISTANCE
}

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

/** 5000 at ≤25m, then 5000 × e^(−km / 2000), clamped 0–5000. */
export function scoreFromDistanceKm(km) {
  if (!Number.isFinite(km) || km < 0) return 0
  if (km < 0.025) return 5000
  return Math.max(0, Math.min(5000, Math.round(5000 * Math.exp(-km / 2000))))
}

export function formatKm(km) {
  if (km == null || !Number.isFinite(km)) return '—'
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 100) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

/** Round-win standings label, e.g. "2W". */
export function formatWins(wins) {
  const n = Math.max(0, Math.round(Number(wins) || 0))
  return `${n}W`
}

export function formatMatchScore(value, scoringMode = SCORING_DISTANCE) {
  if (normalizeScoringMode(scoringMode) === SCORING_POINTS) {
    return String(Math.max(0, Math.round(Number(value) || 0)))
  }
  return formatWins(value)
}

/**
 * Rank players for the active scoring mode.
 * points: higher total score first
 * distance: more round wins first, then lower cumulative km
 */
export function rankPlayers(players, scoringMode = SCORING_DISTANCE) {
  const mode = normalizeScoringMode(scoringMode)
  return [...players].sort((a, b) => {
    const as = Math.round(Number(a.score) || 0)
    const bs = Math.round(Number(b.score) || 0)
    if (bs !== as) return bs - as
    if (mode === SCORING_DISTANCE) {
      const ak = Number.isFinite(a.totalKm) ? a.totalKm : Infinity
      const bk = Number.isFinite(b.totalKm) ? b.totalKm : Infinity
      if (ak !== bk) return ak - bk
    }
    return String(a.id).localeCompare(String(b.id))
  })
}

/** @deprecated use rankPlayers(SCORING_DISTANCE) */
export function rankByDistanceWins(players) {
  return rankPlayers(players, SCORING_DISTANCE)
}

/** 6-digit room PIN (e.g. "482913"). */
export function makeRoomCode() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000
  return String(n).padStart(6, '0')
}

export function normalizeRoomPin(raw) {
  return String(raw || '').replace(/\D/g, '').slice(0, 6)
}
