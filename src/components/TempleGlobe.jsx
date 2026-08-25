/**
 * Temple-void globe for the landing hero.
 * Brass wireframe + jade land band — spins to nod at worldwide rounds.
 */
export function TempleGlobe({ className = '' }) {
  return (
    <div className={`temple-globe ${className}`} aria-hidden="true">
      <svg className="temple-globe-svg" viewBox="0 0 200 200" fill="none">
        <defs>
          <radialGradient id="tg-sphere" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#1a3a38" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#0c1618" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#040608" stopOpacity="1" />
          </radialGradient>
          <radialGradient id="tg-sheen" cx="32%" cy="28%" r="55%">
            <stop offset="0%" stopColor="#f0c98a" stopOpacity="0.22" />
            <stop offset="40%" stopColor="#d4a574" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#d4a574" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="tg-land" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5ec4b6" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#d4a574" stopOpacity="0.4" />
          </linearGradient>
          <clipPath id="tg-clip">
            <circle cx="100" cy="100" r="72" />
          </clipPath>
        </defs>

        {/* Outer seal rings — temple frame */}
        <circle cx="100" cy="100" r="92" stroke="#d4a574" strokeWidth="1" opacity="0.28" />
        <circle cx="100" cy="100" r="86" stroke="#d4a574" strokeWidth="1.2" opacity="0.42" />
        <circle
          cx="100"
          cy="100"
          r="86"
          stroke="#f0c98a"
          strokeWidth="0.6"
          strokeDasharray="2 7"
          opacity="0.35"
          className="temple-globe-ticks"
        />

        {/* Sphere body */}
        <circle cx="100" cy="100" r="72" fill="url(#tg-sphere)" />
        <circle cx="100" cy="100" r="72" fill="url(#tg-sheen)" />
        <circle cx="100" cy="100" r="72" stroke="#d4a574" strokeWidth="1.15" opacity="0.55" />

        {/* Rotating world band */}
        <g clipPath="url(#tg-clip)">
          <g className="temple-globe-spin">
            <TempleLandBand x={-20} />
            <TempleLandBand x={140} />
          </g>

          {/* Latitude / longitude wireframe (static — reads as a globe) */}
          <ellipse cx="100" cy="100" rx="72" ry="24" stroke="#d4a574" strokeWidth="0.7" opacity="0.28" />
          <ellipse cx="100" cy="100" rx="72" ry="48" stroke="#d4a574" strokeWidth="0.65" opacity="0.22" />
          <ellipse cx="100" cy="100" rx="24" ry="72" stroke="#d4a574" strokeWidth="0.7" opacity="0.26" />
          <ellipse cx="100" cy="100" rx="48" ry="72" stroke="#d4a574" strokeWidth="0.65" opacity="0.2" />
          <line x1="28" y1="100" x2="172" y2="100" stroke="#d4a574" strokeWidth="0.7" opacity="0.32" />
          <line x1="100" y1="28" x2="100" y2="172" stroke="#d4a574" strokeWidth="0.55" opacity="0.2" />
        </g>

        {/* Limb darkening / void edge */}
        <circle
          cx="100"
          cy="100"
          r="72"
          stroke="#000"
          strokeWidth="10"
          opacity="0.35"
          style={{ filter: 'blur(3px)' }}
        />
      </svg>
    </div>
  )
}

/** Simplified continent silhouettes — not cartographic, just “world” in temple ink. */
function TempleLandBand({ x = 0 }) {
  return (
    <g transform={`translate(${x} 0)`} fill="url(#tg-land)">
      {/* NW mass */}
      <path d="M18 58c8-10 22-14 34-10 9 3 14 10 12 18-3 9-12 12-22 14-14 2-24-4-28-12-2-4 0-7 4-10z" />
      {/* Central belt */}
      <path d="M52 78c6-4 16-3 22 2 5 5 4 12-1 16-7 5-18 4-24-1-6-5-4-12 3-17z" />
      {/* SE archipelago feel */}
      <path d="M88 92c5-6 14-7 20-2 4 4 3 10-2 13-6 4-14 2-18-3-3-4-2-6 0-8z" />
      <path d="M108 70c4-5 11-6 15-2 3 3 2 8-1 10-5 3-11 1-14-3-2-2-1-4 0-5z" />
      {/* Southern tip */}
      <path d="M64 118c3-5 10-6 14-2 2 3 1 7-2 9-5 3-11 1-13-3-1-2 0-3 1-4z" />
      {/* Island dots */}
      <circle cx="40" cy="102" r="2.2" opacity="0.7" />
      <circle cx="126" cy="88" r="1.8" opacity="0.65" />
      <circle cx="96" cy="112" r="1.6" opacity="0.55" />
    </g>
  )
}
