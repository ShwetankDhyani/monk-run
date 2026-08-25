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

  return (
    <div
      className="play-sv-root absolute inset-0 h-full min-h-0 w-full overflow-hidden bg-ink"
      onContextMenu={(e) => e.preventDefault()}
    >
      <iframe
        key={viewToken}
        title="Round panorama"
        src={`/api/game/sv/${viewToken}`}
        className="h-full w-full border-0"
        referrerPolicy="no-referrer"
        allow="accelerometer; gyroscope"
        sandbox="allow-scripts allow-same-origin"
      />
      {/* Block Google's location label that appears over the panorama (anti-spoiler). */}
      <div className="play-sv-spoiler-shield pointer-events-none absolute inset-x-0 top-0 z-20 h-[4.75rem] bg-gradient-to-b from-[#06080e] via-[#06080e]/92 to-transparent" aria-hidden />
      <div className="play-sv-spoiler-shield-center pointer-events-none absolute inset-x-[12%] top-2 z-20 h-12 rounded-md bg-[#06080e]/88" aria-hidden />
    </div>
  )
}
