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
          className="scout-pick flex min-h-[5.25rem] flex-col items-center justify-start overflow-hidden px-1 pb-2 pt-1.5"
          title={a.label}
        >
          <canvas ref={(el) => { refs.current[a.id] = el }} width={64} height={64} className="h-11 w-11 shrink-0 sm:h-12 sm:w-12" />
          <span className="scout-name">{a.label}</span>
        </button>
      ))}
    </div>
  )
}
