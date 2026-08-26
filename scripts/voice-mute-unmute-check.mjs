/**
 * Regression: unmute must rebind RTCRtpSender via replaceTrack.
 * Local metering can move (same MediaStreamTrack) while peers stay silent
 * if we only toggle track.enabled.
 */
import { createVoiceChat } from '../src/lib/voiceChat.js'

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

function mockTrack(kind = 'audio') {
  return {
    kind,
    enabled: true,
    readyState: 'live',
    stop() {
      this.readyState = 'ended'
    },
  }
}

function mockStream(track) {
  return {
    getAudioTracks: () => (track.readyState ? [track] : []),
    getTracks: () => [track],
  }
}

function mockSender(track) {
  const sender = {
    track,
    replaceCalls: [],
    replaceTrack(next) {
      sender.replaceCalls.push(next)
      sender.track = next
      return Promise.resolve()
    },
  }
  return sender
}

function mockPc(sender) {
  return {
    connectionState: 'connected',
    getSenders: () => [sender],
    addTrack() {
      throw new Error('addTrack should not be needed when sender exists')
    },
  }
}

function mockCall(peerId, pc) {
  const handlers = {}
  return {
    peer: peerId,
    peerConnection: pc,
    on(evt, fn) {
      handlers[evt] = fn
    },
    close() {},
  }
}

async function main() {
  const track = mockTrack()
  const stream = mockStream(track)
  const sender = mockSender(track)
  const pc = mockPc(sender)
  const remoteId = 'peer-z'
  // Lower id initiates — self < remote
  const selfId = 'peer-a'

  const gum = { impl: async () => stream }
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      mediaDevices: {
        getUserMedia: (...args) => gum.impl(...args),
      },
    },
    configurable: true,
  })
  Object.defineProperty(globalThis, 'window', {
    value: {
      AudioContext: class {
        createMediaStreamSource() {
          return { connect() {} }
        }
        createAnalyser() {
          return {
            fftSize: 256,
            smoothingTimeConstant: 0.72,
            getByteTimeDomainData(arr) {
              arr.fill(128)
            },
          }
        }
        resume() {
          return Promise.resolve()
        }
        close() {}
      },
    },
    configurable: true,
  })
  Object.defineProperty(globalThis, 'document', {
    value: {
      body: {
        contains: () => true,
        appendChild() {},
      },
      createElement: () => ({
        style: { cssText: '' },
        setAttribute() {},
        appendChild() {},
        remove() {},
        play: async () => {},
      }),
    },
    configurable: true,
  })
  globalThis.requestAnimationFrame = () => 1
  globalThis.cancelAnimationFrame = () => {}
  globalThis.performance = { now: () => Date.now() }

  const call = mockCall(remoteId, pc)
  const peer = {
    on() {},
    off() {},
    call(id, _stream) {
      assert(id === remoteId, 'dials remote peer')
      assert(_stream === stream, 'passes local stream')
      return call
    },
  }

  const statuses = []
  const voice = createVoiceChat({
    getPeer: () => peer,
    getRemotePeerIds: () => [remoteId],
    selfId,
    onStatus: (s) => statuses.push(s),
  })

  await voice.enableMic()
  assert(voice.hasMic(), 'mic active after join')
  assert(!voice.isMuted(), 'unmuted after join')
  assert(track.enabled === true, 'track enabled after join')

  // PeerJS would have added the track; sender already holds it
  sender.replaceCalls.length = 0

  voice.setMuted(true)
  assert(voice.isMuted(), 'muted flag')
  assert(track.enabled === false, 'local track disabled while muted')
  assert(sender.replaceCalls.length === 1, 'mute replaceTrack once')
  assert(sender.replaceCalls[0] === null, 'mute replaceTrack(null)')

  sender.replaceCalls.length = 0
  voice.setMuted(false)
  assert(!voice.isMuted(), 'unmuted flag')
  assert(track.enabled === true, 'local track enabled after unmute')
  assert(sender.replaceCalls.length === 1, 'unmute replaceTrack once')
  assert(sender.replaceCalls[0] === track, 'unmute rebinds same live track')

  // Dead-track: ended mic must reacquire on toggle
  track.readyState = 'ended'
  const fresh = mockTrack()
  const freshStream = mockStream(fresh)
  let gumCalls = 0
  gum.impl = async () => {
    gumCalls += 1
    return freshStream
  }
  sender.replaceCalls.length = 0
  await voice.toggleMute()
  assert(gumCalls === 1, 'reacquires mic when track ended')
  assert(fresh.enabled === true, 'fresh track enabled')
  assert(voice.hasMic(), 'hasMic after reacquire')

  voice.destroy()
  console.log('voice-mute-unmute-check: ok')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
