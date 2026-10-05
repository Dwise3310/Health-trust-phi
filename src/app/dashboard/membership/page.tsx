"use client";

import { useEffect, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { PaySlide } from "@/components/pay-slide";
import { useLoading } from "@/components/loading-provider";
import { useToast } from "@/components/toast";
import { TIERS, type TierId } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
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
  const [step, setStep] = useState<"ask" | "slide">("ask");
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

  function canBuy(id: TierId) {
    if (!sub) return true;
    if (new Date(sub.expires_at) <= new Date()) return true;
    return RANK[id] > RANK[sub.tier];
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
    <main className="grid gap-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Membership
        </p>
        <h1 className="mt-1 text-3xl">Choose Base, Plus, or Prime</h1>
        <p className="mt-2 text-sm text-muted">
          Paid from your Health wallet. You have {balance} Health. You can
          upgrade while a plan is live. You cannot step down until it ends.
        </p>
      </div>

      {ORDER.map((id) => {
        const tier = TIERS[id];
        const on = sub?.tier === id;
        const allowed = canBuy(id);
        return (
          <article key={id} className="desk-block">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl">{tier.name}</h2>
                <p className="mt-1 text-sm text-muted">{tier.quotaHint}</p>
              </div>
              <p className="text-sm font-semibold">{formatPrice(tier.priceHealth)}</p>
            </div>
            <p className="mt-2 text-xs text-muted">
              {tier.durationMonths} months · queue rank {tier.queue} · Care Quota
              starts at 100%
            </p>
            <ul className="mt-3 grid gap-1 text-sm text-muted">
              {tier.perks.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <ActionButton
              className="mt-4"
              variant={on ? "secondary" : "primary"}
              disabled={on || !allowed}
              onClick={() => {
                if (balance < tier.priceHealth) {
                  toast("Not enough Health. Add some in Wallet first.");
                  return;
                }
                setPick(id);
                setStep("ask");
              }}
            >
              {on ? "Current plan" : allowed ? `Pay ${tier.short}` : "Downgrade locked"}
            </ActionButton>
          </article>
        );
      })}

      {pick ? (
        <div className="pay-mask">
          <div className="pay-sheet">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Confirm payment
            </p>
            <h2 className="mt-2 text-2xl">{TIERS[pick].name}</h2>
            <p className="mt-2 text-sm text-muted">
              {formatPrice(TIERS[pick].priceHealth)} leaves this wallet. Care
              Quota fills to 100%. This cannot be undone from a mis-tap.
            </p>
            {step === "ask" ? (
              <div className="mt-6 grid gap-2">
                <ActionButton
                  variant="primary"
                  onClick={() => setStep("slide")}
                >
                  Confirm payment
                </ActionButton>
                <ActionButton variant="ghost" onClick={() => setPick(null)}>
                  Cancel
                </ActionButton>
              </div>
            ) : (
              <div className="mt-6">
                {busy ? (
                  <p className="text-sm text-muted">Taking payment</p>
                ) : (
                  <PaySlide
                    label="Slide left to pay"
                    onConfirm={() => pay(pick)}
                  />
                )}
                <ActionButton
                  className="mt-4"
                  variant="ghost"
                  onClick={() => setPick(null)}
                  disabled={busy}
                >
                  Cancel
                </ActionButton>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
