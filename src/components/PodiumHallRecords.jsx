import { useEffect, useState } from 'react'
import { COPY } from '../copy.js'
import { fetchLeaderboard } from '../lib/leaderboard.js'
import { formatKm } from '../lib/scoring.js'
import { migrateVibeToAvatar } from '../data/avatars.js'

function RecordChip({ label, name, value, tone = 'fame' }) {
  return (
    <div className={`podium-record-chip podium-record-chip--${tone}`}>
      <p className="podium-record-label">{label}</p>
      <p className="podium-record-name">{name}</p>
      <p className="podium-record-value">{value}</p>
    </div>
  )
}

/**
 * Inline all-time context beneath the podium — no extra tap required.
 */
export function PodiumHallRecords({ refreshKey = 0, partyScore, playerName }) {
  const [halls, setHalls] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchLeaderboard().then((data) => {
      if (!alive) return
      setHalls(data)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [refreshKey])

  const high = halls?.highestScore?.[0]
  const low = halls?.lowestScore?.[0]
  const close = halls?.closestGuess?.[0]
  const far = halls?.farthestGuess?.[0]

  const yourRank =
    halls?.highestScore?.findIndex(
      (e) => e.name === playerName && Number(e.score) === Number(partyScore),
    ) ?? -1

  const empty =
    !loading &&
    [halls?.highestScore, halls?.lowestScore, halls?.closestGuess, halls?.farthestGuess].every(
      (list) => !list?.length,
    )

  return (
    <section className="podium-records" aria-labelledby="podium-records-title">
      <header className="podium-records-head">
        <h3 id="podium-records-title" className="podium-records-title">
          {COPY.podium.allTimeTitle}
        </h3>
        <p className="podium-records-sub">{COPY.podium.allTimeHint}</p>
      </header>

      {loading ? (
        <p className="podium-records-loading">{COPY.leaderboard.loading}</p>
      ) : empty ? (
        <p className="podium-records-empty">{COPY.leaderboard.empty}</p>
      ) : (
        <>
          <div className="podium-records-grid">
            {high && (
              <RecordChip
                label={COPY.leaderboard.highestScore}
                name={high.name}
                value={high.score?.toLocaleString?.() ?? high.score}
                tone="fame"
              />
            )}
            {close && (
              <RecordChip
                label={COPY.leaderboard.closestGuess}
                name={close.name}
                value={formatKm(close.km)}
                tone="fame"
              />
            )}
            {low && (
              <RecordChip
                label={COPY.leaderboard.lowestScore}
                name={low.name}
                value={low.score?.toLocaleString?.() ?? low.score}
                tone="shame"
              />
            )}
            {far && (
              <RecordChip
                label={COPY.leaderboard.farthestGuess}
                name={far.name}
                value={formatKm(far.km)}
                tone="shame"
              />
            )}
          </div>
          {partyScore != null && playerName && (
            <p className="podium-records-you">
              {yourRank >= 0
                ? COPY.podium.allTimeRank(yourRank + 1, partyScore)
                : COPY.podium.allTimeYourRun(partyScore, high?.score)}
            </p>
          )}
        </>
      )}
    </section>
  )
}
