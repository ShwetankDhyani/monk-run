/** All-time top scores (server-backed). */

export async function fetchLeaderboard() {
  try {
    const res = await fetch('/api/leaderboard')
    if (!res.ok) return []
    const data = await res.json()
    return data.entries || []
  } catch {
    return []
  }
}

export async function submitScore({ name, score, roomCode }) {
  try {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score, roomCode }),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
