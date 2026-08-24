import { useEffect, useRef } from 'react'
import { MONK_AVATARS } from '../data/avatars.js'
import { drawAvatarPreview } from '../lib/avatarDraw.js'

export function AvatarPicker({ value, onChange }) {
  const refs = useRef({})

  useEffect(() => {
    MONK_AVATARS.forEach((a, i) => {
      const c = refs.current[a.id]
      if (!c) return
      const ctx = c.getContext('2d')
      ctx.clearRect(0, 0, 64, 64)
      drawAvatarPreview(ctx, 32, 36, a.id, i)
    })
  }, [])

  return (
    <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
      {MONK_AVATARS.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onChange(a.id)}
          className={`flex flex-col items-center rounded-xl border p-2 transition ${
            value === a.id ? 'border-sky bg-sky/10 ring-2 ring-sky' : 'border-white/10 bg-black/20 hover:border-white/25'
          }`}
        >
          <canvas ref={(el) => { refs.current[a.id] = el }} width={64} height={64} className="h-14 w-14" />
          <span className="mt-1 text-[9px] font-display uppercase tracking-wide text-muted">{a.label}</span>
        </button>
      ))}
    </div>
  )
}
