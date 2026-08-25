/** Host-only game session API — locations stay on server; clients get view tokens. */

import { fetchRetry, playerError } from './playerErrors.js'

export async function createGameSession(roomCode, rounds = 5) {
  let res
  try {
    res = await fetchRetry(
      '/api/game/session',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, rounds }),
      },
      { retries: 4, delayMs: 350 },
    )
  } catch (err) {
    throw new Error(playerError(err, 'Couldn’t start the match. Try again.'))
  }
  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = String(body?.error || '')
    } catch {
      /* ignore */
    }
    if (res.status === 503 || /Maps key|Street View|API key/i.test(detail)) {
      throw new Error(
        detail ||
          'Street View isn’t configured. Add a valid GOOGLE_MAPS_API_KEY on Vercel (Street View Static API + billing).',
      )
    }
    throw new Error(detail || 'Couldn’t start the match. Try again.')
  }
  return res.json()
}

export async function openRoundView(sessionId, roundIndex) {
  let res
  try {
    res = await fetchRetry(
      `/api/game/session/${encodeURIComponent(sessionId)}/round/${roundIndex}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { retries: 3, delayMs: 300 },
    )
  } catch (err) {
    throw new Error(playerError(err, 'Round didn’t load. Try again.'))
  }
  if (!res.ok) throw new Error('Round didn’t load. Try again.')
  return res.json()
}

/**
 * Host-authenticated server scoring — never trust client-computed distances.
 */
export async function revealRoundScores(sessionId, hostToken, roundIndex, guesses) {
  let res
  try {
    res = await fetchRetry(
      `/api/game/session/${encodeURIComponent(sessionId)}/round/${roundIndex}/reveal`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Host-Token': hostToken,
        },
        body: JSON.stringify({ hostToken, guesses }),
      },
      { retries: 3, delayMs: 300 },
    )
  } catch (err) {
    throw new Error(playerError(err, 'Couldn’t score this round. Try again.'))
  }
  if (!res.ok) throw new Error('Couldn’t score this round. Try again.')
  return res.json()
}

/** @deprecated Truth is host-only via revealRoundScores */
export async function fetchRoundTruth() {
  return null
}
