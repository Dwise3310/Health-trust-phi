"use client";

import { Check, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { useLoading } from "@/components/loading-provider";
import { PageHeader, StatusChip } from "@/components/ui";
import { useToast } from "@/components/toast";
import { TIERS, type TierId } from "@/lib/constants";
import { formatHealth, formatNaira, nairaFromHealth } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const ORDER: TierId[] = ["base", "plus", "prime"];
const RANK: Record<TierId, number> = { base: 1, plus: 2, prime: 3 };

type Sub = { tier: TierId; expires_at: string; quota_remaining: number };

export default function MembershipPage() {
  const { toast } = useToast();
  const { start, stop } = useLoading();
  const [uid, setUid] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [sub, setSub] = useState<Sub | null>(null);
  const [pick, setPick] = useState<TierId | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(userId: string) {
    const supabase = createClient();
    if (!supabase) return;
    const { data: wallet } = await supabase
      .from("wallets")
      .select("health_balance")
      .eq("user_id", userId)
      .maybeSingle();
    if (wallet) setBalance(Number(wallet.health_balance || 0));
    const { data: row } = await supabase
      .from("subscriptions")
      .select("tier, expires_at, quota_remaining")
      .eq("user_id", userId)
      .eq("active", true)
      .maybeSingle();
    setSub((row as Sub) || null);
  }

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUid(data.user.id);
      void load(data.user.id);
    });
  }, []);

  const live = Boolean(sub && new Date(sub.expires_at) > new Date());

  // Same rule as the database: while a plan is live you can only move up.
  function lockReason(id: TierId): string | null {
    if (!sub || !live) return null;
    if (sub.tier === id) return null;
    if (RANK[id] < RANK[sub.tier]) {
      return `You can move up while ${TIERS[sub.tier].name} is live. Lower plans open when it ends.`;
    }
    return null;
  }

  async function pay(id: TierId) {
    const supabase = createClient();
    if (!supabase || !uid) return;
    setBusy(true);
    start("Confirming plan");
    const { error } = await supabase.rpc("sh_buy_tier", { p_tier: id });
    stop();
    setBusy(false);
    setPick(null);
    if (error) {
      toast(error.message);
      return;
    }
    toast(`${TIERS[id].name} is now active`);
    void load(uid);
  }

  return (
    <main className="grid gap-6">
      <PageHeader eyebrow="Care" title="Choose a plan">
        Plans are paid from your Health wallet. You have {formatHealth(balance)} (about{" "}
        {formatNaira(nairaFromHealth(balance))}). You can move up while a plan is live. You
        cannot move down until it ends.
      </PageHeader>

      <div className="split" style={{ "--cols": 3 } as React.CSSProperties}>
        {ORDER.map((id) => {
          const tier = TIERS[id];
          const current = sub?.tier === id && live;
          const reason = lockReason(id);
          const affordable = balance >= tier.priceHealth;
          return (
            <article
              key={id}
              className="flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl">{tier.name}</h2>
                  <p className="mt-1 text-sm text-muted">{tier.quotaHint}</p>
                </div>
                {current ? <StatusChip label="Your plan" tone="ok" /> : null}
              </div>

              <div>
                <p className="font-serif text-3xl tabular-nums">{tier.priceHealth} Health</p>
                <p className="text-sm text-muted">about {formatNaira(nairaFromHealth(tier.priceHealth))}</p>
              </div>

              <dl className="grid grid-cols-2 gap-3 border-y border-border py-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">Duration</dt>
                  <dd className="font-semibold">{tier.durationMonths} months</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Queue rank</dt>
                  <dd className="font-semibold">{tier.queue === 1 ? "First" : tier.queue === 2 ? "Second" : "Third"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Care Quota</dt>
                  <dd className="font-semibold">100% on purchase</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Quota refreshes</dt>
                  <dd className="font-semibold">{tier.refreshes} times</dd>
                </div>
              </dl>

              <ul className="grid gap-2 text-sm">
                {tier.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto grid gap-2">
                {current ? (
                  <ActionButton variant="secondary" disabled>
                    Current plan
                  </ActionButton>
                ) : reason ? (
                  <>
                    <ActionButton variant="secondary" disabled>
                      <Lock className="size-4" aria-hidden /> Locked for now
                    </ActionButton>
                    <p className="text-xs text-muted">{reason}</p>
                  </>
                ) : (
                  <>
                    <ActionButton
                      variant="primary"
                      onClick={() => {
                        if (!affordable) {
                          toast(`You need ${tier.priceHealth - balance} more Health. Fund your wallet first.`);
                          return;
                        }
                        setPick(id);
                      }}
                    >
                      {affordable ? `Pay ${tier.priceHealth} Health` : `Need ${tier.priceHealth - balance} more Health`}
                    </ActionButton>
                    {!affordable ? (
                      <p className="text-xs text-muted">Fund your wallet to unlock this plan.</p>
                    ) : null}
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {pick ? (
        <div className="pay-mask" role="dialog" aria-modal="true" aria-labelledby="confirm-plan">
          <div className="pay-sheet">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Confirm plan
            </p>
            <h2 id="confirm-plan" className="mt-2 text-2xl">
              {TIERS[pick].name}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {TIERS[pick].priceHealth} Health (about {formatNaira(nairaFromHealth(TIERS[pick].priceHealth))})
              leaves your wallet. Your Care Quota is set to 100%. Your current plan, if any, is replaced.
            </p>
            <div className="mt-6 grid gap-2">
              <ActionButton variant="primary" onClick={() => pay(pick)} disabled={busy}>
                {busy ? "Taking payment" : "Confirm and pay"}
              </ActionButton>
              <ActionButton variant="ghost" onClick={() => setPick(null)} disabled={busy}>
                Cancel
              </ActionButton>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
