export function LegalPage({ kind, onBack }) {
  const title = kind === 'privacy' ? 'Privacy' : 'Terms of Use'
  return (
    <div className="flex min-h-full flex-col items-center overflow-auto bg-ink p-4 pb-10">
      <div className="panel mt-6 w-full max-w-2xl p-6 md:p-8">
        <button type="button" className="btn btn-ghost mb-4 !px-3 text-sm" onClick={onBack}>
          ← Back
        </button>
        <h1 className="font-display text-3xl font-extrabold text-fog">{title}</h1>
        <p className="mt-2 text-xs uppercase tracking-widest text-muted">monk.run · effective launch build</p>

        {kind === 'privacy' ? (
          <div className="prose-invert mt-6 space-y-4 text-sm leading-relaxed text-muted">
            <p>
              monk.run is a party geography game. We collect the minimum data needed to run rooms and the all-time
              leaderboard: display name, avatar choice, room PIN, and scores you submit after a verified match.
            </p>
            <p>
              Voice chat uses peer-to-peer WebRTC. Microphone audio is not uploaded to monk.run servers; it flows
              between players after you explicitly join voice.
            </p>
            <p>
              Map search may query OpenStreetMap Nominatim. Street View is provided by Google Maps Platform when a
              server API key is configured. Their privacy policies apply to those services.
            </p>
            <p>
              Peer connections may use a public PeerJS broker and STUN/TURN servers you configure. Do not share
              personal data in lobby chat that you would not say in a public party.
            </p>
            <p>Leaderboard entries can be removed on request by contacting the operator of your deployment.</p>
          </div>
        ) : (
          <div className="prose-invert mt-6 space-y-4 text-sm leading-relaxed text-muted">
            <p>
              By playing monk.run you agree to use the game for fun, respectful party play. Harassment, hate speech,
              cheating via coordinate leaks, or abuse of shared infrastructure may result in removal from rooms or
              leaderboards.
            </p>
            <p>
              You must comply with Google Maps Platform Terms when Street View is enabled, and with OpenStreetMap
              usage policies for geocoding. Do not scrape, redistribute, or reverse-engineer panorama feeds.
            </p>
            <p>
              monk.run characters, temple lobby, and branding are original. The game is an independent geography party
              experience — not affiliated with any third-party geography-game trademarks.
            </p>
            <p>
              The software is provided as-is for entertainment. Operators who deploy monk.run are responsible for
              their API keys, TURN servers, moderation, and regional compliance (including age-appropriate use).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
