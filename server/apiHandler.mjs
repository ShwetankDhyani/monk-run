import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from './loadEnv.mjs'
import {
  createGameSession,
  openRoundView,
  getViewForToken,
  scoreRound,
  renderStreetViewHtml,
  sendHtml,
  mapsConfigured,
  consumeLeaderboardCommit,
} from './game.mjs'
import { probeConfiguredMapsKey } from './randomPlaces.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnvFile(join(__dirname, '..', '.env'))

// On Vercel the deploy FS is read-only — persist board under /tmp when needed.
const DATA_DIR = process.env.VERCEL
  ? join('/tmp', 'monk-run-data')
  : join(__dirname, '..', 'data')
const DATA_FILE = join(DATA_DIR, 'leaderboard.json')
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
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Host-Token',
  })
  res.end(JSON.stringify(body))
}

function readBody(req, limit = 64_000) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > limit) reject(new Error('too large'))
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}


/**
 * Shared HTTP API for local Node server and Vercel serverless.
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
export async function handleApi(req, res) {

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {})
    return
  }

  const url = req.url?.split('?')[0]

  if (req.method === 'GET' && url === '/api/health') {
    const mapsKey = await probeConfiguredMapsKey()
    sendJson(res, 200, {
      ok: true,
      service: 'monk.run',
      mapsConfigured: mapsConfigured(),
      mapsKey,
      uptimeSec: Math.round(process.uptime()),
    })
    return
  }

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
      const sessionId = String(body.sessionId || '')
      const playerId = String(body.playerId || '')
      const commitToken = String(body.commitToken || '')

      if (score <= 0) {
        sendJson(res, 400, { error: 'Score must be positive' })
        return
      }
      // Reject forged / reused scores — one-shot commit matching server totals
      if (
        !sessionId ||
        !playerId ||
        !commitToken ||
        !consumeLeaderboardCommit(sessionId, playerId, score, commitToken)
      ) {
        sendJson(res, 403, { error: 'Score not verified' })
        return
      }

      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        score,
        avatarId: String(body.avatarId || 'aot-eren').slice(0, 32),
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

  if (req.method === 'GET' && url === '/api/geocode') {
    try {
      const q = new URL(req.url, 'http://localhost').searchParams.get('q')?.trim()
      if (!q || q.length < 2) {
        sendJson(res, 400, { error: 'Query too short' })
        return
      }
      const geoUrl = new URL('https://nominatim.openstreetmap.org/search')
      geoUrl.searchParams.set('q', q)
      geoUrl.searchParams.set('format', 'json')
      geoUrl.searchParams.set('limit', '5')
      geoUrl.searchParams.set('addressdetails', '1')
      const geoRes = await fetch(geoUrl.toString(), {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'monk.run/1.0 (https://monk.run; party geography game)',
        },
      })
      if (!geoRes.ok) {
        sendJson(res, 502, { error: 'Geocoder unavailable' })
        return
      }
      const hits = await geoRes.json()
      const hit = hits?.[0]
      if (!hit) {
        sendJson(res, 404, { error: 'Place not found' })
        return
      }
      sendJson(res, 200, {
        lat: parseFloat(hit.lat),
        lng: parseFloat(hit.lon),
        label: hit.display_name,
        country: hit.address?.country || '',
        results: (hits || []).slice(0, 5).map((h) => ({
          lat: parseFloat(h.lat),
          lng: parseFloat(h.lon),
          label: h.display_name,
          country: h.address?.country || '',
        })),
      })
    } catch {
      sendJson(res, 500, { error: 'Geocode failed' })
    }
    return
  }

  if (req.method === 'POST' && url === '/api/game/session') {
    try {
      if (!mapsConfigured() && !MAPS_KEY) {
        sendJson(res, 503, {
          error: 'Street View is not configured. Add GOOGLE_MAPS_API_KEY to the server environment.',
        })
        return
      }
      const raw = await readBody(req)
      const body = JSON.parse(raw || '{}')
      const roomCode = String(body.roomCode || body.roomPin || '')
      const rounds = Math.max(1, Math.min(10, Math.round(Number(body.rounds) || 5)))
      const session = await createGameSession(roomCode, rounds, MAPS_KEY)
      sendJson(res, 201, session)
    } catch (err) {
      console.error('[game/session]', err)
      const msg = err?.message || 'Could not create game session'
      const denied = /Maps key rejected|REQUEST_DENIED|API key is invalid/i.test(msg)
      sendJson(res, denied ? 503 : 500, { error: msg })
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

  // Public truth endpoint removed — use host-authenticated /reveal
  const roundReveal = url?.match(/^\/api\/game\/session\/([a-f0-9]+)\/round\/(\d+)\/reveal$/)
  if (req.method === 'POST' && roundReveal) {
    try {
      const [, sessionId, roundIdx] = roundReveal
      const raw = await readBody(req)
      const body = JSON.parse(raw || '{}')
      const hostToken = String(body.hostToken || req.headers['x-host-token'] || '')
      const scored = await scoreRound(sessionId, hostToken, Number(roundIdx), body.guesses || [])
      if (!scored) {
        sendJson(res, 403, { error: 'Unauthorized or unknown round' })
        return
      }
      sendJson(res, 200, scored)
    } catch (err) {
      console.error('[game/reveal]', err)
      sendJson(res, 500, { error: 'Reveal failed' })
    }
    return
  }

  // Legacy truth path: closed (anti-cheat)
  const roundTruth = url?.match(/^\/api\/game\/session\/([a-f0-9]+)\/round\/(\d+)\/truth$/)
  if (req.method === 'GET' && roundTruth) {
    sendJson(res, 403, { error: 'Truth requires host reveal' })
    return
  }

  const svMatch = url?.match(/^\/api\/game\/sv\/([a-f0-9]+)$/)
  if (req.method === 'GET' && svMatch) {
    const view = getViewForToken(svMatch[1])
    if (!view) {
      sendHtml(
        res,
        410,
        '<!DOCTYPE html><body style="background:#0b1220;color:#94a3b8;font-family:monospace;display:grid;place-items:center;height:100vh;margin:0">Round view expired</body>',
      )
      return
    }
    sendHtml(res, 200, renderStreetViewHtml(view, MAPS_KEY))
    return
  }


  const staticDir = process.env.VERCEL ? null : process.env.STATIC_DIR
  if (staticDir && req.method === 'GET') {
    try {
      const { createReadStream, existsSync, statSync } = await import('node:fs')
      const { join, extname } = await import('node:path')
      let rel = decodeURIComponent(url || '/')
      if (rel === '/') rel = '/index.html'
      const file = join(staticDir, rel.replace(/\\/g, '/').replace(/^\/+/, ''))
      if (file.startsWith(staticDir) && existsSync(file) && statSync(file).isFile()) {
        const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon', '.woff2': 'font/woff2' }
        res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': rel === '/index.html' ? 'no-store' : 'public, max-age=86400' })
        createReadStream(file).pipe(res)
        return
      }
      const fallback = join(staticDir, 'index.html')
      if (existsSync(fallback) && !rel.startsWith('/api')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
        createReadStream(fallback).pipe(res)
        return
      }
    } catch (e) {
      console.error('[static]', e)
    }
  }

  sendJson(res, 404, { error: 'Not found' })

}
