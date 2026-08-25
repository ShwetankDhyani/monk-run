import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { pickGlobalPlaces, enrichPlace } from './randomPlaces.mjs'

/** @type {Map<string, object>} */
const sessions = new Map()

/** @type {Map<string, { lat: number, lng: number, panoId: string, expiresAt: number }>} */
const viewTokens = new Map()

const SESSION_TTL_MS = 2 * 60 * 60 * 1000
const VIEW_TTL_MS = 100 * 60 * 1000

/** Never fall back to the Maps key — that would mint forgeable leaderboard tokens. */
function SCORE_SECRET() {
  const s = String(process.env.MONK_SCORE_SECRET || '').trim()
  if (s && s !== 'change-me-to-a-long-random-string') return s
  if (process.env.NODE_ENV === 'production') {
    throw new Error('MONK_SCORE_SECRET is required in production')
  }
  return 'monk-dev-score-secret-local-only'
}

function purgeExpired() {
  const now = Date.now()
  for (const [id, s] of sessions) {
    if (now - s.createdAt > SESSION_TTL_MS) sessions.delete(id)
  }
  for (const [tok, v] of viewTokens) {
    if (now > v.expiresAt) viewTokens.delete(tok)
  }
}

function mintViewToken(loc) {
  const payload = {
    lat: Number(loc.lat),
    lng: Number(loc.lng),
    panoId: String(loc.panoId || '').slice(0, 128),
    exp: Date.now() + VIEW_TTL_MS,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', SCORE_SECRET()).update(body).digest('base64url')
  const viewToken = `${body}.${sig}`
  // Legacy map — helps local dev / warm instances; not required on Vercel.
  viewTokens.set(viewToken, {
    lat: payload.lat,
    lng: payload.lng,
    panoId: payload.panoId,
    expiresAt: payload.exp,
  })
  return viewToken
}

function parseViewToken(token) {
  const t = String(token || '').trim()
  if (!t) return null

  // Stateless signed token (works across Vercel serverless instances).
  const dot = t.indexOf('.')
  if (dot > 0) {
    const body = t.slice(0, dot)
    const sig = t.slice(dot + 1)
    if (!body || !sig) return null
    const expected = createHmac('sha256', SCORE_SECRET()).update(body).digest('base64url')
    if (!safeEqual(sig, expected)) return null
    try {
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
      if (!payload?.exp || Date.now() > Number(payload.exp)) return null
      const lat = Number(payload.lat)
      const lng = Number(payload.lng)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
      return {
        lat,
        lng,
        panoId: String(payload.panoId || ''),
      }
    } catch {
      return null
    }
  }

  // Legacy hex tokens (same-instance only).
  purgeExpired()
  const v = viewTokens.get(t)
  if (!v || Date.now() > v.expiresAt) return null
  return v
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}

function scoreFromDistanceKm(km) {
  if (!Number.isFinite(km) || km < 0) return 0
  if (km < 0.025) return 5000
  return Math.max(0, Math.min(5000, Math.round(5000 * Math.exp(-km / 2000))))
}

export function signLeaderboardCommit(sessionId, playerId, score) {
  return createHmac('sha256', SCORE_SECRET())
    .update(`${sessionId}:${playerId}:${Math.round(score)}`)
    .digest('hex')
}

export function verifyLeaderboardCommit(sessionId, playerId, score, token) {
  const expected = signLeaderboardCommit(sessionId, playerId, score)
  return safeEqual(expected, token)
}

/**
 * @param {string} roomCode
 * @param {number} rounds
 * @param {string} [mapsKey]
 */
export async function createGameSession(roomCode, rounds = 5, mapsKey = '') {
  purgeExpired()
  const picks = await pickGlobalPlaces(rounds, mapsKey)
  const sessionId = randomBytes(16).toString('hex')
  const hostToken = randomBytes(24).toString('hex')
  const locationIds = picks.map((l) => l.id)
  const roundTokens = picks.map((loc) => mintViewToken(loc))
  sessions.set(sessionId, {
    roomCode: String(roomCode || '').slice(0, 8),
    hostToken,
    locations: picks,
    locationIds,
    roundTokens,
    revealed: new Set(),
    /** @type {Map<number, object>} */
    roundSnapshots: new Map(),
    totals: /** @type {Record<string, number>} */ ({}),
    /** Best / worst guess distance (km) per player across revealed rounds */
    kmStats: /** @type {Record<string, { closestKm: number|null, farthestKm: number|null }>} */ ({}),
    /** Player ids that already posted to the all-time board this session */
    consumedCommits: new Set(),
    createdAt: Date.now(),
  })
  return {
    sessionId,
    hostToken,
    totalRounds: picks.length,
    locationIds,
  }
}

export function openRoundView(sessionId, roundIndex) {
  purgeExpired()
  const session = sessions.get(sessionId)
  if (!session) return null
  const loc = session.locations?.[roundIndex]
  if (!loc) return null

  let viewToken = session.roundTokens?.[roundIndex]
  if (!viewToken || !parseViewToken(viewToken)) {
    viewToken = mintViewToken(loc)
    if (!session.roundTokens) session.roundTokens = []
    session.roundTokens[roundIndex] = viewToken
  }
  return { viewToken, locationId: loc.id }
}

export function getViewForToken(token) {
  return parseViewToken(token)
}

function assertHost(sessionId, hostToken) {
  const session = sessions.get(sessionId)
  if (!session || !hostToken || !safeEqual(session.hostToken, hostToken)) return null
  return session
}

/** Host-only truth (never expose without hostToken). */
export async function getEnrichedLocationForHost(sessionId, roundIndex, hostToken) {
  const session = assertHost(sessionId, hostToken)
  if (!session) return null
  const loc = session.locations?.[roundIndex]
  if (!loc) return null
  return enrichPlace(loc)
}

/**
 * Server-authoritative reveal — host submits guesses, server returns scores + truth.
 * Idempotent per round: a second call returns the same snapshot and does not re-add totals.
 * @param {string} sessionId
 * @param {string} hostToken
 * @param {number} roundIndex
 * @param {{ playerId: string, name?: string, avatar?: string, lat: number|null, lng: number|null, country?: string }[]} guesses
 */
export async function scoreRound(sessionId, hostToken, roundIndex, guesses) {
  const session = assertHost(sessionId, hostToken)
  if (!session) return null
  const loc = session.locations?.[roundIndex]
  if (!loc) return null

  // Fairness: never double-count if the host retried / raced reveal.
  if (session.revealed.has(roundIndex) && session.roundSnapshots?.has(roundIndex)) {
    return session.roundSnapshots.get(roundIndex)
  }

  const truthLoc = await enrichPlace(loc)
  const list = Array.isArray(guesses) ? guesses : []
  const results = list.map((g) => {
    const playerId = String(g.playerId || '').slice(0, 64)
    const lat = Number(g.lat)
    const lng = Number(g.lng)
    const missed = !Number.isFinite(lat) || !Number.isFinite(lng)
    const km = missed ? null : haversineKm({ lat, lng }, { lat: truthLoc.lat, lng: truthLoc.lng })
    const score = missed ? 0 : scoreFromDistanceKm(km)
    session.totals[playerId] = (session.totals[playerId] || 0) + score
    if (Number.isFinite(km)) {
      if (!session.kmStats) session.kmStats = {}
      const prev = session.kmStats[playerId] || { closestKm: null, farthestKm: null }
      if (prev.closestKm == null || km < prev.closestKm) prev.closestKm = km
      if (prev.farthestKm == null || km > prev.farthestKm) prev.farthestKm = km
      session.kmStats[playerId] = prev
    }
    return {
      playerId,
      name: String(g.name || '').slice(0, 24),
      avatar: String(g.avatar || '').slice(0, 32),
      lat: missed ? null : lat,
      lng: missed ? null : lng,
      country: String(g.country || '').slice(0, 64),
      km,
      score,
      missed,
      total: session.totals[playerId],
      commitToken: signLeaderboardCommit(sessionId, playerId, session.totals[playerId]),
    }
  })
  // Round rank: higher score, then closer km, then playerId (stable).
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const ak = a.km == null ? Infinity : a.km
    const bk = b.km == null ? Infinity : b.km
    if (ak !== bk) return ak - bk
    return String(a.playerId).localeCompare(String(b.playerId))
  })
  session.revealed.add(roundIndex)

  const snapshot = {
    truth: {
      id: truthLoc.id,
      lat: truthLoc.lat,
      lng: truthLoc.lng,
      country: truthLoc.country,
      city: truthLoc.city,
    },
    results,
    totals: { ...session.totals },
  }
  if (!session.roundSnapshots) session.roundSnapshots = new Map()
  session.roundSnapshots.set(roundIndex, snapshot)
  return snapshot
}

/**
 * Verify + consume a one-shot leaderboard commit for this session.
 * Score must match the server's cumulative total for that player.
 * Returns match stats (including server-tracked closest/farthest km) or null.
 */
export function consumeLeaderboardCommit(sessionId, playerId, score, token) {
  const session = sessions.get(sessionId)
  if (!session) return null
  const pid = String(playerId || '')
  if (!pid || !token) return null
  if (!(pid in (session.totals || {}))) return null
  const expectedScore = Math.round(session.totals[pid] || 0)
  if (Math.round(score) !== expectedScore) return null
  if (!verifyLeaderboardCommit(sessionId, pid, expectedScore, token)) return null
  if (!session.consumedCommits) session.consumedCommits = new Set()
  if (session.consumedCommits.has(pid)) return null
  session.consumedCommits.add(pid)
  const km = session.kmStats?.[pid] || {}
  return {
    score: expectedScore,
    closestKm: Number.isFinite(km.closestKm) ? km.closestKm : null,
    farthestKm: Number.isFinite(km.farthestKm) ? km.farthestKm : null,
  }
}

export { haversineKm, scoreFromDistanceKm }

function streetViewEmbedSrc(panoId, latS, lngS, heading) {
  return panoId
    ? `https://www.google.com/maps?layer=c&panoid=${encodeURIComponent(panoId)}&cbp=12,${heading},0,0,0&hl=en&output=svembed`
    : `https://www.google.com/maps?layer=c&cbll=${latS},${lngS}&cbp=12,${heading},0,0,0&hl=en&output=svembed`
}

/** Direct Google embed URL — one iframe hop for reliable mobile touch panning. */
export function buildStreetViewEmbedUrl(view, heading = Math.floor(Math.random() * 360)) {
  const panoId = String(view.panoId || '').replace(/[^A-Za-z0-9_-]/g, '')
  const latS = Number(view.lat).toFixed(6)
  const lngS = Number(view.lng).toFixed(6)
  return streetViewEmbedSrc(panoId, latS, lngS, heading)
}

export function streetViewEmbedHtml(embedSrc) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="referrer" content="no-referrer" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://www.google.com https://maps.google.com https://maps.gstatic.com; frame-src https://www.google.com https://maps.google.com; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; object-src 'none';" />
  <style>
    html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#06080e}
    .wrap{position:relative;width:100%;height:100%;overflow:hidden;background:#06080e}
    iframe{border:0;width:100%;height:100%;display:block}
    .shield-top{position:absolute;inset:0 0 auto 0;height:48px;background:linear-gradient(180deg,rgba(6,8,14,0.95) 0%,transparent 100%);pointer-events:none;z-index:2}
  </style>
</head>
<body oncontextmenu="return false">
  <div class="wrap">
    <iframe id="sv" title="Round view" referrerpolicy="no-referrer" allow="accelerometer; gyroscope; magnetometer; fullscreen" src="${embedSrc}"></iframe>
    <div class="shield-top" aria-hidden="true"></div>
  </div>
</body>
</html>`
}

/**
 * Street View HTML — prefer panorama id so raw lat/lng are not in the document.
 *
 * Maps JavaScript API needs a valid first-party key (billing + Maps JS API enabled).
 * Invalid/restricted keys show Google's "Something went wrong" page — so demo mode
 * (scrape allowed) uses the public svembed iframe instead.
 */
export function renderStreetViewHtml(view, apiKey = '', forceEmbedFallback = true) {
  const panoId = String(view.panoId || '').replace(/[^A-Za-z0-9_-]/g, '')
  const latS = Number(view.lat).toFixed(6)
  const lngS = Number(view.lng).toFixed(6)
  const heading = Math.floor(Math.random() * 360)
  const embedSrc = buildStreetViewEmbedUrl(view, heading)

  if (!apiKey) {
    return streetViewEmbedHtml(embedSrc)
  }

  const authFallback = forceEmbedFallback
    ? `
    var __embedFallback = ${JSON.stringify(embedSrc)};
    window.gm_authFailure = function() { location.replace(__embedFallback); };
    function __fallbackToEmbed() { location.replace(__embedFallback); }
    setTimeout(function() {
      var pano = document.getElementById('pano');
      if (!pano || pano.querySelector('canvas, img') == null) __fallbackToEmbed();
    }, 5000);`
    : ''

  if (panoId) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="referrer" content="no-referrer" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://maps.googleapis.com https://maps.gstatic.com https://www.google.com https://maps.google.com; script-src 'self' 'unsafe-inline' https://maps.googleapis.com; style-src 'self' 'unsafe-inline'; img-src https://maps.gstatic.com https://maps.googleapis.com data:; connect-src https://maps.googleapis.com; frame-src https://www.google.com https://maps.google.com; object-src 'none';" />
  <style>html,body,#pano{margin:0;width:100%;height:100%;overflow:hidden;background:#06080e}#pano{position:absolute;inset:0}.shield-top{position:absolute;inset:0 0 auto 0;height:48px;background:linear-gradient(180deg,rgba(6,8,14,0.95) 0%,transparent 100%);pointer-events:none;z-index:2}</style>
</head>
<body oncontextmenu="return false">
  <div id="pano"></div>
  <div class="shield-top" aria-hidden="true"></div>
  <script>
    ${authFallback}
    function init() {
      var pano = new google.maps.StreetViewPanorama(document.getElementById('pano'), {
        pano: ${JSON.stringify(panoId)},
        pov: { heading: ${heading}, pitch: 0 },
        zoom: 1,
        addressControl: false,
        linksControl: true,
        panControl: false,
        zoomControl: true,
        fullscreenControl: false,
        motionTracking: true,
        motionTrackingControl: true,
        enableCloseButton: false,
        showRoadLabels: false,
        clickToGo: true,
        scrollwheel: true,
        gestureHandling: 'greedy',
      });
    }
  </script>
  <script async defer src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=init"></script>
</body>
</html>`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="referrer" content="no-referrer" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://maps.googleapis.com https://maps.gstatic.com https://www.google.com https://maps.google.com; script-src 'self' 'unsafe-inline' https://maps.googleapis.com; style-src 'self' 'unsafe-inline'; img-src https://maps.gstatic.com https://maps.googleapis.com data:; connect-src https://maps.googleapis.com; frame-src https://www.google.com https://maps.google.com; object-src 'none';" />
  <style>html,body,#pano{margin:0;width:100%;height:100%;overflow:hidden;background:#06080e}#pano{position:absolute;inset:0}.shield-top{position:absolute;inset:0 0 auto 0;height:48px;background:linear-gradient(180deg,rgba(6,8,14,0.95) 0%,transparent 100%);pointer-events:none;z-index:2}</style>
</head>
<body oncontextmenu="return false">
  <div id="pano"></div>
  <div class="shield-top" aria-hidden="true"></div>
  <script>
    ${authFallback}
    function init() {
      var pano = new google.maps.StreetViewPanorama(document.getElementById('pano'), {
        position: { lat: ${latS}, lng: ${lngS} },
        pov: { heading: ${heading}, pitch: 0 },
        zoom: 1,
        addressControl: false,
        linksControl: true,
        panControl: false,
        zoomControl: true,
        fullscreenControl: false,
        motionTracking: true,
        motionTrackingControl: true,
        enableCloseButton: false,
        showRoadLabels: false,
        clickToGo: true,
        scrollwheel: true,
        gestureHandling: 'greedy',
      });
      var svc = new google.maps.StreetViewService();
      svc.getPanorama({ location: { lat: ${latS}, lng: ${lngS} }, radius: 5000, preference: google.maps.StreetViewPreference.NEAREST }, function(data, status) {
        if (status === 'OK' && data && data.location && data.location.pano) {
          pano.setPano(data.location.pano);
          pano.setVisible(true);
        }
      });
    }
  </script>
  <script async defer src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=init"></script>
</body>
</html>`
}

export function sendHtml(res, status, html) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'no-referrer',
  })
  res.end(html)
}

export function mapsConfigured() {
  // Demo scrape is on unless explicitly disabled with ALLOW_MAPS_KEY_SCRAPE=0
  if (process.env.ALLOW_MAPS_KEY_SCRAPE !== '0') return true
  return Boolean(
    String(process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '').trim(),
  )
}
