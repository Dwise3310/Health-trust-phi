import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { TIERS } from "@/lib/health/constants";
import { formatHealth, formatNaira, nairaFromHealth } from "@/lib/utils";

export const Route = createFileRoute("/tiers")({ component: Tiers });

function Tiers() {
  const { user, isPending } = useCurrentUserState();
  const joinTo = !isPending && user ? "/dashboard" : "/login?next=/dashboard";

  return (
    <PublicShell>
      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-4xl">Membership tiers</h1>
        <p className="mt-3 max-w-2xl text-muted">
          You can upgrade while a plan is live. Remaining time is added to the
          new term. You cannot downgrade until the current plan expires.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {Object.values(TIERS).map((t) => (
            <Card key={t.id} className="flex flex-col gap-4">
              <div>
                <p className="text-sm text-muted">{t.short}</p>
                <h2 className="mt-1 text-2xl">{t.name}</h2>
              </div>
              <p className="text-2xl tabular-nums">
                {formatHealth(t.priceHealth)}
              </p>
              <p className="text-sm text-muted">
                {formatNaira(nairaFromHealth(t.priceHealth))} at 1 Health = ₦100
              </p>
              <ul className="grid gap-2 text-sm text-muted">
                <li>{t.durationMonths} months of Care Quota</li>
                <li>Refreshes to 100% every 3 months</li>
                <li>{t.refreshes} auto-renewals in term</li>
                <li>
                  Queue rank{" "}
                  {t.queue === 1 ? "first" : t.queue === 2 ? "second" : "third"}
                </li>
              </ul>
              <Button asChild className="mt-auto">
                <Link to={joinTo}>
                  {user ? `Join ${t.short} in dashboard` : `Join ${t.short}`}
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      </main>
    </PublicShell>
  );
}
