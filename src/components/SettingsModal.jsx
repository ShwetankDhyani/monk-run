import { useEffect, useState } from 'react'
import { isSfxMuted, setSfxMuted, setSfxVolume, sfx } from '../lib/sfx.js'
import { COPY } from '../copy.js'

export function SettingsModal({ open, onClose }) {
  const [mute, setMute] = useState(() => isSfxMuted())
  const [vol, setVol] = useState(() => Number(localStorage.getItem('monk-sfx-vol') || '0.45'))
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem('monk-reduce-motion') === '1')

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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={onClose} role="presentation">
      <div className="panel w-full max-w-md p-0" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="settings-title">
        <div className="flex items-center justify-between border-b border-brass/15 px-5 py-4">
          <h2 id="settings-title" className="font-display text-xl font-medium">
            {COPY.settings.title}
          </h2>
          <button type="button" className="btn btn-ghost px-3 py-1 text-sm" onClick={onClose}>
            {COPY.settings.close}
          </button>
        </div>
        <div className="space-y-5 px-5 py-5 text-sm">
          <label className="flex items-center justify-between gap-3">
            <span>{COPY.settings.sfx}</span>
            <input
              type="checkbox"
              checked={!mute}
              onChange={(e) => {
                const on = e.target.checked
                setMute(!on)
                setSfxMuted(!on)
                if (on) sfx.ui()
              }}
            />
          </label>
          <label className="block">
            <span className="text-muted">{COPY.settings.volume}</span>
            <input
              className="mt-2 w-full"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={vol}
              disabled={mute}
              onChange={(e) => {
                const v = Number(e.target.value)
                setVol(v)
                setSfxVolume(v)
              }}
            />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>{COPY.settings.reduceMotion}</span>
            <input
              type="checkbox"
              checked={reduceMotion}
              onChange={(e) => {
                const on = e.target.checked
                setReduceMotion(on)
                localStorage.setItem('monk-reduce-motion', on ? '1' : '0')
                document.documentElement.dataset.reduceMotion = on ? '1' : '0'
              }}
            />
          </label>
          <p className="text-[11px] text-muted">{COPY.settings.note}</p>
        </div>
      </div>
    </div>
  )
}
