import { useEffect, useState } from 'react'
import { fetchLeaderboard } from '../lib/leaderboard.js'

export function LeaderboardPanel({ compact = false, refreshKey = 0 }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchLeaderboard().then((list) => {
      if (alive) {
        setEntries(list)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [refreshKey])

  if (loading && entries.length === 0) {
    return (
      <div className={compact ? 'mt-4 rounded-xl border border-white/10 bg-black/20 p-3' : 'rounded-xl border border-white/10 bg-black/20 p-4'}>
        <p className="text-[10px] uppercase tracking-widest text-muted">All-time top 25</p>
        <p className="mt-2 text-xs text-muted animate-pulse">Loading scores…</p>
      </div>
    )
  }

  return (
    <div className={compact ? 'mt-4 rounded-xl border border-white/10 bg-black/20 p-3' : 'rounded-xl border border-white/10 bg-black/20 p-4'}>
      <p className="text-[10px] uppercase tracking-widest text-muted">All-time top 25</p>
      {entries.length === 0 ? (
        <p className="mt-2 text-xs text-muted">No scores yet — finish a game to claim the board.</p>
      ) : (
        <ol className={`mt-2 space-y-1 ${compact ? 'max-h-48 overflow-y-auto' : ''}`}>
          {entries.map((e, i) => (
            <li key={e.id || i} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm even:bg-white/5">
              <span className="flex items-center gap-2 truncate">
                <span className="w-5 shrink-0 font-display text-xs text-amber">{i + 1}</span>
                <span className="truncate text-fog">{e.name}</span>
              </span>
              <span className="shrink-0 font-mono text-mint">{e.score.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
