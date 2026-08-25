/**
 * Secure round view — loads server-proxied Street View via one-time token.
 * Coordinates never enter the React app; no satellite / external map links.
 */
export default function StreetView({ viewToken }) {
  if (!viewToken) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-ink">
        <p className="animate-pulse font-mono text-xs tracking-widest text-sky">LOADING ROUND VIEW…</p>
      </div>
    )
  }

  const src = `/api/game/sv/${encodeURIComponent(viewToken)}`

  return (
    <div
      className="play-sv-root absolute inset-0 h-full min-h-0 w-full overflow-hidden bg-ink"
      onContextMenu={(e) => e.preventDefault()}
    >
      <iframe
        key={viewToken}
        title="Round panorama"
        src={src}
        className="play-sv-frame h-full w-full border-0"
        referrerPolicy="no-referrer"
        allow="accelerometer; gyroscope; magnetometer; fullscreen; xr-spatial-tracking"
      />
      {/* Slim top gradient — hides Google's location label without blocking the view. */}
      <div
        className="play-sv-spoiler-shield pointer-events-none absolute inset-x-0 top-0 z-20 h-12 bg-gradient-to-b from-[#06080e]/95 to-transparent"
        aria-hidden
      />
    </div>
  )
}
