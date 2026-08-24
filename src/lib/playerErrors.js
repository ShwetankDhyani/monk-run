/**
 * Map technical/internal failures to short player-facing copy.
 * Never surface npm, stack traces, or infra instructions in the game UI.
 */

const RULES = [
  [/npm run|vite|localhost|ECONNREFUSED|Failed to fetch|NetworkError|fetch/i, 'Connection hiccup — try again in a moment.'],
  [/Game server|server offline|server unavailable|API/i, 'Couldn’t reach the game service. Try again.'],
  [/Could not (find|load).*(Street View|panorama|round)/i, 'That round didn’t load. Trying again…'],
  [/Host not found|Check the room PIN|Host disconnected/i, null], // keep as-is when already friendly
  [/PIN already in use/i, 'That PIN is taken — create a new room.'],
  [/Mic|permission|NotAllowedError/i, 'Microphone blocked — allow access to use voice.'],
  [/Peer|broker|WebRTC|ice/i, 'Multiplayer link dropped. Rejoin with the PIN.'],
]

/**
 * @param {unknown} err
 * @param {string} [fallback]
 */
export function playerError(err, fallback = 'Something went wrong — try again.') {
  const raw = typeof err === 'string' ? err : err?.message || ''
  if (!raw) return fallback
  for (const [re, msg] of RULES) {
    if (re.test(raw)) return msg === null ? raw : msg
  }
  // Strip anything that looks like a shell/dev instruction
  if (/npm |node |restart with|API automatically/i.test(raw)) return fallback
  if (raw.length > 120) return fallback
  return raw
}

/**
 * fetch with short retries for flaky local/proxy blips.
 * @param {string} url
 * @param {RequestInit} [init]
 * @param {{ retries?: number, delayMs?: number }} [opts]
 */
export async function fetchRetry(url, init = {}, opts = {}) {
  const retries = opts.retries ?? 3
  const delayMs = opts.delayMs ?? 400
  let lastErr
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, init)
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429)) {
        return res
      }
      lastErr = new Error(`HTTP ${res.status}`)
    } catch (e) {
      lastErr = e
    }
    if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)))
  }
  throw lastErr || new Error('Network error')
}
