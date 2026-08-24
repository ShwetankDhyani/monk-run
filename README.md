# monk.run

> multiplayer psychedelic GeoGuessr — drop into the same street, guess the world, awaken together

**monk.run** is a real-time multiplayer browser game for up to **5 players**. Create a room, share the link, and compete across 5 rounds of distance-based karma scoring while the Void Monk narrates your doom (or enlightenment).

## Play

```bash
npm install
npm run dev
```

Open the printed URL (default **http://127.0.0.1:47447**).

1. Enter a monk name + aura  
2. **Create room** (or join with a code / `#room/cosmic-77` link)  
3. Host hits **Begin ritual**  
4. Explore the panorama → **Guess** → drop a pin → **Lock guess**  
5. Reveal phase shows everyone’s pins flying to the truth  
6. After 5 rounds: podium + downloadable karma card  

### Controls

| Action | How |
|--------|-----|
| Look around (fallback mode) | Drag |
| Open guess map | Guess button |
| Drop pin | Click map |
| Lock | Lock guess |
| Force end round (host) | Force reveal |

## Google Street View (optional)

Without a key, the game uses a fully playable **astral biome fallback** (drag-look panorama + location metadata).

With a key, real Street View loads:

```bash
cp .env.example .env
# set VITE_GOOGLE_MAPS_API_KEY=your_key
npm run dev
```

Enable **Maps JavaScript API** + **Street View Static / panorama** for your key.

## Multiplayer

Rooms sync over **PeerJS** (WebRTC). The host is authoritative for round timing, location seed, and scoring. If the PeerJS broker is unreachable, the app falls back to **local solo mode** so you can still play.

## Stack

Vite · React 19 · Tailwind CSS 4 · PeerJS · Leaflet/CARTO dark map · Canvas shader overlay · optional Google Maps Street View

## Scripts

```bash
npm run dev      # port 47447
npm run build
npm run preview
```

---

◎ built for [monk.run](https://monk.run)
