# monk.run

Multiplayer party GeoGuessr — hang out in a **temple lobby** as robed monks, talk on **live voice chat**, then get pulled through a **portal** into **5 synchronized Street View rounds**.

## Features

- **Private rooms** (up to 5 players) via PeerJS
- **Temple lobby** — walk as monks, nudge friends, emotes 1–4
- **WebRTC voice chat** — Join voice / mute toggle
- **Portal launch** — host opens the portal; physics suck-in into Round 1
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

1. Create or join a room  
2. **Join voice**, Ready up, walk the temple hall  
3. Host hits **Open portal** → portal forms → monks get pulled in  
4. Explore Street View → pin the world map → lock → reveal → next round  
5. Final podium + downloadable card  

## Stack

Vite · React 19 · Tailwind CSS 4 · Canvas 2D temple lobby · PeerJS (data + voice) · Leaflet · Google Street View (API or embed)

---

Built for [monk.run](https://monk.run)
