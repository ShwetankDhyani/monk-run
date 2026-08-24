import { randomBytes, randomInt } from 'node:crypto'
import { LOCATIONS, pickRoundLocations } from '../src/data/locations.js'

/** @type {Map<string, { roomCode: string, locationIds: string[], createdAt: number }>} */
const sessions = new Map()

/** @type {Map<string, { lat: number, lng: number, expiresAt: number, used: boolean }>} */
const viewTokens = new Map()

const SESSION_TTL_MS = 2 * 60 * 60 * 1000
const VIEW_TTL_MS = 100 * 60 * 1000

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
  const viewToken = randomBytes(24).toString('hex')
  viewTokens.set(viewToken, {
    lat: loc.lat,
    lng: loc.lng,
    expiresAt: Date.now() + VIEW_TTL_MS,
    used: false,
  })
  return viewToken
}

export function createGameSession(roomCode, rounds = 5) {
  purgeExpired()
  const seed = randomInt(1, 2147483646)
  const picks = pickRoundLocations(rounds, seed)
  const sessionId = randomBytes(16).toString('hex')
  const locationIds = picks.map((l) => l.id)
  const roundTokens = locationIds.map((locId) => {
    const loc = LOCATIONS.find((l) => l.id === locId)
    return loc ? mintViewToken(loc) : null
  })
  sessions.set(sessionId, {
    roomCode: String(roomCode || '').slice(0, 8),
    locationIds,
    roundTokens,
    createdAt: Date.now(),
  })
  return {
    sessionId,
    totalRounds: picks.length,
    locationIds,
  }
}

export function openRoundView(sessionId, roundIndex) {
  purgeExpired()
  const session = sessions.get(sessionId)
  if (!session) return null
  const locId = session.locationIds[roundIndex]
  const loc = LOCATIONS.find((l) => l.id === locId)
  if (!loc) return null

  let viewToken = session.roundTokens?.[roundIndex]
  if (!viewToken || !viewTokens.has(viewToken)) {
    viewToken = mintViewToken(loc)
    if (!session.roundTokens) session.roundTokens = []
    session.roundTokens[roundIndex] = viewToken
  }
  return { viewToken, locationId: locId }
}

export function getViewForToken(token) {
  purgeExpired()
  const v = viewTokens.get(token)
  if (!v || Date.now() > v.expiresAt) return null
  return v
}

export function getLocationForSessionRound(sessionId, roundIndex) {
  const session = sessions.get(sessionId)
  if (!session) return null
  const id = session.locationIds[roundIndex]
  return LOCATIONS.find((l) => l.id === id) || null
}

/** Locked-down Street View page — coordinates exist only server-side. */
export function renderStreetViewHtml({ lat, lng }, apiKey = '') {
  const latS = Number(lat).toFixed(6)
  const lngS = Number(lng).toFixed(6)

  if (apiKey) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="referrer" content="no-referrer" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://maps.googleapis.com https://maps.gstatic.com; script-src 'self' 'unsafe-inline' https://maps.googleapis.com; style-src 'self' 'unsafe-inline'; img-src https://maps.gstatic.com https://maps.googleapis.com data:; connect-src https://maps.googleapis.com; frame-src 'none'; object-src 'none';" />
  <style>html,body,#pano{margin:0;width:100%;height:100%;overflow:hidden;background:#0b1220}</style>
</head>
<body oncontextmenu="return false">
  <div id="pano"></div>
  <script>
    function init() {
      var pano = new google.maps.StreetViewPanorama(document.getElementById('pano'), {
        position: { lat: ${latS}, lng: ${lngS} },
        pov: { heading: 34, pitch: 0 },
        zoom: 1,
        addressControl: false,
        linksControl: false,
        panControl: false,
        zoomControl: false,
        fullscreenControl: false,
        motionTracking: false,
        motionTrackingControl: false,
        enableCloseButton: false,
        showRoadLabels: false,
        clickToGo: false,
        scrollwheel: true,
      });
      var svc = new google.maps.StreetViewService();
      svc.getPanorama({ location: { lat: ${latS}, lng: ${lngS} }, radius: 1200 }, function(data, status) {
        if (status === 'OK' && data && data.location && data.location.pano) {
          pano.setPano(data.location.pano);
          pano.setVisible(true);
        }
      });
      document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 's' || e.key === 'p')) e.preventDefault();
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
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://www.google.com https://maps.google.com https://maps.gstatic.com; frame-src https://www.google.com https://maps.google.com; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; object-src 'none';" />
  <style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#0b1220}iframe{border:0;width:100%;height:100%}</style>
</head>
<body oncontextmenu="return false">
  <iframe
    id="sv"
    title="Round view"
    referrerpolicy="no-referrer"
    allow="accelerometer; gyroscope"
    sandbox="allow-scripts allow-same-origin"
  ></iframe>
  <script>
    (function() {
      var lat = ${latS}, lng = ${lngS};
      document.getElementById('sv').src =
        'https://www.google.com/maps?layer=c&cbll=' + lat + ',' + lng + '&cbp=12,0,0,0,0&hl=en&output=svembed';
      document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 's' || e.key === 'p')) e.preventDefault();
      });
    })();
  </script>
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
