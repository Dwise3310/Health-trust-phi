"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { HOSPITAL, NAV } from "@/lib/constants";
import { NavLink } from "./nav-link";
import { ThemeToggle } from "./theme-toggle";

export function Header({ signedIn }: { signedIn?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <NavLink href="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full border border-primary text-xs font-semibold text-primary">
            HT
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold">{HOSPITAL.program}</span>
            <span className="block text-[11px] text-muted">
              {HOSPITAL.sponsor}
            </span>
          </span>
        </NavLink>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Main">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="text-sm text-muted hover:text-fg"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NavLink
            href={signedIn ? "/dashboard" : "/login"}
            className="hidden rounded-full bg-primary px-4 py-2 text-sm text-primary-fg sm:inline-flex"
          >
            {signedIn ? "Dashboard" : "Sign in"}
          </NavLink>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-border lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          className="grid gap-1 border-t border-border px-4 py-3 lg:hidden"
          aria-label="Mobile"
        >
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="rounded-lg px-2 py-2 text-sm"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            href={signedIn ? "/dashboard" : "/login"}
            className="rounded-lg bg-primary px-3 py-2 text-center text-sm text-primary-fg"
            onClick={() => setOpen(false)}
          >
            {signedIn ? "Dashboard" : "Sign in"}
          </NavLink>
        </nav>
      ) : null}
    </header>
  );
}
