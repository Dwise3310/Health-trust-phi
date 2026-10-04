"use client";

import { useEffect, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { useToast } from "@/components/toast";
import { TIERS, type TierId } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const ORDER: TierId[] = ["base", "plus", "prime"];

type Sub = { tier: string; expires_at: string; quota_remaining: number };

export default function MembershipPage() {
  const { toast } = useToast();
  const [uid, setUid] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [sub, setSub] = useState<Sub | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

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

  async function buy(id: TierId) {
    const supabase = createClient();
    if (!supabase || !uid) return;
    const tier = TIERS[id];
    if (balance < tier.priceHealth) {
      toast("Not enough Health. Use Wallet test credit first, then come back.");
      return;
    }
    setBusy(id);
    const { error } = await supabase.rpc("sh_buy_tier", { p_tier: id });
    setBusy(null);
    if (error) {
      toast(error.message);
      return;
    }
    toast(`${tier.name} is now active`);
    void load(uid);
  }

  return (
    <main className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Membership
        </p>
        <h1 className="mt-1 text-3xl">Choose Base, Plus, or Prime</h1>
        <p className="mt-2 text-sm text-muted">
          Paid from your Health wallet. Wallet has {balance} Health right now.
        </p>
      </div>

      {sub ? (
        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted">Active plan</p>
          <p className="mt-1 text-2xl capitalize">Sure Health {sub.tier}</p>
          <p className="mt-1 text-sm text-muted">
            Until {new Date(sub.expires_at).toLocaleDateString("en-NG")} · Care
            Quota remaining {sub.quota_remaining}%
          </p>
        </section>
      ) : (
        <p className="text-sm text-muted">No plan yet. Pick one below.</p>
      )}

      <div className="grid gap-3">
        {ORDER.map((id) => {
          const tier = TIERS[id];
          const on = sub?.tier === id;
          return (
            <article
              key={id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl">{tier.name}</h2>
                  <p className="mt-1 text-sm text-muted">{tier.quotaHint}</p>
                </div>
                <p className="text-sm font-semibold">{formatPrice(tier.priceHealth)}</p>
              </div>
              <p className="mt-2 text-xs text-muted">
                {tier.durationMonths} months · queue rank {tier.queue}
              </p>
              <ul className="mt-3 grid gap-1 text-sm text-muted">
                {tier.perks.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <ActionButton
                className="mt-4"
                variant={on ? "secondary" : "primary"}
                disabled={on || busy === id}
                onClick={() => buy(id)}
              >
                {on ? "Current plan" : busy === id ? "Paying" : `Pay ${tier.short}`}
              </ActionButton>
            </article>
          );
        })}
      </div>
    </main>
  );
}
