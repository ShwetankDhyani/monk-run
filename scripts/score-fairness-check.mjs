/**
 * Fairness smoke checks: distance round-wins + one-shot commits.
 * Run: node scripts/score-fairness-check.mjs
 */
import assert from 'node:assert/strict'
import {
  haversineKm,
  signLeaderboardCommit,
  verifyLeaderboardCommit,
  consumeLeaderboardCommit,
  createGameSession,
  scoreRound,
} from '../server/game.mjs'
import { haversineKm as clientHaversine, formatWins, rankByDistanceWins } from '../src/lib/scoring.js'

const nyc = { lat: 40.7128, lng: -74.006 }
const lon = { lat: 51.5074, lng: -0.1278 }
assert.ok(Math.abs(haversineKm(nyc, lon) - clientHaversine(nyc, lon)) < 0.001, 'haversine drift')
assert.equal(formatWins(2), '2W')

const ranked = rankByDistanceWins([
  { id: 'a', score: 1, totalKm: 900 },
  { id: 'b', score: 2, totalKm: 1200 },
  { id: 'c', score: 2, totalKm: 400 },
])
assert.deepEqual(
  ranked.map((p) => p.id),
  ['c', 'b', 'a'],
  'rank by wins then lower total km',
)

const tok = signLeaderboardCommit('sess', 'p1', 3)
assert.equal(verifyLeaderboardCommit('sess', 'p1', 3, tok), true)
assert.equal(verifyLeaderboardCommit('sess', 'p1', 9, tok), false)

const mapsKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || ''
if (!mapsKey && process.env.ALLOW_MAPS_KEY_SCRAPE !== '1') {
  console.log('distance wins parity: ok (skipping live session checks — no Maps key)')
  process.exit(0)
}

const session = await createGameSession('TEST01', 1, mapsKey)
const guesses = [
  { playerId: 'p1', name: 'A', lat: 40.71, lng: -74.0, country: 'US' },
  { playerId: 'p2', name: 'B', lat: null, lng: null, country: '' },
  { playerId: 'p3', name: 'C', lat: 0, lng: 0, country: '' },
]
const first = await scoreRound(session.sessionId, session.hostToken, 0, guesses)
assert.ok(first, 'first scoreRound failed')
const second = await scoreRound(session.sessionId, session.hostToken, 0, guesses)
assert.deepEqual(first.totals, second.totals, 'double reveal must not re-add totals')
assert.deepEqual(first.kmTotals, second.kmTotals, 'double reveal must not re-add km totals')

const p1 = first.results.find((r) => r.playerId === 'p1')
const p2 = first.results.find((r) => r.playerId === 'p2')
const p3 = first.results.find((r) => r.playerId === 'p3')
assert.equal(p1.wonRound, true, 'closest pin wins the round')
assert.equal(p2.wonRound, false)
assert.equal(p3.wonRound, false)
assert.equal(p1.total, 1)
assert.equal(p2.total, 0)
assert.ok(p1.km != null && p1.km < (p3.km ?? Infinity))

assert.ok(verifyLeaderboardCommit(session.sessionId, 'p1', p1.total, p1.commitToken))
const consumed = consumeLeaderboardCommit(session.sessionId, 'p1', p1.total, p1.commitToken)
assert.ok(consumed && consumed.score === 1)
assert.equal(consumeLeaderboardCommit(session.sessionId, 'p1', p1.total, p1.commitToken), null)

console.log('distance wins fairness checks: ok')
