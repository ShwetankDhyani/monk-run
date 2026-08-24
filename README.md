# monk.run

> collect the light. dodge the collapse. chant on the pulse. leave the ego at the portal.

**monk.run** is a browser arcade game wrapped in an acid-trip space ritual — not a screensaver. You pilot a consciousness mote through eight psychedelic realms with score, lives, combos, and a hard fail state.

## How to play

1. Hit **PLAY** (audio needs a gesture).
2. **WASD / arrows** — thrust (momentum physics).
3. **Click or Shift** — dash with a brief shield.
4. **Collect** every saffron consciousness node.
5. **Avoid** red collapsing dimensions (they pull you in; contact costs a life).
6. When nodes are cleared, **press Space on the beat** (top pulse ring) to stabilize the portal, then fly through it.
7. Clear all **8 realms** to awaken. Hit 0 lives or run out of time to dissolve.
8. **R / Enter** reincarnates after game over or victory.

Scoring: node value × combo, beat-accurate portal opens, realm clear bonuses, leftover time.

## Run locally

```bash
npm install
npm run dev
```

Dev server defaults to port **47391**.

```bash
npm run build
npm run preview
```

## Stack

Vanilla JS · WebGL2 backdrop · Canvas gameplay · Web Audio beat clock · Vite

Built for **[monk.run](https://monk.run)**.
