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

  const blockCheatUi = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const guardProps = {
    className: 'play-sv-cheat-guard-block',
    onPointerDown: blockCheatUi,
    onPointerUp: blockCheatUi,
    onTouchStart: blockCheatUi,
    onTouchEnd: blockCheatUi,
    onClick: blockCheatUi,
    onContextMenu: blockCheatUi,
  }

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
        sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-orientation-lock"
      />
      {/* Blocks Google location bar + map escape — must capture pointer events. */}
      <div className="play-sv-cheat-guard" aria-hidden>
        <div className="play-sv-cheat-guard-top" {...guardProps} />
        <div className="play-sv-cheat-guard-band" {...guardProps} />
        <div className="play-sv-cheat-guard-right" {...guardProps} />
        <div className="play-sv-cheat-guard-google" {...guardProps} />
        <div className="play-sv-cheat-guard-terms" {...guardProps} />
      </div>
    </div>
  )
}
