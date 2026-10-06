import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-3xl">{title}</h1>
        {children ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{children}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export type ChipTone = "ok" | "warn" | "danger" | "muted";

const TONE: Record<ChipTone, string> = {
  ok: "bg-ok/12 text-ok",
  warn: "bg-warn/12 text-warn",
  danger: "bg-danger/12 text-danger",
  muted: "bg-border/60 text-muted",
};

export function StatusChip({ label, tone = "muted" }: { label: string; tone?: ChipTone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[tone]}`}>
      {label}
    </span>
  );
}

export function statusTone(status: string): ChipTone {
  const s = status.toLowerCase();
  if (["active", "paid", "booked", "confirmed", "issued", "done"].includes(s)) return "ok";
  if (["pending", "requested", "scheduled", "processing"].includes(s)) return "warn";
  if (["cancelled", "canceled", "failed", "expired", "used"].includes(s)) return s === "used" ? "muted" : "danger";
  return "muted";
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 overflow-x-auto border-b border-border"
    >
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            className={`relative min-h-10 shrink-0 px-3 text-sm font-semibold transition-colors ${
              on ? "text-primary" : "text-muted hover:text-fg"
            }`}
          >
            {o.label}
            {on ? <span className="tab-mark" /> : null}
          </button>
        );
      })}
    </div>
  );
}
