# monk.run

Multiplayer party GeoGuessr — hang out in a **Buddhist temple lobby** as robed monks, talk on **live voice chat**, then get pulled into a **black hole** and out into **5 synchronized Street View rounds**.

## Features

- **6-digit PIN rooms** (up to 5 players) via PeerJS — create a room or join with the PIN
- **Temple lobby** — walk as monks with names above heads, smack friends, emotes 1–4
- **WebRTC voice chat** — Join voice / mute toggle
- **Black hole launch** — host opens the singularity; monks (and hall debris) get stretched and sucked in fast
- **Random location seeding** — crypto seed so even the host doesn't know the rounds
- **GeoGuessr loop** — Street View, pin guess, auto-reveal when everyone locks, podium + share card

## Run

```bash
npm install
npm run dev
```

Open **http://127.0.0.1:47447**

### Optional Google Street View

```bash
cp .env.example .env
# set VITE_GOOGLE_MAPS_API_KEY
```

Without a key, monk.run uses a Google Maps Street View embed (and a satellite backup if the embed is blocked).

## How to play

1. **Create room** (share the 6-digit PIN) or **Join with PIN**
2. **Join voice**, walk the temple hall with other monks and NPCs
3. Host hits **PLAY** → black hole forms from a dot, then pulls everyone in
4. Explore Street View → pin the world map → lock → reveal → next round
5. Final podium + downloadable card

## Stack

Vite · React 19 · Tailwind CSS 4 · Canvas 2D temple lobby · PeerJS (data + voice) · Leaflet · Google Street View (API or embed)

---

Built for [monk.run](https://monk.run)
