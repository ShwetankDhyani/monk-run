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

/**
 * Rank players by round wins (desc), then cumulative km (asc), then id.
 * @param {{ id: string, score?: number, totalKm?: number }[]} players
 */
export function rankByDistanceWins(players) {
  return [...players].sort((a, b) => {
    const aw = Math.round(Number(a.score) || 0)
    const bw = Math.round(Number(b.score) || 0)
    if (bw !== aw) return bw - aw
    const ak = Number.isFinite(a.totalKm) ? a.totalKm : Infinity
    const bk = Number.isFinite(b.totalKm) ? b.totalKm : Infinity
    if (ak !== bk) return ak - bk
    return String(a.id).localeCompare(String(b.id))
  })
}

/** 6-digit room PIN (e.g. "482913"). */
export function makeRoomCode() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000
  return String(n).padStart(6, '0')
}

export function normalizeRoomPin(raw) {
  return String(raw || '').replace(/\D/g, '').slice(0, 6)
}
