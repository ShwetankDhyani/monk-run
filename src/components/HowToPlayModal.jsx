import { useEffect } from 'react'
import { COPY } from '../copy.js'

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
        <div className="flex items-center justify-between border-b border-brass/15 px-5 py-4">
          <h2 id="howto-title" className="font-display text-xl font-medium text-fog">
            {COPY.howTo.title}
          </h2>
          <button type="button" className="btn btn-ghost px-3 py-1 text-sm" onClick={onClose}>
            {COPY.howTo.close}
          </button>
        </div>
        <ol className="space-y-4 px-5 py-5">
          {COPY.howTo.steps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="font-display text-lg text-amber">{i + 1}</span>
              <div>
                <p className="font-display font-medium text-fog">{s.title}</p>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="border-t border-brass/15 px-5 py-3 text-[11px] text-muted">
          {COPY.howTo.controls}
        </p>
      </div>
    </div>
  )
}
