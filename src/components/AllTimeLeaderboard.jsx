import { useEffect, useRef, useState } from 'react'
import { resolvePlayerLook, migrateVibeToAvatar } from '../data/avatars.js'
import { drawMonkTopDown } from '../lib/avatarDraw.js'
import { fetchLeaderboard } from '../lib/leaderboard.js'

function PodiumMonk({ entry, size = 88 }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    if (!c || !entry) return
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, size, size)
    const look = resolvePlayerLook(migrateVibeToAvatar(entry.avatarId || 'monk-male'), entry.id || entry.name, [])
    drawMonkTopDown(ctx, size / 2, size / 2 + (size > 48 ? 10 : 4), look, 'down', 0)
  }, [entry, size])
  return <canvas ref={ref} width={size} height={size} className="drop-shadow-lg" />
}

const PODIUM_ORDER = [
  { rank: 2, slot: 'left', height: 'h-20', medal: '🥈' },
  { rank: 1, slot: 'center', height: 'h-28', medal: '🥇' },
  { rank: 3, slot: 'right', height: 'h-16', medal: '🥉' },
]

function LeaderboardModal({ onClose, refreshKey }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchLeaderboard().then((list) => {
      if (alive) {
        setEntries(list.slice(0, 10))
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [refreshKey])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3, 10)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="panel w-full max-w-lg overflow-hidden p-0 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="lb-title"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 id="lb-title" className="font-display text-xl font-bold text-fog">
            All Time Leaderboard
          </h2>
          <button type="button" className="btn btn-ghost px-3 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="px-5 py-6">
          {loading ? (
            <p className="py-12 text-center text-sm text-muted animate-pulse">Loading scores…</p>
          ) : entries.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">No scores yet — finish a game to claim the podium.</p>
          ) : (
            <>
              {/* Podium — top 3 with avatars */}
              <div className="flex items-end justify-center gap-2 sm:gap-4">
                {PODIUM_ORDER.map(({ rank, height, medal }) => {
                  const entry = top3[rank - 1]
                  if (!entry) {
                    return (
                      <div key={rank} className="flex w-[30%] max-w-[120px] flex-col items-center opacity-30">
                        <div className={`mb-1 flex w-full items-end justify-center rounded-t-lg border border-white/10 bg-white/5 ${height}`} />
                        <span className="text-xs text-muted">—</span>
                      </div>
                    )
                  }
                  return (
                    <div key={rank} className="flex w-[30%] max-w-[120px] flex-col items-center">
                      <PodiumMonk entry={entry} size={rank === 1 ? 96 : 80} />
                      <p className="mt-1 max-w-full truncate text-center font-display text-sm font-bold text-fog">
                        {entry.name}
                      </p>
                      <p className="font-mono text-sm text-mint">{entry.score.toLocaleString()}</p>
                      <div
                        className={`mt-2 flex w-full flex-col items-center justify-end rounded-t-lg border border-amber/30 bg-gradient-to-t from-amber/20 to-amber/5 ${height}`}
                      >
                        <span className="mb-2 text-2xl">{medal}</span>
                        <span className="mb-1 font-display text-lg font-bold text-amber">{rank}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Ranks 4–10 */}
              {rest.length > 0 && (
                <ol className="mt-8 space-y-2 border-t border-white/10 pt-6">
                  {rest.map((e, i) => {
                    const rank = i + 4
                    return (
                      <li
                        key={e.id || rank}
                        className="flex items-center justify-between rounded-xl bg-black/25 px-3 py-2.5"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="w-6 shrink-0 font-display text-sm text-muted">{rank}</span>
                          <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40">
                            <PodiumMonk entry={e} size={32} />
                          </span>
                          <span className="truncate font-display text-sm text-fog">{e.name}</span>
                        </span>
                        <span className="shrink-0 font-mono text-sm text-mint">{e.score.toLocaleString()}</span>
                      </li>
                    )
                  })}
                </ol>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Clickable button that opens the all-time top 10 podium view. */
export function AllTimeLeaderboardButton({ refreshKey = 0, className = '' }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={`btn btn-ghost w-full border border-white/10 ${className}`}
        onClick={() => setOpen(true)}
      >
        All Time Leaderboard
      </button>
      {open && <LeaderboardModal onClose={() => setOpen(false)} refreshKey={refreshKey} />}
    </>
  )
}
