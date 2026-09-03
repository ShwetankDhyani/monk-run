/**
 * Fairness smoke checks: dual scoring modes + one-shot commits.
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
import {
  haversineKm as clientHaversine,
  scoreFromDistanceKm as clientScore,
  formatWins,
  rankPlayers,
  SCORING_DISTANCE,
  SCORING_POINTS,
} from '../src/lib/scoring.js'

const samples = [0, 0.01, 0.024, 0.025, 1, 100, 500, 2000, 10000]
for (const km of samples) {
  assert.equal(scoreFromDistanceKm(km), clientScore(km), `score mismatch at ${km}km`)
}

const nyc = { lat: 40.7128, lng: -74.006 }
const lon = { lat: 51.5074, lng: -0.1278 }
assert.ok(Math.abs(haversineKm(nyc, lon) - clientHaversine(nyc, lon)) < 0.001, 'haversine drift')
assert.equal(formatWins(2), '2W')

const ranked = rankPlayers(
  [
    { id: 'a', score: 1, totalKm: 900 },
    { id: 'b', score: 2, totalKm: 1200 },
    { id: 'c', score: 2, totalKm: 400 },
  ],
  SCORING_DISTANCE,
)
assert.deepEqual(
  ranked.map((p) => p.id),
  ['c', 'b', 'a'],
  'rank by wins then lower total km',
)

const rankedPts = rankPlayers(
  [
    { id: 'a', score: 3000 },
    { id: 'b', score: 4500 },
    { id: 'c', score: 4500 },
  ],
  SCORING_POINTS,
)
assert.equal(rankedPts[0].score, 4500)

const tok = signLeaderboardCommit('sess', 'p1', 3)
assert.equal(verifyLeaderboardCommit('sess', 'p1', 3, tok), true)
assert.equal(verifyLeaderboardCommit('sess', 'p1', 9, tok), false)

const mapsKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || ''
if (!mapsKey && process.env.ALLOW_MAPS_KEY_SCRAPE !== '1') {
  console.log('dual scoring parity: ok (skipping live session checks — no Maps key)')
  process.exit(0)
}

const distanceSession = await createGameSession('TEST01', 1, mapsKey, SCORING_DISTANCE)
const distanceGuesses = [
  { playerId: 'p1', name: 'A', lat: 40.71, lng: -74.0, country: 'US' },
  { playerId: 'p2', name: 'B', lat: null, lng: null, country: '' },
  { playerId: 'p3', name: 'C', lat: 0, lng: 0, country: '' },
]
const d1 = await scoreRound(distanceSession.sessionId, distanceSession.hostToken, 0, distanceGuesses)
assert.ok(d1)
const p1d = d1.results.find((r) => r.playerId === 'p1')
const p2d = d1.results.find((r) => r.playerId === 'p2')
const p3d = d1.results.find((r) => r.playerId === 'p3')
assert.equal(p2d.wonRound, false, 'missed guess cannot win')
assert.equal(p2d.total, 0)
const winners = d1.results.filter((r) => r.wonRound)
assert.ok(winners.length >= 1, 'someone with a pin wins')
assert.ok(winners.every((r) => Number.isFinite(r.km)))
assert.equal(d1.scoringMode, SCORING_DISTANCE)
assert.equal(p1d.total + p2d.total + p3d.total, winners.length)

const pointsSession = await createGameSession('TEST02', 1, mapsKey, SCORING_POINTS)
const p1 = await scoreRound(pointsSession.sessionId, pointsSession.hostToken, 0, [
  { playerId: 'x', name: 'X', lat: 40.71, lng: -74.0, country: 'US' },
])
const xr = p1.results.find((r) => r.playerId === 'x')
assert.ok(xr.score > 0 && xr.score <= 5000, 'points mode uses curve')
assert.equal(xr.total, xr.score)
assert.equal(p1.scoringMode, SCORING_POINTS)

assert.ok(verifyLeaderboardCommit(pointsSession.sessionId, 'x', xr.total, xr.commitToken))
const consumed = consumeLeaderboardCommit(pointsSession.sessionId, 'x', xr.total, xr.commitToken)
assert.ok(consumed && consumed.score === xr.total)

console.log('dual scoring fairness checks: ok')
