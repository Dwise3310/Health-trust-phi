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
          d="M8 45 H78
             L92 45 L102 18 L114 72 L126 45 H150
             C150 45 156 28 168 28
             C178 28 182 38 180 45
             C178 38 182 28 192 28
             C204 28 210 45 210 45
             H234 L246 18 L258 72 L270 45 H352"
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
