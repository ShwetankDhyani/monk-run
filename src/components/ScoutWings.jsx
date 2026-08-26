/**
 * Original scout-wing emblem for landing hero.
 * Homage geometry inspired by Survey Corps — not the official Wings of Freedom logo.
 */
export function ScoutWings({ className = '' }) {
  return (
    <div className={`scout-wings ${className}`} aria-hidden="true">
      <svg className="scout-wings-svg" viewBox="0 0 240 200" fill="none">
        <defs>
          <linearGradient id="sw-blade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9fd4a8" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#6b9a62" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#d4a574" stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id="sw-dark" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2a3a2c" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#4a6b4a" stopOpacity="0.85" />
          </linearGradient>
          <filter id="sw-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring — wall seal */}
        <circle cx="120" cy="108" r="86" stroke="#8b7355" strokeWidth="1.2" opacity="0.35" />
        <circle
          cx="120"
          cy="108"
          r="78"
          stroke="#6b9a62"
          strokeWidth="1.4"
          opacity="0.45"
          strokeDasharray="3 8"
          className="scout-wings-orbit"
        />

        {/* Left wing — freer / wilder */}
        <g filter="url(#sw-glow)" className="scout-wings-flap scout-wings-flap--l">
          <path
            d="M112 96
               C88 70 52 52 28 44
               C42 62 48 86 52 108
               C40 98 22 92 8 96
               C28 108 48 128 72 148
               C86 132 100 116 112 104 Z"
            fill="url(#sw-blade)"
            opacity="0.92"
          />
          <path
            d="M108 100 C86 78 58 62 36 54 C46 70 50 90 54 108 C46 100 32 96 18 98 C34 108 52 124 70 140"
            stroke="#f0c98a"
            strokeWidth="1.1"
            opacity="0.55"
            fill="none"
          />
        </g>

        {/* Right wing — ordered / military */}
        <g filter="url(#sw-glow)" className="scout-wings-flap scout-wings-flap--r">
          <path
            d="M128 96
               C152 70 188 52 212 44
               C198 62 192 86 188 108
               C200 98 218 92 232 96
               C212 108 192 128 168 148
               C154 132 140 116 128 104 Z"
            fill="url(#sw-dark)"
            opacity="0.95"
          />
          <path
            d="M132 100 C154 78 182 62 204 54 C194 70 190 90 186 108 C194 100 208 96 222 98 C206 108 188 124 170 140"
            stroke="#7ec89a"
            strokeWidth="1.1"
            opacity="0.5"
            fill="none"
          />
        </g>

        {/* Center shield / heart chevron */}
        <path
          d="M120 62 L142 92 L120 84 L98 92 Z"
          fill="#7ec89a"
          opacity="0.85"
        />
        <path
          d="M120 72 L134 90 L120 84 L106 90 Z"
          fill="#f0c98a"
          opacity="0.7"
        />
        <circle cx="120" cy="118" r="10" fill="#0a100c" stroke="#d4a574" strokeWidth="1.4" />
        <circle cx="120" cy="118" r="4" fill="#6b9a62" />
      </svg>
    </div>
  )
}
