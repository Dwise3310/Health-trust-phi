"use client";

type Props = {
  label: string;
  onClick: () => void;
};

export function GoogleButton({ label, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-press flex w-full items-center justify-center gap-2 rounded-full border border-border bg-bg px-4 py-2.5 text-sm font-medium"
    >
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.7 2.2 2.4 6.5 2.4 11.8S6.7 21.4 12 21.4c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z"
        />
      </svg>
      {label}
    </button>
  );
}
