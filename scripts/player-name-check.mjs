/**
 * Player name normalization + in-room uniqueness.
 * Run: node scripts/player-name-check.mjs
 */
import assert from 'node:assert/strict'
import {
  normalizePlayerName,
  playerNameKey,
  isPlayerNameTaken,
  MAX_PLAYER_NAME_LEN,
} from '../src/lib/peerRoom.js'

assert.equal(normalizePlayerName('  Alice  '), 'Alice')
assert.equal(normalizePlayerName('   '), '')
assert.equal(normalizePlayerName(null), '')
assert.equal(normalizePlayerName('x'.repeat(30)).length, MAX_PLAYER_NAME_LEN)

assert.equal(playerNameKey('  BOB '), 'bob')
assert.equal(playerNameKey('bob'), 'bob')

const players = [
  { id: 'a', name: 'Alice' },
  { id: 'b', name: 'Bob' },
]

assert.equal(isPlayerNameTaken(players, 'Alice'), true)
assert.equal(isPlayerNameTaken(players, ' alice '), true)
assert.equal(isPlayerNameTaken(players, 'Carol'), false)
assert.equal(isPlayerNameTaken(players, 'Alice', 'a'), false)
assert.equal(isPlayerNameTaken(players, 'Bob', 'b'), false)
assert.equal(isPlayerNameTaken(players, 'Alice', 'b'), true)
assert.equal(isPlayerNameTaken(players, ''), false)

console.log('player-name-check: ok')
