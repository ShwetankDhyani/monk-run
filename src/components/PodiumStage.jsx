import { useEffect, useMemo, useRef } from 'react'
import { resolvePlayerLook } from '../data/avatars.js'
import { drawMonkTopDown } from '../lib/avatarDraw.js'

const PEDESTAL_HEIGHTS = [88, 64, 48]
const PEDESTAL_WIDTHS = [112, 96, 88]

/**
 * Top 3 finishers on pedestals with a gentle victory bounce.
 */
export function PodiumStage({ ranked = [] }) {
  const canvasRef = useRef(null)
  const top3 = useMemo(() => ranked.slice(0, 3), [ranked])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    let raf = 0
    let alive = true

    const draw = (t) => {
      if (!alive) return
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      // Floor glow
      const floor = ctx.createLinearGradient(0, h * 0.55, 0, h)
      floor.addColorStop(0, 'rgba(94, 196, 182, 0.06)')
      floor.addColorStop(1, 'rgba(6, 8, 14, 0)')
      ctx.fillStyle = floor
      ctx.fillRect(0, h * 0.45, w, h * 0.55)

      const slots = [
        { idx: 1, x: w * 0.5, rank: 1 },
        { idx: 0, x: w * 0.22, rank: 2 },
        { idx: 2, x: w * 0.78, rank: 3 },
      ]

      for (const slot of slots) {
        const p = top3[slot.idx]
        if (!p) continue
        const ph = PEDESTAL_HEIGHTS[slot.rank - 1]
        const pw = PEDESTAL_WIDTHS[slot.rank - 1]
        const baseY = h - 28
        const bounce =
          slot.rank === 1
            ? Math.sin(t * 0.008) * 10 + Math.abs(Math.sin(t * 0.016)) * 6
            : Math.sin(t * 0.007 + slot.idx) * 6

        // Pedestal
        ctx.fillStyle = 'rgba(212, 165, 116, 0.14)'
        ctx.strokeStyle = 'rgba(240, 201, 138, 0.35)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(slot.x - pw / 2, baseY - ph, pw, ph, 8)
        } else {
          ctx.rect(slot.x - pw / 2, baseY - ph, pw, ph)
        }
        ctx.fill()
        ctx.stroke()

        // Rank badge
        ctx.fillStyle = slot.rank === 1 ? '#f0c98a' : 'rgba(240, 201, 138, 0.75)'
        ctx.font = '600 13px Fraunces, serif'
        ctx.textAlign = 'center'
        ctx.fillText(String(slot.rank), slot.x, baseY - ph + 18)

        const look = resolvePlayerLook(p.avatar || p.vibe, p.id, top3)
        const monkY = baseY - ph - 8 - bounce
        drawMonkTopDown(ctx, slot.x, monkY, look, 'down', t * 0.012, 1.15, 1.15)

        // Name + score
        ctx.fillStyle = '#e6ebe8'
        ctx.font = '500 14px Outfit, system-ui, sans-serif'
        ctx.fillText(p.name.slice(0, 12), slot.x, baseY + 14)
        ctx.fillStyle = '#5ec4b6'
        ctx.font = '600 13px "IBM Plex Mono", monospace'
        ctx.fillText(String(p.score ?? 0), slot.x, baseY + 32)
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [top3])

  if (top3.length === 0) return null

  return (
    <div className="podium-stage" aria-hidden={false}>
      <canvas ref={canvasRef} width={640} height={280} className="podium-stage-canvas" />
      <ol className="sr-only">
        {top3.map((p, i) => (
          <li key={p.id}>
            {i + 1}. {p.name} — {p.score}
          </li>
        ))}
      </ol>
    </div>
  )
}
