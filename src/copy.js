/**
 * monk.run — player-facing copy
 *
 * Voice: sparse temple myth + clear party UX.
 * Product name stays monk.run.
 */

export const COPY = {
  brand: 'monk.run',
  metaDescription:
    'monk.run — multiplayer globe guesser. Drop into Street View with friends, pin the map, closest wins.',

  landing: {
    kicker: 'A live geography duel',
    tag: 'One street-view frame. A blank globe. Drop your pin before the clock runs out.',
    create: 'Form a squad',
    join: 'Join with PIN',
    back: '← Back',
    nameLabel: 'Your name',
    namePlaceholder: 'Enter your name',
    scoutLabel: 'Your look',
    scoutHint: 'Shared picks wear different robes.',
    openTemple: 'Open the temple',
    pinLabel: 'Room PIN',
    stepInside: 'Step inside',
    dismiss: 'Dismiss',
    howTo: 'How to play',
    settings: 'Settings',
    privacy: 'Privacy',
    terms: 'Terms',
    board: 'All-time board',
    sound: 'Sound',
    hudLive: 'Round live',
    hudBuild: 'build 4.26 · live',
  },

  connecting: 'Crossing…',

  error: {
    hostLeft: 'The host has left.',
    connectionLost: 'The link broke.',
    fallback: 'Something went wrong. Return to the temple and try again.',
    back: 'Return to temple',
  },

  lobby: {
    subtitle: (n, max, local) => `${n}/${max}${local ? ' · local' : ''}`,
    pinLabel: 'PIN',
    copied: 'Copied',
    tapCopy: 'Copy',
    joinVoice: 'Talk',
    unmute: 'Unmute',
    muteMic: 'Mute',
    play: 'START',
    players: 'Who’s here',
    here: 'here',
    away: 'away',
    host: 'host',
    chat: 'Chat',
    chatEmpty: 'No messages yet — say hi.',
    chatPlaceholder: 'Type a message…',
    send: 'Send',
    voiceOff: 'Mic off — tap Talk to broadcast',
    voiceMuted: 'You’re muted',
    voiceLive: (n) => `Live · ${n} hearing you`,
    voiceReconnecting: 'Voice reconnecting…',
    voiceBlocked: 'Mic blocked — allow access to talk.',
    waitingHost: 'Waiting for host…',
    crew: 'Players',
    crewHint: 'Wander, talk, wave — host starts when ready.',
    emptySeat: 'Open',
    you: 'you',
    gather: 'The gathering',
    gatherHint: 'This is where the party lives — talk, wander, catch up. The world waits for PLAY.',
    joinVoiceCta: 'Start talking',
    conversation: 'Messages',
    mutePlayer: 'Mute',
    mutedByHost: 'Host muted your mic',
    voiceHint: 'Anyone can talk. Only the host can mute others.',
  },

  howTo: {
    title: 'How to play',
    close: 'Close',
    steps: [
      {
        title: 'Gather first',
        body: 'Open a room or enter a six-digit PIN. Walk the hall, join voice, chat, wave — hang with your party before anyone falls.',
      },
      {
        title: 'Fall through',
        body: 'The host presses START. The black hole opens and pulls everyone into five shared rounds.',
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
    controls: 'Gathering: WASD / arrows · Space nudge · 1–4 emotes · join voice · chat',
  },

  settings: {
    title: 'Settings',
    close: 'Close',
    sfx: 'Sound effects',
    ambient: 'Atmosphere',
    volume: 'Volume',
    reduceMotion: 'Reduce motion',
    note: 'Atmosphere is optional background audio (off by default). Voice mute lives in the lobby.',
  },

  leaderboard: {
    title: 'Hall of Fame',
    subtitle: 'and Hall of Shame',
    close: 'Close',
    loading: 'Reading the halls…',
    empty: 'No records yet. Finish a match to carve your name.',
    emptyList: 'No entries yet.',
    link: 'Hall of Fame',
    fame: 'Hall of Fame',
    shame: 'Hall of Shame',
    highestScore: 'Highest score',
    highestScoreHint: 'Top 5 match totals',
    closestGuess: 'Closest guess',
    closestGuessHint: 'Top 5 nearest pins',
    lowestScore: 'Lowest score',
    lowestScoreHint: 'Top 5 humblest totals',
    farthestGuess: 'Farthest guess',
    farthestGuessHint: 'Top 5 wildest misses',
  },

  podium: {
    title: 'Match results',
    playAgain: 'Back to lobby',
    waitingHost: 'Waiting for the host to reopen the lobby…',
    leaveParty: 'Leave party',
    download: 'Save podium card',
    shareFooter: 'gathered · fallen · guessed',
    shareHeader: (code) => `ROOM ${code} · MATCH RESULTS`,
  },

  reveal: {
    eyebrow: 'Truth',
    you: 'You',
    youTag: '(you)',
    missed: 'missed',
    totals: 'Standings',
    playerCol: 'Player',
    roundCol: 'Round',
    totalCol: 'Total',
    roundResults: 'This round',
    roundLabel: (i, total) => `Round ${i}/${total}`,
    next: 'Next place',
    opening: 'The next place opens…',
    seeking: 'Seeking a view…',
    hang: 'Hold still — the void is choosing.',
    podium: 'Podium',
    nextRound: 'Next round',
    waitingHost: 'Waiting for host to start…',
    mapLocation: 'Location',
    mapYourGuess: 'Your guess',
    crew: 'Players',
    crewHint: 'Same room. Same mic. Same fall.',
    emptySeat: 'Open seat',
  },

  loading: {
    round: (n) => `Round ${n}`,
    title: 'A place takes shape…',
    scoring: 'Scoring the round…',
    scoringTitle: 'Fair reckoning',
  },

  play: {
    round: (i, total, locked, players) =>
      `Round ${i}/${total} · ${locked}/${players} locked`,
    time: 'Time',
    voice: 'Voice',
    unmute: 'Unmute',
    mute: 'Mute',
    endRound: 'End round',
    editPin: 'Edit pin on map',
    mapTitle: 'World map',
    mapHint: 'Search a place, or tap the map.',
    mapCollapsed: 'Explore the view first — open the map when you are ready to guess.',
    openMap: 'Pin on map',
    backToView: 'Back to location',
    pinPlaced: 'Pin placed — open the map again to lock in',
    closeMap: 'Close',
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
    nameRequired: 'Enter a name to join.',
    nameTaken: 'That name is already in the room — pick another.',
    copy: 'Couldn’t copy the PIN',
    voice: 'Voice unavailable right now.',
    voiceNat:
      'Voice couldn’t reach everyone — often a phone network or strict firewall. Try same Wi‑Fi, or ask the host to set a TURN server (VITE_ICE_SERVERS).',
  },
}

/** Deterministic lobby flavor line per room code. */
export function lobbyFlavor(roomCode = '') {
  const lines = [
    'Share the code. Fill the seats. Then fall.',
    'Walk up, say hey, join voice.',
    'Host hits START when the crew feels ready.',
    'Five places. One party. Start with a hello.',
    'The lounge is for talking. The void is for guessing.',
  ]
  let h = 0
  for (let i = 0; i < roomCode.length; i++) h = (h + roomCode.charCodeAt(i) * (i + 1)) % lines.length
  return lines[h]
}
