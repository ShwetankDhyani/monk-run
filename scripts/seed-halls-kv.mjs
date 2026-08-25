#!/usr/bin/env node
/**
 * Copy local data/leaderboard.json into durable storage (Vercel Blob or KV).
 * Prefer Blob: set BLOB_READ_WRITE_TOKEN from Vercel → Storage → Blob.
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from '../server/loadEnv.mjs'
import { seedDurableFromFile, getLeaderboardStoreInfo } from '../server/hallStore.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
loadEnvFile(join(root, '.env'))

const info = getLeaderboardStoreInfo()
if (!info.durable || (info.kind !== 'blob' && info.kind !== 'kv')) {
  console.error('Durable store not configured. Create Vercel Blob and set BLOB_READ_WRITE_TOKEN in .env')
  process.exit(1)
}

const { kind, halls } = await seedDurableFromFile()
console.log(`Seeded halls to ${kind}:`, info.path)
console.log(JSON.stringify(halls, null, 2))
