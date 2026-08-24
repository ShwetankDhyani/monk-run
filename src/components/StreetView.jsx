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
      className="absolute inset-0 h-full min-h-[50vh] w-full overflow-hidden bg-ink"
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
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-3">
        <span className="rounded-full bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white/70">
          Locked view · explore only
        </span>
      </div>
    </div>
  )
}
