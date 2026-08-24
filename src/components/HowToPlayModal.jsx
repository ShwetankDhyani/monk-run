import { useEffect } from 'react'

const STEPS = [
  { title: 'Gather in the temple', body: 'Create a room or join with a 6-digit PIN. Walk around, smack friends, and hop on voice when you’re ready.' },
  { title: 'Enter the black hole', body: 'The host presses PLAY. A singularity forms in the lobby and pulls everyone into five synchronized rounds.' },
  { title: 'Read the world', body: 'Explore Street View. Look for signs, flora, driving side, architecture — then drop a pin on the world map.' },
  { title: 'Lock & reveal', body: 'Lock your guess. When everyone’s locked (or time runs out), distances and scores appear. Closest monk wins the round.' },
]

export function HowToPlayModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="panel max-h-[90vh] w-full max-w-lg overflow-auto p-0 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="howto-title"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 id="howto-title" className="font-display text-xl font-bold text-fog">
            How to play
          </h2>
          <button type="button" className="btn btn-ghost px-3 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <ol className="space-y-4 px-5 py-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="font-display text-lg font-bold text-amber">{i + 1}</span>
              <div>
                <p className="font-display font-semibold text-fog">{s.title}</p>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="border-t border-white/10 px-5 py-3 text-[11px] text-muted">
          Controls in lobby: WASD / arrows move · Space smack · 1–4 emotes · voice is opt-in
        </p>
      </div>
    </div>
  )
}
