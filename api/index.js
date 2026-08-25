/**
 * Single Vercel serverless entry for all /api/* routes.
 * Nested paths are forwarded via ?__path= from vercel.json rewrites
 * (Vite + catch-all [...path] only matched one URL segment on Vercel).
 */
import { handleApi } from '../server/apiHandler.mjs'

function rewriteVercelPath(req) {
  try {
    const u = new URL(req.url || '/', 'http://localhost')
    const forwarded = u.searchParams.get('__path')
    if (forwarded == null) return
    u.searchParams.delete('__path')
    const q = u.searchParams.toString()
    const path = String(forwarded).replace(/^\/+/, '')
    req.url = `/api/${path}${q ? `?${q}` : ''}`
  } catch {
    // keep original url
  }
}

export default async function handler(req, res) {
  try {
    rewriteVercelPath(req)
    await handleApi(req, res)
  } catch (err) {
    console.error('[vercel-api]', err)
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Internal error' }))
    }
  }
}
