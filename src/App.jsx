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
import { VoiceMuteButton } from './components/VoiceMuteButton.jsx'
import StreetView from './components/StreetView.jsx'
import GuessMap from './components/GuessMap.jsx'
import { MonkLobby } from './components/MonkLobby.jsx'
import { AvatarPicker } from './components/AvatarPicker.jsx'
import { CinematicOverlay } from './components/CinematicOverlay.jsx'
import { AllTimeLeaderboardButton } from './components/AllTimeLeaderboard.jsx'
import { submitScore } from './lib/leaderboard.js'
import { playerError } from './lib/playerErrors.js'
import { HowToPlayModal } from './components/HowToPlayModal.jsx'
import { SettingsModal } from './components/SettingsModal.jsx'
import { LegalPage } from './components/LegalPage.jsx'
import { Atmosphere, BrandMark } from './components/Atmosphere.jsx'
import { TempleGlobe } from './components/TempleGlobe.jsx'

import { sfx } from './lib/sfx.js'
import { COPY, lobbyFlavor } from './copy.js'

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
        .sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id))),
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
    g.addColorStop(0, '#06080e')
    g.addColorStop(0.45, '#121820')
    g.addColorStop(1, '#1a2a28')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#f0c98a'
    ctx.font = '500 78px Fraunces, serif'
    ctx.fillText('monk.run', 80, 150)
    ctx.fillStyle = 'rgba(230,235,232,0.65)'
    ctx.font = '400 26px Outfit, sans-serif'
    ctx.fillText(COPY.podium.shareHeader(roomCode), 80, 210)
    ranked.slice(0, 5).forEach((p, i) => {
      const y = 320 + i * 140
      const look = resolvePlayerLook(p.avatar || p.vibe, p.id, ranked)
      ctx.fillStyle = look.robe
      ctx.beginPath()
      ctx.arc(110, y, 28, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#e6ebe8'
      ctx.font = '500 42px Fraunces, serif'
      ctx.fillText(`${i + 1}. ${p.name}`, 170, y + 12)
      ctx.fillStyle = '#5ec4b6'
      ctx.font = '500 36px IBM Plex Mono, monospace'
      ctx.fillText(String(p.score), 820, y + 12)
    })
    ctx.fillStyle = 'rgba(212,165,116,0.85)'
    ctx.font = '400 24px Outfit, sans-serif'
    ctx.fillText(COPY.podium.shareFooter, 80, 1260)
  }, [ranked, roomCode])

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="max-h-64 w-full max-w-xs border border-brass/20" />
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
        {COPY.podium.download}
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
  const [showHowTo, setShowHowTo] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [legal, setLegal] = useState(null)
  const [gateMode, setGateMode] = useState(null) // null | 'create' | 'join'
  const commitRef = useRef({ sessionId: '', tokens: {} })
  const [room, setRoom] = useState(null)
  const [guess, setGuess] = useState(null)
  const [pinning, setPinning] = useState(false)
  const [country, setCountry] = useState('')
  const [copied, setCopied] = useState(false)
  const [chatDraft, setChatDraft] = useState('')
  const chatEndRef = useRef(null)
  const [voice, setVoice] = useState({
    muted: true,
    active: false,
    peers: [],
    error: null,
    link: 'idle',
    level: 0,
  })
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
    if (!room?.reveal?.results) return
    // Commit tokens are delivered privately via myCommit — never scraped from shared reveal.
    if (room.myCommit?.commitToken) {
      commitRef.current = {
        sessionId: room.myCommit.sessionId || commitRef.current.sessionId,
        tokens: {
          ...commitRef.current.tokens,
          [room.selfId]: room.myCommit.commitToken,
        },
      }
    }
    sfx.reveal()
  }, [room?.reveal, room?.myCommit, room?.selfId])

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
      setError('')
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
        room.phase === 'revealing' ||
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
    const commit =
      room.myCommit?.commitToken
        ? room.myCommit
        : {
            sessionId: commitRef.current.sessionId,
            commitToken: commitRef.current.tokens[room.selfId] || '',
          }
    submitScore({
      name: me.name,
      score,
      roomCode: room.roomCode,
      avatarId: me.avatar || me.vibe,
      sessionId: commit.sessionId || '',
      playerId: room.selfId,
      commitToken: commit.commitToken || '',
    }).then(() => {
      setLeaderboardKey((k) => k + 1)
    })
  }, [room?.phase, room?.selfId, room?.scores, room?.players, room?.roomCode, room?.myCommit])

  // Rematch: when the party returns to the temple, keep voice mesh warm.
  useEffect(() => {
    if (room?.phase !== 'lobby') return
    scoreSubmittedRef.current = false
    commitRef.current = { sessionId: '', tokens: {} }
    voiceRef.current?.refresh?.()
  }, [room?.phase])

  const selfGuessed = !!(room && room.guesses?.[room.selfId])
  const lockedCount = room ? Object.keys(room.guesses || {}).length : 0

  const ranked = useMemo(() => {
    if (!room) return []
    return [...room.players]
      .map((p) => ({ ...p, score: room.scores?.[p.id] || 0 }))
      .sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)))
  }, [room])

  const ensureVoice = async () => {
    if (!voiceRef.current) {
      voiceRef.current = createVoiceChat({
        getPeer: () => ctrlRef.current?.getPeer?.(),
        getRemotePeerIds: () => ctrlRef.current?.getPeerIds?.() || [],
        selfId: () => ctrlRef.current?.getState?.()?.selfId || room?.selfId,
        onStatus: (s) =>
          setVoice({
            muted: s.muted,
            active: s.active,
            peers: s.peers || [],
            error: s.error || null,
            link: s.link || 'idle',
            level: typeof s.level === 'number' ? s.level : 0,
          }),
      })
    }
    try {
      await voiceRef.current.enableMic()
      voiceRef.current.setMuted(false)
      // Unlock remote playback on the same user gesture (Safari / late streams)
      voiceRef.current.unlockPlayback?.()
      voiceRef.current.refresh?.()
    } catch (err) {
      setVoice((v) => ({
        ...v,
        error: err?.message || 'Mic permission denied',
        link: 'blocked',
        level: 0,
      }))
    }
  }

  const create = async () => {
    setError('')
    setBusy(true)
    setScreen('cabin')
    localStorage.setItem('monk-name', name.trim() || COPY.landing.namePlaceholder)
    localStorage.setItem('monk-avatar', avatar)
    try {
      await ctrlRef.current.createRoom({
        name: name.trim() || COPY.landing.namePlaceholder,
        avatar,
        vibe,
        code: makeRoomCode(),
      })
    } catch (err) {
      setScreen('landing')
      setError(playerError(err, COPY.errors.create))
    } finally {
      setBusy(false)
    }
  }

  const join = async () => {
    setError('')
    setBusy(true)
    setScreen('cabin')
    localStorage.setItem('monk-name', name.trim() || COPY.landing.namePlaceholder)
    localStorage.setItem('monk-avatar', avatar)
    try {
      await ctrlRef.current.joinRoom({
        name: name.trim() || COPY.landing.namePlaceholder,
        avatar,
        vibe,
        code: normalizeRoomPin(joinCode),
      })
    } catch (err) {
      setScreen('landing')
      setError(playerError(err, COPY.errors.join))
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
      setError(COPY.errors.copy)
    }
  }

  const portalActive = room?.phase === 'countdown' || portalHold

  const lockGuess = useCallback(() => {
    if (!guess || selfGuessed) return
    ctrlRef.current.submitGuess({ lat: guess.lat, lng: guess.lng, country })
  }, [guess, country, selfGuessed])

  useEffect(() => {
    if (selfGuessed) {
      setPinning(false)
      return
    }
    // Phones: start in pin-map mode so the Leaflet surface is actually reachable
    const narrow = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
    setPinning(narrow)
  }, [room?.roundIndex, room?.phase, selfGuessed])

  useEffect(() => {
    if (!pinning) return undefined
    const notify = () => window.dispatchEvent(new Event('monk-play-layout'))
    notify()
    document.getElementById('play-map-panel')?.scrollIntoView({ block: 'nearest' })
    const id = window.setTimeout(notify, 80)
    const id2 = window.setTimeout(notify, 320)
    return () => {
      window.clearTimeout(id)
      window.clearTimeout(id2)
    }
  }, [pinning])


  const onPose = useCallback((pose) => {
    ctrlRef.current?.sendLobbyPose(pose)
  }, [])

  const onSmack = useCallback((targetId) => {
    ctrlRef.current?.smack(targetId)
  }, [])

  useEffect(() => {
    voiceRef.current?.refresh?.()
  }, [room?.players?.length])

  // Mobile browsers sometimes keep a stale window scroll from the landing gate,
  // which clips the temple header / PLAY control. Pin scroll on screen changes.
  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [screen, room?.phase, gateMode])

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

  if (legal) {
    return <LegalPage kind={legal} onBack={() => setLegal(null)} />
  }

  if (screen === 'landing' && !busy && (!room || room.phase === 'boot')) {
    const pinReady = normalizeRoomPin(joinCode).length === 6
    return (
      <div className={`landing ${gateMode ? 'landing--gate' : ''}`}>
        <Atmosphere />
        <div className="landing-stage">
          <div className="landing-hero">
            <div className="landing-brand">
              <TempleGlobe className="landing-globe" />
              <h1 className="landing-title">{COPY.brand}</h1>
              {!gateMode && <p className="landing-tag">{COPY.landing.tag}</p>}
            </div>

            {!gateMode && (
              <div className="landing-ctas">
                <button type="button" className="btn btn-primary" onClick={() => setGateMode('create')}>
                  {COPY.landing.create}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setGateMode('join')}>
                  {COPY.landing.join}
                </button>
              </div>
            )}

            {gateMode && (
              <div className="landing-gate">
                <div className="landing-gate-scroll">
                  <button
                    type="button"
                    className="landing-back"
                    onClick={() => setGateMode(null)}
                  >
                    {COPY.landing.back}
                  </button>

                  <label className="landing-label">{COPY.landing.nameLabel}</label>
                  <input
                    className="input-clean mt-1"
                    maxLength={18}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={COPY.landing.namePlaceholder}
                    enterKeyHint="done"
                    autoComplete="nickname"
                  />

                  {gateMode === 'create' && (
                    <>
                      <p className="landing-label mt-5">{COPY.landing.scoutLabel}</p>
                      <AvatarPicker
                        value={avatar}
                        onChange={(id) => {
                          setAvatar(id)
                          localStorage.setItem('monk-avatar', id)
                        }}
                      />
                      <p className="landing-hint">{COPY.landing.scoutHint}</p>
                    </>
                  )}

                  {gateMode === 'join' && (
                    <>
                      <p className="landing-label mt-5">{COPY.landing.scoutLabel}</p>
                      <AvatarPicker
                        value={avatar}
                        onChange={(id) => {
                          setAvatar(id)
                          localStorage.setItem('monk-avatar', id)
                        }}
                      />
                      <label className="landing-label mt-5">{COPY.landing.pinLabel}</label>
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
                        enterKeyHint="go"
                      />
                    </>
                  )}

                  {error && (
                    <div className="notice-soft" role="status">
                      <p>{playerError(error)}</p>
                      <button
                        type="button"
                        className="landing-back mt-2"
                        onClick={() => setError('')}
                      >
                        {COPY.landing.dismiss}
                      </button>
                    </div>
                  )}
                </div>

                <div className="landing-gate-action">
                  {gateMode === 'create' ? (
                    <button
                      type="button"
                      className="btn btn-primary w-full"
                      disabled={busy}
                      onClick={create}
                    >
                      {COPY.landing.openTemple}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary w-full"
                      disabled={busy || !pinReady}
                      onClick={join}
                    >
                      {COPY.landing.stepInside}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="landing-below">
            <div className="landing-foot">
              <button type="button" onClick={() => setShowHowTo(true)}>{COPY.landing.howTo}</button>
              <button type="button" onClick={() => setShowSettings(true)}>{COPY.landing.settings}</button>
              <button type="button" onClick={() => setLegal('privacy')}>{COPY.landing.privacy}</button>
              <button type="button" onClick={() => setLegal('terms')}>{COPY.landing.terms}</button>
            </div>
            <AllTimeLeaderboardButton refreshKey={leaderboardKey} className="landing-board" />
          </div>
        </div>

        <HowToPlayModal open={showHowTo} onClose={() => setShowHowTo(false)} />
        <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      </div>
    )
  }

  if (!room || room.phase === 'boot') {
    return (
      <div className="relative grid min-h-full place-items-center overflow-hidden">
        <Atmosphere intensity="soft" />
        <p className="relative z-10 animate-pulse font-display text-sm tracking-[0.35em] text-brass">{COPY.connecting}</p>
      </div>
    )
  }

  if (room.phase === 'error') {
    return (
      <div className="relative flex min-h-full items-center justify-center overflow-auto p-4">
        <Atmosphere intensity="soft" />
        <div className="relative z-10 w-full max-w-md text-center">
          <BrandMark className="mx-auto mb-4 h-12 w-12 text-brass opacity-80" />
          <p className="font-display text-3xl font-medium text-fog">
            {hostLeft ? COPY.error.hostLeft : COPY.error.connectionLost}
          </p>
          <p className="mt-3 text-sm text-muted">
            {playerError(room.message || error, COPY.error.fallback)}
          </p>
          <button
            type="button"
            className="btn btn-primary mt-8 w-full"
            onClick={() => {
              setError('')
              setGateMode(null)
              ctrlRef.current.destroy()
              setRoom(null)
              setScreen('landing')
              window.location.hash = ''
            }}
          >
            {COPY.error.back}
          </button>
        </div>
      </div>
    )
  }

  if (inLobby) {
    const inPortal = room.phase === 'countdown' || portalHold
    return (
      <Fragment>
      <div className="lobby-shell">
        <Atmosphere intensity="soft" />
        <header className="lobby-header">
          <div>
            <p className="font-display text-2xl font-medium tracking-tight text-fog">monk.run</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
              {COPY.lobby.subtitle(room.players.length, MAX_PLAYERS, room.localOnly)}
            </p>
          </div>
          <button
            type="button"
            className="pin-plate"
            onClick={copyPin}
            disabled={inPortal}
            title="Copy PIN"
          >
            <p className="text-[9px] uppercase tracking-[0.25em] text-muted">{COPY.lobby.pinLabel}</p>
            <p className="font-mono text-2xl font-bold tracking-[0.2em] text-amber">
              {room.roomCode}
            </p>
            <p className="text-[10px] text-jade-bright">{copied ? COPY.lobby.copied : COPY.lobby.tapCopy}</p>
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <VoiceMuteButton
              active={voice.active}
              muted={voice.muted}
              level={voice.level}
              disabled={inPortal}
              onClick={() => {
                if (!voice.active) ensureVoice()
                else voiceRef.current?.toggleMute()
              }}
              idleLabel={COPY.lobby.joinVoice}
              muteLabel={COPY.lobby.muteMic}
              unmuteLabel={COPY.lobby.unmute}
            />
            {room.isHost && room.phase === 'lobby' && (
              <button
                type="button"
                className="btn btn-primary px-8 text-lg tracking-wide"
                onClick={() =>
                  ctrlRef.current.beginCountdown({
                    rounds: DEFAULT_ROUNDS,
                    roundTimeMs: DEFAULT_ROUND_MS,
                  })
                }
              >
                {COPY.lobby.play}
              </button>
            )}
          </div>
        </header>

        <div className="lobby-main">
          <div className="lobby-canvas-wrap">
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
          </div>
          <aside className="panel flex min-h-0 flex-col gap-3 p-4">
            <p className="landing-label">{COPY.lobby.players}</p>
            <ul className="space-y-2">
              {room.players.map((p) => {
                const look = resolvePlayerLook(p.avatar || p.vibe, p.id, room.players)
                return (
                  <li key={p.id} className="flex items-center justify-between border-b border-brass/10 px-1 py-2">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: look.robe }} />
                      <span className="font-display text-sm">{p.name}</span>
                      {p.isHost && <span className="text-[9px] uppercase text-amber">{COPY.lobby.host}</span>}
                    </span>
                    <span className={`text-[10px] uppercase ${p.connected === false ? 'text-coral' : 'text-mint'}`}>
                      {p.connected === false ? COPY.lobby.away : COPY.lobby.here}
                    </span>
                  </li>
                )
              })}
            </ul>

            <p className="landing-label mt-1">{COPY.lobby.chat}</p>
            <ul className="min-h-[72px] max-h-36 flex-1 space-y-1.5 overflow-y-auto border border-brass/10 bg-black/25 p-2">
              {(room.chat || []).length === 0 && (
                <li className="text-[11px] text-muted">{COPY.lobby.chatEmpty}</li>
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
                placeholder={COPY.lobby.chatPlaceholder}
                maxLength={200}
                disabled={inPortal}
              />
              <button type="submit" className="btn btn-ghost shrink-0 !px-3" disabled={inPortal || !chatDraft.trim()}>
                {COPY.lobby.send}
              </button>
            </form>

            <div className="space-y-1 text-[10px] leading-relaxed text-muted">
              <p>
                {voice.link === 'blocked'
                  ? COPY.lobby.voiceBlocked
                  : voice.link === 'reconnecting' && voice.active
                    ? COPY.lobby.voiceReconnecting
                    : voice.active
                      ? voice.muted
                        ? COPY.lobby.voiceMuted
                        : COPY.lobby.voiceLive(voice.peers.length)
                      : COPY.lobby.voiceOff}
              </p>
              <p className="text-brass/70">{lobbyFlavor(room.roomCode)}</p>
              {voice.error && (
                <p className="notice-soft !mt-2 text-left text-amber">
                  {String(voice.error).includes('voice-nat') || /ice|turn|candidate|webrtc/i.test(String(voice.error))
                    ? COPY.errors.voiceNat
                    : playerError(voice.error, voice.link === 'blocked' ? COPY.errors.mic : COPY.errors.voice)}
                </p>
              )}
              {!room.isHost && room.phase === 'lobby' && !inPortal && (
                <p>{COPY.lobby.waitingHost}</p>
              )}
              {(error || (room.message && /couldn|try again|didn.t load|hiccup|reach the game/i.test(room.message))) && (
                <div className="notice-soft !mt-2 text-left" role="status">
                  <p>{playerError(error || room.message)}</p>
                  {error && (
                    <button
                      type="button"
                      className="mt-0.5 text-[9px] uppercase tracking-wider text-muted underline-offset-2 hover:underline"
                      onClick={() => setError('')}
                    >
                      {COPY.landing.dismiss}
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
      <div className="screen-enter relative flex min-h-full flex-col items-center justify-center overflow-auto p-4 pb-6">
        <Atmosphere />
        <div className="relative z-10 w-full max-w-2xl px-2 md:px-4">
          <BrandMark className="mx-auto mb-3 h-10 w-10 text-brass" />
          <h2 className="text-center font-display text-4xl font-medium text-brass-bright md:text-5xl">{COPY.podium.title}</h2>
          <p className="mt-2 text-center text-xs uppercase tracking-[0.25em] text-muted">{COPY.podium.room(room.roomCode)}</p>
          <ol className="mt-8 space-y-1">
            {ranked.map((p, i) => {
              const look = resolvePlayerLook(p.avatar || p.vibe, p.id, ranked)
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between border-b border-brass/15 px-2 py-3"
                >
                  <span className="flex items-center gap-3">
                    <span className="podium-rank text-xl text-amber">{i + 1}</span>
                    <span className="h-3 w-3 rounded-full" style={{ background: look.robe }} />
                    <span className="font-display text-lg">{p.name}</span>
                  </span>
                  <span className="font-mono text-mint">{p.score}</span>
                </li>
              )
            })}
          </ol>
          <div className="mt-8">
            <ShareCard players={room.players} scores={room.scores} roomCode={room.roomCode} />
          </div>
          {room.isHost ? (
            <button
              type="button"
              className="btn btn-primary mt-6 w-full"
              onClick={() => {
                ctrlRef.current?.returnToLobby?.()
                // Keep voice mesh up for the rematch; just refresh peer links.
                voiceRef.current?.refresh?.()
                setError('')
              }}
            >
              {COPY.podium.playAgain}
            </button>
          ) : (
            <p className="mt-6 text-center text-sm text-muted">{COPY.podium.waitingHost}</p>
          )}
          <button
            type="button"
            className="btn btn-ghost mt-3 w-full"
            onClick={() => {
              voiceRef.current?.destroy()
              voiceRef.current = null
              ctrlRef.current.destroy()
              setRoom(null)
              setGateMode(null)
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
            {COPY.podium.leaveParty}
          </button>
        </div>
        <AllTimeLeaderboardButton refreshKey={leaderboardKey} className="relative z-10 mt-5 shrink-0" />
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
      <div className="screen-enter relative flex min-h-full flex-col overflow-hidden">
        <Atmosphere intensity="soft" />
        {isIntermission && room.viewToken && (
          <div className="pointer-events-none absolute inset-0 z-0 opacity-0" aria-hidden>
            <StreetView viewToken={room.viewToken} />
          </div>
        )}
        <div className="relative z-10 grid flex-1 gap-3 p-3 md:grid-cols-2">
          <div className="flex min-h-[280px] flex-col border border-brass/15 bg-black/30 p-3 backdrop-blur-md">
            <p className="landing-label text-jade-bright">{COPY.reveal.eyebrow}</p>
            <h3 className="reveal-place mt-1 text-fog">
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
          <div className="flex flex-col gap-3 border border-brass/15 bg-black/30 p-4 backdrop-blur-md">
            <p className="font-display text-lg">
              You:{' '}
              <span className="text-mint">{selfResult?.missed ? 'missed' : formatKm(selfResult?.km)}</span>
              {' · '}
              <span className="text-brass-bright">+{selfResult?.score || 0}</span>
            </p>
            <ul className="space-y-1">
              {room.reveal.results.map((r) => (
                <li key={r.playerId} className="flex justify-between border-b border-brass/10 px-1 py-2 text-sm">
                  <span className="font-display">{r.name}</span>
                  <span className="text-muted">
                    {r.missed ? 'missed' : formatKm(r.km)} · <span className="text-mint">{r.score}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <p className="mb-2 landing-label">{COPY.reveal.totals}</p>
              {ranked.map((p) => (
                <div key={p.id} className="flex justify-between text-xs text-fog/80">
                  <span>{p.name}</span>
                  <span className="text-brass-bright">{p.score}</span>
                </div>
              ))}
              {isIntermission ? (
                <div className="mt-4 border border-brass/25 bg-black/40 px-4 py-5 text-center">
                  <p className="landing-label">{COPY.reveal.next}</p>
                  {room.intermissionEndsAt > 0 ? (
                    <>
                      <p className="font-display text-4xl font-medium text-brass-bright">{intermissionLeft || 1}s</p>
                      <p className="mt-2 text-xs text-muted">
                        {room.viewToken ? COPY.reveal.opening : COPY.reveal.seeking}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 animate-pulse font-display text-xl text-brass">{COPY.reveal.seeking}</p>
                      <p className="mt-2 text-xs text-muted">{COPY.reveal.hang}</p>
                    </>
                  )}
                </div>
              ) : room.isHost ? (
                <button
                  type="button"
                  className="btn btn-primary mt-4 w-full"
                  onClick={() => ctrlRef.current.nextRound()}
                >
                  {room.roundIndex + 1 >= room.totalRounds ? COPY.reveal.podium : COPY.reveal.nextRound}
                </button>
              ) : (
                <p className="mt-4 text-center text-xs text-muted">{COPY.reveal.waitingHost}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <CinematicOverlay phase={cinPhase} />
      </Fragment>
    )
  }

  if (room.phase === 'loading-round' || room.phase === 'revealing') {
    return (
      <Fragment>
      <div className="screen-enter relative flex min-h-full flex-col items-center justify-center overflow-hidden p-6">
        <Atmosphere />
        <div className="relative z-10 max-w-md text-center">
          <BrandMark className="mx-auto mb-4 h-12 w-12 animate-pulse text-brass" />
          <p className="landing-label">
            {room.phase === 'revealing'
              ? 'Scoring the round…'
              : COPY.loading.round(room.roundIndex + 1)}
          </p>
          <p className="mt-2 font-display text-3xl text-brass-bright">
            {room.phase === 'revealing' ? 'Fair reckoning' : COPY.loading.title}
          </p>
        </div>
        {room.viewToken && room.phase === 'loading-round' && (
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
    <div className={`play-shell screen-enter${pinning && !selfGuessed ? ' play-shell--pinning' : ''}`}>
      <div className="play-view">
        {room.viewToken && <StreetView viewToken={room.viewToken} />}

        <header className="play-hud">
          <div className="pointer-events-auto hud-chip px-3 py-2">
            <p className="font-display text-lg font-medium">monk.run</p>
            <p className="text-[10px] text-muted">
              {COPY.play.round(room.roundIndex + 1, room.totalRounds, lockedCount, room.players.length)}
            </p>
          </div>
          <div className="pointer-events-auto hud-chip px-4 py-2 text-center">
            <p className="landing-label">{COPY.play.time}</p>
            <p className={`font-display text-2xl font-medium ${roundLeft <= 10 ? 'text-coral' : 'text-fog'}`}>
              {roundLeft}s
            </p>
          </div>
          <div className="pointer-events-auto hud-chip hud-chip--scores max-w-[150px] px-3 py-2">
            {ranked.slice(0, 3).map((p) => (
              <div key={p.id} className="flex justify-between gap-2 text-[10px]">
                <span className="truncate text-muted">{p.name}</span>
                <span className="text-mint">{p.score}</span>
              </div>
            ))}
            <VoiceMuteButton
              compact
              className="mt-2"
              active={voice.active}
              muted={voice.muted}
              level={voice.level}
              onClick={() => {
                if (!voice.active) ensureVoice()
                else voiceRef.current?.toggleMute()
              }}
              idleLabel={COPY.play.voice}
              muteLabel={COPY.play.mute}
              unmuteLabel={COPY.play.unmute}
            />
          </div>
        </header>

        {room.isHost && (
          <button
            type="button"
            className="btn btn-ghost play-end"
            onClick={() => ctrlRef.current.revealRound()}
          >
            {COPY.play.endRound}
          </button>
        )}
      </div>

      <aside className="play-map" id="play-map-panel">
        {!selfGuessed ? (
          <>
            <div className="play-map-head mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display text-base font-medium text-brass-bright">{COPY.play.mapTitle}</p>
                <p className="play-map-hint text-[11px] text-muted">
                  {COPY.play.mapHint}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost shrink-0 !px-3 !py-1.5 text-[11px] uppercase tracking-wide md:hidden"
                onClick={() => setPinning((v) => !v)}
              >
                {pinning ? 'View' : 'Pin map'}
              </button>
            </div>
            <div className="play-map-body min-h-0 flex-1 overflow-hidden">
              <GuessMap
                mode="guess"
                guess={guess}
                onGuess={setGuess}
                country={country}
                onCountry={setCountry}
                locked={selfGuessed}
                tall
                onPinFocus={() => setPinning(true)}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary play-lock-btn mt-3 w-full shrink-0"
              disabled={!guess}
              onClick={lockGuess}
            >
              {guess ? COPY.play.lock : COPY.play.needPin}
            </button>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="font-display text-xl text-mint">{COPY.play.locked}</p>
            <p className="text-sm text-muted">
              {lockedCount >= room.players.filter((p) => p.connected !== false).length
                ? COPY.play.allIn
                : COPY.play.waiting(lockedCount, room.players.length)}
            </p>
            {guess && (
              <p className="font-mono text-xs text-brass">
                {COPY.play.yourPin} · {guess.lat.toFixed(2)}, {guess.lng.toFixed(2)}
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
