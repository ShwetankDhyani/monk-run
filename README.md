# monk.run

Temple lobby. Voice chat. Worldwide Street View rounds. A party geography game built for global launch.

**Art direction:** void navy + brass/jade temple light, Fraunces + Outfit — brand-first landing, atmospheric grain, HUD chips instead of SaaS cards.

> Independent title — **not** affiliated with any third-party geography-game trademarks. Scout pickers use Attack on Titan character names as an homage.

## Features

- **6-digit PIN rooms** (up to 5 players) via PeerJS
- **Temple lobby** — walk, smack, emote, optional voice
- **Black-hole launch** into synchronized Street View rounds
- **Server-authoritative scoring** — guesses scored on the API; leaderboard commits are HMAC-signed
- **Opaque Street View tokens** — prefer panorama IDs; no public truth endpoint
- **How to play / Settings / Privacy / Terms** in-product
- **SFX**, reduce-motion, verified all-time board

## Launch requirements

| Requirement | Why |
|-------------|-----|
| `GOOGLE_MAPS_API_KEY` | Street View Metadata + panorama rendering (restricted key, billing enabled) |
| `MONK_SCORE_SECRET` | HMAC for leaderboard commit tokens |
| HTTPS + TURN (recommended) | Voice/data behind strict NATs |
| Own PeerServer (recommended) | Don’t rely on public PeerJS cloud at scale |

```bash
cp .env.example .env
# set GOOGLE_MAPS_API_KEY and MONK_SCORE_SECRET
npm install
npm run dev          # Vite :47447 + API :47448
```

Open **http://127.0.0.1:47447**

### Production (Docker)

```bash
export GOOGLE_MAPS_API_KEY=...
export MONK_SCORE_SECRET=...
docker compose up --build -d
# serves API + static build on :47448
```

Or:

```bash
npm run build
STATIC_DIR=dist NODE_ENV=production GOOGLE_MAPS_API_KEY=... node server/leaderboard.mjs
```

## How to play

1. Create or join with a PIN  
2. Lobby → host hits PLAY  
3. Explore → pin the map → lock  
4. Server scores the round → podium → host returns the party to the **temple lobby** for a rematch (same PIN; Leave party exits to home)

### Scoring fairness

- Round points are **server-authoritative** (haversine distance → 0–5000). Distance only — no time bonus.
- Reveals are **idempotent** (a raced/retried reveal cannot double-count).
- Guesses are **first-lock** and pin coordinates are **not synced** until reveal (stops pin-peeking).
- All-time board commits are **HMAC + one-shot** and require `MONK_SCORE_SECRET` (never falls back to the Maps key).
- Residual party-game trust: the host still submits guesses to the API; treat ranked competitive play as needing a fully server-side lock path.

### Voice chat

Voice is optional PeerJS mesh audio. Public STUN works on many networks; **strict NATs need a TURN server** via `VITE_ICE_SERVERS` (see `.env.example`). Deploy over HTTPS so browsers allow the mic.

Vite · React 19 · Tailwind 4 · Canvas lobby · PeerJS · Leaflet · Google Street View · Node integrity API

## Compliance notes

- Do **not** enable `ALLOW_MAPS_KEY_SCRAPE` in production  
- Geocoding uses Nominatim — cache/rate-limit at scale; set a proper User-Agent  
- Deploy Privacy & Terms for your operator jurisdiction  

---

Built for [monk.run](https://monk.run)
