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
    <div className="scout-grid mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
      {MONK_AVATARS.map((a) => (
        <button
          key={a.id}
          type="button"
          data-active={value === a.id}
          onClick={() => onChange(a.id)}
          className="flex flex-col items-center p-2"
        >
          <canvas ref={(el) => { refs.current[a.id] = el }} width={64} height={64} className="h-14 w-14" />
          <span className="mt-1 font-display text-[9px] uppercase tracking-wide text-muted">{a.label}</span>
        </button>
      ))}
    </div>
  )
}
