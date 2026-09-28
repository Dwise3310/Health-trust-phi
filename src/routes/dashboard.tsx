import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  CreditCard,
  Home,
  Menu,
  QrCode,
  Search,
  Share2,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ensureMember, setUsername } from "@/lib/health/actions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({ component: DashboardLayout });

type MemberSnap = Awaited<ReturnType<typeof ensureMember>>;

const nav = [
  { to: "/dashboard", label: "Overview", icon: Home, exact: true },
  { to: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { to: "/dashboard/codes", label: "Codes", icon: QrCode },
  { to: "/dashboard/cards", label: "Cards", icon: CreditCard },
  { to: "/dashboard/appointments", label: "Bookings", icon: CalendarDays },
  { to: "/dashboard/referrals", label: "Referrals", icon: Share2 },
  { to: "/dashboard/check", label: "Check code", icon: Search },
] as const;

function DashboardLayout() {
  const { user, isPending } = useCurrentUserState();
  const [snap, setSnap] = useState<MemberSnap | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  async function reload() {
    const data = await ensureMember();
    setSnap(data);
  }

  useEffect(() => {
    if (!user) return;
    ensureMember()
      .then(setSnap)
      .catch((e) => setLoadErr(e instanceof Error ? e.message : "Failed"));
  }, [user]);

  if (isPending) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg text-muted">
        Loading session…
      </div>
    );
  }
  if (!user) return <RedirectToSignIn to="/login" />;

  if (!snap) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg text-muted">
        {loadErr ?? "Preparing your membership…"}
      </div>
    );
  }

  if (!snap.profile.username) {
    return <UsernameGate onDone={reload} />;
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Top bar — roomy, not compacted */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16">
          <button
            type="button"
            className="grid size-10 place-items-center rounded-xl border border-border bg-surface text-fg md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-fg shadow-sm">
              HT
            </span>
            <span className="truncate font-display text-base sm:text-lg">Health Trust</span>
          </Link>

          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="hidden max-w-[10rem] truncate rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-muted sm:inline-block">
              @{snap.profile.username}
            </span>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Mobile slide-over menu */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col bg-bg shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <p className="font-display text-lg">Menu</p>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-xl border border-border"
                onClick={() => setMenuOpen(false)}
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs text-muted">Signed in as</p>
              <p className="font-medium">@{snap.profile.username}</p>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted transition hover:bg-surface hover:text-fg"
                  activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
                  activeOptions={item.exact ? { exact: true } : undefined}
                >
                  <item.icon className="size-5 shrink-0" />
                  {item.label === "Codes" ? "Care Quota codes" : item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 pb-28 md:grid-cols-[220px_1fr] md:pb-8">
        {/* Desktop sidebar */}
        <nav className="hidden md:flex md:flex-col md:gap-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-surface hover:text-fg"
              activeProps={{ className: "bg-surface text-fg font-medium shadow-sm" }}
              activeOptions={item.exact ? { exact: true } : undefined}
            >
              <item.icon className="size-4 shrink-0 opacity-80" />
              {item.label === "Codes" ? "Care Quota codes" : item.label}
            </Link>
          ))}
        </nav>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom bar — primary destinations */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {nav.slice(0, 4).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[10px] text-muted"
              activeProps={{ className: "text-primary font-semibold" }}
              activeOptions={item.exact ? { exact: true } : undefined}
            >
              <item.icon className="size-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
          <button
            type="button"
            className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[10px] text-muted"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-5" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function UsernameGate({ onDone }: { onDone: () => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await setUsername({
        data: {
          username: String(fd.get("username") ?? ""),
          fullName: String(fd.get("fullName") ?? "") || undefined,
          phone: String(fd.get("phone") ?? "") || undefined,
          referredBy: String(fd.get("referredBy") ?? "") || undefined,
        },
      });
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4">
      <Card className="grid w-full max-w-md gap-4 p-6">
        <h1 className="text-2xl">Choose a permanent username</h1>
        <p className="text-sm text-muted">
          Usernames are unique and cannot be changed later. Use this as your
          public handle and referral identity.
        </p>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <div className="grid gap-1.5">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" required minLength={3} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="referredBy">Referrer username or code (optional)</Label>
            <Input id="referredBy" name="referredBy" />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={busy}>
            Lock username
          </Button>
        </form>
      </Card>
    </div>
  );
}
