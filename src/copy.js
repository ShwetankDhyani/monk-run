/**
 * monk.run — player-facing copy (narrative / UX writing desk)
 *
 * Voice: sparse temple myth + clear party UX.
 * One image beats three explanations. No jargon, no "SECURE",
 * no tips that repeat the UI.
 */

export const COPY = {
  brand: 'monk.run',
  metaDescription:
    'monk.run — gather in the temple, fall through the black hole, guess the world with your party.',

  landing: {
    tag: 'Gather. Fall through. Name the place.',
    create: 'Create room',
    join: 'Enter with PIN',
    back: '← Back',
    nameLabel: 'Your name',
    namePlaceholder: 'Wanderer',
    scoutLabel: 'Your scout',
    scoutHint: 'Pick an AOT scout — shared picks wear different robes.',
    openTemple: 'Open the temple',
    pinLabel: 'Room PIN',
    stepInside: 'Step inside',
    dismiss: 'Dismiss',
    howTo: 'How to play',
    settings: 'Settings',
    privacy: 'Privacy',
    terms: 'Terms',
    board: 'All-time board',
  },

  connecting: 'Crossing…',

  error: {
    hostLeft: 'The host has left.',
    connectionLost: 'The link broke.',
    fallback: 'Something went wrong. Return to the temple and try again.',
    back: 'Return to temple',
  },

  lobby: {
    subtitle: (n, max, local) => `Temple · ${n}/${max}${local ? ' · local' : ''}`,
    pinLabel: 'PIN',
    copied: 'Copied',
    tapCopy: 'Copy',
    joinVoice: 'Join voice',
    unmute: 'Unmute',
    muteMic: 'Mute',
    play: 'PLAY',
    players: 'Party',
    here: 'here',
    away: 'away',
    host: 'host',
    chat: 'Chat',
    chatEmpty: 'The temple is quiet.',
    chatPlaceholder: 'Speak…',
    send: 'Send',
    voiceOff: 'Voice off',
    voiceMuted: 'Voice muted',
    voiceLive: (n) => `Voice live · ${n}`,
    voiceReconnecting: 'Voice reconnecting…',
    voiceBlocked: 'Mic blocked — allow access to join voice.',
    waitingHost: 'Waiting on the host…',
  },

  howTo: {
    title: 'How to play',
    close: 'Close',
    steps: [
      {
        title: 'Meet in the temple',
        body: 'Open a room or enter a six-digit PIN. Move, smack, emote — and join voice if you like.',
      },
      {
        title: 'Fall through',
        body: 'The host presses PLAY. The black hole opens and pulls everyone into five shared rounds.',
      },
      {
        title: 'Read the place',
        body: 'Look around: signs, trees, traffic, stone. Then pin where you think you are on the world map.',
      },
      {
        title: 'Lock and learn',
        body: 'Lock your guess. When all are locked — or time ends — the truth appears. Closest wins the round.',
      },
    ],
    controls: 'Lobby: WASD / arrows · Space smack · 1–4 emotes · voice opt-in',
  },

  settings: {
    title: 'Settings',
    close: 'Close',
    sfx: 'Sound',
    volume: 'Volume',
    reduceMotion: 'Reduce motion',
    note: 'Voice mute lives in the lobby. The mic is always opt-in.',
  },

  leaderboard: {
    title: 'All-time board',
    close: 'Close',
    loading: 'Reading the board…',
    empty: 'No names yet. Finish a match to claim a place.',
    link: 'all-time board',
  },

  podium: {
    title: 'Final podium',
    room: (code) => `room ${code}`,
    playAgain: 'Back to temple',
    waitingHost: 'Waiting for the host to reopen the temple…',
    leaveParty: 'Leave party',
    download: 'Save podium card',
    shareFooter: 'gathered · fallen · guessed',
    shareHeader: (code) => `ROOM ${code} · FINAL PODIUM`,
  },

  reveal: {
    eyebrow: 'Truth',
    you: 'You',
    missed: 'missed',
    totals: 'Standings',
    next: 'Next place',
    opening: 'The next place opens…',
    seeking: 'Seeking a view…',
    hang: 'Hold still — the void is choosing.',
    podium: 'Podium',
    nextRound: 'Next round',
    waitingHost: 'Waiting on the host…',
  },

  loading: {
    round: (n) => `Round ${n}`,
    title: 'A place takes shape…',
  },

  play: {
    round: (i, total, locked, players) =>
      `Round ${i}/${total} · ${locked}/${players} locked`,
    time: 'Time',
    voice: 'Voice',
    unmute: 'Unmute',
    mute: 'Mute',
    endRound: 'End round',
    mapTitle: 'World map',
    mapHint: 'Search a place, or click the map.',
    lock: 'Lock guess',
    needPin: 'Drop a pin first',
    locked: 'Guess locked',
    allIn: 'All locked — revealing…',
    waiting: (a, b) => `Waiting · ${a}/${b} locked`,
    yourPin: 'Your pin',
  },

  cinematic: {
    enterGame: 'Falling through…',
    enterReveal: 'The truth',
    enterPodium: 'The ranking',
  },

  map: {
    searchPlaceholder: 'City or place…',
    countryOptional: 'Country (optional)',
    filterCountries: 'Filter countries…',
    noPlace: 'No place found — try another name.',
    searchFailed: 'Search failed',
  },

  legal: {
    privacyTitle: 'Privacy',
    termsTitle: 'Terms',
    effective: 'monk.run · launch build',
    back: '← Back',
  },

  errors: {
    default: 'Something went wrong — try again.',
    network: 'The connection flickered — try again.',
    service: 'Couldn’t reach the temple. Try again.',
    panorama: 'That place didn’t appear. Trying again…',
    pinTaken: 'That PIN is taken — open a new room.',
    mic: 'Microphone blocked — allow access for voice.',
    peer: 'The party link dropped. Rejoin with the PIN.',
    create: 'Couldn’t open the temple. Try again.',
    join: 'Couldn’t enter — check the PIN.',
    copy: 'Couldn’t copy the PIN',
    voice: 'Voice unavailable right now.',
    voiceNat:
      'Voice couldn’t reach everyone — often a strict network or firewall. Try again, or play on the same Wi‑Fi.',
  },
}

/** Deterministic lobby flavor line per room code. */
export function lobbyFlavor(roomCode = '') {
  const lines = [
    'The black hole waits in the floor.',
    'Five places. One party. No maps in hand.',
    'Closer is kinder. Locked is final.',
    'Signs lie less than vibes.',
  ]
  let h = 0
  for (let i = 0; i < roomCode.length; i++) h = (h + roomCode.charCodeAt(i) * (i + 1)) % lines.length
  return lines[h]
}
