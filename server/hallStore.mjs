import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const HALL_SIZE = 5
const REDIS_KEY = 'monk:halls'

const DATA_DIR = process.env.VERCEL
  ? join('/tmp', 'monk-run-data')
  : join(__dirname, '..', 'data')
const DATA_FILE = join(DATA_DIR, 'leaderboard.json')

export function emptyHalls() {
  return {
    highestScore: [],
    lowestScore: [],
    closestGuess: [],
    farthestGuess: [],
  }
}

export function normalizeHalls(raw) {
  if (Array.isArray(raw)) {
    return {
      ...emptyHalls(),
      highestScore: [...raw]
        .sort((a, b) => b.score - a.score || (b.at || 0) - (a.at || 0))
        .slice(0, HALL_SIZE),
    }
  }
  if (!raw || typeof raw !== 'object') return emptyHalls()
  return {
    highestScore: Array.isArray(raw.highestScore) ? raw.highestScore : [],
    lowestScore: Array.isArray(raw.lowestScore) ? raw.lowestScore : [],
    closestGuess: Array.isArray(raw.closestGuess) ? raw.closestGuess : [],
    farthestGuess: Array.isArray(raw.farthestGuess) ? raw.farthestGuess : [],
  }
}

function kvEnv() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return { url, token }
}

/** @returns {'kv' | 'file' | 'ephemeral'} */
export function getLeaderboardStoreKind() {
  if (kvEnv()) return 'kv'
  if (!process.env.VERCEL) return 'file'
  return 'ephemeral'
}

export function getLeaderboardStoreInfo() {
  const kind = getLeaderboardStoreKind()
  return {
    kind,
    durable: kind === 'kv' || kind === 'file',
    path: kind === 'file' ? DATA_FILE : kind === 'kv' ? REDIS_KEY : null,
  }
}

let redisPromise = null

async function getRedis() {
  if (!redisPromise) {
    redisPromise = (async () => {
      const env = kvEnv()
      if (!env) return null
      const { Redis } = await import('@upstash/redis')
      return new Redis({ url: env.url, token: env.token })
    })()
  }
  return redisPromise
}

async function loadFromFile() {
  try {
    if (!existsSync(DATA_FILE)) return emptyHalls()
    const raw = await readFile(DATA_FILE, 'utf8')
    return normalizeHalls(JSON.parse(raw))
  } catch {
    return emptyHalls()
  }
}

async function saveToFile(halls) {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true })
  await writeFile(DATA_FILE, JSON.stringify(halls, null, 2))
}

async function loadFromKv() {
  const redis = await getRedis()
  if (!redis) return emptyHalls()
  try {
    const raw = await redis.get(REDIS_KEY)
    return normalizeHalls(raw)
  } catch (err) {
    console.error('[hallStore/kv/load]', err)
    return emptyHalls()
  }
}

async function saveToKv(halls) {
  const redis = await getRedis()
  if (!redis) throw new Error('KV not configured')
  await redis.set(REDIS_KEY, halls)
}

export async function loadHalls() {
  const kind = getLeaderboardStoreKind()
  if (kind === 'kv') return loadFromKv()
  return loadFromFile()
}

export async function saveHalls(halls) {
  const kind = getLeaderboardStoreKind()
  if (kind === 'kv') {
    await saveToKv(halls)
    return
  }
  await saveToFile(halls)
}

/**
 * Read-modify-write helper for score commits.
 * @param {(halls: ReturnType<typeof emptyHalls>) => ReturnType<typeof emptyHalls>} mutator
 */
export async function updateHalls(mutator) {
  const halls = await loadHalls()
  const next = mutator(structuredClone(halls))
  await saveHalls(next)
  return next
}

/** One-time import from local file into KV (production seed). */
export async function seedKvFromFile() {
  const env = kvEnv()
  if (!env) throw new Error('KV_REST_API_URL and KV_REST_API_TOKEN required')
  const halls = await loadFromFile()
  await saveToKv(halls)
  return halls
}
