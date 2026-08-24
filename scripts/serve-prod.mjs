/**
 * Production static+API server — serves Vite build and game API on one port.
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync, createReadStream, statSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')
const PORT = Number(process.env.PORT || process.env.LEADERBOARD_PORT || 47448)

// Boot API handlers by importing the leaderboard module's logic is awkward
// because it listens immediately — use a lightweight proxy approach:
// run API routes by dynamically importing a factory if present, else spawn note.

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

// Import and re-bind: start API by forking the same process pattern
// Prefer: node server/leaderboard with STATIC_DIR
process.env.STATIC_DIR = dist
await import(pathToFileURL(join(root, 'server', 'leaderboard.mjs')).href)

console.log(`[prod] static dir ${dist} (API owns port ${PORT})`)
