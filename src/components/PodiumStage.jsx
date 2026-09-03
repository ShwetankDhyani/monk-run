import { useEffect, useMemo, useRef } from 'react'
import { resolvePlayerLook } from '../data/avatars.js'
import { drawMonkTopDown } from '../lib/avatarDraw.js'
import { formatWins } from '../lib/scoring.js'

/** Olympic order: 1st center (tallest), 2nd left, 3rd right. */
const PODIUM_LAYOUT = [
  { place: 1, idx: 0, x: 0.5, height: 118, width: 124, label: '1st' },
  { place: 2, idx: 1, x: 0.22, height: 76, width: 100, label: '2nd' },
  { place: 3, idx: 2, x: 0.78, height: 54, width: 92, label: '3rd' },
]

/**
 * Top 3 finishers — Olympic 2 · 1 · 3 layout with tiered pedestals.
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

      const floor = ctx.createLinearGradient(0, h * 0.5, 0, h)
      floor.addColorStop(0, 'rgba(94, 196, 182, 0.08)')
      floor.addColorStop(1, 'rgba(6, 8, 14, 0)')
      ctx.fillStyle = floor
      ctx.fillRect(0, h * 0.4, w, h * 0.6)

      const baseY = h - 36

      for (const slot of PODIUM_LAYOUT) {
        const p = top3[slot.idx]
        if (!p) continue

        const cx = w * slot.x
        const ph = slot.height
        const pw = slot.width
        const isWinner = slot.place === 1
        const bounce = isWinner ? Math.sin(t * 0.009) * 11 + Math.abs(Math.sin(t * 0.017)) * 7 : 0

        // Pedestal block
        const top = baseY - ph
        ctx.fillStyle = isWinner ? 'rgba(240, 201, 138, 0.16)' : 'rgba(212, 165, 116, 0.12)'
        ctx.strokeStyle = isWinner ? 'rgba(240, 201, 138, 0.5)' : 'rgba(212, 165, 116, 0.28)'
        ctx.lineWidth = isWinner ? 2 : 1.5
        ctx.beginPath()
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(cx - pw / 2, top, pw, ph, 6)
        } else {
          ctx.rect(cx - pw / 2, top, pw, ph)
        }
        ctx.fill()
        ctx.stroke()

        // Position label on pedestal face
        ctx.fillStyle = isWinner ? '#f0c98a' : 'rgba(240, 201, 138, 0.82)'
        ctx.font = isWinner ? '700 18px Fraunces, Georgia, serif' : '600 14px Fraunces, Georgia, serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(slot.label, cx, top + ph * 0.42)

        // Player name on pedestal
        ctx.fillStyle = '#e6ebe8'
        ctx.font = '600 12px Outfit, system-ui, sans-serif'
        ctx.fillText(p.name.slice(0, 14), cx, top + ph * 0.72)

        // Round wins below pedestal
        ctx.fillStyle = '#5ec4b6'
        ctx.font = '600 12px "IBM Plex Mono", monospace'
        ctx.fillText(formatWins(p.score), cx, baseY + 16)

        const look = resolvePlayerLook(p.avatar || p.vibe, p.id, top3)
        const monkScale = isWinner ? 1.22 : slot.place === 2 ? 1.1 : 1.05
        const monkY = top - 10 - bounce
        drawMonkTopDown(ctx, cx, monkY, look, 'down', isWinner ? t * 0.014 : 0, monkScale, monkScale)
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
      <canvas ref={canvasRef} width={640} height={300} className="podium-stage-canvas" />
      <ol className="sr-only">
        {top3.map((p, i) => (
          <li key={p.id}>
            {i + 1}. {p.name} — {formatWins(p.score)}
          </li>
        ))}
      </ol>
    </div>
  )
}
