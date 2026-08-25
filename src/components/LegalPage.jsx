import { COPY } from '../copy.js'

export function LegalPage({ kind, onBack }) {
  const title = kind === 'privacy' ? COPY.legal.privacyTitle : COPY.legal.termsTitle
  return (
    <div className="flex min-h-full flex-col items-center overflow-auto bg-ink p-4 pb-10">
      <div className="panel mt-6 w-full max-w-2xl p-6 md:p-8">
        <button type="button" className="btn btn-ghost mb-4 !px-3 text-sm" onClick={onBack}>
          {COPY.legal.back}
        </button>
        <h1 className="font-display text-3xl font-medium text-fog">{title}</h1>
        <p className="mt-2 text-xs uppercase tracking-widest text-muted">{COPY.legal.effective}</p>

        {kind === 'privacy' ? (
          <div className="prose-invert mt-6 space-y-4 text-sm leading-relaxed text-muted">
            <p>
              monk.run is a party geography game. We keep only what the temple needs: your display name,
              scout choice, room PIN, and scores submitted after a verified match.
            </p>
            <p>
              Voice is peer-to-peer. Mic audio never uploads to monk.run — it only flows between players
              after you join voice yourself.
            </p>
            <p>
              Place search may use OpenStreetMap Nominatim. Street View comes from Google Maps Platform
              when a server key is set. Those services follow their own privacy policies.
            </p>
            <p>
              Peers may connect through a public broker and STUN/TURN you configure. Treat lobby chat
              like a public party — share nothing you would not say aloud.
            </p>
            <p>Ask your deployment’s operator to remove a leaderboard entry if you need it gone.</p>
          </div>
        ) : (
          <div className="prose-invert mt-6 space-y-4 text-sm leading-relaxed text-muted">
            <p>
              Play for fun and respect. Harassment, hate, coordinate leaks, or abuse of shared
              infrastructure can mean removal from rooms or the board.
            </p>
            <p>
              When Street View is on, Google Maps Platform Terms apply. Geocoding follows OpenStreetMap
              policies. Do not scrape, redistribute, or reverse-engineer panoramas.
            </p>
            <p>
              Scout pickers use Attack on Titan character names as an homage. The temple lobby and
              monk.run mark are otherwise original. This is an independent party geography game —
              not affiliated with any third-party geography trademarks.
            </p>
            <p>
              Provided as entertainment. Operators who host monk.run own their keys, TURN setup,
              moderation, and regional rules (including age-appropriate use).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
