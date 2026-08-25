/**
 * Mesh voice chat over PeerJS media calls (room-wide).
 *
 * Hardening:
 * - Lower peer id dials; higher id answers (glare rule)
 * - Never answer without a local stream
 * - Incomplete calls (no remote stream) time out and redial
 * - Prefer inbound when our outbound never got audio (join-order deadlock)
 * - DOM <audio> + play retries (Safari / late streams)
 * - Mute toggles track.enabled (does not tear down the call)
 * - Local mic level (0–1) for the mute control meter
 */

function resolveSelfId(selfId) {
  return typeof selfId === 'function' ? selfId() : selfId
}

const CALL_TIMEOUT_MS = 8_000
const PLAY_RETRY_MS = 1_200

export function createVoiceChat({ getPeer, getRemotePeerIds, selfId, onStatus }) {
  let localStream = null
  let muted = true
  /** @type {Map<string, any>} */
  const calls = new Map()
  /** @type {Map<string, HTMLAudioElement>} */
  const remoteAudio = new Map()
  /** Peer ids that delivered a remote stream at least once this session */
  const voiceReady = new Set()
  /** @type {Map<string, ReturnType<typeof setTimeout>>} */
  const callTimers = new Map()
  let answering = false
  /** @type {((call: any) => void) | null} */
  let callHandler = null
  /** @type {ReturnType<typeof setTimeout> | null} */
  let retryTimer = null
  let link = 'idle' // idle | live | reconnecting | blocked
  let level = 0
  /** @type {AudioContext | null} */
  let audioCtx = null
  /** @type {AnalyserNode | null} */
  let analyser = null
  let meterRaf = 0
  let lastLevelEmit = 0
  /** @type {HTMLElement | null} */
  let audioMount = null

  function emitLevel() {
    return muted || !localStream ? 0 : level
  }

  function status(partial = {}) {
    onStatus?.({
      muted,
      active: !!localStream,
      peers: [...remoteAudio.keys()],
      link,
      level: emitLevel(),
      ...partial,
    })
  }

  function ensureAudioMount() {
    if (audioMount && document.body.contains(audioMount)) return audioMount
    audioMount = document.createElement('div')
    audioMount.setAttribute('data-monk-voice', '1')
    audioMount.setAttribute('aria-hidden', 'true')
    audioMount.style.cssText =
      'position:fixed;width:0;height:0;overflow:hidden;pointer-events:none;opacity:0;left:0;top:0'
    document.body.appendChild(audioMount)
    return audioMount
  }

  function stopMeter() {
    if (meterRaf) {
      cancelAnimationFrame(meterRaf)
      meterRaf = 0
    }
    if (audioCtx) {
      try {
        audioCtx.close()
      } catch {
        /* */
      }
      audioCtx = null
    }
    analyser = null
    level = 0
  }

  function startMeter() {
    if (!localStream || meterRaf) return
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    try {
      audioCtx = new AC()
      const source = audioCtx.createMediaStreamSource(localStream)
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.72
      source.connect(analyser)
      audioCtx.resume?.().catch(() => {})
    } catch {
      stopMeter()
      return
    }

    const data = new Uint8Array(analyser.fftSize)
    const tick = () => {
      meterRaf = requestAnimationFrame(tick)
      if (!analyser) return

      if (muted || !localStream) {
        level *= 0.78
        if (level < 0.01) level = 0
      } else {
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / data.length)
        const gated = Math.max(0, rms - 0.018)
        const next = Math.min(1, gated * 4.2)
        level = level * 0.55 + next * 0.45
      }

      const now = performance.now()
      if (now - lastLevelEmit >= 48) {
        lastLevelEmit = now
        status({ level: emitLevel() })
      }
    }
    tick()
  }

  /** Resume AudioContext + retry remote playback (Safari / late streams). */
  function unlockPlayback() {
    audioCtx?.resume?.().catch(() => {})
    for (const el of remoteAudio.values()) {
      el.play().catch(() => {})
    }
  }

  function shouldInitiate(remoteId) {
    const me = String(resolveSelfId(selfId) || '')
    const them = String(remoteId || '')
    if (!me || !them) return true
    return me < them
  }

  function clearCallTimer(peerId) {
    const t = callTimers.get(peerId)
    if (t) {
      clearTimeout(t)
      callTimers.delete(peerId)
    }
  }

  function hangUp(peerId) {
    clearCallTimer(peerId)
    const call = calls.get(peerId)
    if (call) {
      try {
        call.close()
      } catch {
        /* */
      }
      calls.delete(peerId)
    }
    const el = remoteAudio.get(peerId)
    if (el) {
      try {
        el.pause()
      } catch {
        /* */
      }
      el.srcObject = null
      el.remove()
      remoteAudio.delete(peerId)
    }
    status()
  }

  /**
   * Tear down a call that never received a remote stream so retry can redial.
   * Fixes join-order deadlock: early outbound stays in `calls` and blocks redial.
   */
  function armCallTimeout(peerId) {
    clearCallTimer(peerId)
    callTimers.set(
      peerId,
      setTimeout(() => {
        callTimers.delete(peerId)
        if (!remoteAudio.has(peerId) && calls.has(peerId)) {
          hangUp(peerId)
          scheduleRetry()
        }
      }, CALL_TIMEOUT_MS),
    )
  }

  function attachRemote(peerId, stream) {
    clearCallTimer(peerId)
    voiceReady.add(peerId)
    let el = remoteAudio.get(peerId)
    if (!el) {
      el = document.createElement('audio')
      el.autoplay = true
      el.playsInline = true
      el.setAttribute('playsinline', 'true')
      el.setAttribute('autoplay', 'true')
      ensureAudioMount().appendChild(el)
      remoteAudio.set(peerId, el)
    }
    if (el.srcObject !== stream) el.srcObject = stream

    const tryPlay = () => {
      el.play().catch(() => {
        setTimeout(() => {
          el.play().catch(() => {})
        }, PLAY_RETRY_MS)
      })
    }
    tryPlay()
    el.onloadedmetadata = tryPlay

    link = 'live'
    status({ error: null })
  }

  function bindCall(peerId, call) {
    calls.set(peerId, call)
    armCallTimeout(peerId)
    call.on('stream', (stream) => attachRemote(peerId, stream))
    call.on('close', () => {
      hangUp(peerId)
      scheduleRetry()
    })
    call.on('error', () => {
      hangUp(peerId)
      scheduleRetry()
    })
  }

  function pruneMissingPeers() {
    const live = new Set(getRemotePeerIds?.() || [])
    for (const id of [...calls.keys()]) {
      if (!live.has(id)) {
        voiceReady.delete(id)
        hangUp(id)
      }
    }
    for (const id of [...voiceReady]) {
      if (!live.has(id)) voiceReady.delete(id)
    }
  }

  function wireIncoming() {
    const peer = getPeer?.()
    if (!peer || answering) return
    answering = true
    callHandler = (call) => {
      if (!localStream) {
        try {
          call.close()
        } catch {
          /* */
        }
        return
      }

      const existing = calls.get(call.peer)
      // Incomplete outbound (no audio yet) — prefer this inbound and replace.
      if (existing && !remoteAudio.has(call.peer)) {
        hangUp(call.peer)
      } else if (existing && shouldInitiate(call.peer)) {
        // We already have (or had) an outbound toward this peer — drop glare.
        try {
          call.close()
        } catch {
          /* */
        }
        return
      }

      try {
        call.answer(localStream)
      } catch {
        return
      }
      bindCall(call.peer, call)
    }
    peer.on('call', callHandler)
  }

  function connectToPeers() {
    const peer = getPeer?.()
    if (!peer || !localStream) return
    pruneMissingPeers()
    unlockPlayback()
    const ids = getRemotePeerIds?.() || []
    for (const id of ids) {
      if (!id || id === resolveSelfId(selfId) || String(id).startsWith('solo-')) continue
      if (!shouldInitiate(id)) continue

      if (calls.has(id) && remoteAudio.has(id)) continue
      if (calls.has(id) && !remoteAudio.has(id)) hangUp(id)

      try {
        const call = peer.call(id, localStream)
        if (!call) continue
        bindCall(id, call)
      } catch {
        /* peer may not be ready */
      }
    }
  }

  function scheduleRetry() {
    if (!localStream) return
    if (retryTimer) return
    let attempts = 0
    const tick = () => {
      retryTimer = null
      if (!localStream) return
      pruneMissingPeers()
      connectToPeers()
      attempts += 1

      const roster = (getRemotePeerIds?.() || []).filter(
        (id) => id && id !== resolveSelfId(selfId) && !String(id).startsWith('solo-'),
      )
      const linked = remoteAudio.size
      const awaiting = [...calls.keys()].filter((id) => !remoteAudio.has(id))

      if (awaiting.length) {
        link = 'reconnecting'
        status(
          attempts >= 6
            ? { error: 'voice-nat', link: 'reconnecting' }
            : { error: null, link: 'reconnecting' },
        )
        retryTimer = setTimeout(tick, Math.min(900 * attempts, 5000))
        return
      }

      // Soft wait while party exists but nobody else joined voice yet
      if (roster.length && linked === 0 && attempts < 4) {
        link = 'reconnecting'
        status({ error: null, link: 'reconnecting' })
        retryTimer = setTimeout(tick, Math.min(900 * attempts, 4000))
        return
      }

      link = 'live'
      status({ error: null })
    }
    retryTimer = setTimeout(tick, 700)
  }

  async function enableMic() {
    if (localStream) {
      unlockPlayback()
      return localStream
    }
    link = 'reconnecting'
    status({ error: null })
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })
    } catch (err) {
      link = 'blocked'
      status({ error: err?.message || 'Mic permission denied', active: false })
      throw err
    }
    muted = false
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = true
    })
    link = 'live'
    status({ error: null, level: 0 })
    startMeter()
    unlockPlayback()
    wireIncoming()
    connectToPeers()
    scheduleRetry()
    return localStream
  }

  function setMuted(next) {
    muted = !!next
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => {
        t.enabled = !muted
      })
    }
    if (muted) level = 0
    else unlockPlayback()
    status({ level: emitLevel() })
  }

  function toggleMute() {
    if (!localStream) return enableMic().then(() => setMuted(false))
    setMuted(!muted)
  }

  function refresh() {
    if (!localStream) return
    unlockPlayback()
    const want = (getRemotePeerIds?.() || []).length
    link = remoteAudio.size || !want ? 'live' : 'reconnecting'
    status({ error: null })
    connectToPeers()
    scheduleRetry()
  }

  function destroy() {
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
    for (const id of [...callTimers.keys()]) clearCallTimer(id)
    stopMeter()
    for (const id of [...calls.keys()]) hangUp(id)
    voiceReady.clear()
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop())
      localStream = null
    }
    const peer = getPeer?.()
    if (peer && callHandler) {
      try {
        peer.off('call', callHandler)
      } catch {
        try {
          peer.removeListener?.('call', callHandler)
        } catch {
          /* */
        }
      }
    }
    callHandler = null
    answering = false
    muted = true
    link = 'idle'
    level = 0
    if (audioMount) {
      audioMount.remove()
      audioMount = null
    }
    status({ active: false, peers: [], error: null, level: 0 })
  }

  return {
    enableMic,
    setMuted,
    toggleMute,
    refresh,
    destroy,
    unlockPlayback,
    isMuted: () => muted,
    hasMic: () => !!localStream,
    getLevel: () => emitLevel(),
  }
}
