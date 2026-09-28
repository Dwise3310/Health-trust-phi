import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/about", label: "About" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/tiers", label: "Tiers" },
  { to: "/referrals", label: "Referrals" },
  { to: "/updates", label: "Updates" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const { user, isPending } = useCurrentUserState();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg text-fg">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-fg">
            HT
          </span>
          Health Trust
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm text-muted hover:text-fg"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isPending ? (
            <div className="h-11 w-24 animate-pulse rounded-md bg-border" />
          ) : user ? (
            <>
              <Button asChild size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <UserButton />
            </>
          ) : (
            <SignedOut>
              <Button asChild size="sm" variant="outline">
                <Link to="/login">Sign in</Link>
              </Button>
            </SignedOut>
          )}
          <button
            type="button"
            className="grid size-11 place-items-center rounded-md border border-border md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-border px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm text-fg"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <SignedIn>
              <Link to="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </Link>
            </SignedIn>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
