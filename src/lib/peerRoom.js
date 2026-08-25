import Peer from 'peerjs'
import { migrateVibeToAvatar } from '../data/avatars.js'
import { randomBlackHolePos, pickRandomSpawn, clampToFloor } from './templeRoom.js'
import { createGameSession, openRoundView, revealRoundScores } from './gameSession.js'
import { playerError } from './playerErrors.js'

export const MAX_PLAYERS = 5
export const DEFAULT_ROUNDS = 5
export const DEFAULT_ROUND_MS = 90_000
export const LOBBY_COUNTDOWN_MS = 3_000
export const INTERMISSION_MS = 4_500

const DEFAULT_ICE = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
]

/** Parse VITE_ICE_SERVERS JSON, or fall back to public STUN. */
export function resolveIceServers() {
  const raw = import.meta.env?.VITE_ICE_SERVERS
  if (!raw || typeof raw !== 'string') return DEFAULT_ICE
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length) return parsed
  } catch {
    /* ignore bad env */
  }
  return DEFAULT_ICE
}

/** Assign a random walkable spawn, spread from existing lobby positions. */
function assignSpawn(lobby, excludeId = null) {
  const existing = Object.entries(lobby || {})
    .filter(([id, p]) => id !== excludeId && p?.x != null)
    .map(([, p]) => ({ x: p.x, y: p.y }))
  const spot = pickRandomSpawn(existing)
  return {
    x: spot.x,
    y: spot.y,
    dir: spot.dir,
    emote: null,
    emoteUntil: 0,
    hitFlash: 0,
  }
}

function clone(s) {
  return JSON.parse(JSON.stringify(s))
}

/** Host-authoritative PeerJS room: temple lobby → portal countdown → world-guess. */
export function createRoomController({ onState, onError, onEvent }) {
  let peer = null
  let hostConn = null
  let actingHost = false
  const connections = new Map()
  let state = blank()
  let lastLobbyEmit = 0
  let roundLoadGen = 0
  let revealGen = 0
  let pendingRoundIndex = 0
  let revealRetryScheduled = false
  let revealInFlight = false

  function emitLobbyPoses() {
    const now = Date.now()
    if (now - lastLobbyEmit < 40) return
    lastLobbyEmit = now
    emit()
  }

  function blank() {
    return {
      phase: 'boot',
      roomCode: '',
      isHost: false,
      selfId: '',
      players: [],
      lobby: {},
      chat: [],
      countdownEndsAt: 0,
      countdownStartedAt: 0,
      blackHoleX: 640,
      blackHoleY: 380,
      roundIndex: 0,
      totalRounds: DEFAULT_ROUNDS,
      roundEndsAt: 0,
      intermissionEndsAt: 0,
      roundStartedAt: 0,
      viewToken: '',
      guesses: {},
      reveal: null,
      scores: {},
      roundTimeMs: DEFAULT_ROUND_MS,
      message: '',
      localOnly: false,
      myCommit: null,
      revealingStartedAt: 0,
      roundLoadStartedAt: 0,
      phaseStuckSince: 0,
    }
  }

  /** Public sync — never includes seeds, location ids, raw guess coords, or commit tokens. */
  function publicState() {
    return {
      phase: state.phase,
      roomCode: state.roomCode,
      players: state.players,
      lobby: state.lobby,
      chat: state.chat,
      countdownEndsAt: state.countdownEndsAt,
      countdownStartedAt: state.countdownStartedAt,
      blackHoleX: state.blackHoleX,
      blackHoleY: state.blackHoleY,
      roundIndex: state.roundIndex,
      totalRounds: state.totalRounds,
      roundEndsAt: state.roundEndsAt,
      intermissionEndsAt: state.intermissionEndsAt,
      roundStartedAt: state.roundStartedAt,
      viewToken: state.viewToken,
      guesses: publicGuesses(),
      reveal: publicReveal(state.reveal),
      scores: state.scores,
      roundTimeMs: state.roundTimeMs,
      message: state.message,
    }
  }

  /** During play, only broadcast lock flags — not pin coordinates (stops pin-peeking). */
  function publicGuesses() {
    const out = {}
    for (const [id, g] of Object.entries(state.guesses || {})) {
      if (!g) continue
      if (state.phase === 'playing' || state.phase === 'revealing') {
        out[id] = { locked: true, at: g.at || 0 }
      } else {
        out[id] = { locked: true, at: g.at || 0 }
      }
    }
    return out
  }

  function publicReveal(reveal) {
    if (!reveal) return null
    return {
      truth: reveal.truth,
      totals: reveal.totals,
      results: (reveal.results || []).map((r) => ({
        playerId: r.playerId,
        name: r.name,
        vibe: r.vibe,
        avatar: r.avatar,
        lat: r.lat,
        lng: r.lng,
        country: r.country,
        km: r.km,
        score: r.score,
        missed: r.missed,
        total: r.total,
        // commitToken intentionally omitted — delivered privately per player
      })),
    }
  }

  function blankSecrets() {
    return {
      gameSessionId: null,
      hostToken: null,
      locationIds: [],
      currentLocationId: null,
      seed: 0,
    }
  }

  let secrets = blankSecrets()

  function emit() {
    onState?.(clone(state))
  }

  function fire(evt) {
    onEvent?.(evt)
  }

  function fail(msg) {
    const text = playerError(msg)
    state.phase = 'error'
    state.message = text
    onError?.(text)
    emit()
  }

  function upsertPlayer(p) {
    const i = state.players.findIndex((x) => x.id === p.id)
    if (i >= 0) state.players[i] = { ...state.players[i], ...p }
    else {
      state.players.push({ ready: false, connected: true, ...p })
      if (!state.lobby[p.id]) {
        state.lobby[p.id] = assignSpawn(state.lobby, p.id)
      }
    }
  }

  function send(conn, msg) {
    if (!conn?.open) return
    try {
      conn.send(JSON.stringify(msg))
    } catch {
      /* ignore */
    }
  }

  function broadcast(msg, exceptId = null) {
    const body = JSON.stringify(msg)
    for (const [id, conn] of connections) {
      if (id === exceptId || !conn.open) continue
      try {
        conn.send(body)
      } catch {
        /* ignore */
      }
    }
  }

  function snapshotMsg() {
    return { type: 'sync', state: publicState() }
  }

  function pushSync() {
    if (actingHost && !state.localOnly) broadcast(snapshotMsg())
    emit()
  }

  function relay(msg, fromId) {
    if (actingHost) broadcast(msg, fromId)
  }

  function onHostData(fromId, msg) {
    if (msg.type === 'hello') {
      if (state.players.length >= MAX_PLAYERS) {
        send(connections.get(fromId), { type: 'reject', reason: 'Room is full (max 5).' })
        connections.get(fromId)?.close()
        connections.delete(fromId)
        return
      }
      upsertPlayer({
        id: fromId,
        name: String(msg.name || 'Wanderer').slice(0, 18),
        avatar: migrateVibeToAvatar(msg.avatar || msg.vibe || 'aot-eren'),
        vibe: msg.vibe || 'saffron',
        connected: true,
      })
      const idx = state.players.findIndex((p) => p.id === fromId)
      state.lobby[fromId] = assignSpawn(state.lobby, fromId)
      if (state.scores[fromId] == null) state.scores[fromId] = 0
      pushSync()
      return
    }
    if (msg.type === 'ready') {
      upsertPlayer({ id: fromId, ready: !!msg.ready })
      pushSync()
      return
    }
    if (msg.type === 'lobby-pose' && (state.phase === 'lobby' || state.phase === 'countdown')) {
      state.lobby[fromId] = {
        ...(state.lobby[fromId] || assignSpawn(state.lobby, fromId)),
        x: msg.x,
        y: msg.y ?? state.lobby[fromId]?.y ?? 430,
        dir: msg.dir ?? state.lobby[fromId]?.dir ?? 'down',
        speaking: !!msg.speaking,
      }
      broadcast(
        {
          type: 'lobby-pose',
          id: fromId,
          x: msg.x,
          y: msg.y ?? state.lobby[fromId]?.y ?? 430,
          dir: msg.dir ?? 'down',
          speaking: !!msg.speaking,
        },
        fromId,
      )
      emitLobbyPoses()
      return
    }
    if (msg.type === 'smack' && (state.phase === 'lobby' || state.phase === 'countdown')) {
      applySmack(fromId, msg.targetId)
      return
    }
    if (msg.type === 'emote' && (state.phase === 'lobby' || state.phase === 'countdown')) {
      applyEmote(fromId, msg.emote)
      return
    }
    if (msg.type === 'chat') {
      appendChat(fromId, msg.text)
      return
    }
    if (msg.type === 'guess' && state.phase === 'playing') {
      // First lock wins — no revisions until the next round.
      if (state.guesses[fromId]) return
      state.guesses = {
        ...state.guesses,
        [fromId]: {
          lat: Number(msg.lat),
          lng: Number(msg.lng),
          country: msg.country || '',
          at: Date.now(), // host receive time — ignore client clocks
        },
      }
      pushSync()
      autoRevealIfReady()
    }
  }

  function onClientData(msg) {
    if (msg.type === 'commit') {
      // Private leaderboard credential — only accept for self.
      if (msg.playerId && msg.playerId !== state.selfId) return
      state.myCommit = {
        sessionId: String(msg.sessionId || ''),
        commitToken: String(msg.commitToken || ''),
        score: Math.round(Number(msg.score) || 0),
      }
      emit()
      return
    }
    if (msg.type === 'sync') {
      const keepCommit = state.myCommit
      const prevPhase = state.phase
      state = {
        ...state,
        ...msg.state,
        isHost: false,
        selfId: state.selfId,
        localOnly: false,
        myCommit: keepCommit,
      }
      if (msg.state.phase !== prevPhase) {
        state.phaseStuckSince = Date.now()
      }
      emit()
      return
    }
    if (msg.type === 'lobby-pose') {
      state.lobby[msg.id] = {
        ...(state.lobby[msg.id] || assignSpawn(state.lobby, msg.id)),
        x: msg.x,
        y: msg.y ?? state.lobby[msg.id]?.y ?? 430,
        dir: msg.dir ?? state.lobby[msg.id]?.dir ?? 'down',
        speaking: !!msg.speaking,
      }
      emit()
      return
    }
    if (msg.type === 'smack') {
      state.lobby[msg.targetId] = {
        ...(state.lobby[msg.targetId] || assignSpawn(state.lobby, msg.targetId)),
        hitFlash: Date.now() + 400,
        x: msg.tx,
        y: msg.ty,
      }
      fire({ type: 'smack', fromId: msg.fromId, targetId: msg.targetId })
      emit()
      return
    }
    if (msg.type === 'emote') {
      state.lobby[msg.id] = {
        ...(state.lobby[msg.id] || assignSpawn(state.lobby, msg.id)),
        emote: msg.emote,
        emoteUntil: Date.now() + 2500,
      }
      fire({ type: 'emote', id: msg.id, emote: msg.emote })
      emit()
      return
    }
    if (msg.type === 'force-mute' && msg.targetId === state.selfId) {
      fire({ type: 'force-mute', by: msg.by || null })
      return
    }
    if (msg.type === 'reject') fail(msg.reason || 'Rejected')
    if (msg.type === 'chat' && msg.entry) {
      state.chat = [...(state.chat || []), msg.entry].slice(-60)
      emit()
    }
  }

  function appendChat(fromId, text) {
    const body = String(text || '').trim().slice(0, 200)
    if (!body) return
    const p = state.players.find((x) => x.id === fromId)
    const entry = { id: fromId, name: p?.name || 'Monk', text: body, at: Date.now() }
    state.chat = [...(state.chat || []), entry].slice(-60)
    broadcast({ type: 'chat', entry })
    emit()
  }


  function applySmack(fromId, targetId) {
    if (!targetId || fromId === targetId) return
    const a = state.lobby[fromId]
    const b = state.lobby[targetId]
    if (!a || !b) return
    const dx = b.x - a.x
    const dy = b.y - a.y
    const d = Math.hypot(dx, dy) || 1
    if (d > 95) return
    const nx = dx / d
    const ny = dy / d
    const tx = clampToFloor(b.x + nx * 28, b.y + ny * 28).x
    const ty = clampToFloor(b.x + nx * 28, b.y + ny * 28).y
    state.lobby[targetId] = { ...b, x: tx, y: ty, hitFlash: Date.now() + 400, emote: 'laugh', emoteUntil: Date.now() + 1200 }
    const payload = { type: 'smack', fromId, targetId, tx, ty }
    broadcast(payload)
    fire(payload)
    emit()
    if (state.phase === 'lobby') pushSync()
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n))
  }

  function applyEmote(id, emote) {
    state.lobby[id] = {
      ...(state.lobby[id] || assignSpawn(state.lobby, id)),
      emote,
      emoteUntil: Date.now() + 2500,
    }
    const payload = { type: 'emote', id, emote }
    broadcast(payload)
    fire(payload)
    emit()
  }

  function attach(conn, hostSide) {
    conn.on('data', (raw) => {
      let msg
      try {
        msg = typeof raw === 'string' ? JSON.parse(raw) : raw
      } catch {
        return
      }
      if (hostSide) onHostData(conn.peer, msg)
      else onClientData(msg)
    })
    conn.on('close', () => {
      connections.delete(conn.peer)
      if (hostSide) {
        state.players = state.players.map((p) =>
          p.id === conn.peer ? { ...p, connected: false } : p,
        )
        pushSync()
      } else if (!actingHost) {
        fail('Host disconnected.')
      }
    })
  }

  function openPeer(id) {
    return new Promise((resolve, reject) => {
      const p = new Peer(id, {
        debug: 0,
        config: {
          iceServers: resolveIceServers(),
        },
      })
      const timer = setTimeout(() => {
        try {
          p.destroy()
        } catch {
          /* */
        }
        reject(new Error('Peer broker timeout'))
      }, 12000)
      p.on('open', (openId) => {
        clearTimeout(timer)
        resolve({ peer: p, id: openId })
      })
      p.on('error', (err) => {
        clearTimeout(timer)
        reject(err)
      })
    })
  }

  function bootLocal({ name, vibe, avatar, code }) {
    actingHost = true
    state = blank()
    secrets = blankSecrets()
    state.phase = 'lobby'
    state.roomCode = code
    state.isHost = true
    state.localOnly = true
    state.selfId = `solo-${Math.random().toString(36).slice(2, 9)}`
    state.message = 'Playing solo — PeerJS broker unreachable; voice needs a live peer connection.'
    state.scores[state.selfId] = 0
    upsertPlayer({ id: state.selfId, name, avatar: migrateVibeToAvatar(avatar || vibe), vibe, connected: true, isHost: true })
    state.lobby[state.selfId] = assignSpawn(state.lobby, state.selfId)
    emit()
  }

  async function createRoom({ name, vibe, avatar, code }) {
    destroy()
    const av = migrateVibeToAvatar(avatar || vibe || 'aot-eren')
    try {
      const opened = await openPeer(`monk-${code}`)
      peer = opened.peer
      actingHost = true
      state = blank()
      secrets = blankSecrets()
      state.phase = 'lobby'
      state.roomCode = code
      state.isHost = true
      state.selfId = opened.id
      state.scores[opened.id] = 0
      upsertPlayer({ id: opened.id, name, avatar: av, vibe, connected: true, isHost: true })
      state.lobby[opened.id] = assignSpawn(state.lobby, opened.id)
        peer.on('connection', (conn) => {
        connections.set(conn.peer, conn)
        conn.on('open', () => {
          attach(conn, true)
          send(conn, snapshotMsg())
        })
      })
      peer.on('error', (err) => {
        if (err?.type === 'unavailable-id') fail('PIN already in use. Create again.')
      })
      emit()
    } catch {
      bootLocal({ name, vibe, avatar: av, code })
    }
  }

  async function joinRoom({ name, vibe, avatar, code }) {
    destroy()
    const av = migrateVibeToAvatar(avatar || vibe || 'aot-eren')
    try {
      const opened = await openPeer()
      peer = opened.peer
      actingHost = false
      state = blank()
      secrets = blankSecrets()
      state.selfId = opened.id
      state.roomCode = code
      state.isHost = false
      state.phase = 'lobby'
      emit()

      const conn = peer.connect(`monk-${code}`, { reliable: true })
      hostConn = conn
      connections.set(conn.peer, conn)

      await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('Host not found. Check the room PIN.')), 12000)
        conn.on('open', () => {
          clearTimeout(t)
          resolve()
        })
        conn.on('error', (e) => {
          clearTimeout(t)
          reject(e)
        })
      })

      attach(conn, false)
      send(conn, { type: 'hello', name, vibe, avatar: av })
    } catch (err) {
      fail(err?.message || 'Could not join room')
      throw err
    }
  }

  function setReady(ready) {
    if (actingHost) {
      upsertPlayer({ id: state.selfId, ready: !!ready })
      pushSync()
    } else {
      send(hostConn, { type: 'ready', ready: !!ready })
    }
  }

  function sendLobbyPose(pose) {
    state.lobby[state.selfId] = {
      ...(state.lobby[state.selfId] || assignSpawn(state.lobby, state.selfId)),
      ...pose,
    }
    if (actingHost) {
      broadcast({ type: 'lobby-pose', id: state.selfId, ...pose })
      emitLobbyPoses()
    } else {
      send(hostConn, { type: 'lobby-pose', ...pose })
    }
  }

  function smack(targetId) {
    if (actingHost) applySmack(state.selfId, targetId)
    else send(hostConn, { type: 'smack', targetId })
  }

  function emote(emoteName) {
    const name = String(emoteName || '').slice(0, 16)
    if (!name) return
    // Optimistic local so the sender always sees their own gesture immediately.
    state.lobby[state.selfId] = {
      ...(state.lobby[state.selfId] || assignSpawn(state.lobby, state.selfId)),
      emote: name,
      emoteUntil: Date.now() + 2500,
    }
    emit()
    if (actingHost) applyEmote(state.selfId, name)
    else send(hostConn, { type: 'emote', emote: name })
  }

  /** Host-only: force another player's mic muted on their client. */
  function forceMute(targetId) {
    if (!actingHost || !targetId || targetId === state.selfId) return
    const payload = { type: 'force-mute', targetId, by: state.selfId }
    broadcast(payload)
    fire(payload)
  }

  function sendChat(text) {
    const body = String(text || '').trim().slice(0, 200)
    if (!body) return
    if (actingHost) appendChat(state.selfId, body)
    else send(hostConn, { type: 'chat', text: body })
  }

  /** Host starts countdown; locations are drawn server-side (never synced to clients). */
  function beginCountdown({ rounds = DEFAULT_ROUNDS, roundTimeMs = DEFAULT_ROUND_MS } = {}) {
    if (!actingHost) return
    if (state.phase !== 'lobby') return
    void beginCountdownAsync({ rounds, roundTimeMs })
  }

  async function beginCountdownAsync({ rounds = DEFAULT_ROUNDS, roundTimeMs = DEFAULT_ROUND_MS } = {}) {
    const bh = randomBlackHolePos()
    state.blackHoleX = bh.x
    state.blackHoleY = bh.y
    state.countdownStartedAt = Date.now()
    state.countdownEndsAt = Date.now() + LOBBY_COUNTDOWN_MS
    state.phase = 'countdown'
    state.roundTimeMs = roundTimeMs
    state.scores = Object.fromEntries(state.players.map((p) => [p.id, 0]))
    state.reveal = null
    state.guesses = {}
    state.viewToken = ''
    state.message = 'Black hole forming…'
    pushSync()

    try {
      const session = await createGameSession(state.roomCode, rounds)
      if (state.phase !== 'countdown') return
      secrets = {
        gameSessionId: session.sessionId,
        hostToken: session.hostToken || '',
        locationIds: session.locationIds || [],
        currentLocationId: null,
        seed: 0,
      }
      state.totalRounds = session.totalRounds || rounds
      pushSync()
    } catch (err) {
      if (state.phase !== 'countdown') return
      state.phase = 'lobby'
      state.countdownStartedAt = 0
      state.countdownEndsAt = 0
      // Recoverable — stay in lobby with a soft notice, never expose infra/npm copy
      state.message = playerError(err, 'Couldn’t start the match. Tap PLAY to try again.')
      emit()
    }
  }

  function cancelPendingReveal() {
    revealGen++
    revealInFlight = false
  }

  /** Sync transition once the next panorama token is ready. */
  function finishRoundStart(index) {
    if (!actingHost) return
    cancelPendingReveal()
    roundLoadGen++
    state.roundIndex = index
    state.guesses = {}
    state.reveal = null
    state.intermissionEndsAt = 0
    state.phase = 'playing'
    state.roundStartedAt = Date.now()
    state.roundEndsAt = Date.now() + state.roundTimeMs
    state.message = `Round ${index + 1}/${state.totalRounds}`
    pushSync()
  }

  function startRound(index) {
    void startRoundAsync(index)
  }

  async function startRoundAsync(index) {
    if (!actingHost) return
    const gen = ++roundLoadGen
    cancelPendingReveal()

    state.roundIndex = index
    state.guesses = {}
    state.reveal = null
    state.intermissionEndsAt = 0
    state.roundEndsAt = 0
    state.phase = 'loading-round'
    state.viewToken = ''
    state.roundLoadStartedAt = Date.now()
    state.phaseStuckSince = Date.now()
    pushSync()

    try {
      const opened = await openRoundView(secrets.gameSessionId, index)
      if (gen !== roundLoadGen) return
      state.viewToken = opened.viewToken
      secrets.currentLocationId = opened.locationId
    } catch (err) {
      if (gen !== roundLoadGen) return
      state.roundLoadStartedAt = 0
      fail(playerError(err, 'Couldn’t load this round. Head back and try PLAY again.'))
      return
    }

    if (gen !== roundLoadGen) return
    state.roundLoadStartedAt = 0
    state.phase = 'playing'
    state.roundStartedAt = Date.now()
    state.roundEndsAt = Date.now() + state.roundTimeMs
    state.message = `Round ${index + 1}/${state.totalRounds}`
    pushSync()
  }

  async function beginIntermissionAsync(nextIndex) {
    if (!actingHost) return
    pendingRoundIndex = nextIndex
    state.phase = 'intermission'
    state.intermissionEndsAt = 0
    state.roundEndsAt = 0
    state.guesses = {}
    state.viewToken = ''
    state.message = `Loading round ${nextIndex + 1}…`
    pushSync()

    try {
      const opened = await openRoundView(secrets.gameSessionId, nextIndex)
      state.viewToken = opened.viewToken
      secrets.currentLocationId = opened.locationId
      state.intermissionEndsAt = Date.now() + INTERMISSION_MS
      state.message = `Round ${nextIndex + 1} in ${Math.ceil(INTERMISSION_MS / 1000)}s`
      pushSync()
    } catch {
      fail('Couldn’t load the next round. Try starting a new match.')
    }
  }

  function submitGuess({ lat, lng, country }) {
    if (state.phase !== 'playing') return
    // First lock wins for self as well.
    if (state.guesses[state.selfId]) return
    const guess = {
      lat: Number(lat),
      lng: Number(lng),
      country: country || '',
      at: Date.now(),
    }
    state.guesses = { ...state.guesses, [state.selfId]: guess }
    if (actingHost) {
      pushSync()
      autoRevealIfReady()
    } else {
      emit()
      send(hostConn, { type: 'guess', lat: guess.lat, lng: guess.lng, country: guess.country })
    }
  }

  function autoRevealIfReady() {
    if (!actingHost || state.phase !== 'playing') return
    const live = state.players.filter((p) => p.connected !== false)
    if (live.length > 0 && live.every((p) => !!state.guesses[p.id])) {
      revealRound()
    }
  }

  async function buildRevealAsync() {
    const guesses = state.players.map((p) => {
      const g = state.guesses[p.id]
      return {
        playerId: p.id,
        name: p.name,
        avatar: p.avatar || p.vibe,
        lat: g?.lat ?? null,
        lng: g?.lng ?? null,
        country: g?.country || '',
      }
    })
    const scored = await revealRoundScores(
      secrets.gameSessionId,
      secrets.hostToken,
      state.roundIndex,
      guesses,
    )
    if (!scored) return null
    const results = scored.results.map((r) => ({
      playerId: r.playerId,
      name: r.name || state.players.find((p) => p.id === r.playerId)?.name || 'Monk',
      vibe: state.players.find((p) => p.id === r.playerId)?.vibe,
      avatar: r.avatar || state.players.find((p) => p.id === r.playerId)?.avatar,
      lat: r.lat,
      lng: r.lng,
      country: r.country || '',
      km: r.km,
      score: r.score,
      missed: !!r.missed,
      commitToken: r.commitToken,
      total: r.total,
    }))
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const ak = a.km == null ? Infinity : a.km
      const bk = b.km == null ? Infinity : b.km
      if (ak !== bk) return ak - bk
      return String(a.playerId).localeCompare(String(b.playerId))
    })
    return {
      truth: scored.truth,
      results,
      totals: scored.totals,
    }
  }

  /** Deliver each player's leaderboard commit privately — never broadcast tokens. */
  function deliverCommits(reveal) {
    const sessionId = secrets.gameSessionId
    if (!sessionId || !reveal?.results) return
    for (const r of reveal.results) {
      if (!r.commitToken || !r.playerId) continue
      const payload = {
        type: 'commit',
        sessionId,
        playerId: r.playerId,
        commitToken: r.commitToken,
        score: r.total,
      }
      if (r.playerId === state.selfId) {
        state.myCommit = {
          sessionId,
          commitToken: r.commitToken,
          score: Math.round(Number(r.total) || 0),
        }
      } else {
        send(connections.get(r.playerId), payload)
      }
    }
  }

  function revealRound() {
    if (state.phase !== 'playing' && state.phase !== 'revealing') return
    cancelPendingReveal()
    void revealRoundAsync()
  }

  async function revealRoundAsync() {
    if (!actingHost) return
    if (state.phase !== 'playing' && state.phase !== 'revealing') return
    if (revealInFlight) return
    revealInFlight = true
    const gen = revealGen
    const idx = state.roundIndex
    if (state.phase === 'playing') {
      state.phase = 'revealing'
      state.roundEndsAt = 0
      state.revealingStartedAt = Date.now()
      state.phaseStuckSince = Date.now()
      state.message = 'Scoring…'
      pushSync()
    }
    try {
      const reveal = await buildRevealAsync()
      if (gen !== revealGen || state.roundIndex !== idx) return
      if (state.phase !== 'revealing') return
      if (!reveal) {
        state.revealingStartedAt = 0
        state.phase = 'playing'
        state.message = 'Couldn’t score — try ending the round again.'
        pushSync()
        return
      }
      deliverCommits(reveal)
      state.reveal = publicReveal(reveal)
      state.viewToken = ''
      state.scores = { ...(reveal.totals || {}) }
      state.phase = 'reveal'
      state.revealingStartedAt = 0
      state.message = 'Results'
      pushSync()
    } catch (err) {
      if (gen !== revealGen || state.roundIndex !== idx) return
      if (state.phase !== 'revealing') return
      state.revealingStartedAt = 0
      state.phase = 'playing'
      state.message = playerError(err, 'Couldn’t score this round. Try ending the round again.')
      pushSync()
    } finally {
      revealInFlight = false
    }
  }

  function clientStuckWatchdog() {
    if (state.phase !== 'loading-round' && state.phase !== 'revealing') {
      state.phaseStuckSince = 0
      return
    }
    if (!state.phaseStuckSince) state.phaseStuckSince = Date.now()
    const elapsed = Date.now() - state.phaseStuckSince
    if (elapsed < 55_000) return
    state.phaseStuckSince = 0
    fail(
      state.phase === 'revealing'
        ? 'Round scoring stalled. Ask the host to retry, or return to the temple.'
        : 'Round load stalled. Return to the temple and start again.',
    )
  }

  function hostStuckWatchdog() {
    if (state.phase === 'revealing' && state.revealingStartedAt > 0) {
      const elapsed = Date.now() - state.revealingStartedAt
      if (elapsed > 32_000 && !revealRetryScheduled && !revealInFlight) {
        revealRetryScheduled = true
        void revealRoundAsync().finally(() => {
          revealRetryScheduled = false
        })
      } else if (elapsed > 65_000) {
        state.revealingStartedAt = 0
        fail('Scoring timed out. Return to the temple and start a new match.')
      }
      return
    }
    if (state.phase === 'loading-round' && state.roundLoadStartedAt > 0) {
      const elapsed = Date.now() - state.roundLoadStartedAt
      if (elapsed > 50_000) {
        state.roundLoadStartedAt = 0
        fail('Round load timed out. Return to the temple and start a new match.')
      }
    }
  }

  function tick() {
    if (!actingHost) {
      clientStuckWatchdog()
      return
    }
    hostStuckWatchdog()
    if (state.phase === 'countdown' && Date.now() >= state.countdownEndsAt) {
      // Wait until game session exists — place picking can finish after the portal animation
      if (!secrets.gameSessionId) {
        state.message = 'Locking worldwide locations…'
        pushSync()
        return
      }
      state.phase = 'loading-round'
      state.countdownEndsAt = 0
      pushSync()
      startRound(0)
      return
    }
    if (
      state.phase === 'intermission' &&
      state.intermissionEndsAt > 0 &&
      state.viewToken &&
      Date.now() >= state.intermissionEndsAt
    ) {
      finishRoundStart(pendingRoundIndex)
      return
    }
    if (state.phase === 'playing') {
      autoRevealIfReady()
      if (state.phase === 'playing' && state.roundEndsAt > 0 && Date.now() >= state.roundEndsAt) {
        revealRound()
      }
    }
  }

  function nextRound() {
    if (!actingHost || state.phase !== 'reveal') return
    if (state.roundIndex + 1 >= state.totalRounds) {
      state.phase = 'podium'
      state.message = 'Final podium'
      state.viewToken = ''
      state.intermissionEndsAt = 0
      pushSync()
      return
    }
    void beginIntermissionAsync(state.roundIndex + 1)
  }

  /**
   * Host sends the party back to the temple lobby for another match.
   * Keeps PeerJS connections, room PIN, and roster — only resets match state.
   */
  function returnToLobby() {
    if (!actingHost) return
    if (state.phase !== 'podium' && state.phase !== 'error') return
    cancelPendingReveal()
    roundLoadGen++
    secrets = blankSecrets()
    state.phase = 'lobby'
    state.message = 'Temple lobby — gather when ready.'
    state.roundIndex = 0
    state.totalRounds = DEFAULT_ROUNDS
    state.roundEndsAt = 0
    state.roundStartedAt = 0
    state.countdownEndsAt = 0
    state.countdownStartedAt = 0
    state.intermissionEndsAt = 0
    state.viewToken = ''
    state.guesses = {}
    state.reveal = null
    state.scores = Object.fromEntries(
      state.players.filter((p) => p.connected !== false).map((p) => [p.id, 0]),
    )
    // Drop seats that disconnected mid-match so PIN slots free up
    state.players = state.players.filter((p) => p.connected !== false)
    state.players = state.players.map((p) => ({ ...p, ready: false }))
    const keep = new Set(state.players.map((p) => p.id))
    for (const id of Object.keys(state.lobby || {})) {
      if (!keep.has(id)) delete state.lobby[id]
    }
    for (const p of state.players) {
      if (!state.lobby[p.id]) state.lobby[p.id] = assignSpawn(state.lobby, p.id)
    }
    state.myCommit = null
    pushSync()
  }

  function destroy() {
    for (const c of connections.values()) {
      try {
        c.close()
      } catch {
        /* */
      }
    }
    connections.clear()
    hostConn = null
    if (peer) {
      try {
        peer.destroy()
      } catch {
        /* */
      }
      peer = null
    }
    actingHost = false
    secrets = blankSecrets()
  }

  return {
    createRoom,
    joinRoom,
    setReady,
    beginCountdown,
    sendLobbyPose,
    smack,
    emote,
    forceMute,
    sendChat,
    submitGuess,
    tick,
    revealRound,
    nextRound,
    returnToLobby,
    destroy,
    getState: () => state,
    getPeer: () => peer,
    getPeerIds: () =>
      state.players
        .filter((p) => p.id !== state.selfId && p.connected !== false && !String(p.id).startsWith('solo-'))
        .map((p) => p.id),
  }
}
