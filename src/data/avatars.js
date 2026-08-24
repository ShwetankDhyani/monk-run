/** AOT scout characters — cinematic portraits + lobby sprite traits. */
export const MONK_AVATARS = [
  {
    id: 'aot-eren',
    label: 'Eren',
    feature: 'eren',
    portrait: '/avatars/aot-eren.png',
    heightCm: 170,
    heightScale: 1.0,
    hair: '#3d2818',
    eyes: '#1f9a62',
    skin: '#e8d4c4',
    brow: '#3a2818',
    jacket: '#5a4030',
    shirt: '#b8a888',
    sash: '#6a5040',
    hood: '#4a3428',
    accent: '#8b6914',
  },
  {
    id: 'aot-mikasa',
    label: 'Mikasa',
    feature: 'mikasa',
    portrait: '/avatars/aot-mikasa.png',
    heightCm: 176,
    heightScale: 1.04,
    hair: '#0f0d0c',
    eyes: '#6a6a78',
    skin: '#f0d0b8',
    brow: '#0f0d0c',
    jacket: '#4a5058',
    shirt: '#6a7078',
    sash: '#8b1a1a',
    scarf: '#7a1515',
    hood: '#3a4048',
    accent: '#2a5080',
  },
  {
    id: 'aot-armin',
    label: 'Armin',
    feature: 'armin',
    portrait: '/avatars/aot-armin.png',
    heightCm: 163,
    heightScale: 0.88,
    hair: '#d4c060',
    eyes: '#2a68a8',
    skin: '#f5dcc0',
    brow: '#a89048',
    jacket: '#4a5058',
    shirt: '#7a8088',
    sash: '#c0a848',
    hood: '#2a5038',
    cape: '#1e4030',
    accent: '#a0a8b0',
  },
  {
    id: 'aot-levi',
    label: 'Levi',
    feature: 'levi',
    portrait: '/avatars/aot-levi.png',
    heightCm: 160,
    heightScale: 0.78,
    hair: '#1a1816',
    eyes: '#3a4858',
    skin: '#dcc0a8',
    brow: '#141210',
    jacket: '#4a5058',
    shirt: '#8a9098',
    sash: '#6a7078',
    hood: '#3a4048',
    cravat: '#f0f0f0',
    accent: '#5a6068',
  },
  {
    id: 'aot-hange',
    label: 'Hange',
    feature: 'hange',
    portrait: '/avatars/aot-hange.png',
    heightCm: 170,
    heightScale: 1.0,
    hair: '#6a5030',
    eyes: '#6a5030',
    skin: '#eecaa0',
    brow: '#5a4028',
    jacket: '#5a6050',
    shirt: '#7a8070',
    sash: '#8a7040',
    hood: '#4a5040',
    accent: '#a08050',
  },
  {
    id: 'aot-jean',
    label: 'Jean',
    feature: 'jean',
    portrait: '/avatars/aot-jean.png',
    heightCm: 190,
    heightScale: 1.14,
    hair: '#8a7858',
    eyes: '#5a5848',
    skin: '#e0c0a0',
    brow: '#6a5840',
    jacket: '#5a5040',
    shirt: '#4a5038',
    sash: '#6a6050',
    hood: '#4a4438',
    accent: '#7a7060',
  },
  {
    id: 'aot-historia',
    label: 'Historia',
    feature: 'historia',
    portrait: '/avatars/aot-historia.png',
    heightCm: 145,
    heightScale: 0.72,
    hair: '#f0e0a8',
    eyes: '#4a78b0',
    skin: '#ffe8d8',
    brow: '#c0b078',
    jacket: '#6a6858',
    shirt: '#9a9888',
    sash: '#a89878',
    hood: '#5a5848',
    tiara: '#d4af37',
    accent: '#c8b888',
  },
]

/** Alternate jacket tones when duplicate characters join the same room. */
export const ROBE_PALETTE = [
  { jacket: '#5a4030', sash: '#6a5040', hood: '#4a3428' },
  { jacket: '#4a5058', sash: '#8b1a1a', hood: '#3a4048' },
  { jacket: '#4a5850', sash: '#2a5038', hood: '#1e4030' },
  { jacket: '#505860', sash: '#8a9098', hood: '#3a4048' },
  { jacket: '#5a6050', sash: '#8a7040', hood: '#4a5040' },
  { jacket: '#5a5448', sash: '#6a6050', hood: '#4a4438' },
  { jacket: '#6a6858', sash: '#a89878', hood: '#5a5848' },
]

export function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function getAvatar(id) {
  const resolved = migrateVibeToAvatar(id)
  return MONK_AVATARS.find((a) => a.id === resolved) || MONK_AVATARS[0]
}

export function getPortraitPath(avatarId) {
  return getAvatar(avatarId).portrait
}

/** Merge character defaults with duplicate-room palette + height scale. */
export function resolvePlayerLook(avatarId, playerId, players = []) {
  const avatar = getAvatar(avatarId)
  const sameAvatar = players.filter((p) => migrateVibeToAvatar(p.avatar || p.vibe) === avatar.id)
  const idxAmong = Math.max(0, sameAvatar.findIndex((p) => p.id === playerId))
  const colorIdx = (hashStr(playerId) + idxAmong) % ROBE_PALETTE.length
  const palette = ROBE_PALETTE[colorIdx]
  return {
    ...avatar,
    robe: palette.jacket,
    hood: palette.hood,
    sash: avatar.scarf || avatar.sash || palette.sash,
    jacket: palette.jacket,
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
