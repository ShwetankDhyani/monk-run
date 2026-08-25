import { createServer } from 'node:http'
import { handleApi } from './apiHandler.mjs'
import { mapsConfigured } from './game.mjs'

const PORT = Number(process.env.LEADERBOARD_PORT || process.env.PORT || 47448)

const server = createServer((req, res) => {
  handleApi(req, res).catch((err) => {
    console.error('[api]', err)
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal error' }))
    }
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`monk.run API on http://0.0.0.0:${PORT} · maps=${mapsConfigured() ? 'configured' : 'MISSING KEY'}`)
})
