/**
 * Full-bleed Attack-on-Titan homage backdrop for landing / lobby shells.
 * Original silhouettes only — walls, steam, colossal form beyond the wall.
 */
export function Atmosphere({ intensity = 'full', variant = 'default' }) {
  const mode = intensity === 'soft' ? 'soft' : 'full'
  const isExpedition = variant === 'expedition' || mode === 'full'
  return (
    <div
      className={`atmosphere${isExpedition ? ' atmosphere--expedition' : ''}`}
      aria-hidden="true"
      data-intensity={mode}
      data-variant={variant}
    >
      <div className="atmosphere-void" />
      <div className="atmosphere-skyfire" />
      <div className="atmosphere-colossal" />
      <div className="atmosphere-walls" />
      <div className="atmosphere-wall-near" />
      <div className="atmosphere-aurora" />
      <div className="atmosphere-horizon" />
      <div className="atmosphere-temple" />
      <div className="atmosphere-rift" />
      <div className="atmosphere-steam" />
      <div className="atmosphere-steam atmosphere-steam--high" />
      <div className="atmosphere-rays" />
      <div className="atmosphere-grain" />
      <div className="atmosphere-vignette" />
    </div>
  )
}

/** monk.run seal + bold scout-wing chevrons. */
export function BrandMark({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M48 6 L68 36 L48 28 L28 36 Z" fill="currentColor" opacity="0.2" />
      <path
        d="M44 40 C28 28 14 24 6 26 C14 34 18 46 20 56 C14 52 6 50 0 52 C10 58 22 68 34 78 C38 68 42 56 44 44 Z"
        fill="currentColor"
        opacity="0.28"
      />
      <path
        d="M52 40 C68 28 82 24 90 26 C82 34 78 46 76 56 C82 52 90 50 96 52 C86 58 74 68 62 78 C58 68 54 56 52 44 Z"
        fill="currentColor"
        opacity="0.22"
      />
      <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="1.1" opacity="0.28" />
      <circle cx="48" cy="48" r="34" stroke="currentColor" strokeWidth="1.35" opacity="0.45" />
      <circle cx="48" cy="48" r="22" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
      <circle cx="48" cy="48" r="7" fill="currentColor" opacity="0.92" />
      <path
        d="M48 10v12M48 74v12M10 48h12M74 48h12"
        stroke="currentColor"
        strokeWidth="1.35"
        opacity="0.5"
      />
      <path
        d="M34 62V44c0-7.7 6.3-14 14-14s14 6.3 14 14v18"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.55"
      />
      <path d="M34 62h28" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
      <circle cx="48" cy="40" r="2.2" fill="currentColor" opacity="0.7" />
    </svg>
  )
}
