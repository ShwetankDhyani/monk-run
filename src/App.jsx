import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from 'react'
import { migrateVibeToAvatar, resolvePlayerLook } from './data/avatars.js'
import { formatKm, makeRoomCode, normalizeRoomPin } from './lib/scoring.js'
import {
  createRoomController,
  DEFAULT_ROUNDS,
  DEFAULT_ROUND_MS,
  MAX_PLAYERS,
} from './lib/peerRoom.js'
import { createVoiceChat } from './lib/voiceChat.js'
import StreetView from './components/StreetView.jsx'
import GuessMap from './components/GuessMap.jsx'
import { MonkLobby } from './components/MonkLobby.jsx'
import { AvatarPicker } from './components/AvatarPicker.jsx'
import { CinematicOverlay } from './components/CinematicOverlay.jsx'
import { AllTimeLeaderboardButton } from './components/AllTimeLeaderboard.jsx'
import { submitScore } from './lib/leaderboard.js'
import { playerError } from './lib/playerErrors.js'

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
      const look = resolvePlayerLook(p.avatar || p.vibe, p.id, ranked)
      ctx.fillStyle = look.robe
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
  const [avatar, setAvatar] = useState(() => migrateVibeToAvatar(localStorage.getItem('monk-avatar') || localStorage.getItem('monk-vibe') || 'aot-eren'))
  const [cinPhase, setCinPhase] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [room, setRoom] = useState(null)
  const [guess, setGuess] = useState(null)
  const [country, setCountry] = useState('')
  const [copied, setCopied] = useState(false)
  const [chatDraft, setChatDraft] = useState('')
  const chatEndRef = useRef(null)
  const [voice, setVoice] = useState({ muted: true, active: false, peers: [], error: null })
  const [portalHold, setPortalHold] = useState(false)
  const prevPhaseRef = useRef(null)
  const prevRoundIndexRef = useRef(-1)
  const [leaderboardKey, setLeaderboardKey] = useState(0)
  const scoreSubmittedRef = useRef(false)

  const ctrlRef = useRef(null)
  const voiceRef = useRef(null)

  const roundLeft = useCountdown(room?.roundEndsAt, room?.phase === 'playing')
  const lobbyLeft = useCountdown(room?.countdownEndsAt, room?.phase === 'countdown')
  const intermissionLeft = useCountdown(room?.intermissionEndsAt, room?.phase === 'intermission')

  useEffect(() => {
    const ctrl = createRoomController({
      onState: (s) => setRoom(s),
      onError: (msg) => setError(playerError(msg)),
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
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [room?.chat?.length])

  // Phase → screen routing. portalHold is intentionally NOT a dependency:
  // putting it in deps re-ran this effect, cleared the enter timeout, and
  // stuck players forever on the cabin (no Street View).
  useEffect(() => {
    if (!room) return undefined
    const prev = prevPhaseRef.current
    prevPhaseRef.current = room.phase

    if (room.phase === 'lobby' || room.phase === 'countdown') {
      setScreen('cabin')
    }

    if (room.phase === 'playing' && prev !== 'playing') {
      setGuess(null)
      setCountry('')
    }

    if (room.roundIndex !== prevRoundIndexRef.current) {
      prevRoundIndexRef.current = room.roundIndex
      setGuess(null)
      setCountry('')
    }

    // Countdown finished → quick black-hole finish, flash, enter game
    if (prev === 'countdown' && room.phase === 'playing') {
      setPortalHold(true)
      setScreen('cabin')
      const t1 = setTimeout(() => setCinPhase('bh-flash'), 450)
      const t2 = setTimeout(() => {
        setCinPhase('enter-game')
        setPortalHold(false)
        setScreen('game')
      }, 580)
      const t3 = setTimeout(() => setCinPhase(null), 1600)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
      }
    }

    if (room.phase === 'reveal' && prev === 'playing') {
      setCinPhase('enter-reveal')
      const t = setTimeout(() => setCinPhase(null), 1100)
      return () => clearTimeout(t)
    }

    if (room.phase === 'podium' && prev !== 'podium') {
      setCinPhase('enter-podium')
      scoreSubmittedRef.current = false
      const t = setTimeout(() => setCinPhase(null), 1200)
      return () => clearTimeout(t)
    }

    if (
      (room.phase === 'playing' ||
        room.phase === 'reveal' ||
        room.phase === 'intermission' ||
        room.phase === 'loading-round' ||
        room.phase === 'podium') &&
      prev !== 'countdown'
    ) {
      setPortalHold(false)
      if (prev === 'intermission' && room.phase === 'playing') {
        setCinPhase('enter-game')
        const t = setTimeout(() => setCinPhase(null), 1000)
        setScreen('game')
        return () => clearTimeout(t)
      }
      setScreen('game')
    }

    return undefined
  }, [room?.phase, room?.roundIndex])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [room?.chat?.length])

  useEffect(() => {
    if (room?.phase !== 'podium' || scoreSubmittedRef.current) return
    const me = room.players.find((p) => p.id === room.selfId)
    const score = room.scores?.[room.selfId] || 0
    if (!me || score <= 0) return
    scoreSubmittedRef.current = true
    submitScore({ name: me.name, score, roomCode: room.roomCode, avatarId: me.avatar || me.vibe }).then(() => {
      setLeaderboardKey((k) => k + 1)
    })
  }, [room?.phase, room?.selfId, room?.scores, room?.players, room?.roomCode])

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
    setScreen('cabin')
    localStorage.setItem('monk-name', name.trim() || 'Wanderer')
    localStorage.setItem('monk-avatar', avatar)
    try {
      await ctrlRef.current.createRoom({
        name: name.trim() || 'Wanderer',
        avatar,
        vibe,
        code: makeRoomCode(),
      })
    } catch (err) {
      setScreen('landing')
      setError(playerError(err, 'Couldn’t create room. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  const join = async () => {
    setError('')
    setBusy(true)
    setScreen('cabin')
    localStorage.setItem('monk-name', name.trim() || 'Wanderer')
    localStorage.setItem('monk-avatar', avatar)
    try {
      await ctrlRef.current.joinRoom({
        name: name.trim() || 'Wanderer',
        avatar,
        vibe,
        code: normalizeRoomPin(joinCode),
      })
    } catch (err) {
      setScreen('landing')
      setError(playerError(err, 'Couldn’t join — check the PIN and try again.'))
    } finally {
      setBusy(false)
    }
  }

  const copyPin = async () => {
    try {
      await navigator.clipboard.writeText(String(room.roomCode))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('Could not copy PIN')
    }
  }

  const portalActive = room?.phase === 'countdown' || portalHold

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

  useEffect(() => {
    voiceRef.current?.refresh?.()
  }, [room?.players?.length])

  const sendChat = (e) => {
    e?.preventDefault?.()
    const text = chatDraft.trim()
    if (!text) return
    ctrlRef.current?.sendChat(text)
    setChatDraft('')
  }

  const onEmote = useCallback((emoteName) => {
    ctrlRef.current?.emote(emoteName)
  }, [])

  const hostLeft = room?.message === 'Host disconnected.'

  const inLobby =
    room &&
    (room.phase === 'lobby' || room.phase === 'countdown' || portalHold)

  if (screen === 'landing' && !busy && (!room || room.phase === 'boot')) {
    const pinReady = normalizeRoomPin(joinCode).length === 6
    return (
      <div className="flex min-h-full flex-col items-center justify-center overflow-auto bg-ink p-4 pb-6">
        <div className="panel w-full max-w-lg p-6 md:p-8">
          <p className="text-center font-display text-sm font-bold uppercase tracking-[0.3em] text-sky">
            party geoguessr
          </p>
          <h1 className="mt-2 text-center font-display text-5xl font-extrabold tracking-tight text-fog md:text-6xl">
            monk.run
          </h1>
          <p className="mt-3 text-center text-sm text-muted">Voice chat + party GeoGuessr.</p>

          <label className="mt-6 block text-[10px] uppercase tracking-widest text-muted">Your monk name</label>
          <input
            className="input-clean mt-1"
            maxLength={18}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Wanderer"
          />

          <p className="mt-4 text-[10px] uppercase tracking-widest text-muted">Choose your scout</p>
          <AvatarPicker
            value={avatar}
            onChange={(id) => {
              setAvatar(id)
              localStorage.setItem('monk-avatar', id)
            }}
          />
          <p className="mt-2 text-[10px] text-muted">Same character? You get a different robe color in-room.</p>

          <button type="button" className="btn btn-primary mt-6 w-full" disabled={busy} onClick={create}>
            Create room
          </button>
          <p className="mt-2 text-center text-[11px] text-muted">Host gets a 6-digit PIN to share</p>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">or join with PIN</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <label className="block text-[10px] uppercase tracking-widest text-muted">Room PIN</label>
          <input
            className="input-clean mt-1 text-center font-mono text-2xl tracking-[0.35em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={joinCode}
            onChange={(e) => setJoinCode(normalizeRoomPin(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && pinReady && !busy) join()
            }}
            placeholder="000000"
          />
          <button
            type="button"
            className="btn btn-ghost mt-3 w-full"
            disabled={busy || !pinReady}
            onClick={join}
          >
            Join room
          </button>
          {error && (
            <div
              className="mt-4 rounded-xl border border-amber/30 bg-amber/10 px-3 py-2 text-center text-xs text-amber"
              role="status"
            >
              <p>{playerError(error)}</p>
              <button
                type="button"
                className="mt-1 text-[10px] uppercase tracking-wider text-muted underline-offset-2 hover:underline"
                onClick={() => setError('')}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
        <AllTimeLeaderboardButton refreshKey={leaderboardKey} className="mt-5 shrink-0" />
      </div>
    )
  }

  if (!room || room.phase === 'boot') {
    return (
      <div className="grid min-h-full place-items-center bg-ink">
        <p className="animate-pulse text-xs tracking-widest text-sky">CONNECTING…</p>
      </div>
    )
  }

  if (room.phase === 'error') {
    return (
      <div className="flex min-h-full items-center justify-center overflow-auto bg-ink p-4">
        <div className="panel w-full max-w-md p-6 text-center">
          <p className="font-display text-2xl font-bold text-fog">
            {hostLeft ? 'Host left the room' : 'Connection lost'}
          </p>
          <p className="mt-3 text-sm text-muted">
            {playerError(room.message || error, 'Something went wrong. You can head back and try again.')}
          </p>
          <button
            type="button"
            className="btn btn-primary mt-6 w-full"
            onClick={() => {
              setError('')
              ctrlRef.current.destroy()
              setRoom(null)
              setScreen('landing')
              window.location.hash = ''
            }}
          >
            Back to start
          </button>
        </div>
      </div>
    )
  }

  if (inLobby) {
    const inPortal = room.phase === 'countdown' || portalHold
    return (
      <Fragment>
      <div className="flex h-full min-h-full flex-col bg-ink">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="font-display text-xl font-bold text-fog">monk.run</p>
            <p className="text-[10px] uppercase tracking-widest text-muted">
              Temple lobby · {room.players.length}/{MAX_PLAYERS}
              {room.localOnly ? ' · local' : ''}
            </p>
          </div>
          <button
            type="button"
            className="rounded-xl border border-amber/30 bg-black/30 px-4 py-2 text-left disabled:opacity-60"
            onClick={copyPin}
            disabled={inPortal}
            title="Copy PIN"
          >
            <p className="text-[9px] uppercase tracking-[0.25em] text-muted">Room PIN</p>
            <p className="font-mono text-2xl font-bold tracking-[0.2em] text-amber">
              {room.roomCode}
            </p>
            <p className="text-[10px] text-sky">{copied ? 'Copied!' : 'Tap to copy'}</p>
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`btn ${voice.active && !voice.muted ? 'btn-primary' : 'btn-ghost'}`}
              disabled={inPortal}
              onClick={() => {
                if (!voice.active) ensureVoice()
                else voiceRef.current?.toggleMute()
              }}
            >
              {!voice.active ? 'Join voice' : voice.muted ? 'Unmute' : 'Mute mic'}
            </button>
            {room.isHost && room.phase === 'lobby' && (
              <button
                type="button"
                className="btn btn-primary px-8 text-lg font-bold tracking-wide"
                onClick={() =>
                  ctrlRef.current.beginCountdown({
                    rounds: DEFAULT_ROUNDS,
                    roundTimeMs: DEFAULT_ROUND_MS,
                  })
                }
              >
                PLAY
              </button>
            )}
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[1fr_280px]">
          <MonkLobby
            selfId={room.selfId}
            players={room.players}
            lobby={room.lobby || {}}
            onPose={onPose}
            onSmack={onSmack}
            onEmote={onEmote}
            countdownSec={room.phase === 'countdown' ? lobbyLeft : portalHold ? 0 : null}
            portalActive={portalActive}
            countdownStartedAt={room.countdownStartedAt}
            countdownEndsAt={room.countdownEndsAt}
            portalHold={portalHold}
            blackHoleX={room.blackHoleX ?? 640}
            blackHoleY={room.blackHoleY ?? 380}
            focused={!inPortal}
          />
          <aside className="panel flex min-h-0 flex-col gap-3 p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted">Players</p>
            <ul className="space-y-2">
              {room.players.map((p) => {
                const look = resolvePlayerLook(p.avatar || p.vibe, p.id, room.players)
                return (
                  <li key={p.id} className="flex items-center justify-between rounded-lg bg-black/20 px-2 py-2">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: look.robe }} />
                      <span className="font-display text-sm">{p.name}</span>
                      {p.isHost && <span className="text-[9px] uppercase text-amber">host</span>}
                    </span>
                    <span className={`text-[10px] uppercase ${p.connected === false ? 'text-coral' : 'text-mint'}`}>
                      {p.connected === false ? 'away' : 'here'}
                    </span>
                  </li>
                )
              })}
            </ul>

            <p className="text-[10px] uppercase tracking-widest text-muted">Chat</p>
            <ul className="min-h-[72px] max-h-36 flex-1 space-y-1.5 overflow-y-auto rounded-lg bg-black/25 p-2">
              {(room.chat || []).length === 0 && (
                <li className="text-[11px] text-muted">Say hi to the room…</li>
              )}
              {(room.chat || []).map((m) => (
                <li key={m.at + m.id + m.text.slice(0, 8)} className="text-[11px] leading-snug">
                  <span className="font-display text-amber">{m.name}: </span>
                  <span className="text-fog/90">{m.text}</span>
                </li>
              ))}
              <li ref={chatEndRef} />
            </ul>
            <form className="flex gap-2" onSubmit={sendChat}>
              <input
                className="input-clean min-w-0 flex-1 text-sm"
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                placeholder="Message the lobby…"
                maxLength={200}
                disabled={inPortal}
              />
              <button type="submit" className="btn btn-ghost shrink-0 !px-3" disabled={inPortal || !chatDraft.trim()}>
                Send
              </button>
            </form>

            <div className="space-y-1 text-[10px] leading-relaxed text-muted">
              <p>
                Voice:{' '}
                {voice.active
                  ? voice.muted
                    ? 'muted'
                    : `live (${voice.peers.length} linked)`
                  : 'off'}
              </p>
              {voice.error && (
                <p className="rounded-lg border border-amber/20 bg-amber/10 px-2 py-1 text-amber">
                  {playerError(voice.error, 'Voice unavailable right now.')}
                </p>
              )}
              {!room.isHost && room.phase === 'lobby' && !inPortal && (
                <p>Waiting for host to press PLAY…</p>
              )}
              {(error || (room.message && /couldn|try again|didn.t load|hiccup|reach the game/i.test(room.message))) && (
                <div className="rounded-lg border border-amber/25 bg-amber/10 px-2 py-1.5 text-amber" role="status">
                  <p>{playerError(error || room.message)}</p>
                  {error && (
                    <button
                      type="button"
                      className="mt-0.5 text-[9px] uppercase tracking-wider text-muted underline-offset-2 hover:underline"
                      onClick={() => setError('')}
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
      <CinematicOverlay phase={cinPhase} />
      </Fragment>
    )
  }

  if (room.phase === 'podium') {
    return (
      <Fragment>
      <div className="screen-enter flex min-h-full flex-col items-center justify-center overflow-auto bg-ink p-4 pb-6">
        <div className="panel w-full max-w-2xl p-6 md:p-8">
          <h2 className="text-center font-display text-4xl font-extrabold text-mint">Final podium</h2>
          <p className="mt-2 text-center text-xs uppercase tracking-[0.25em] text-muted">room {room.roomCode}</p>
          <ol className="mt-6 space-y-3">
            {ranked.map((p, i) => {
              const look = resolvePlayerLook(p.avatar || p.vibe, p.id, ranked)
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3"
                >
                  <span className="flex items-center gap-3">
                    <span className="font-display text-xl text-amber">{i + 1}</span>
                    <span className="h-3 w-3 rounded-full" style={{ background: look.robe }} />
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
                onError: (msg) => setError(playerError(msg)),
              })
              ctrlRef.current = ctrl
              setError('')
            }}
          >
            New party
          </button>
        </div>
        <AllTimeLeaderboardButton refreshKey={leaderboardKey} className="mt-5 shrink-0" />
      </div>
      <CinematicOverlay phase={cinPhase} />
      </Fragment>
    )
  }

  if ((room.phase === 'reveal' || room.phase === 'intermission') && room.reveal) {
    const selfResult = room.reveal.results.find((r) => r.playerId === room.selfId)
    const isIntermission = room.phase === 'intermission'
    return (
      <Fragment>
      <div className="screen-enter flex min-h-full flex-col bg-ink">
        {isIntermission && room.viewToken && (
          <div className="pointer-events-none absolute inset-0 z-0 opacity-0" aria-hidden>
            <StreetView viewToken={room.viewToken} />
          </div>
        )}
        <div className="relative z-10 grid flex-1 gap-3 p-3 md:grid-cols-2">
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
              {isIntermission ? (
                <div className="mt-4 rounded-xl border border-sky/30 bg-black/30 px-4 py-5 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-muted">Next round</p>
                  {room.intermissionEndsAt > 0 ? (
                    <>
                      <p className="font-display text-4xl font-bold text-sky">{intermissionLeft || 1}s</p>
                      <p className="mt-2 text-xs text-muted">
                        {room.viewToken ? 'Panorama preloading…' : 'Fetching location…'}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 animate-pulse font-display text-xl text-sky">Loading location…</p>
                      <p className="mt-2 text-xs text-muted">Hang tight — the next panorama is on its way.</p>
                    </>
                  )}
                </div>
              ) : room.isHost ? (
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
      <CinematicOverlay phase={cinPhase} />
      </Fragment>
    )
  }

  if (room.phase === 'loading-round') {
    return (
      <Fragment>
      <div className="screen-enter flex min-h-full flex-col items-center justify-center bg-ink p-6">
        <div className="panel max-w-md p-8 text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted">Round {room.roundIndex + 1}</p>
          <p className="mt-2 font-display text-2xl text-sky">Loading panorama…</p>
          <p className="mt-3 animate-pulse font-mono text-xs text-muted">SECURE VIEW TOKEN · STAY READY</p>
        </div>
        {room.viewToken && (
          <div className="pointer-events-none absolute inset-0 opacity-0" aria-hidden>
            <StreetView viewToken={room.viewToken} />
          </div>
        )}
      </div>
      <CinematicOverlay phase={cinPhase} />
      </Fragment>
    )
  }

  // Playing: Street View + always-visible world map (never hide the map behind a button)
  return (
    <Fragment>
    <div className={`screen-enter flex h-full min-h-full flex-col overflow-hidden bg-ink md:flex-row`}>
      <div className="relative min-h-0 flex-1">
        {room.viewToken && <StreetView viewToken={room.viewToken} />}

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
                Search a city to drop a pin, or click the world map directly.
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
    <CinematicOverlay phase={cinPhase} />
    </Fragment>
  )
}
