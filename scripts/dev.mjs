import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function run(label, cmd, args) {
  const child = spawn(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  })
  child.on('exit', (code, signal) => {
    if (signal) return
    if (code !== 0) console.error(`[${label}] exited with code ${code}`)
  })
  return child
}

const api = run('api', 'node', ['server/leaderboard.mjs'])
const vite = run('vite', 'node', ['node_modules/vite/bin/vite.js', '--host', '0.0.0.0', '--port', '47447'])

function shutdown() {
  api.kill('SIGTERM')
  vite.kill('SIGTERM')
  setTimeout(() => process.exit(0), 300)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
