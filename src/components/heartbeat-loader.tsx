export function HeartbeatLoader({
  label = "Loading",
}: {
  label?: string;
}) {
  return (
    <div
      className="grid place-items-center gap-4 px-6"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <svg
        viewBox="0 0 360 90"
        className="h-16 w-[min(88vw,360px)] text-fg"
        fill="none"
        aria-hidden="true"
      >
        <path
          className="ecg-draw"
          d="M8 45 H78 L90 45 L100 16 L112 74 L124 45 H170 L182 45 L192 16 L204 74 L216 45 H352"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-sm tracking-wide text-muted">{label}</p>
    </div>
  );
}
