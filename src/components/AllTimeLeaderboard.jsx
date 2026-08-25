import { COPY } from '../copy.js'
import { useEffect, useRef, useState } from 'react'
import { resolvePlayerLook, migrateVibeToAvatar } from '../data/avatars.js'
import { drawMonkTopDown } from '../lib/avatarDraw.js'
import { fetchLeaderboard } from '../lib/leaderboard.js'
import { formatKm } from '../lib/scoring.js'

function HallMonk({ entry, size = 36 }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    if (!c || !entry) return
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, size, size)
    const look = resolvePlayerLook(
      migrateVibeToAvatar(entry.avatarId || 'aot-eren'),
      entry.id || entry.name,
      [],
    )
    drawMonkTopDown(ctx, size / 2, size / 2 + (size > 40 ? 6 : 2), look, 'down', 0)
  }, [entry, size])
  return <canvas ref={ref} width={size} height={size} className="drop-shadow-md" />
}

function HallList({ title, subtitle, entries, kind, empty }) {
  return (
    <section className="hall-panel">
      <header className="hall-panel-head">
        <h3 className="hall-panel-title">{title}</h3>
        <p className="hall-panel-sub">{subtitle}</p>
      </header>
      {entries.length === 0 ? (
        <p className="hall-empty">{empty}</p>
      ) : (
        <ol className="hall-list">
          {entries.slice(0, 5).map((e, i) => (
            <li key={e.id || `${kind}-${i}-${e.name}`} className="hall-row">
              <span className="hall-rank">{i + 1}</span>
              <span className="hall-avatar">
                <HallMonk entry={e} size={32} />
              </span>
              <span className="hall-name">{e.name}</span>
              <span className={`hall-stat hall-stat--${kind}`}>
                {kind === 'score' ? (e.score?.toLocaleString?.() ?? e.score) : formatKm(e.km)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function HallsModal({ onClose, refreshKey }) {
  const [halls, setHalls] = useState({
    highestScore: [],
    lowestScore: [],
    closestGuess: [],
    farthestGuess: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchLeaderboard().then((data) => {
      if (!alive) return
      setHalls({
        highestScore: data.highestScore || [],
        lowestScore: data.lowestScore || [],
        closestGuess: data.closestGuess || [],
        farthestGuess: data.farthestGuess || [],
      })
      setLoading(false)
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

  const empty =
    !loading &&
    [halls.highestScore, halls.lowestScore, halls.closestGuess, halls.farthestGuess].every(
      (list) => list.length === 0,
    )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="panel hall-modal w-full max-w-3xl overflow-hidden p-0 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="hall-title"
      >
        <div className="flex items-center justify-between border-b border-brass/15 px-5 py-4">
          <div>
            <h2 id="hall-title" className="font-display text-xl font-medium text-fog">
              {COPY.leaderboard.title}
            </h2>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted">
              {COPY.leaderboard.subtitle}
            </p>
          </div>
          <button type="button" className="btn btn-ghost px-3 py-1 text-sm" onClick={onClose}>
            {COPY.leaderboard.close}
          </button>
        </div>

        <div className="max-h-[min(78vh,720px)] overflow-y-auto px-5 py-5">
          {loading ? (
            <p className="animate-pulse py-12 text-center text-sm text-muted">{COPY.leaderboard.loading}</p>
          ) : empty ? (
            <p className="py-12 text-center text-sm text-muted">{COPY.leaderboard.empty}</p>
          ) : (
            <div className="hall-grid">
              <div className="hall-column hall-column--fame">
                <p className="hall-column-label">{COPY.leaderboard.fame}</p>
                <HallList
                  title={COPY.leaderboard.highestScore}
                  subtitle={COPY.leaderboard.highestScoreHint}
                  entries={halls.highestScore}
                  kind="score"
                  empty={COPY.leaderboard.emptyList}
                />
                <HallList
                  title={COPY.leaderboard.closestGuess}
                  subtitle={COPY.leaderboard.closestGuessHint}
                  entries={halls.closestGuess}
                  kind="km"
                  empty={COPY.leaderboard.emptyList}
                />
              </div>
              <div className="hall-column hall-column--shame">
                <p className="hall-column-label">{COPY.leaderboard.shame}</p>
                <HallList
                  title={COPY.leaderboard.lowestScore}
                  subtitle={COPY.leaderboard.lowestScoreHint}
                  entries={halls.lowestScore}
                  kind="score"
                  empty={COPY.leaderboard.emptyList}
                />
                <HallList
                  title={COPY.leaderboard.farthestGuess}
                  subtitle={COPY.leaderboard.farthestGuessHint}
                  entries={halls.farthestGuess}
                  kind="km"
                  empty={COPY.leaderboard.emptyList}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function AllTimeLeaderboardButton({ refreshKey = 0, className = '' }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className={`flex justify-center ${className}`}>
        <button type="button" className="lb-footlink" onClick={() => setOpen(true)}>
          {COPY.leaderboard.link}
        </button>
      </div>
      {open && <HallsModal onClose={() => setOpen(false)} refreshKey={refreshKey} />}
    </>
  )
}
