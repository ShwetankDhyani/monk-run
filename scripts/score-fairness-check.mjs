/**
 * Fairness smoke checks: client/server score math parity + one-shot commits.
 * Run: node scripts/score-fairness-check.mjs
 */
import assert from 'node:assert/strict'
import {
  haversineKm,
  scoreFromDistanceKm,
  signLeaderboardCommit,
  verifyLeaderboardCommit,
  consumeLeaderboardCommit,
  createGameSession,
  scoreRound,
} from '../server/game.mjs'
import { haversineKm as clientHaversine, scoreFromDistanceKm as clientScore } from '../src/lib/scoring.js'

const samples = [0, 0.01, 0.024, 0.025, 1, 100, 500, 2000, 10000]
for (const km of samples) {
  assert.equal(scoreFromDistanceKm(km), clientScore(km), `score mismatch at ${km}km`)
}

const nyc = { lat: 40.7128, lng: -74.006 }
const lon = { lat: 51.5074, lng: -0.1278 }
assert.ok(Math.abs(haversineKm(nyc, lon) - clientHaversine(nyc, lon)) < 0.001, 'haversine drift')

const tok = signLeaderboardCommit('sess', 'p1', 1234)
assert.equal(verifyLeaderboardCommit('sess', 'p1', 1234, tok), true)
assert.equal(verifyLeaderboardCommit('sess', 'p1', 9999, tok), false)

const mapsKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || ''
if (!mapsKey && process.env.ALLOW_MAPS_KEY_SCRAPE !== '1') {
  console.log('score formula parity: ok (skipping live session checks — no Maps key)')
  process.exit(0)
}

const session = await createGameSession('TEST01', 1, mapsKey)
const guesses = [
  { playerId: 'p1', name: 'A', lat: 40.71, lng: -74.0, country: 'US' },
  { playerId: 'p2', name: 'B', lat: null, lng: null, country: '' },
]
const first = await scoreRound(session.sessionId, session.hostToken, 0, guesses)
assert.ok(first, 'first scoreRound failed')
const second = await scoreRound(session.sessionId, session.hostToken, 0, guesses)
assert.deepEqual(first.totals, second.totals, 'double reveal must not re-add totals')

const p1 = first.results.find((r) => r.playerId === 'p1')
assert.ok(verifyLeaderboardCommit(session.sessionId, 'p1', p1.total, p1.commitToken))
assert.equal(consumeLeaderboardCommit(session.sessionId, 'p1', p1.total, p1.commitToken), true)
assert.equal(consumeLeaderboardCommit(session.sessionId, 'p1', p1.total, p1.commitToken), false)

console.log('score fairness checks: ok')
