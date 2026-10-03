"use client";

import { LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function AccountMenu({
  name,
  avatarUrl,
  onSignOut,
}: {
  name: string;
  avatarUrl?: string | null;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const initial = (name || "M").slice(0, 1).toUpperCase();

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        className="grid size-10 place-items-center overflow-hidden rounded-full border border-border bg-card"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="text-sm font-semibold">{initial}</span>
        )}
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-50 w-52 rounded-2xl border border-border bg-card p-2 shadow-lg">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
            onClick={() => setOpen(false)}
          >
            <UserRound className="size-4" /> Patient file
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
            onClick={() => setOpen(false)}
          >
            <Settings className="size-4" /> Settings
          </Link>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-danger"
            onClick={onSignOut}
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
