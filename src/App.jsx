import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MONK_VIBES, getLocation } from './data/locations.js'
import { formatKm, makeRoomCode } from './lib/scoring.js'
import { createRoomController, DEFAULT_ROUNDS, DEFAULT_ROUND_MS, MAX_PLAYERS } from './lib/peerRoom.js'
import { getMapsApiKey } from './lib/maps.js'
import StreetView from './components/StreetView.jsx'
import ShaderOverlay from './components/ShaderOverlay.jsx'
import GuessMap from './components/GuessMap.jsx'
import VoidMonk from './components/VoidMonk.jsx'

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
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [endsAt, active])
  return left
}

function ShareCard({ players, scores, roomCode }) {
  const canvasRef = useRef(null)
  const ranked = useMemo(() => {
    return [...players]
      .map((p) => ({ ...p, score: scores[p.id] || 0 }))
      .sort((a, b) => b.score - a.score)
  }, [players, scores])

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const w = 1080
    const h = 1350
    c.width = w
    c.height = h
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, '#12081f')
    g.addColorStop(0.5, '#07040f')
    g.addColorStop(1, '#0a1a1c')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#f4a261'
    ctx.font = '800 72px Syne, sans-serif'
    ctx.fillText('monk.run', 80, 140)
    ctx.fillStyle = 'rgba(245,240,255,0.7)'
    ctx.font = '500 28px IBM Plex Mono, monospace'
    ctx.fillText(`ROOM ${roomCode} · KARMA BOARD`, 80, 200)
    ranked.slice(0, 5).forEach((p, i) => {
      const y = 320 + i * 140
      const vibe = MONK_VIBES.find((v) => v.id === p.vibe) || MONK_VIBES[0]
      ctx.fillStyle = vibe.color
      ctx.beginPath()
      ctx.arc(110, y, 28, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f5f0ff'
      ctx.font = '700 42px Syne, sans-serif'
      ctx.fillText(`${i + 1}. ${p.name}`, 170, y + 12)
      ctx.fillStyle = '#80ff72'
      ctx.font = '600 36px IBM Plex Mono, monospace'
      ctx.fillText(String(p.score), 820, y + 12)
    })
    ctx.fillStyle = 'rgba(0,229,255,0.8)'
    ctx.font = '500 24px IBM Plex Mono, monospace'
    ctx.fillText('psychedelic geoguessr · awaken together', 80, 1260)
  }, [ranked, roomCode])

  const download = () => {
    const a = document.createElement('a')
    a.download = `monk-run-${roomCode || 'karma'}.png`
    a.href = canvasRef.current.toDataURL('image/png')
    a.click()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="max-h-64 w-full max-w-xs rounded-xl border border-saffron/30" />
      <button type="button" className="btn-ghost" onClick={download}>
        Download karma card
      </button>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState('landing') // landing | lobby | game
  const [name, setName] = useState(() => localStorage.getItem('monk-name') || '')
  const [vibe, setVibe] = useState(() => localStorage.getItem('monk-vibe') || 'saffron')
  const [joinCode, setJoinCode] = useState(() => parseRoomFromHash())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [room, setRoom] = useState(null)
  const [guess, setGuess] = useState(null)
  const [country, setCountry] = useState('')
  const [mapOpen, setMapOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const controllerRef = useRef(null)

  const secondsLeft = useCountdown(room?.roundEndsAt, room?.phase === 'playing')

  useEffect(() => {
    const ctrl = createRoomController({
      onState: (s) => setRoom(s),
      onError: (msg) => setError(msg),
    })
    controllerRef.current = ctrl
    const id = setInterval(() => ctrl.tick(), 400)
    return () => {
      clearInterval(id)
      ctrl.destroy()
    }
  }, [])

  useEffect(() => {
    if (!room?.roomCode) return
    window.location.hash = `room/${room.roomCode}`
  }, [room?.roomCode])

  useEffect(() => {
    if (room?.phase === 'playing') {
      setGuess(null)
      setCountry('')
      setMapOpen(false)
      setScreen('game')
    }
    if (room?.phase === 'lobby') setScreen('lobby')
    if (room?.phase === 'reveal' || room?.phase === 'podium') setScreen('game')
  }, [room?.phase])

  const location = useMemo(() => {
    if (!room?.currentLocationId) return null
    return getLocation(room.currentLocationId)
  }, [room?.currentLocationId])

  const selfGuessed = !!(room && room.guesses?.[room.selfId])
  const selfResult = room?.reveal?.results?.find((r) => r.playerId === room.selfId)

  const create = async () => {
    setError('')
    setBusy(true)
    localStorage.setItem('monk-name', name.trim() || 'Wanderer')
    localStorage.setItem('monk-vibe', vibe)
    const code = makeRoomCode()
    await controllerRef.current.createRoom({
      name: name.trim() || 'Wanderer',
      vibe,
      code,
    })
    setBusy(false)
    setScreen('lobby')
  }

  const join = async () => {
    setError('')
    setBusy(true)
    localStorage.setItem('monk-name', name.trim() || 'Wanderer')
    localStorage.setItem('monk-vibe', vibe)
    try {
      await controllerRef.current.joinRoom({
        name: name.trim() || 'Wanderer',
        vibe,
        code: joinCode.trim().toLowerCase(),
      })
      setScreen('lobby')
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
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setError('Could not copy link')
    }
  }

  const lockGuess = useCallback(() => {
    if (!guess || selfGuessed) return
    controllerRef.current.submitGuess({
      lat: guess.lat,
      lng: guess.lng,
      country,
    })
    setMapOpen(false)
  }, [guess, country, selfGuessed])

  const ranked = useMemo(() => {
    if (!room) return []
    return [...room.players]
      .map((p) => ({ ...p, score: room.scores?.[p.id] || 0 }))
      .sort((a, b) => b.score - a.score)
  }, [room])

  /* ---------------- LANDING ---------------- */
  if (screen === 'landing') {
    return (
      <div className="relative flex min-h-full items-center justify-center overflow-auto bg-void p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(244,162,97,0.18),transparent_45%),radial-gradient(ellipse_at_70%_80%,rgba(0,229,255,0.12),transparent_40%)]" />
        <div className="panel relative z-10 w-full max-w-lg p-6 md:p-8">
          <p className="text-center text-3xl text-cyan">◎</p>
          <h1 className="mt-2 text-center font-display text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-saffron via-fog to-cyan md:text-6xl">
            monk.run
          </h1>
          <p className="mt-2 text-center font-mono text-[11px] uppercase tracking-[0.28em] text-fog/55">
            multiplayer psychedelic geoguessr
          </p>
          <p className="mt-4 text-center text-sm leading-relaxed text-fog/70">
            Up to {MAX_PLAYERS} monks drop into the same Street View trip. Guess the place. The Void Monk judges your karma.
          </p>

          <label className="mt-6 block font-mono text-[10px] uppercase tracking-widest text-fog/45">Monk name</label>
          <input
            className="input-mystic mt-1 w-full"
            maxLength={18}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Wanderer"
          />

          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-fog/45">Aura</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {MONK_VIBES.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVibe(v.id)}
                className={`rounded-full px-3 py-1.5 font-mono text-[11px] ${
                  vibe === v.id ? 'ring-2 ring-cyan' : 'opacity-70'
                }`}
                style={{ background: `${v.color}33`, color: v.color, border: `1px solid ${v.color}66` }}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" className="btn-mystic flex-1" disabled={busy} onClick={create}>
              Create room
            </button>
            <button
              type="button"
              className="btn-ghost flex-1"
              disabled={busy || !joinCode.trim()}
              onClick={join}
            >
              Join room
            </button>
          </div>
          <input
            className="input-mystic mt-3 w-full"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toLowerCase())}
            placeholder="room code e.g. cosmic-77"
          />
          {error && <p className="mt-3 text-center font-mono text-xs text-ember">{error}</p>}
          <p className="mt-5 text-center font-mono text-[10px] text-fog/35">
            {getMapsApiKey()
              ? 'Google Street View key detected'
              : 'No Maps key — astral biome fallback active (fully playable)'}
          </p>
        </div>
      </div>
    )
  }

  /* ---------------- LOBBY ---------------- */
  if (screen === 'lobby' && room) {
    const self = room.players.find((p) => p.id === room.selfId)
    return (
      <div className="relative flex min-h-full items-center justify-center overflow-auto bg-void p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,229,255,0.12),transparent_50%)]" />
        <div className="panel relative z-10 grid w-full max-w-3xl gap-6 p-6 md:grid-cols-[1fr_0.9fr] md:p-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan">Room</p>
            <h2 className="font-display text-4xl font-extrabold text-saffron">{room.roomCode}</h2>
            <p className="mt-2 font-mono text-xs text-fog/55">
              {room.localOnly ? 'Local solo mode' : `Share link · ${room.players.length}/${MAX_PLAYERS} monks`}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" onClick={copyLink}>
                {copied ? 'Copied' : 'Copy invite link'}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => controllerRef.current.setReady(!(self?.ready))}
              >
                {self?.ready ? 'Unready' : 'Ready'}
              </button>
            </div>
            <ul className="mt-5 space-y-2">
              {room.players.map((p) => {
                const v = MONK_VIBES.find((x) => x.id === p.vibe) || MONK_VIBES[0]
                return (
                  <li key={p.id} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: v.color }} />
                      <span className="font-display text-sm">{p.name}</span>
                      {p.isHost && <span className="font-mono text-[9px] text-saffron">HOST</span>}
                    </span>
                    <span className={`font-mono text-[10px] uppercase ${p.ready ? 'text-acid' : 'text-fog/40'}`}>
                      {p.connected === false ? 'offline' : p.ready ? 'ready' : 'waiting'}
                    </span>
                  </li>
                )
              })}
            </ul>
            {room.isHost && (
              <button
                type="button"
                className="btn-mystic mt-6 w-full"
                onClick={() =>
                  controllerRef.current.startGame({
                    rounds: DEFAULT_ROUNDS,
                    roundTimeMs: DEFAULT_ROUND_MS,
                  })
                }
              >
                Begin ritual · {DEFAULT_ROUNDS} rounds
              </button>
            )}
            {!room.isHost && (
              <p className="mt-6 text-center font-mono text-xs text-fog/45">Waiting for host to begin…</p>
            )}
            {room.message && <p className="mt-3 font-mono text-[11px] text-cyan/70">{room.message}</p>}
            {error && <p className="mt-2 font-mono text-xs text-ember">{error}</p>}
          </div>
          <div className="flex flex-col items-center justify-center">
            <VoidMonk vibe={vibe} mood="idle" seed={room.roomCode.length} />
          </div>
        </div>
      </div>
    )
  }

  /* ---------------- GAME / REVEAL / PODIUM ---------------- */
  if (!room) {
    return (
      <div className="grid min-h-full place-items-center bg-void">
        <p className="font-mono text-xs tracking-widest text-cyan animate-pulse">ALIGNING…</p>
      </div>
    )
  }

  if (room.phase === 'podium') {
    return (
      <div className="relative flex min-h-full items-center justify-center overflow-auto bg-void p-4">
        <ShaderOverlay intensity={0.7} pulse={1} />
        <div className="panel relative z-10 w-full max-w-2xl p-6 md:p-8">
          <h2 className="text-center font-display text-4xl font-extrabold text-acid">KARMA COMPLETE</h2>
          <p className="mt-2 text-center font-mono text-xs uppercase tracking-[0.25em] text-fog/50">
            room {room.roomCode}
          </p>
          <ol className="mt-6 space-y-3">
            {ranked.map((p, i) => {
              const v = MONK_VIBES.find((x) => x.id === p.vibe) || MONK_VIBES[0]
              return (
                <li key={p.id} className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
                  <span className="flex items-center gap-3">
                    <span className="font-display text-xl text-saffron">{i + 1}</span>
                    <span className="h-3 w-3 rounded-full" style={{ background: v.color }} />
                    <span className="font-display">{p.name}</span>
                  </span>
                  <span className="font-mono text-acid">{p.score}</span>
                </li>
              )
            })}
          </ol>
          <div className="mt-8">
            <ShareCard players={room.players} scores={room.scores} roomCode={room.roomCode} />
          </div>
          <button
            type="button"
            className="btn-mystic mt-6 w-full"
            onClick={() => {
              controllerRef.current.destroy()
              setRoom(null)
              setScreen('landing')
              window.location.hash = ''
              const ctrl = createRoomController({
                onState: (s) => setRoom(s),
                onError: (msg) => setError(msg),
              })
              controllerRef.current = ctrl
            }}
          >
            New pilgrimage
          </button>
        </div>
      </div>
    )
  }

  if (room.phase === 'reveal' && room.reveal) {
    return (
      <div className="relative flex min-h-full flex-col bg-void">
        <ShaderOverlay intensity={0.55} pulse={0.8} />
        <div className="relative z-10 grid flex-1 gap-4 p-3 md:grid-cols-2 md:p-5">
          <div className="panel flex min-h-[280px] flex-col p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-acid">Reveal</p>
            <h3 className="font-display text-2xl text-saffron">
              {room.reveal.truth.city}, {room.reveal.truth.country}
            </h3>
            <p className="mt-1 font-mono text-[11px] text-fog/55">{room.reveal.truth.hint}</p>
            <div className="mt-3 min-h-[240px] flex-1">
              <GuessMap
                mode="reveal"
                truth={room.reveal.truth}
                revealResults={room.reveal.results}
                selfId={room.selfId}
              />
            </div>
          </div>
          <div className="panel flex flex-col gap-4 p-4">
            <VoidMonk
              vibe={vibe}
              mood="react"
              score={selfResult?.score ?? 0}
              seed={room.roundIndex + 3}
            />
            <ul className="space-y-2">
              {room.reveal.results.map((r) => (
                <li key={r.playerId} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
                  <span className="font-display text-sm">{r.name}</span>
                  <span className="font-mono text-xs text-fog/70">
                    {r.missed ? 'missed' : formatKm(r.km)} · <span className="text-acid">{r.score}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-fog/40">Live totals</p>
              {ranked.map((p) => (
                <div key={p.id} className="flex justify-between font-mono text-xs text-fog/80">
                  <span>{p.name}</span>
                  <span className="text-cyan">{p.score}</span>
                </div>
              ))}
              {room.isHost ? (
                <button type="button" className="btn-mystic mt-4 w-full" onClick={() => controllerRef.current.nextRound()}>
                  {room.roundIndex + 1 >= room.totalRounds ? 'Final podium' : 'Next round'}
                </button>
              ) : (
                <p className="mt-4 text-center font-mono text-xs text-fog/45">Waiting for host…</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* playing */
  return (
    <div className="relative h-full min-h-full overflow-hidden bg-void">
      {location && <StreetView location={location} interactive={!mapOpen} />}
      <ShaderOverlay intensity={0.45} pulse={selfGuessed ? 0.6 : 0.25} />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-3 md:p-4">
        <div className="pointer-events-auto panel px-3 py-2">
          <p className="font-display text-lg text-saffron">monk.run</p>
          <p className="font-mono text-[10px] text-fog/50">
            Round {room.roundIndex + 1}/{room.totalRounds}
          </p>
        </div>
        <div className="pointer-events-auto panel px-4 py-2 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan">Pulse</p>
          <p className={`font-display text-2xl ${secondsLeft <= 10 ? 'text-ember' : 'text-fog'}`}>{secondsLeft}s</p>
        </div>
        <div className="pointer-events-auto panel max-w-[140px] px-3 py-2">
          {ranked.slice(0, 3).map((p) => (
            <div key={p.id} className="flex justify-between gap-2 font-mono text-[10px]">
              <span className="truncate text-fog/70">{p.name}</span>
              <span className="text-acid">{p.score}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="absolute bottom-3 left-3 z-20 hidden md:block">
        <div className="panel p-3">
          <VoidMonk
            vibe={vibe}
            mood={selfGuessed ? 'locked' : mapOpen ? 'looking' : 'idle'}
            seed={room.roundIndex}
            compact
          />
        </div>
      </div>

      <div className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-2">
        {!selfGuessed && (
          <button type="button" className="btn-mystic" onClick={() => setMapOpen((v) => !v)}>
            {mapOpen ? 'Hide map' : 'Guess'}
          </button>
        )}
        {selfGuessed && (
          <div className="panel px-4 py-2 font-mono text-xs text-acid">Guess locked — waiting for reveal</div>
        )}
        {room.isHost && (
          <button type="button" className="btn-ghost" onClick={() => controllerRef.current.revealRound()}>
            Force reveal
          </button>
        )}
      </div>

      {mapOpen && !selfGuessed && (
        <div className="absolute inset-x-3 bottom-20 z-30 mx-auto max-w-xl md:inset-x-auto md:right-3 md:w-[420px]">
          <div className="panel p-3">
            <GuessMap
              mode="guess"
              guess={guess}
              onGuess={setGuess}
              country={country}
              onCountry={setCountry}
              locked={selfGuessed}
            />
            <button type="button" className="btn-mystic mt-3 w-full" disabled={!guess} onClick={lockGuess}>
              Lock guess
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
