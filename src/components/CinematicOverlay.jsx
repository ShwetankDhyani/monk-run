/** Full-screen cinematic transition layer between game phases. */
import { COPY } from '../copy.js'

export function CinematicOverlay({ phase }) {
  if (!phase) return null

  const labels = {
    'bh-flash': '',
    'enter-game': COPY.cinematic.enterGame,
    'enter-reveal': COPY.cinematic.enterReveal,
    'enter-podium': COPY.cinematic.enterPodium,
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
