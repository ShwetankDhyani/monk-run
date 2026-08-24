/** Monk avatar types + robe palette (duplicate avatars get different robe colors). */
export const MONK_AVATARS = [
  { id: 'monk-male', label: 'Monk', emoji: '🧘' },
  { id: 'monk-female', label: 'Nun', emoji: '🙏' },
  { id: 'monk-baby', label: 'Novice', emoji: '👶' },
  { id: 'monk-bald', label: 'Shaved', emoji: '🪒' },
  { id: 'monk-mustache', label: 'Elder', emoji: '👴' },
  { id: 'monk-mohawk', label: 'Rebel', emoji: '🎸' },
  { id: 'monk-glasses', label: 'Scholar', emoji: '🤓' },
]

export const ROBE_PALETTE = [
  { robe: '#e8943a', sash: '#c9a227', skin: '#ddb896', hair: '#2a1810' },
  { robe: '#c45c4a', sash: '#8b1a1a', skin: '#c9a882', hair: '#1a1008' },
  { robe: '#4a6741', sash: '#8fbc8f', skin: '#ddb896', hair: '#3a2418' },
  { robe: '#5a4a8a', sash: '#9b8ec4', skin: '#e0b898', hair: '#2a1810' },
  { robe: '#8b6914', sash: '#d4af37', skin: '#c9a882', hair: '#1a1008' },
  { robe: '#2a6a7a', sash: '#5ec4d4', skin: '#ddb896', hair: '#2a1810' },
  { robe: '#7a3a5a', sash: '#e8a0b0', skin: '#e0b898', hair: '#4a3020' },
]

export function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/** Pick robe colors; same avatar in room → different palette slot. */
export function resolvePlayerLook(avatarId, playerId, players = []) {
  const id = migrateVibeToAvatar(avatarId)
  const avatar = MONK_AVATARS.find((a) => a.id === id) || MONK_AVATARS[0]
  const sameAvatar = players.filter((p) => migrateVibeToAvatar(p.avatar || p.vibe) === id)
  const idxAmong = Math.max(0, sameAvatar.findIndex((p) => p.id === playerId))
  const colorIdx = (hashStr(playerId) + idxAmong) % ROBE_PALETTE.length
  return { ...avatar, ...ROBE_PALETTE[colorIdx], avatarId: avatar.id }
}

export function migrateVibeToAvatar(vibe) {
  const map = {
    saffron: 'monk-male',
    cyan: 'monk-glasses',
    acid: 'monk-mohawk',
    ember: 'monk-mustache',
    violet: 'monk-female',
  }
  if (MONK_AVATARS.some((a) => a.id === vibe)) return vibe
  return map[vibe] || 'monk-male'
}
