/**
 * Mesh voice chat over PeerJS media calls (room-wide).
 *
 * Hardening:
 * - Only dial connected peers; glare rule (lower id initiates)
 * - Never answer without a local stream
 * - Retry outbound calls with short backoff
 * - Drop calls when peers leave; surface link state via onStatus
 * - Mute toggles track.enabled (does not tear down the call)
 * - Local mic level (0–1) so the mute control can show when you are being heard
 */

function resolveSelfId(selfId) {
  return typeof selfId === 'function' ? selfId() : selfId
}

export function createVoiceChat({ getPeer, getRemotePeerIds, selfId, onStatus }) {
  let localStream = null
  let muted = true
  const calls = new Map() // peerId -> MediaConnection
  const remoteAudio = new Map() // peerId -> HTMLAudioElement
  let answering = false
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

  function emitLevel() {
    return muted || !localStream ? 0 : level
  }

  function status(partial) {
    onStatus?.({
      muted,
      active: !!localStream,
      peers: [...remoteAudio.keys()],
      link,
      level: emitLevel(),
      ...partial,
    })
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

      // Muted → decay to 0 (you are not being heard).
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
        // Gate room noise, then expand into a readable 0–1 meter.
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

  function shouldInitiate(remoteId) {
    const me = String(resolveSelfId(selfId) || '')
    const them = String(remoteId || '')
    if (!me || !them) return true
    // Lower peer id dials; higher id only answers — avoids dual-call glare.
    return me < them
  }

  async function enableMic() {
    if (localStream) return localStream
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
    status({ level: emitLevel() })
  }

  function toggleMute() {
    if (!localStream) return enableMic().then(() => setMuted(false))
    setMuted(!muted)
  }

  function attachRemote(peerId, stream) {
    let el = remoteAudio.get(peerId)
    if (!el) {
      el = new Audio()
      el.autoplay = true
      el.setAttribute('playsinline', 'true')
      remoteAudio.set(peerId, el)
    }
    el.srcObject = stream
    el.play().catch(() => {
      /* autoplay may need gesture — Join voice covers this */
    })
    link = 'live'
    status({ error: null })
  }

  function hangUp(peerId) {
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
      el.srcObject = null
      remoteAudio.delete(peerId)
    }
    status()
  }

  function pruneMissingPeers() {
    const live = new Set(getRemotePeerIds?.() || [])
    for (const id of [...calls.keys()]) {
      if (!live.has(id)) hangUp(id)
    }
  }

  function wireIncoming() {
    const peer = getPeer?.()
    if (!peer || answering) return
    answering = true
    peer.on('call', (call) => {
      if (!localStream) {
        // Don't answer empty — remote will retry after we enable mic.
        try {
          call.close()
        } catch {
          /* */
        }
        return
      }
      // If we already initiated toward this peer, drop the inbound glare call.
      if (calls.has(call.peer) && shouldInitiate(call.peer)) {
        try {
          call.close()
        } catch {
          /* */
        }
        return
      }
      call.answer(localStream)
      calls.set(call.peer, call)
      call.on('stream', (stream) => attachRemote(call.peer, stream))
      call.on('close', () => {
        hangUp(call.peer)
        scheduleRetry()
      })
      call.on('error', () => {
        hangUp(call.peer)
        scheduleRetry()
      })
    })
  }

  function connectToPeers() {
    const peer = getPeer?.()
    if (!peer || !localStream) return
    pruneMissingPeers()
    const ids = getRemotePeerIds?.() || []
    for (const id of ids) {
      if (!id || id === resolveSelfId(selfId) || calls.has(id) || String(id).startsWith('solo-')) continue
      if (!shouldInitiate(id)) continue
      try {
        const call = peer.call(id, localStream)
        if (!call) continue
        calls.set(id, call)
        call.on('stream', (stream) => attachRemote(id, stream))
        call.on('close', () => {
          hangUp(id)
          scheduleRetry()
        })
        call.on('error', () => {
          hangUp(id)
          scheduleRetry()
        })
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
      const want = (getRemotePeerIds?.() || []).filter(
        (id) => id && id !== resolveSelfId(selfId) && !String(id).startsWith('solo-'),
      )
      connectToPeers()
      attempts += 1
      const linked = remoteAudio.size
      if (want.length && linked < want.length) {
        link = 'reconnecting'
        // After several failed mesh attempts, hint at NAT/firewall (TURN).
        status(
          attempts >= 5
            ? { error: 'voice-nat', link: 'reconnecting' }
            : { error: null, link: 'reconnecting' },
        )
        // Keep trying while the party is together — NAT paths can open late.
        retryTimer = setTimeout(tick, Math.min(900 * attempts, 5000))
        return
      }
      if (linked) {
        link = 'live'
        status({ error: null })
      } else if (!want.length) {
        link = 'live'
        status({ error: null })
      }
    }
    retryTimer = setTimeout(tick, 700)
  }

  function refresh() {
    if (!localStream) return
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
    stopMeter()
    for (const id of [...calls.keys()]) hangUp(id)
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop())
      localStream = null
    }
    answering = false
    muted = true
    link = 'idle'
    level = 0
    status({ active: false, peers: [], error: null, level: 0 })
  }

  return {
    enableMic,
    setMuted,
    toggleMute,
    refresh,
    destroy,
    isMuted: () => muted,
    hasMic: () => !!localStream,
    getLevel: () => emitLevel(),
  }
}
