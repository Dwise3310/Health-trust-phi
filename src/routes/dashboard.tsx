import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ensureMember, setUsername } from "@/lib/health/actions";

export const Route = createFileRoute("/dashboard")({ component: DashboardLayout });

type MemberSnap = Awaited<ReturnType<typeof ensureMember>>;

const nav = [
  { to: "/dashboard", label: "Overview", exact: true },
  { to: "/dashboard/wallet", label: "Wallet" },
  { to: "/dashboard/codes", label: "Care Quota codes" },
  { to: "/dashboard/cards", label: "Appointment cards" },
  { to: "/dashboard/appointments", label: "Bookings" },
  { to: "/dashboard/referrals", label: "Referrals" },
  { to: "/dashboard/check", label: "Check a code" },
];

function DashboardLayout() {
  const { user, isPending } = useCurrentUserState();
  const [snap, setSnap] = useState<MemberSnap | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

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
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <Link to="/" className="font-display text-lg">
          Health Trust
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline">@{snap.profile.username}</span>
          <UserButton />
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted hover:bg-surface hover:text-fg"
              activeProps={{ className: "bg-surface text-fg" }}
              activeOptions={item.exact ? { exact: true } : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Outlet />
      </div>
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
      <Card className="grid w-full max-w-md gap-4">
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
