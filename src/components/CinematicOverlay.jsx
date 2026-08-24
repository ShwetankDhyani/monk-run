/** Full-screen cinematic transition layer between game phases. */
export function CinematicOverlay({ phase }) {
  if (!phase) return null

  const labels = {
    'bh-flash': '',
    'enter-game': 'Entering the world…',
    'enter-reveal': 'Revealing truth…',
    'enter-podium': 'Final scores…',
    'exit-lobby': '',
  }

  return (
    <div
      className={`cinematic-overlay cinematic-overlay--${phase}`}
      aria-hidden={phase === 'bh-flash' ? 'true' : undefined}
    >
      {labels[phase] && <p className="cinematic-overlay__label">{labels[phase]}</p>}
    </div>
  )
}
