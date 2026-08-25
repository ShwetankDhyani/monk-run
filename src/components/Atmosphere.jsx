/** Shared void + temple light layers for branded surfaces. */
export function Atmosphere({ intensity = 'full' }) {
  const mode = intensity === 'soft' ? 'soft' : 'full'
  return (
    <div className="atmosphere" aria-hidden="true" data-intensity={mode}>
      <div className="atmosphere-void" />
      <div className="atmosphere-aurora" />
      <div className="atmosphere-horizon" />
      <div className="atmosphere-temple" />
      <div className="atmosphere-rift" />
      <div className="atmosphere-rays" />
      <div className="atmosphere-grain" />
      <div className="atmosphere-vignette" />
    </div>
  )
}

/** Temple seal — dominant brand object for hero surfaces. */
export function BrandMark({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
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
        d="M20 20l9 9M67 67l9 9M67 20l-9 9M29 67l-9 9"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.38"
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
