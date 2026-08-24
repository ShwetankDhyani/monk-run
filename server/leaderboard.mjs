import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createGameSession,
  openRoundView,
  getViewForToken,
  getLocationForSessionRound,
  renderStreetViewHtml,
  sendHtml,
} from './game.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const DATA_FILE = join(DATA_DIR, 'leaderboard.json')
const PORT = Number(process.env.LEADERBOARD_PORT || 47448)
const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || ''
const MAX_ENTRIES = 10

async function loadEntries() {
  try {
    if (!existsSync(DATA_FILE)) return []
    const raw = await readFile(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function saveEntries(entries) {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true })
  await writeFile(DATA_FILE, JSON.stringify(entries, null, 2))
}

function topEntries(entries) {
  return [...entries]
    .sort((a, b) => b.score - a.score || b.at - a.at)
    .slice(0, MAX_ENTRIES)
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > 4096) reject(new Error('too large'))
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {})
    return
  }

  const url = req.url?.split('?')[0]

  if (req.method === 'GET' && url === '/api/leaderboard') {
    const entries = await loadEntries()
    sendJson(res, 200, { entries: topEntries(entries) })
    return
  }

  if (req.method === 'POST' && url === '/api/leaderboard') {
    try {
      const raw = await readBody(req)
      const body = JSON.parse(raw || '{}')
      const name = String(body.name || 'Monk').trim().slice(0, 18) || 'Monk'
      const score = Math.max(0, Math.min(999_999, Math.round(Number(body.score) || 0)))
      if (score <= 0) {
        sendJson(res, 400, { error: 'Score must be positive' })
        return
      }
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        score,
        avatarId: String(body.avatarId || 'monk-male').slice(0, 32),
        roomCode: String(body.roomCode || '').slice(0, 8),
        at: Date.now(),
      }
      const entries = await loadEntries()
      entries.push(entry)
      const trimmed = topEntries(entries)
      await saveEntries(trimmed)
      sendJson(res, 201, { entry, entries: trimmed })
    } catch {
      sendJson(res, 400, { error: 'Invalid request' })
    }
    return
  }

  if (req.method === 'GET' && url === '/api/health') {
    sendJson(res, 200, { ok: true })
    return
  }

  // --- Game integrity: locations + Street View never sent to client as raw coords ---
  if (req.method === 'POST' && url === '/api/game/session') {
    try {
      const raw = await readBody(req)
      const body = JSON.parse(raw || '{}')
      const roomCode = String(body.roomCode || '')
      const rounds = Math.max(1, Math.min(10, Math.round(Number(body.rounds) || 5)))
      const session = createGameSession(roomCode, rounds)
      sendJson(res, 201, session)
    } catch {
      sendJson(res, 500, { error: 'Could not create game session' })
    }
    return
  }

  const roundOpen = url?.match(/^\/api\/game\/session\/([a-f0-9]+)\/round\/(\d+)$/)
  if (req.method === 'POST' && roundOpen) {
    const [, sessionId, roundIdx] = roundOpen
    const opened = openRoundView(sessionId, Number(roundIdx))
    if (!opened) {
      sendJson(res, 404, { error: 'Round not found' })
      return
    }
    sendJson(res, 200, { viewToken: opened.viewToken, locationId: opened.locationId })
    return
  }

  const roundTruth = url?.match(/^\/api\/game\/session\/([a-f0-9]+)\/round\/(\d+)\/truth$/)
  if (req.method === 'GET' && roundTruth) {
    const [, sessionId, roundIdx] = roundTruth
    const loc = getLocationForSessionRound(sessionId, Number(roundIdx))
    if (!loc) {
      sendJson(res, 404, { error: 'Not found' })
      return
    }
    sendJson(res, 200, {
      id: loc.id,
      lat: loc.lat,
      lng: loc.lng,
      country: loc.country,
      city: loc.city,
    })
    return
  }

  const svMatch = url?.match(/^\/api\/game\/sv\/([a-f0-9]+)$/)
  if (req.method === 'GET' && svMatch) {
    const view = getViewForToken(svMatch[1])
    if (!view) {
      sendHtml(res, 410, '<!DOCTYPE html><body style="background:#0b1220;color:#94a3b8;font-family:monospace;display:grid;place-items:center;height:100vh;margin:0">Round view expired</body>')
      return
    }
    sendHtml(res, 200, renderStreetViewHtml(view, MAPS_KEY))
    return
  }

  sendJson(res, 404, { error: 'Not found' })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`monk.run API (leaderboard + game integrity) on http://0.0.0.0:${PORT}`)
})
