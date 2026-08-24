/** Host-only game session API — locations stay on server, clients get view tokens. */

export async function createGameSession(roomCode, rounds = 5) {
  const res = await fetch('/api/game/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode, rounds }),
  })
  if (!res.ok) throw new Error('Game server unavailable')
  return res.json()
}

export async function openRoundView(sessionId, roundIndex) {
  const res = await fetch(`/api/game/session/${encodeURIComponent(sessionId)}/round/${roundIndex}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Could not open round view')
  return res.json()
}

export async function fetchRoundTruth(sessionId, roundIndex) {
  const res = await fetch(
    `/api/game/session/${encodeURIComponent(sessionId)}/round/${roundIndex}/truth`,
  )
  if (!res.ok) return null
  return res.json()
}
