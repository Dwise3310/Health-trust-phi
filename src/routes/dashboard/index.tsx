import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ensureMember, subscribeTier } from "@/lib/health/actions";
import { TIERS, type TierId } from "@/lib/health/constants";
import { formatHealth } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/")({ component: Overview });

function Overview() {
  const [snap, setSnap] = useState<Awaited<ReturnType<typeof ensureMember>> | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setSnap(await ensureMember());
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function join(tier: TierId) {
    setMsg(null);
    try {
      await subscribeTier({ data: { tier } });
      await load();
      setMsg(`Joined ${TIERS[tier].name}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not subscribe");
    }
  }

  if (!snap) return <p className="text-muted">Loading…</p>;
  const sub = snap.subscription;
  const quota = sub ? Number(sub.quota_percent) : 0;

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl">Overview</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Wallet</p>
          <p className="mt-2 text-2xl tabular-nums">
            {formatHealth(Number(snap.wallet?.health_balance ?? 0))}
          </p>
          <p className="mt-1 text-xs text-muted">
            Account {snap.wallet?.account_number}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Care Quota</p>
          <p className="mt-2 text-2xl tabular-nums">{quota.toFixed(0)}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
            <div className="h-full bg-primary" style={{ width: `${Math.min(100, quota)}%` }} />
          </div>
        </Card>
        <Card>
          <p className="text-sm text-muted">Plan</p>
          <p className="mt-2 text-2xl">{sub ? TIERS[sub.tier].short : "None"}</p>
          {sub ? (
            <p className="mt-1 text-xs text-muted">
              Next refresh {new Date(sub.next_refresh_at).toLocaleDateString()} ·
              ends {new Date(sub.expires_at).toLocaleDateString()}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted">Subscribe from the wallet after funding.</p>
          )}
        </Card>
      </div>
      {msg ? <p className="text-sm text-muted">{msg}</p> : null}
      <div className="grid gap-3 md:grid-cols-3">
        {Object.values(TIERS).map((t) => (
          <Card key={t.id} className="grid gap-3">
            <h2>{t.name}</h2>
            <p className="tabular-nums">{formatHealth(t.priceHealth)}</p>
            <Button type="button" onClick={() => join(t.id)}>
              {sub ? "Upgrade / join" : "Subscribe"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
