/**
 * Original temple scouts — monk.run characters (not third-party IP).
 * Visual traits are original; IDs are stable for saves/leaderboards.
 */
export const MONK_AVATARS = [
  {
    id: 'monk-rift',
    label: 'Rift',
    feature: 'rift',
    heightScale: 1.0,
    hair: '#14100c',
    eyes: '#00dcc8',
    skin: '#c89878',
    brow: '#2a1810',
  },
  {
    id: 'monk-veil',
    label: 'Veil',
    feature: 'veil',
    heightScale: 1.02,
    hair: '#0a0808',
    eyes: '#2a2830',
    skin: '#edd4bc',
    brow: '#0a0808',
    scarf: '#7a1418',
    scarfDark: '#4a080c',
    scarfLight: '#9a2428',
  },
  {
    id: 'monk-lotus',
    label: 'Lotus',
    feature: 'lotus',
    heightScale: 0.9,
    hair: '#d4b85a',
    eyes: '#3a6a9a',
    skin: '#f5d4b0',
    brow: '#a89040',
  },
  {
    id: 'monk-blade',
    label: 'Blade',
    feature: 'blade',
    heightScale: 0.8,
    hair: '#0e0c0a',
    eyes: '#5a7088',
    skin: '#dcc0a0',
    brow: '#0e0c0a',
    cravat: '#f0ece4',
  },
  {
    id: 'monk-lens',
    label: 'Lens',
    feature: 'lens',
    heightScale: 1.0,
    hair: '#6a5030',
    eyes: '#5a4030',
    skin: '#eecaa0',
    brow: '#5a4030',
  },
  {
    id: 'monk-ridge',
    label: 'Ridge',
    feature: 'ridge',
    heightScale: 1.12,
    hair: '#7a5a30',
    eyes: '#5a5040',
    skin: '#e8c098',
    brow: '#6a5030',
  },
  {
    id: 'monk-crown',
    label: 'Crown',
    feature: 'crown',
    heightScale: 0.74,
    hair: '#f0e8a8',
    eyes: '#4a7ab0',
    skin: '#ffe8d0',
    brow: '#c0b070',
    tiara: '#d4af37',
  },
]

export const ROBE_PALETTE = [
  { id: 'saffron', robe: '#e8a020', hood: '#f0b040', sash: '#fff4d0' },
  { id: 'cyan', robe: '#1aa8c8', hood: '#2ec4e0', sash: '#d0f4ff' },
  { id: 'acid', robe: '#7ec820', hood: '#98e038', sash: '#f0ffd0' },
  { id: 'ember', robe: '#d04030', hood: '#e85840', sash: '#ffe0d0' },
  { id: 'violet', robe: '#8050c8', hood: '#9868e0', sash: '#f0e0ff' },
  { id: 'ink', robe: '#2a3040', hood: '#3a4458', sash: '#c8d0e0' },
]

/** @deprecated legacy vibe → avatar migration */
export function migrateVibeToAvatar(vibe) {
  const map = {
    saffron: 'monk-rift',
    cyan: 'monk-lotus',
    acid: 'monk-lens',
    ember: 'monk-blade',
    violet: 'monk-veil',
    'monk-male': 'monk-rift',
    'monk-female': 'monk-veil',
    'monk-baby': 'monk-lotus',
    'monk-bald': 'monk-blade',
    'monk-mustache': 'monk-ridge',
    'monk-mohawk': 'monk-lens',
    'monk-glasses': 'monk-lens',
    'monk-rift': 'monk-rift',
    'monk-veil': 'monk-veil',
    'monk-lotus': 'monk-lotus',
    'monk-blade': 'monk-blade',
    'monk-lens': 'monk-lens',
    'monk-ridge': 'monk-ridge',
    'monk-crown': 'monk-crown',
    eren: 'monk-rift',
    mikasa: 'monk-veil',
    armin: 'monk-lotus',
    levi: 'monk-blade',
    hange: 'monk-lens',
    jean: 'monk-ridge',
    historia: 'monk-crown',
  }
  return map[vibe] || (MONK_AVATARS.some((a) => a.id === vibe) ? vibe : 'monk-rift')
}

export function getAvatar(id) {
  const mid = migrateVibeToAvatar(id)
  return MONK_AVATARS.find((a) => a.id === mid) || MONK_AVATARS[0]
}

export function resolvePlayerLook(avatarId, playerId, players = []) {
  const base = getAvatar(avatarId)
  const same = players.filter((p) => migrateVibeToAvatar(p.avatar || p.vibe) === base.id)
  const idx = Math.max(
    0,
    same.findIndex((p) => p.id === playerId),
  )
  const robe = ROBE_PALETTE[idx % ROBE_PALETTE.length]
  return {
    ...base,
    ...robe,
    heightScale: base.heightScale || 1,
  }
}
