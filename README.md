# monk.run

Multiplayer party GeoGuessr — hang out in a **Buddhist living-room lobby** as robed monks, talk on **live voice chat**, then get pulled into a **random black hole** and out into **5 synchronized Street View rounds**.

## Features

- **6-digit PIN rooms** (up to 5 players) via PeerJS — create a room or join with the PIN
- **Living-room lobby** — walk as monks with names above heads, smack friends, emotes 1–4
- **WebRTC voice chat** — Join voice / mute toggle
- **Black hole launch** — host hits PLAY; singularity spawns at a random spot, then sucks everyone in
- **All-time top 10 leaderboard** — click to see podium with monk avatars
- **Cheat-resistant rounds** — locations live on the game server; clients get one-time panorama tokens only (no satellite toggle, no external Maps links, no place search)
- **GeoGuessr loop** — Street View, pin guess, auto-reveal when everyone locks, podium + share card

## Run

```bash
npm install
npm run dev
```

Open **http://127.0.0.1:47447**

`npm run dev` starts both the Vite app and the game/leaderboard API (port 47448). **Required for PLAY** — rounds and Street View are served through it.

### Google Street View

Rounds are **fully random worldwide** — each panorama is snapped via the Street View Metadata API (never a fixed place list).

```bash
cp .env.example .env
# optional but recommended:
# GOOGLE_MAPS_API_KEY=...   or   VITE_GOOGLE_MAPS_API_KEY=...
```

With your own Maps key, panoramas render via the JS API. Without one, the server still finds random covered locations (metadata) and serves the public Street View embed at those exact coords.

## How to play

1. **Create room** (share the 6-digit PIN) or **Join with PIN**
2. **Join voice**, walk the living room with other monks
3. Host hits **PLAY** → black hole forms at a random spot, then pulls everyone in
4. Explore Street View → pin the world map → lock → reveal → next round
5. Final podium + downloadable card — your score posts to the all-time board

## Stack

Vite · React 19 · Tailwind CSS 4 · Canvas 2D lobby · PeerJS (data + voice) · Leaflet · Google Street View (API or embed) · Node leaderboard API

---

Built for [monk.run](https://monk.run)
