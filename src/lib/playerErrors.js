/**
 * Map technical failures to short player-facing copy.
 * Never surface npm, stacks, or infra instructions in the game UI.
 */
import { COPY } from '../copy.js'

const RULES = [
  [/npm run|vite|localhost|ECONNREFUSED|Failed to fetch|NetworkError|fetch/i, () => COPY.errors.network],
  [/Game server|server offline|server unavailable|API/i, () => COPY.errors.service],
  [/Could not (find|load).*(Street View|panorama|round)/i, () => COPY.errors.panorama],
  [/Host not found|Check the room PIN|Host disconnected/i, null],
  [/PIN already in use/i, () => COPY.errors.pinTaken],
  [/Mic|permission|NotAllowedError/i, () => COPY.errors.mic],
  [/voice-nat|TURN|candidate/i, () => COPY.errors.voiceNat],
  [/Peer|broker|WebRTC|ice/i, () => COPY.errors.peer],
]

/**
 * @param {unknown} err
 * @param {string} [fallback]
 */
export function playerError(err, fallback = COPY.errors.default) {
  const raw = typeof err === 'string' ? err : err?.message || ''
  if (!raw) return fallback
  for (const [re, msg] of RULES) {
    if (re.test(raw)) return msg === null ? raw : msg()
  }
  if (/npm |node |restart with|API automatically/i.test(raw)) return fallback
  if (raw.length > 120) return fallback
  return raw
}

/**
 * fetch with short retries for flaky local/proxy blips.
 */
export async function fetchRetry(url, init = {}, opts = {}) {
  const retries = opts.retries ?? 3
  const delayMs = opts.delayMs ?? 400
  const timeoutMs = opts.timeoutMs ?? 0
  let lastErr
  for (let i = 0; i < retries; i++) {
    const controller = timeoutMs > 0 ? new AbortController() : null
    const timer =
      controller && timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null
    try {
      const res = await fetch(url, {
        ...init,
        signal: controller?.signal ?? init?.signal,
      })
      if (timer) clearTimeout(timer)
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429)) {
        return res
      }
      lastErr = new Error(`HTTP ${res.status}`)
    } catch (e) {
      if (timer) clearTimeout(timer)
      if (e?.name === 'AbortError' && timeoutMs > 0) {
        lastErr = new Error('Request timed out')
      } else {
        lastErr = e
      }
    }
    if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)))
  }
  throw lastErr || new Error('Network error')
}
