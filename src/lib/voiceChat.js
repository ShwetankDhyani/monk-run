/**
 * Mesh voice chat over PeerJS media calls (room-wide).
 * Mute toggles enabled track on the local mic stream.
 */
export function createVoiceChat({ getPeer, getRemotePeerIds, selfId, onStatus }) {
  let localStream = null
  let muted = true
  const calls = new Map() // peerId -> MediaConnection
  const remoteAudio = new Map() // peerId -> HTMLAudioElement
  let answering = false

  function status(partial) {
    onStatus?.({
      muted,
      active: !!localStream,
      peers: [...remoteAudio.keys()],
      ...partial,
    })
  }

  async function enableMic() {
    if (localStream) return localStream
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    })
    muted = false
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = true
    })
    status({ error: null })
    wireIncoming()
    connectToPeers()
    return localStream
  }

  function setMuted(next) {
    muted = !!next
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => {
        t.enabled = !muted
      })
    }
    status()
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
      /* autoplay may need gesture — lobby button covers this */
    })
    status()
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

  function wireIncoming() {
    const peer = getPeer?.()
    if (!peer || answering) return
    answering = true
    peer.on('call', (call) => {
      if (!localStream) {
        call.answer(undefined)
        return
      }
      call.answer(localStream)
      calls.set(call.peer, call)
      call.on('stream', (stream) => attachRemote(call.peer, stream))
      call.on('close', () => hangUp(call.peer))
      call.on('error', () => hangUp(call.peer))
    })
  }

  function connectToPeers() {
    const peer = getPeer?.()
    if (!peer || !localStream) return
    const ids = getRemotePeerIds?.() || []
    for (const id of ids) {
      if (!id || id === selfId || calls.has(id) || String(id).startsWith('solo-')) continue
      try {
        const call = peer.call(id, localStream)
        if (!call) continue
        calls.set(id, call)
        call.on('stream', (stream) => attachRemote(id, stream))
        call.on('close', () => hangUp(id))
        call.on('error', () => hangUp(id))
      } catch {
        /* peer may not be ready */
      }
    }
  }

  function refresh() {
    if (localStream) connectToPeers()
  }

  function destroy() {
    for (const id of [...calls.keys()]) hangUp(id)
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop())
      localStream = null
    }
    answering = false
    muted = true
    status({ active: false, peers: [] })
  }

  return {
    enableMic,
    setMuted,
    toggleMute,
    refresh,
    destroy,
    isMuted: () => muted,
    hasMic: () => !!localStream,
  }
}
