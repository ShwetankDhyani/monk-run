# monk.run

Multiplayer party GeoGuessr — hang out in a **2D chopper lounge**, talk on **live voice chat**, smack each other, then jump into **5 synchronized Street View rounds**.

## Features

- **Private rooms** (up to 5 players) via PeerJS
- **2D chopper lounge lobby** (Among Us vibes) — WASD move, smack, emotes 1–4
- **WebRTC voice chat** — Join voice / mute toggle (room-wide)
- **Synced countdown** then simultaneous jump into Round 1
- **Random location seeding** — crypto seed so even the host doesn't know the rounds
- **GeoGuessr loop** — Street View embed (or Maps API if keyed), pin guess, **auto-reveal when everyone locks**, podium + share card

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

Without a key, the astral panorama fallback is fully playable.

## How to play

1. Create or join a room  
2. **Join voice**, Ready up, wander the cabin  
3. Host hits **Launch** → 5…4…3…2…1…JUMP  
4. Explore → **Guess** → lock pin → reveal → next round  
5. Final podium + downloadable card  

## Stack

Vite · React 19 · Tailwind CSS 4 · Canvas 2D lobby · PeerJS (data + voice) · Leaflet · Google Street View (API or embed)

---

Built for [monk.run](https://monk.run)
