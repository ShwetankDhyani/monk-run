#!/usr/bin/env node
/**
 * Copy local data/leaderboard.json into Vercel KV / Upstash Redis.
 * Requires KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_* equivalents).
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from '../server/loadEnv.mjs'
import { seedKvFromFile, getLeaderboardStoreInfo } from '../server/hallStore.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
loadEnvFile(join(root, '.env'))

const info = getLeaderboardStoreInfo()
if (info.kind !== 'kv') {
  console.error('KV not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN in .env')
  process.exit(1)
}

const halls = await seedKvFromFile()
console.log('Seeded halls to KV:', info.path)
console.log(JSON.stringify(halls, null, 2))
