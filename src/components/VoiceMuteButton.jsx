/**
 * Mute / join-voice control with a rising mic-level shade.
 * Fill height tracks outbound level so you can see when you are being heard.
 */
export function VoiceMuteButton({
  active,
  muted,
  level = 0,
  disabled = false,
  onClick,
  idleLabel,
  muteLabel,
  unmuteLabel,
  className = '',
  compact = false,
}) {
  const live = active && !muted
  const pct = live ? Math.round(Math.min(1, Math.max(0, level)) * 100) : 0
  const speaking = live && pct >= 8
  const label = !active ? idleLabel : muted ? unmuteLabel : muteLabel

  return (
    <button
      type="button"
      className={`btn voice-mute-btn ${live ? 'btn-primary' : 'btn-ghost'} ${speaking ? 'is-speaking' : ''} ${compact ? 'voice-mute-btn--compact' : ''} ${className}`}
      style={{ '--voice-level': `${pct}%` }}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active ? !muted : undefined}
      aria-label={
        live
          ? speaking
            ? `${muteLabel} — mic open, speaking`
            : `${muteLabel} — mic open`
          : label
      }
      title={live ? (speaking ? 'You’re being heard' : 'Mic open — speak') : label}
    >
      <span className="voice-mute-fill" aria-hidden />
      <span className="voice-mute-label">{label}</span>
    </button>
  )
}
