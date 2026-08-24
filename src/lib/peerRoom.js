import Peer from 'peerjs'
import { migrateVibeToAvatar } from '../data/avatars.js'
import { randomBlackHolePos, pickRandomSpawn, clampToFloor } from './templeRoom.js'
import { haversineKm, scoreFromDistanceKm } from './scoring.js'
import { createGameSession, openRoundView, fetchRoundTruth } from './gameSession.js'

export const MAX_PLAYERS = 5
export const DEFAULT_ROUNDS = 5
export const DEFAULT_ROUND_MS = 90_000
export const LOBBY_COUNTDOWN_MS = 3_000
export const INTERMISSION_MS = 4_500

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

/** Host-authoritative PeerJS room: temple lobby → portal countdown → GeoGuessr. */
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
    }
  }

  /** Public sync — never includes seeds, location ids, or coordinates. */
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
      guesses: state.guesses,
      reveal: state.reveal,
      scores: state.scores,
      roundTimeMs: state.roundTimeMs,
      message: state.message,
    }
  }

  function blankSecrets() {
    return {
      gameSessionId: '',
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
    state.phase = 'error'
    state.message = msg
    onError?.(msg)
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
      }
      broadcast(
        {
          type: 'lobby-pose',
          id: fromId,
          x: msg.x,
          y: msg.y ?? state.lobby[fromId]?.y ?? 430,
          dir: msg.dir ?? 'down',
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
      if (state.roundStartedAt && msg.at < state.roundStartedAt - 250) return
      state.guesses = {
        ...state.guesses,
        [fromId]: { lat: msg.lat, lng: msg.lng, country: msg.country || '', at: Date.now() },
      }
      pushSync()
      autoRevealIfReady()
    }
  }

  function onClientData(msg) {
    if (msg.type === 'sync') {
      state = {
        ...state,
        ...msg.state,
        isHost: false,
        selfId: state.selfId,
        localOnly: false,
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
    const tx = clampToFloor(b.x + nx * 42, b.y + ny * 42).x
    const ty = clampToFloor(b.x + nx * 42, b.y + ny * 42).y
    state.lobby[targetId] = { ...b, x: tx, y: ty, hitFlash: Date.now() + 400 }
    const payload = { type: 'smack', fromId, targetId, tx, ty }
    broadcast(payload)
    fire(payload)
    emit()
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
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
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
    state.message = 'Local mode — voice/multiplayer broker offline. Cabin + GeoGuessr still work.'
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
    if (actingHost) applyEmote(state.selfId, emoteName)
    else send(hostConn, { type: 'emote', emote: emoteName })
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
        locationIds: session.locationIds,
        currentLocationId: null,
        seed: 0,
      }
      state.totalRounds = session.totalRounds
      pushSync()
    } catch {
      if (state.phase !== 'countdown') return
      state.phase = 'lobby'
      state.countdownStartedAt = 0
      state.countdownEndsAt = 0
      state.message = 'Game server offline — restart with npm run dev (starts API automatically).'
      onError?.(state.message)
      emit()
    }
  }

  function cancelPendingReveal() {
    revealGen++
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
    pushSync()

    try {
      const opened = await openRoundView(secrets.gameSessionId, index)
      if (gen !== roundLoadGen) return
      state.viewToken = opened.viewToken
      secrets.currentLocationId = opened.locationId
    } catch {
      if (gen !== roundLoadGen) return
      fail('Could not load secure round view.')
      return
    }

    if (gen !== roundLoadGen) return
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
      fail('Could not load next round.')
    }
  }

  function submitGuess({ lat, lng, country }) {
    if (state.phase !== 'playing') return
    const guess = { lat, lng, country: country || '', at: Date.now() }
    state.guesses = { ...state.guesses, [state.selfId]: guess }
    if (actingHost) {
      pushSync()
      autoRevealIfReady()
    } else {
      emit()
      send(hostConn, { type: 'guess', ...guess })
    }
  }

  function autoRevealIfReady() {
    if (!actingHost || state.phase !== 'playing') return
    const live = state.players.filter((p) => p.connected !== false)
    const started = state.roundStartedAt || 0
    if (
      live.length > 0 &&
      live.every((p) => {
        const g = state.guesses[p.id]
        return g && (!started || g.at >= started - 250)
      })
    ) {
      revealRound()
    }
  }

  async function buildRevealAsync() {
    const truthLoc = await fetchRoundTruth(secrets.gameSessionId, state.roundIndex)
    if (!truthLoc) return null
    const results = state.players.map((p) => {
      const g = state.guesses[p.id]
      if (!g) {
        return {
          playerId: p.id,
          name: p.name,
          vibe: p.vibe,
        avatar: p.avatar || p.vibe,
          lat: null,
          lng: null,
          country: '',
          km: null,
          score: 0,
          missed: true,
        }
      }
      const km = haversineKm({ lat: g.lat, lng: g.lng }, { lat: truthLoc.lat, lng: truthLoc.lng })
      return {
        playerId: p.id,
        name: p.name,
        vibe: p.vibe,
        avatar: p.avatar || p.vibe,
        lat: g.lat,
        lng: g.lng,
        country: g.country,
        km,
        score: scoreFromDistanceKm(km),
        missed: false,
      }
    })
    results.sort((a, b) => b.score - a.score)
    return {
      truth: {
        id: truthLoc.id,
        lat: truthLoc.lat,
        lng: truthLoc.lng,
        country: truthLoc.country,
        city: truthLoc.city,
      },
      results,
    }
  }

  function revealRound() {
    if (state.phase !== 'playing') return
    void revealRoundAsync()
  }

  async function revealRoundAsync() {
    if (!actingHost || state.phase !== 'playing') return
    const gen = revealGen
    const idx = state.roundIndex
    state.roundEndsAt = 0
    const reveal = await buildRevealAsync()
    if (gen !== revealGen || state.phase !== 'playing' || state.roundIndex !== idx) return
    if (!reveal) return
    state.reveal = reveal
    state.viewToken = ''
    for (const r of reveal.results) {
      state.scores[r.playerId] = (state.scores[r.playerId] || 0) + r.score
    }
    state.phase = 'reveal'
    state.message = 'Results'
    pushSync()
  }

  function tick() {
    if (!actingHost) return
    if (state.phase === 'countdown' && Date.now() >= state.countdownEndsAt) {
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
    sendChat,
    submitGuess,
    tick,
    revealRound,
    nextRound,
    destroy,
    getState: () => state,
    getPeer: () => peer,
    getPeerIds: () => state.players.map((p) => p.id).filter((id) => id !== state.selfId && !String(id).startsWith('solo-')),
  }
}
