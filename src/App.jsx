import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MONK_VIBES, getLocation } from './data/locations.js'
import { formatKm, makeRoomCode } from './lib/scoring.js'
import {
  createRoomController,
  DEFAULT_ROUNDS,
  DEFAULT_ROUND_MS,
  MAX_PLAYERS,
} from './lib/peerRoom.js'
import { getMapsApiKey } from './lib/maps.js'
import { createVoiceChat } from './lib/voiceChat.js'
import StreetView from './components/StreetView.jsx'
import GuessMap from './components/GuessMap.jsx'
import CabinLobby from './components/CabinLobby.jsx'

function parseRoomFromHash() {
  const h = window.location.hash.replace(/^#/, '')
  const m = h.match(/(?:room\/)?([a-z]+-\d{2,})/i)
  return m ? m[1].toLowerCase() : ''
}

function useCountdown(endsAt, active) {
  const [left, setLeft] = useState(0)
  useEffect(() => {
    if (!active || !endsAt) {
      setLeft(0)
      return undefined
    }
    const tick = () => setLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 200)
    return () => clearInterval(id)
  }, [endsAt, active])
  return left
}

function ShareCard({ players, scores, roomCode }) {
  const canvasRef = useRef(null)
  const ranked = useMemo(
    () =>
      [...players]
        .map((p) => ({ ...p, score: scores[p.id] || 0 }))
        .sort((a, b) => b.score - a.score),
    [players, scores],
  )

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const w = 1080
    const h = 1350
    c.width = w
    c.height = h
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, '#0b1220')
    g.addColorStop(1, '#102a43')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#38bdf8'
    ctx.font = '800 72px Syne, sans-serif'
    ctx.fillText('monk.run', 80, 140)
    ctx.fillStyle = 'rgba(232,238,247,0.7)'
    ctx.font = '500 28px IBM Plex Mono, monospace'
    ctx.fillText(`ROOM ${roomCode} · FINAL PODIUM`, 80, 200)
    ranked.slice(0, 5).forEach((p, i) => {
      const y = 320 + i * 140
      const vibe = MONK_VIBES.find((v) => v.id === p.vibe) || MONK_VIBES[0]
      ctx.fillStyle = vibe.color
      ctx.beginPath()
      ctx.arc(110, y, 28, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#e8eef7'
      ctx.font = '700 42px Syne, sans-serif'
      ctx.fillText(`${i + 1}. ${p.name}`, 170, y + 12)
      ctx.fillStyle = '#34d399'
      ctx.font = '600 36px IBM Plex Mono, monospace'
      ctx.fillText(String(p.score), 820, y + 12)
    })
    ctx.fillStyle = 'rgba(56,189,248,0.85)'
    ctx.font = '500 24px IBM Plex Mono, monospace'
    ctx.fillText('party geoguessr · voice lobby · smack responsibly', 80, 1260)
  }, [ranked, roomCode])

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="max-h-64 w-full max-w-xs rounded-xl border border-white/10" />
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => {
          const a = document.createElement('a')
          a.download = `monk-run-${roomCode || 'podium'}.png`
          a.href = canvasRef.current.toDataURL('image/png')
          a.click()
        }}
      >
        Download podium card
      </button>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [name, setName] = useState(() => localStorage.getItem('monk-name') || '')
  const [vibe, setVibe] = useState(() => localStorage.getItem('monk-vibe') || 'saffron')
  const [joinCode, setJoinCode] = useState(() => parseRoomFromHash())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [room, setRoom] = useState(null)
  const [guess, setGuess] = useState(null)
  const [country, setCountry] = useState('')
  const [copied, setCopied] = useState(false)
  const [voice, setVoice] = useState({ muted: true, active: false, peers: [], error: null })

  const ctrlRef = useRef(null)
  const voiceRef = useRef(null)

  const roundLeft = useCountdown(room?.roundEndsAt, room?.phase === 'playing')
  const lobbyLeft = useCountdown(room?.countdownEndsAt, room?.phase === 'countdown')

  useEffect(() => {
    const ctrl = createRoomController({
      onState: (s) => setRoom(s),
      onError: (msg) => setError(msg),
    })
    ctrlRef.current = ctrl
    const id = setInterval(() => ctrl.tick(), 200)
    return () => {
      clearInterval(id)
      voiceRef.current?.destroy()
      ctrl.destroy()
    }
  }, [])

  useEffect(() => {
    if (!room?.roomCode) return
    window.location.hash = `room/${room.roomCode}`
  }, [room?.roomCode])

  useEffect(() => {
    if (!room) return
    if (room.phase === 'lobby' || room.phase === 'countdown') setScreen('cabin')
    if (room.phase === 'playing' || room.phase === 'reveal' || room.phase === 'podium') setScreen('game')
    if (room.phase === 'playing') {
      setGuess(null)
      setCountry('')
    }
  }, [room?.phase, room?.roundIndex])

  useEffect(() => {
    voiceRef.current?.refresh?.()
  }, [room?.players?.length])

  const location = useMemo(() => {
    if (!room?.currentLocationId) return null
    return getLocation(room.currentLocationId)
  }, [room?.currentLocationId])

  const selfGuessed = !!(room && room.guesses?.[room.selfId])
  const lockedCount = room ? Object.keys(room.guesses || {}).length : 0

  const ranked = useMemo(() => {
    if (!room) return []
    return [...room.players]
      .map((p) => ({ ...p, score: room.scores?.[p.id] || 0 }))
      .sort((a, b) => b.score - a.score)
  }, [room])

  const ensureVoice = async () => {
    if (!voiceRef.current) {
      voiceRef.current = createVoiceChat({
        getPeer: () => ctrlRef.current?.getPeer?.(),
        getRemotePeerIds: () => ctrlRef.current?.getPeerIds?.() || [],
        selfId: room?.selfId,
        onStatus: (s) =>
          setVoice({
            muted: s.muted,
            active: s.active,
            peers: s.peers || [],
            error: s.error || null,
          }),
      })
    }
    try {
      await voiceRef.current.enableMic()
      voiceRef.current.setMuted(false)
    } catch (err) {
      setVoice((v) => ({ ...v, error: err?.message || 'Mic permission denied' }))
    }
  }

  const create = async () => {
    setError('')
    setBusy(true)
    localStorage.setItem('monk-name', name.trim() || 'Wanderer')
    localStorage.setItem('monk-vibe', vibe)
    await ctrlRef.current.createRoom({
      name: name.trim() || 'Wanderer',
      vibe,
      code: makeRoomCode(),
    })
    setBusy(false)
    setScreen('cabin')
  }

  const join = async () => {
    setError('')
    setBusy(true)
    localStorage.setItem('monk-name', name.trim() || 'Wanderer')
    localStorage.setItem('monk-vibe', vibe)
    try {
      await ctrlRef.current.joinRoom({
        name: name.trim() || 'Wanderer',
        vibe,
        code: joinCode.trim().toLowerCase(),
      })
      setScreen('cabin')
    } catch (err) {
      setError(err?.message || 'Join failed')
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#room/${room.roomCode}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('Could not copy link')
    }
  }

  const lockGuess = useCallback(() => {
    if (!guess || selfGuessed) return
    ctrlRef.current.submitGuess({ lat: guess.lat, lng: guess.lng, country })
  }, [guess, country, selfGuessed])

  const onPose = useCallback((pose) => {
    ctrlRef.current?.sendLobbyPose(pose)
  }, [])

  const onSmack = useCallback((targetId) => {
    ctrlRef.current?.smack(targetId)
  }, [])

  const onEmote = useCallback((emoteName) => {
    ctrlRef.current?.emote(emoteName)
  }, [])

  if (screen === 'landing') {
    return (
      <div className="flex min-h-full items-center justify-center overflow-auto bg-ink p-4">
        <div className="panel w-full max-w-lg p-6 md:p-8">
          <p className="text-center font-display text-sm font-bold uppercase tracking-[0.3em] text-sky">
            party geoguessr
          </p>
          <h1 className="mt-2 text-center font-display text-5xl font-extrabold tracking-tight text-fog md:text-6xl">
            monk.run
          </h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-muted">
            Hop in the chopper lobby, smack your friends on voice chat, then dive into 5 synchronized Street View
            rounds.
          </p>

          <label className="mt-6 block text-[10px] uppercase tracking-widest text-muted">Name</label>
          <input
            className="input-clean mt-1"
            maxLength={18}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pilot"
          />

          <p className="mt-4 text-[10px] uppercase tracking-widest text-muted">Avatar color</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {MONK_VIBES.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVibe(v.id)}
                className={`rounded-full px-3 py-1.5 text-[11px] ${vibe === v.id ? 'ring-2 ring-sky' : 'opacity-70'}`}
                style={{ background: `${v.color}22`, color: v.color, border: `1px solid ${v.color}55` }}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" className="btn btn-primary flex-1" disabled={busy} onClick={create}>
              Create room
            </button>
            <button
              type="button"
              className="btn btn-ghost flex-1"
              disabled={busy || !joinCode.trim()}
              onClick={join}
            >
              Join
            </button>
          </div>
          <input
            className="input-clean mt-3"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toLowerCase())}
            placeholder="room code e.g. cosmic-77"
          />
          {error && <p className="mt-3 text-center text-xs text-coral">{error}</p>}
          <p className="mt-5 text-center text-[10px] text-muted">
            {getMapsApiKey()
              ? 'Google Street View ready'
              : 'No Maps key — playable astral panorama fallback'}
          </p>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="grid min-h-full place-items-center bg-ink">
        <p className="animate-pulse text-xs tracking-widest text-sky">CONNECTING…</p>
      </div>
    )
  }

  if (screen === 'cabin' && (room.phase === 'lobby' || room.phase === 'countdown')) {
    const self = room.players.find((p) => p.id === room.selfId)
    return (
      <div className="flex h-full min-h-full flex-col bg-ink">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="font-display text-xl font-bold text-fog">
              monk.run <span className="text-sky">/{room.roomCode}</span>
            </p>
            <p className="text-[10px] uppercase tracking-widest text-muted">
              Chopper lobby · {room.players.length}/{MAX_PLAYERS}
              {room.localOnly ? ' · local' : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-ghost" onClick={copyLink}>
              {copied ? 'Copied' : 'Invite link'}
            </button>
            <button
              type="button"
              className={`btn ${voice.active && !voice.muted ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                if (!voice.active) ensureVoice()
                else voiceRef.current?.toggleMute()
              }}
            >
              {!voice.active ? 'Join voice' : voice.muted ? 'Unmute' : 'Mute mic'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => ctrlRef.current.setReady(!self?.ready)}
            >
              {self?.ready ? 'Unready' : 'Ready'}
            </button>
            {room.isHost && room.phase === 'lobby' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  ctrlRef.current.beginCountdown({
                    rounds: DEFAULT_ROUNDS,
                    roundTimeMs: DEFAULT_ROUND_MS,
                  })
                }
              >
                Launch ({DEFAULT_ROUNDS} rounds)
              </button>
            )}
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[1fr_280px]">
          <CabinLobby
            selfId={room.selfId}
            players={room.players}
            lobby={room.lobby || {}}
            onPose={onPose}
            onSmack={onSmack}
            onEmote={onEmote}
            countdownSec={room.phase === 'countdown' ? lobbyLeft : null}
            focused
          />
          <aside className="panel flex flex-col gap-3 p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted">Crew</p>
            <ul className="space-y-2">
              {room.players.map((p) => {
                const v = MONK_VIBES.find((x) => x.id === p.vibe) || MONK_VIBES[0]
                return (
                  <li key={p.id} className="flex items-center justify-between rounded-lg bg-black/20 px-2 py-2">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: v.color }} />
                      <span className="font-display text-sm">{p.name}</span>
                    </span>
                    <span className={`text-[10px] uppercase ${p.ready ? 'text-mint' : 'text-muted'}`}>
                      {p.connected === false ? 'away' : p.ready ? 'ready' : 'here'}
                    </span>
                  </li>
                )
              })}
            </ul>
            <div className="mt-auto space-y-2 text-[11px] leading-relaxed text-muted">
              <p>
                Voice:{' '}
                {voice.active
                  ? voice.muted
                    ? 'muted'
                    : `live (${voice.peers.length} linked)`
                  : 'off'}
              </p>
              {voice.error && <p className="text-coral">{voice.error}</p>}
              <p>Emotes: 1 😄 2 😢 3 😠 4 😘</p>
              {!room.isHost && room.phase === 'lobby' && <p>Waiting for host to launch…</p>}
              {error && <p className="text-coral">{error}</p>}
            </div>
          </aside>
        </div>
      </div>
    )
  }

  if (room.phase === 'podium') {
    return (
      <div className="flex min-h-full items-center justify-center overflow-auto bg-ink p-4">
        <div className="panel w-full max-w-2xl p-6 md:p-8">
          <h2 className="text-center font-display text-4xl font-extrabold text-mint">Final podium</h2>
          <p className="mt-2 text-center text-xs uppercase tracking-[0.25em] text-muted">room {room.roomCode}</p>
          <ol className="mt-6 space-y-3">
            {ranked.map((p, i) => {
              const v = MONK_VIBES.find((x) => x.id === p.vibe) || MONK_VIBES[0]
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3"
                >
                  <span className="flex items-center gap-3">
                    <span className="font-display text-xl text-amber">{i + 1}</span>
                    <span className="h-3 w-3 rounded-full" style={{ background: v.color }} />
                    <span className="font-display">{p.name}</span>
                  </span>
                  <span className="font-mono text-mint">{p.score}</span>
                </li>
              )
            })}
          </ol>
          <div className="mt-8">
            <ShareCard players={room.players} scores={room.scores} roomCode={room.roomCode} />
          </div>
          <button
            type="button"
            className="btn btn-primary mt-6 w-full"
            onClick={() => {
              voiceRef.current?.destroy()
              voiceRef.current = null
              ctrlRef.current.destroy()
              setRoom(null)
              setScreen('landing')
              window.location.hash = ''
              const ctrl = createRoomController({
                onState: (s) => setRoom(s),
                onError: (msg) => setError(msg),
              })
              ctrlRef.current = ctrl
            }}
          >
            New party
          </button>
        </div>
      </div>
    )
  }

  if (room.phase === 'reveal' && room.reveal) {
    const selfResult = room.reveal.results.find((r) => r.playerId === room.selfId)
    return (
      <div className="flex min-h-full flex-col bg-ink">
        <div className="grid flex-1 gap-3 p-3 md:grid-cols-2">
          <div className="panel flex min-h-[280px] flex-col p-3">
            <p className="text-[10px] uppercase tracking-widest text-mint">Reveal</p>
            <h3 className="font-display text-2xl text-fog">
              {room.reveal.truth.city}, {room.reveal.truth.country}
            </h3>
            <div className="mt-3 min-h-[240px] flex-1">
              <GuessMap
                mode="reveal"
                truth={room.reveal.truth}
                revealResults={room.reveal.results}
                selfId={room.selfId}
              />
            </div>
          </div>
          <div className="panel flex flex-col gap-3 p-4">
            <p className="font-display text-lg">
              You:{' '}
              <span className="text-mint">{selfResult?.missed ? 'missed' : formatKm(selfResult?.km)}</span>
              {' · '}
              <span className="text-sky">+{selfResult?.score || 0}</span>
            </p>
            <ul className="space-y-2">
              {room.reveal.results.map((r) => (
                <li key={r.playerId} className="flex justify-between rounded-lg bg-black/20 px-3 py-2 text-sm">
                  <span className="font-display">{r.name}</span>
                  <span className="text-muted">
                    {r.missed ? 'missed' : formatKm(r.km)} · <span className="text-mint">{r.score}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-muted">Totals</p>
              {ranked.map((p) => (
                <div key={p.id} className="flex justify-between text-xs text-fog/80">
                  <span>{p.name}</span>
                  <span className="text-sky">{p.score}</span>
                </div>
              ))}
              {room.isHost ? (
                <button
                  type="button"
                  className="btn btn-primary mt-4 w-full"
                  onClick={() => ctrlRef.current.nextRound()}
                >
                  {room.roundIndex + 1 >= room.totalRounds ? 'Podium' : 'Next round'}
                </button>
              ) : (
                <p className="mt-4 text-center text-xs text-muted">Waiting for host…</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Playing: Street View + always-visible world map (never hide the map behind a button)
  return (
    <div className="flex h-full min-h-full flex-col overflow-hidden bg-ink md:flex-row">
      <div className="relative min-h-0 flex-1">
        {location && <StreetView location={location} interactive />}

        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3">
          <div className="pointer-events-auto panel px-3 py-2">
            <p className="font-display text-lg font-bold">monk.run</p>
            <p className="text-[10px] text-muted">
              Round {room.roundIndex + 1}/{room.totalRounds} · locked {lockedCount}/{room.players.length}
            </p>
          </div>
          <div className="pointer-events-auto panel px-4 py-2 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted">Time</p>
            <p className={`font-display text-2xl font-bold ${roundLeft <= 10 ? 'text-coral' : 'text-fog'}`}>
              {roundLeft}s
            </p>
          </div>
          <div className="pointer-events-auto panel max-w-[150px] px-3 py-2">
            {ranked.slice(0, 3).map((p) => (
              <div key={p.id} className="flex justify-between gap-2 text-[10px]">
                <span className="truncate text-muted">{p.name}</span>
                <span className="text-mint">{p.score}</span>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-ghost mt-2 w-full !px-2 !py-1"
              onClick={() => {
                if (!voice.active) ensureVoice()
                else voiceRef.current?.toggleMute()
              }}
            >
              {!voice.active ? 'Voice' : voice.muted ? 'Unmute' : 'Mute'}
            </button>
          </div>
        </header>

        {room.isHost && (
          <button
            type="button"
            className="btn btn-ghost absolute bottom-3 left-3 z-20"
            onClick={() => ctrlRef.current.revealRound()}
          >
            Force reveal
          </button>
        )}
      </div>

      <aside className="z-30 flex max-h-[48vh] w-full shrink-0 flex-col border-t border-sky/30 bg-panel/95 p-3 md:max-h-none md:w-[min(42vw,460px)] md:border-l md:border-t-0">
        {!selfGuessed ? (
          <>
            <div className="mb-2">
              <p className="font-display text-base font-bold text-sky">World map</p>
              <p className="text-[11px] text-muted">
                Street View is on the left. Tap this map to drop your pin, then lock.
              </p>
            </div>
            <div className="min-h-0 flex-1">
              <GuessMap
                mode="guess"
                guess={guess}
                onGuess={setGuess}
                country={country}
                onCountry={setCountry}
                locked={selfGuessed}
                tall
              />
            </div>
            <button
              type="button"
              className="btn btn-primary mt-3 w-full shrink-0"
              disabled={!guess}
              onClick={lockGuess}
            >
              {guess ? 'Lock guess' : 'Drop a pin on the world map first'}
            </button>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="font-display text-xl text-mint">Guess locked</p>
            <p className="text-sm text-muted">
              {lockedCount >= room.players.filter((p) => p.connected !== false).length
                ? 'Everyone in — revealing…'
                : `Waiting · ${lockedCount}/${room.players.length} locked`}
            </p>
            {guess && (
              <p className="font-mono text-xs text-sky">
                Your pin · {guess.lat.toFixed(2)}, {guess.lng.toFixed(2)}
                {country ? ` · ${country}` : ''}
              </p>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}
