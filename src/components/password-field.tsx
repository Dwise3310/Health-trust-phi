"use client";

import { useState } from "react";

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  minLength = 8,
  matchClass = "",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  minLength?: number;
  matchClass?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="field-group">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        minLength={minLength}
        required
        autoComplete={autoComplete}
        className={`${matchClass} pr-11`}
      />
      <span className="field-notch">{label}</span>
      <button
        type="button"
        className={`absolute right-1 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center text-muted ${
          show ? "" : "eye-hidden"
        }`}
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
          <path
            d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path
            className="eye-slash-line"
            d="M4 20 L20 4"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      </button>
    </div>
  );
}
