import { MONK_AVATARS, getPortraitPath } from '../data/avatars.js'

export function AvatarPicker({ value, onChange }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {MONK_AVATARS.map((a) => {
        const selected = value === a.id
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onChange(a.id)}
            className={`group flex flex-col overflow-hidden rounded-xl border transition ${
              selected
                ? 'border-sky bg-sky/10 ring-2 ring-sky'
                : 'border-white/10 bg-black/30 hover:border-white/25'
            }`}
          >
            <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-b from-[#1a2030] to-[#0a0e16]">
              <img
                src={a.portrait}
                alt={`${a.label} scout portrait`}
                className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
            </div>
            <div className="px-2 py-2 text-center">
              <span className="font-display text-xs font-bold uppercase tracking-wide text-fog">{a.label}</span>
              <span className="mt-0.5 block text-[9px] text-muted">{a.heightCm} cm</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export function AvatarPortrait({ avatarId, size = 64, className = '' }) {
  const src = getPortraitPath(avatarId)
  const label = MONK_AVATARS.find((a) => a.id === avatarId)?.label || 'Scout'
  return (
    <img
      src={src}
      alt={`${label} portrait`}
      width={size}
      height={size}
      className={`rounded-full object-cover object-top ring-2 ring-white/10 ${className}`}
      style={{ width: size, height: size }}
      loading="lazy"
    />
  )
}
