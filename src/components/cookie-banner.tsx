"use client";

import { useEffect, useState } from "react";
import { NavLink } from "./nav-link";

const KEY = "ht-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    if (!stored) setVisible(true);
  }, []);

  function choose(value: "essential" | "all") {
    localStorage.setItem(KEY, value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-card p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] md:p-5"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          We use essential cookies to keep you signed in and remember your
          theme. Analytics cookies stay off unless you accept all. Read the{" "}
          <NavLink href="/cookies" className="text-primary underline">
            cookie policy
          </NavLink>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-border px-4 py-2 text-sm"
            onClick={() => choose("essential")}
          >
            Essential only
          </button>
          <button
            type="button"
            className="rounded-full bg-primary px-4 py-2 text-sm text-primary-fg"
            onClick={() => choose("all")}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
