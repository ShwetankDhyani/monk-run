/**
 * Vercel serverless entry — all /api/* traffic lands here.
 * Game sessions are in-memory per instance (fine for parties on a warm function;
 * cold starts mint a fresh session map).
 */
import { handleApi } from '../server/apiHandler.mjs'

export default async function handler(req, res) {
  try {
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
