/** Shared void + temple light layers for branded surfaces. */
export function Atmosphere({ intensity = "full" }) {
  return (
    <div className="atmosphere" aria-hidden="true" data-intensity={intensity}>
      <div className="atmosphere-void" />
      <div className="atmosphere-aurora" />
      <div className="atmosphere-rays" />
      <div className="atmosphere-grain" />
      <div className="atmosphere-vignette" />
    </div>
  );
}

export function BrandMark({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1.25" opacity="0.35" />
      <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
      <circle cx="32" cy="32" r="6" fill="currentColor" />
      <path
        d="M32 8v8M32 48v8M8 32h8M48 32h8"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity="0.4"
      />
      <path
        d="M14 14l6 6M44 44l6 6M44 14l-6 6M20 44l-6 6"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
    </svg>
  );
}
