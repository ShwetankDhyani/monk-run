import { MONK_VIBES } from '../data/locations.js'
import { gradeFromScore } from '../lib/scoring.js'

const KOANS = {
  idle: [
    'Where is the street that is every street?',
    'The map is not the territory — but the pin is a prayer.',
    'Breathe. The coordinates are already inside you.',
  ],
  looking: [
    'Look with the third eye, not the tourist eye.',
    'License plates are mantras. Architecture is scripture.',
    'North is a rumor. South is a mood.',
  ],
  locked: [
    'Commitment is also a form of meditation.',
    'You have cast your karma upon the globe.',
    'Waiting for the other monks to awaken…',
  ],
  ENLIGHTENED: [
    'You stood upon the exact atom. Respect.',
    'Distance collapsed. Ego noticed.',
    'The lotus opens at ground zero.',
  ],
  AWAKENED: [
    'Close enough for enlightenment-adjacent.',
    'Your guess kissed the truth.',
    'The monk nods, slowly, impressed.',
  ],
  SEEKING: [
    'A respectable pilgrimage. Keep walking.',
    'Wrong city, right hemisphere — mostly.',
    'The void grades on a curve today.',
  ],
  LOST: [
    'You teleported to a parallel timeline.',
    'Geography has left the chat.',
    'Even GPS would need therapy.',
  ],
  DISSOLVED: [
    'You guessed Atlantis. It is not on this map.',
    'The pin fell into the oceanic unconscious.',
    'Reincarnate harder next round.',
  ],
}

function pick(list, salt = 0) {
  if (!list?.length) return '…'
  return list[Math.abs(salt) % list.length]
}

export default function VoidMonk({
  vibe = 'saffron',
  mood = 'idle',
  score = null,
  seed = 0,
  compact = false,
}) {
  const palette = MONK_VIBES.find((v) => v.id === vibe) || MONK_VIBES[0]
  const grade = score == null ? null : gradeFromScore(score)
  const speechKey = grade || (mood === 'locked' ? 'locked' : mood === 'looking' ? 'looking' : 'idle')
  const line = pick(KOANS[speechKey] || KOANS.idle, seed + (score || 0))
  const size = compact ? 88 : 128

  return (
    <div className={`flex ${compact ? 'flex-row items-center gap-3' : 'flex-col items-center gap-3'}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="absolute inset-0 animate-[float_4s_ease-in-out_infinite] rounded-full opacity-40 blur-2xl"
          style={{ background: palette.color }}
        />
        <svg viewBox="0 0 120 120" width={size} height={size} className="relative">
          <ellipse cx="60" cy="98" rx="28" ry="8" fill={palette.color} opacity="0.35" />
          <path d="M40 96 Q60 80 80 96" fill="none" stroke={palette.accent} strokeWidth="2" />
          <path d="M40 78 Q60 92 80 78 L76 56 Q60 48 44 56 Z" fill={palette.color} opacity="0.9" />
          <circle cx="60" cy="40" r="20" fill="#1a1024" stroke={palette.accent} strokeWidth="2" />
          <ellipse
            cx="60"
            cy="34"
            rx="4"
            ry="6"
            fill={score != null && score >= 4000 ? '#80ff72' : '#00e5ff'}
          />
          <circle cx="52" cy="42" r="2.2" fill={palette.accent} />
          <circle cx="68" cy="42" r="2.2" fill={palette.accent} />
          {grade === 'DISSOLVED' || grade === 'LOST' ? (
            <path d="M52 52 Q60 48 68 52" fill="none" stroke={palette.accent} strokeWidth="2" />
          ) : (
            <path d="M52 50 Q60 56 68 50" fill="none" stroke={palette.accent} strokeWidth="2" />
          )}
          <circle
            cx="60"
            cy="40"
            r="26"
            fill="none"
            stroke={palette.color}
            strokeWidth="1"
            opacity="0.5"
            strokeDasharray="4 6"
            className="origin-center animate-[spin_12s_linear_infinite]"
            style={{ transformOrigin: '60px 40px' }}
          />
        </svg>
      </div>
      <div className={`speech max-w-[220px] ${compact ? 'text-left' : 'text-center'}`}>
        <p className="font-mono text-[11px] leading-relaxed text-fog/90">“{line}”</p>
        {grade && (
          <p className="mt-1 font-display text-sm tracking-wide" style={{ color: palette.color }}>
            {grade}
          </p>
        )}
      </div>
    </div>
  )
}
