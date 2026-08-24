/** AOT scouts in monk robes — sprite traits for canvas lobby + picker. */
export const MONK_AVATARS = [
  {
    id: 'aot-eren',
    label: 'Eren',
    feature: 'eren',
    heightScale: 1.0,
    hair: '#14100c',
    eyes: '#00dcc8',
    skin: '#c89878',
    brow: '#2a1810',
  },
  {
    id: 'aot-mikasa',
    label: 'Mikasa',
    feature: 'mikasa',
    heightScale: 1.02,
    hair: '#1a1410',
    eyes: '#5a5a6a',
    skin: '#f0c8a8',
    brow: '#1a1410',
    scarf: '#8b1a1a',
  },
  {
    id: 'aot-armin',
    label: 'Armin',
    feature: 'armin',
    heightScale: 0.9,
    hair: '#d4b85a',
    eyes: '#3a6a9a',
    skin: '#f5d4b0',
    brow: '#a89040',
  },
  {
    id: 'aot-levi',
    label: 'Levi',
    feature: 'levi',
    heightScale: 0.8,
    hair: '#2a2420',
    eyes: '#3a4a5a',
    skin: '#e0b898',
    brow: '#1a1814',
  },
  {
    id: 'aot-hange',
    label: 'Hange',
    feature: 'hange',
    heightScale: 1.0,
    hair: '#6a5030',
    eyes: '#5a4030',
    skin: '#eecaa0',
    brow: '#5a4030',
  },
  {
    id: 'aot-jean',
    label: 'Jean',
    feature: 'jean',
    heightScale: 1.12,
    hair: '#7a5a30',
    eyes: '#5a5040',
    skin: '#e8c098',
    brow: '#6a5030',
  },
  {
    id: 'aot-historia',
    label: 'Historia',
    feature: 'historia',
    heightScale: 0.74,
    hair: '#f0e8a8',
    eyes: '#4a7ab0',
    skin: '#ffe8d0',
    brow: '#c0b070',
    tiara: '#d4af37',
  },
]

export const ROBE_PALETTE = [
  { robe: '#c87830', sash: '#8b1a1a', hood: '#a86028' },
  { robe: '#b86828', sash: '#c9a227', hood: '#985020' },
  { robe: '#a85820', sash: '#6a3020', hood: '#884818' },
  { robe: '#d08838', sash: '#9b8ec4', hood: '#b07030' },
  { robe: '#c07028', sash: '#d4af37', hood: '#a05820' },
  { robe: '#b86024', sash: '#5ec4d4', hood: '#984818' },
  { robe: '#c87830', sash: '#e8a0b0', hood: '#a86028' },
]

export function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function resolvePlayerLook(avatarId, playerId, players = []) {
  const id = migrateVibeToAvatar(avatarId)
  const avatar = MONK_AVATARS.find((a) => a.id === id) || MONK_AVATARS[0]
  const sameAvatar = players.filter((p) => migrateVibeToAvatar(p.avatar || p.vibe) === id)
  const idxAmong = Math.max(0, sameAvatar.findIndex((p) => p.id === playerId))
  const colorIdx = (hashStr(playerId) + idxAmong) % ROBE_PALETTE.length
  const palette = ROBE_PALETTE[colorIdx]
  return {
    ...avatar,
    ...palette,
    avatarId: avatar.id,
    feature: avatar.feature,
    heightScale: avatar.heightScale,
  }
}

export function migrateVibeToAvatar(vibe) {
  const map = {
    saffron: 'aot-eren',
    cyan: 'aot-armin',
    acid: 'aot-hange',
    ember: 'aot-levi',
    violet: 'aot-mikasa',
    'monk-male': 'aot-eren',
    'monk-female': 'aot-mikasa',
    'monk-baby': 'aot-armin',
    'monk-bald': 'aot-levi',
    'monk-mustache': 'aot-jean',
    'monk-mohawk': 'aot-hange',
    'monk-glasses': 'aot-hange',
  }
  if (MONK_AVATARS.some((a) => a.id === vibe)) return vibe
  return map[vibe] || 'aot-eren'
}
