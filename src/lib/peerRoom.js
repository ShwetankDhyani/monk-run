import Peer from 'peerjs'
import { getLocation, pickRoundLocations } from '../data/locations.js'
import { haversineKm, scoreFromDistanceKm } from './scoring.js'

export const MAX_PLAYERS = 5
export const DEFAULT_ROUNDS = 5
export const DEFAULT_ROUND_MS = 90_000

function clone(s) {
  return JSON.parse(JSON.stringify(s))
}

/** Host-authoritative PeerJS room with local solo fallback. */
export function createRoomController({ onState, onError }) {
  let peer = null
  let hostConn = null
  let actingHost = false
  const connections = new Map()
  let state = blank()

  function blank() {
    return {
      phase: 'boot',
      roomCode: '',
      isHost: false,
      selfId: '',
      players: [],
      roundIndex: 0,
      totalRounds: DEFAULT_ROUNDS,
      roundEndsAt: 0,
      locationIds: [],
      currentLocationId: null,
      guesses: {},
      reveal: null,
      scores: {},
      roundTimeMs: DEFAULT_ROUND_MS,
      message: '',
      seed: 0,
      localOnly: false,
    }
  }

  function emit() {
    onState?.(clone(state))
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
    else state.players.push({ ready: false, connected: true, ...p })
  }

  function send(conn, msg) {
    if (!conn?.open) return
    try {
      conn.send(JSON.stringify(msg))
    } catch {
      /* ignore */
    }
  }

  function broadcast(msg) {
    const body = JSON.stringify(msg)
    for (const conn of connections.values()) {
      if (!conn.open) continue
      try {
        conn.send(body)
      } catch {
        /* ignore */
      }
    }
  }

  function snapshotMsg() {
    return {
      type: 'sync',
      state: {
        phase: state.phase,
        roomCode: state.roomCode,
        players: state.players,
        roundIndex: state.roundIndex,
        totalRounds: state.totalRounds,
        roundEndsAt: state.roundEndsAt,
        locationIds: state.locationIds,
        currentLocationId: state.currentLocationId,
        guesses: state.guesses,
        reveal: state.reveal,
        scores: state.scores,
        roundTimeMs: state.roundTimeMs,
        message: state.message,
        seed: state.seed,
      },
    }
  }

  function pushSync() {
    if (actingHost && !state.localOnly) broadcast(snapshotMsg())
    emit()
  }

  function onHostData(fromId, msg) {
    if (msg.type === 'hello') {
      if (state.players.length >= MAX_PLAYERS) {
        send(connections.get(fromId), { type: 'reject', reason: 'Room is full (max 5 monks).' })
        connections.get(fromId)?.close()
        connections.delete(fromId)
        return
      }
      upsertPlayer({
        id: fromId,
        name: String(msg.name || 'Wanderer').slice(0, 18),
        vibe: msg.vibe || 'saffron',
        ready: false,
        connected: true,
      })
      if (state.scores[fromId] == null) state.scores[fromId] = 0
      pushSync()
      return
    }
    if (msg.type === 'ready') {
      upsertPlayer({ id: fromId, ready: !!msg.ready })
      pushSync()
      return
    }
    if (msg.type === 'guess' && state.phase === 'playing') {
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
    }
    if (msg.type === 'reject') fail(msg.reason || 'Rejected')
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
        fail('Lost connection to the room host.')
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

  function bootLocal({ name, vibe, code }) {
    actingHost = true
    state = blank()
    state.phase = 'lobby'
    state.roomCode = code
    state.isHost = true
    state.localOnly = true
    state.selfId = `solo-${Math.random().toString(36).slice(2, 9)}`
    state.message = 'Local mode — multiplayer broker unreachable. Solo still works.'
    state.scores[state.selfId] = 0
    upsertPlayer({ id: state.selfId, name, vibe, ready: true, connected: true, isHost: true })
    emit()
  }

  async function createRoom({ name, vibe, code }) {
    destroy()
    try {
      const opened = await openPeer(`monk-${code}`)
      peer = opened.peer
      actingHost = true
      state = blank()
      state.phase = 'lobby'
      state.roomCode = code
      state.isHost = true
      state.selfId = opened.id
      state.scores[opened.id] = 0
      upsertPlayer({ id: opened.id, name, vibe, ready: true, connected: true, isHost: true })
      peer.on('connection', (conn) => {
        connections.set(conn.peer, conn)
        conn.on('open', () => {
          attach(conn, true)
          send(conn, snapshotMsg())
        })
      })
      peer.on('error', (err) => {
        if (err?.type === 'unavailable-id') fail('Room code already in use. Try another.')
      })
      emit()
    } catch {
      bootLocal({ name, vibe, code })
    }
  }

  async function joinRoom({ name, vibe, code }) {
    destroy()
    try {
      const opened = await openPeer()
      peer = opened.peer
      actingHost = false
      state = blank()
      state.selfId = opened.id
      state.roomCode = code
      state.isHost = false
      state.phase = 'lobby'
      emit()

      const conn = peer.connect(`monk-${code}`, { reliable: true })
      hostConn = conn
      connections.set(conn.peer, conn)

      await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('Host not found. Check the room code.')), 12000)
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
      send(conn, { type: 'hello', name, vibe })
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

  function startGame({ rounds = DEFAULT_ROUNDS, roundTimeMs = DEFAULT_ROUND_MS } = {}) {
    if (!actingHost) return
    const seed = Date.now()
    const locs = pickRoundLocations(rounds, seed)
    state.seed = seed
    state.totalRounds = locs.length
    state.roundTimeMs = roundTimeMs
    state.locationIds = locs.map((l) => l.id)
    state.scores = Object.fromEntries(state.players.map((p) => [p.id, 0]))
    state.reveal = null
    startRound(0)
  }

  function startRound(index) {
    state.roundIndex = index
    state.currentLocationId = state.locationIds[index]
    state.guesses = {}
    state.reveal = null
    state.phase = 'playing'
    state.roundEndsAt = Date.now() + state.roundTimeMs
    state.message = `Round ${index + 1}/${state.totalRounds}`
    pushSync()
  }

  function submitGuess({ lat, lng, country }) {
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
    if (live.length > 0 && live.every((p) => state.guesses[p.id])) revealRound()
  }

  function buildReveal() {
    const truth = getLocation(state.currentLocationId)
    const results = state.players.map((p) => {
      const g = state.guesses[p.id]
      if (!g) {
        return {
          playerId: p.id,
          name: p.name,
          vibe: p.vibe,
          lat: null,
          lng: null,
          country: '',
          km: null,
          score: 0,
          missed: true,
        }
      }
      const km = haversineKm({ lat: g.lat, lng: g.lng }, { lat: truth.lat, lng: truth.lng })
      return {
        playerId: p.id,
        name: p.name,
        vibe: p.vibe,
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
        id: truth.id,
        lat: truth.lat,
        lng: truth.lng,
        country: truth.country,
        city: truth.city,
        hint: truth.hint,
      },
      results,
    }
  }

  function revealRound() {
    if (!actingHost || state.phase !== 'playing') return
    const reveal = buildReveal()
    state.reveal = reveal
    for (const r of reveal.results) {
      state.scores[r.playerId] = (state.scores[r.playerId] || 0) + r.score
    }
    state.phase = 'reveal'
    state.message = 'THE VEIL LIFTS'
    pushSync()
  }

  function tick() {
    if (!actingHost) return
    if (state.phase === 'playing' && Date.now() >= state.roundEndsAt) revealRound()
  }

  function nextRound() {
    if (!actingHost) return
    if (state.roundIndex + 1 >= state.totalRounds) {
      state.phase = 'podium'
      state.message = 'KARMA COMPLETE'
      pushSync()
      return
    }
    startRound(state.roundIndex + 1)
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
  }

  return {
    createRoom,
    joinRoom,
    setReady,
    startGame,
    submitGuess,
    tick,
    revealRound,
    nextRound,
    destroy,
    getState: () => state,
  }
}
