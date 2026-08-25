/** Hall of Fame / Hall of Shame — submissions need a server commit token. */

const EMPTY_HALLS = {
  highestScore: [],
  lowestScore: [],
  closestGuess: [],
  farthestGuess: [],
}

export async function fetchLeaderboard() {
  try {
    const res = await fetch('/api/leaderboard')
    if (!res.ok) return { ...EMPTY_HALLS, entries: [] }
    const data = await res.json()
    const halls = data.halls || EMPTY_HALLS
    return {
      highestScore: halls.highestScore || [],
      lowestScore: halls.lowestScore || [],
      closestGuess: halls.closestGuess || [],
      farthestGuess: halls.farthestGuess || [],
      entries: data.entries || halls.highestScore || [],
    }
  } catch {
    return { ...EMPTY_HALLS, entries: [] }
  }
}

export async function submitScore({
  name,
  score,
  roomCode,
  avatarId,
  sessionId,
  playerId,
  commitToken,
}) {
  try {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        score,
        roomCode,
        avatarId,
        sessionId,
        playerId,
        commitToken,
      }),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
