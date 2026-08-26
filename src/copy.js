/**
 * monk.run — player-facing copy (narrative / UX writing desk)
 *
 * Voice: expedition myth + clear party UX. AOT homage in scouts/visuals;
 * product name stays monk.run.
 */

export const COPY = {
  brand: 'monk.run',
  metaDescription:
    'monk.run — Attack on Titan homage party geography. Rally the Survey Corps, breach the gate, scout the world.',

  landing: {
    tag: 'Pick your scout. Breach the gate. Name the place.',
    homage: 'Attack on Titan homage',
    create: 'Form a squad',
    join: 'Join with PIN',
    back: '← Back',
    nameLabel: 'Your name',
    namePlaceholder: 'Enter your name',
    scoutLabel: 'Your scout',
    scoutHint: 'Eren, Mikasa, Levi & more — shared picks wear different capes.',
    openTemple: 'Open the garrison',
    pinLabel: 'Room PIN',
    stepInside: 'Deploy beyond the wall',
    dismiss: 'Dismiss',
    howTo: 'How to play',
    settings: 'Settings',
    privacy: 'Privacy',
    terms: 'Terms',
    board: 'Expedition records',
  },

  connecting: 'Deploying…',

  error: {
    hostLeft: 'The commander has left.',
    connectionLost: 'The link broke.',
    fallback: 'Something went wrong. Return to base and try again.',
    back: 'Return to base',
  },

  lobby: {
    subtitle: (n, max, local) => `${n}/${max} scouts${local ? ' · local' : ''}`,
    pinLabel: 'PIN',
    copied: 'Copied',
    tapCopy: 'Copy',
    joinVoice: 'Talk',
    unmute: 'Unmute',
    muteMic: 'Mute',
    play: 'BREACH',
    players: 'Squad',
    here: 'here',
    away: 'away',
    host: 'commander',
    chat: 'Chat',
    chatEmpty: 'No messages yet — say hi.',
    chatPlaceholder: 'Type a message…',
    send: 'Send',
    voiceOff: 'Mic off — tap Talk to broadcast',
    voiceMuted: 'You’re muted',
    voiceLive: (n) => `Live · ${n} hearing you`,
    voiceReconnecting: 'Voice reconnecting…',
    voiceBlocked: 'Mic blocked — allow access to talk.',
    waitingHost: 'Waiting for commander…',
    crew: 'Squad',
    crewHint: 'Walk the hall, talk, wave — commander breaches when ready.',
    emptySeat: 'Open',
    you: 'you',
    gather: 'Survey Corps HQ',
    gatherHint: 'Rally under the wings — talk, wander, sync. Commander breaches when ready.',
    joinVoiceCta: 'Join comms',
    conversation: 'Messages',
    mutePlayer: 'Mute',
    mutedByHost: 'Commander muted your mic',
    voiceHint: 'Anyone can talk. Only the commander can mute others.',
  },

  howTo: {
    title: 'How to play',
    close: 'Close',
    steps: [
      {
        title: 'Rally first',
        body: 'Open a room or enter a six-digit PIN. Walk the garrison, join voice, chat, wave — sync with your squad before the breach.',
      },
      {
        title: 'Breach the gate',
        body: 'The commander hits BREACH. The colossal gate opens and pulls everyone into five shared recon rounds.',
      },
      {
        title: 'Scout the terrain',
        body: 'Read the ground: signs, trees, traffic, stone. Pin where you think you are on the world map.',
      },
      {
        title: 'Lock and report',
        body: 'Lock your guess. When all are locked — or time ends — command reveals the truth. Closest scout wins the round.',
      },
    ],
    controls: 'Garrison: WASD / arrows · Space nudge · 1–4 emotes · join voice · chat',
  },

  settings: {
    title: 'Settings',
    close: 'Close',
    sfx: 'Sound effects',
    ambient: 'Expedition ambient',
    volume: 'Volume',
    reduceMotion: 'Reduce motion',
    note: 'Ambient is original procedural audio — not licensed anime music. Voice mute lives in the lobby.',
  },

  leaderboard: {
    title: 'Expedition records',
    subtitle: 'Glory & shame',
    close: 'Close',
    loading: 'Reading the archives…',
    empty: 'No records yet. Finish a match to carve your name.',
    emptyList: 'No entries yet.',
    link: 'Expedition records',
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
    shareFooter: 'rallied · breached · scouted',
    shareHeader: (code) => `ROOM ${code} · MATCH RESULTS`,
  },

  reveal: {
    eyebrow: 'Truth',
    you: 'You',
    missed: 'missed',
    totals: 'Standings',
    next: 'Next place',
    opening: 'Command picks the next coordinates…',
    seeking: 'Scouting a view…',
    hang: 'Hold — recon in progress.',
    podium: 'Podium',
    nextRound: 'Next round',
    waitingHost: 'Waiting for host to start…',
    crew: 'Players',
    crewHint: 'Same squad. Same comms. Same breach.',
    emptySeat: 'Open seat',
    you: 'you',
  },

  loading: {
    round: (n) => `Round ${n}`,
    title: 'Scouting coordinates…',
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
    enterGame: 'Breaching the gate…',
    enterReveal: 'Truth revealed',
    enterPodium: 'After-action report',
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
    service: 'Couldn’t reach command. Try again.',
    panorama: 'That place didn’t appear. Trying again…',
    pinTaken: 'That PIN is taken — open a new room.',
    mic: 'Microphone blocked — allow access for voice.',
    peer: 'The party link dropped. Rejoin with the PIN.',
    create: 'Couldn’t open the garrison. Try again.',
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
    'Share the PIN. Fill the squad. Then breach.',
    'Walk up, say hey, join comms.',
    'Commander hits BREACH when the crew is ready.',
    'Five coordinates. One squad. Start with a hello.',
    'The garrison is for talking. The gate is for scouting.',
  ]
  let h = 0
  for (let i = 0; i < roomCode.length; i++) h = (h + roomCode.charCodeAt(i) * (i + 1)) % lines.length
  return lines[h]
}
