"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ActionButton } from "@/components/action-button";
import { useToast } from "@/components/toast";
import { HEALTH_TO_NAIRA } from "@/lib/constants";
import { formatHealth, formatNaira, nairaFromHealth } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Fx = { usd: number; eur: number; asOf: string };
type Code = { code: string; allocated_percent: number; remaining_percent: number };
type Tx = { id: number; amount: number; kind: string; note: string | null; created_at: string };

type Currency = "health" | "ngn" | "usd" | "eur";

export default function WalletPage() {
  const { toast } = useToast();
  const [uid, setUid] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [account, setAccount] = useState("");
  const [quota, setQuota] = useState(0);
  const [plan, setPlan] = useState<string | null>(null);
  const [codes, setCodes] = useState<Code[]>([]);
  const [tx, setTx] = useState<Tx[]>([]);
  const [fx, setFx] = useState<Fx | null>(null);
  const [view, setView] = useState<Currency>("health");
  const [percent, setPercent] = useState("5");

  const naira = nairaFromHealth(balance);
  const display = useMemo(() => {
    if (view === "health") return formatHealth(balance);
    if (view === "ngn") return formatNaira(naira);
    if (!fx) return "Live FX loading";
    if (view === "usd")
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
        naira * fx.usd,
      );
    return new Intl.NumberFormat("en-EU", { style: "currency", currency: "EUR" }).format(
      naira * fx.eur,
    );
  }, [view, balance, naira, fx]);

  async function load(userId: string) {
    const supabase = createClient();
    if (!supabase) return;
    const { data: wallet, error: walletErr } = await supabase
      .from("wallets")
      .select("health_balance, account_number")
      .eq("user_id", userId)
      .maybeSingle();
    if (walletErr) toast(walletErr.message);
    if (wallet) {
      setBalance(Number(wallet.health_balance || 0));
      setAccount(wallet.account_number);
    }
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("quota_remaining, tier")
      .eq("user_id", userId)
      .eq("active", true)
      .maybeSingle();
    if (sub) {
      setQuota(Number(sub.quota_remaining));
      setPlan(sub.tier);
    } else {
      setQuota(0);
      setPlan(null);
    }
    const { data: codeRows } = await supabase
      .from("care_codes")
      .select("code, allocated_percent, remaining_percent")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setCodes((codeRows as Code[]) || []);
    const { data: history } = await supabase
      .from("wallet_tx")
      .select("id, amount, kind, note, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    setTx((history as Tx[]) || []);
  }

  useEffect(() => {
    fetch("/api/fx")
      .then((r) => r.json())
      .then((d) => {
        if (d.usd && d.eur) setFx(d);
      })
      .catch(() => {});
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUid(data.user.id);
      void load(data.user.id);
    });
  }, []);

  async function credit(amount: number) {
    const supabase = createClient();
    if (!supabase || !uid) {
      toast("Could not reach your wallet. Try again in a moment.");
      return;
    }
    const { data, error } = await supabase.rpc("sh_test_credit", { p_amount: amount });
    if (error) {
      toast(error.message);
      return;
    }
    if (typeof data === "number") setBalance(data);
    toast(`Added ${amount} Health`);
    void load(uid);
  }

  async function issueCode(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const slice = Number(percent);
    if (!supabase || !uid) {
      toast("Could not issue a code right now. Try again.");
      return;
    }
    if (!plan) {
      toast("Buy a membership first, then issue a Care Quota code.");
      return;
    }
    if (slice > quota) {
      toast("That slice is bigger than remaining Care Quota.");
      return;
    }
    const code = `SH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { error } = await supabase.from("care_codes").insert({
      user_id: uid,
      code,
      allocated_percent: slice,
      remaining_percent: slice,
      status: "active",
    });
    if (error) {
      toast(error.message);
      return;
    }
    toast("Care Quota code issued");
    void load(uid);
  }

  return (
    <main className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Wallet
        </p>
        <h1 className="mt-1 text-3xl">Health on your name</h1>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">Balance</p>
          <div className="flex rounded-full border border-border p-1 text-xs">
            {(
              [
                ["health", "Health"],
                ["ngn", "NGN"],
                ["usd", "USD"],
                ["eur", "EUR"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={`rounded-full px-2.5 py-1 ${
                  view === id ? "bg-primary text-primary-fg" : ""
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 font-serif text-4xl tabular-nums">{display}</p>
        <p className="mt-2 text-sm text-muted">
          1 Health is ₦{HEALTH_TO_NAIRA} (fixed). USD and EUR follow live naira
          market rates{fx ? `, as of ${fx.asOf}` : ""}.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-xl">Membership</h2>
        <p className="mt-2 text-sm text-muted">
          {plan
            ? `Sure Health ${plan} is active. Care Quota remaining ${quota}%.`
            : "No plan yet. Base, Plus, and Prime are paid from this wallet."}
        </p>
        <Link
          href="/dashboard/membership"
          className="btn-press mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-fg"
        >
          {plan ? "Change plan" : "Buy a plan"}
        </Link>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-xl">Funding account</h2>
        <p className="mt-2 font-mono text-lg tracking-wide">
          {account || "Preparing your account number"}
        </p>
        <p className="mt-2 text-sm text-muted">
          This number is yours for life. Pay into it from any Nigerian bank.
          1 Health is ₦100. Incoming naira lands as Health in this wallet.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[50, 100, 250].map((n) => (
            <ActionButton
              key={n}
              variant="secondary"
              size="sm"
              onClick={() => credit(n)}
            >
              Test +{n} Health
            </ActionButton>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-xl">Care Quota</h2>
        <p className="mt-2 text-3xl tabular-nums">{quota}%</p>
        <p className="mt-1 text-sm text-muted">
          Remaining cover for consults the clinician confirms. Issue a family
          code from here after you hold a plan.
        </p>
        <form onSubmit={issueCode} className="mt-4 grid gap-3">
          <label className="grid gap-1.5 text-sm">
            Percent to allocate
            <input
              type="number"
              min={1}
              max={15}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              className="rounded-xl border border-border bg-bg px-3 py-2.5"
            />
          </label>
          <ActionButton type="submit" variant="primary">
            Issue Care Quota code
          </ActionButton>
        </form>
        <ul className="mt-4 grid gap-2">
          {codes.map((c) => (
            <li
              key={c.code}
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm"
            >
              <span className="font-mono">{c.code}</span>
              <span className="text-muted">{c.allocated_percent}% reserved</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-xl">History</h2>
        <ul className="mt-3 grid gap-2">
          {tx.length === 0 ? (
            <li className="text-sm text-muted">No movement yet.</li>
          ) : (
            tx.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm"
              >
                <span>
                  {row.kind.replaceAll("_", " ")}
                  {row.note ? ` · ${row.note}` : ""}
                </span>
                <span className="tabular-nums">
                  {row.amount > 0 ? "+" : ""}
                  {row.amount} H
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
