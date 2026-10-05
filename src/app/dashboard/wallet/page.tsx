"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { ActionButton } from "@/components/action-button";
import { NavLink } from "@/components/nav-link";
import { useToast } from "@/components/toast";
import { HEALTH_TO_NAIRA, TIERS, type TierId } from "@/lib/constants";
import { formatHealth, formatNaira, formatWhen, nairaFromHealth } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useLoading } from "@/components/loading-provider";

type Fx = { usd: number; eur: number; asOf: string };
type Code = {
  id: number;
  code: string;
  allocated_percent: number;
  remaining_percent: number;
  status: string;
  created_at: string;
};
type Tx = { id: number; amount: number; kind: string; note: string | null; created_at: string };
type Sub = {
  tier: TierId;
  started_at: string;
  expires_at: string;
  quota_percent: number;
  quota_remaining: number;
  next_refresh_at: string;
};
type Currency = "health" | "ngn" | "usd" | "eur";

export default function WalletPage() {
  const { toast } = useToast();
  const { start, stop } = useLoading();
  const [uid, setUid] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [account, setAccount] = useState("");
  const [sub, setSub] = useState<Sub | null>(null);
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
    const { data: row } = await supabase
      .from("subscriptions")
      .select("tier, started_at, expires_at, quota_percent, quota_remaining, next_refresh_at")
      .eq("user_id", userId)
      .eq("active", true)
      .maybeSingle();
    setSub((row as Sub) || null);
    const { data: codeRows } = await supabase
      .from("care_codes")
      .select("id, code, allocated_percent, remaining_percent, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setCodes((codeRows as Code[]) || []);
    const { data: history } = await supabase
      .from("wallet_tx")
      .select("id, amount, kind, note, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
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
    start("Adding Health");
    const { data, error } = await supabase.rpc("sh_test_credit", { p_amount: amount });
    stop();
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
    if (!sub) {
      toast("Buy a membership first, then issue a Care Quota code.");
      return;
    }
    if (slice > Number(sub.quota_remaining)) {
      toast("That slice is bigger than remaining Care Quota.");
      return;
    }
    start("Issuing code");
    const { error } = await supabase.rpc("sh_issue_code", { p_percent: slice });
    stop();
    if (error) {
      toast(error.message);
      return;
    }
    toast("Care Quota code issued");
    void load(uid);
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast("Code copied");
    } catch {
      toast(code);
    }
  }

  async function cancelCode(code: string) {
    const supabase = createClient();
    if (!supabase || !uid) return;
    start("Cancelling code");
    const { error } = await supabase.rpc("sh_cancel_code", { p_code: code });
    stop();
    if (error) {
      toast(error.message);
      return;
    }
    toast("Code cancelled. Quota returned.");
    void load(uid);
  }

  const plan = sub ? TIERS[sub.tier] : null;
  const used = sub ? Number(sub.quota_percent) - Number(sub.quota_remaining) : 0;

  return (
    <main className="grid gap-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Wallet
        </p>
        <h1 className="mt-1 text-3xl">Health on your name</h1>
      </div>

      <section className="desk-block">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">Balance</p>
          <div className="flex gap-1 text-xs">
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
                className={`px-2.5 py-1 ${
                  view === id ? "text-primary" : "text-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 font-serif text-4xl tabular-nums">{display}</p>
        <p className="mt-2 text-sm text-muted">
          1 Health is ₦{HEALTH_TO_NAIRA} (fixed). USD and EUR use live naira
          rates from ExchangeRate-API (open.er-api.com), refreshed every 30
          minutes{fx ? `. Last print ${fx.asOf}` : ""}.
        </p>
      </section>

      <section className="desk-block">
        <p className="text-sm text-muted">Current plan</p>
        {plan && sub ? (
          <div className="mt-2 grid gap-2">
            <h2 className="text-2xl">{plan.name}</h2>
            <p className="text-sm text-muted">{plan.quotaHint}</p>
            <p className="text-sm">
              {plan.durationMonths} months · queue rank {plan.queue} ·{" "}
              {plan.refreshes} quota refreshes
            </p>
            <p className="text-sm">
              Active {formatWhen(sub.started_at)} · ends{" "}
              {new Date(sub.expires_at).toLocaleDateString("en-NG")}
            </p>
            <p className="text-sm">
              Care Quota {Number(sub.quota_remaining)}% remaining of{" "}
              {Number(sub.quota_percent)}% · {used}% already allocated · next
              refresh {new Date(sub.next_refresh_at).toLocaleDateString("en-NG")}
            </p>
            <ul className="mt-1 grid gap-1 text-sm text-muted">
              {plan.perks.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            {sub.tier !== "prime" ? (
              <NavLink
                href="/dashboard/membership"
                className="mt-2 inline-block text-sm font-semibold text-primary"
              >
                Upgrade plan
              </NavLink>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No plan yet.{" "}
            <NavLink href="/dashboard/membership" className="font-semibold text-primary">
              Choose Base, Plus, or Prime
            </NavLink>
          </p>
        )}
      </section>

      <section className="desk-block">
        <h2 className="text-xl">Funding account</h2>
        <p className="mt-2 font-mono text-lg tracking-wide">
          {account || "Preparing your account number"}
        </p>
        <p className="mt-2 text-sm text-muted">
          This number is yours for life. Pay into it from any Nigerian bank.
          1 Health is ₦100.
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

      <section className="desk-block">
        <h2 className="text-xl">Care Quota codes</h2>
        <p className="mt-1 text-sm text-muted">
          Remaining cover {sub ? `${sub.quota_remaining}% of 100%` : "needs a plan"}.
        </p>
        <form onSubmit={issueCode} className="mt-4 grid gap-3">
          <label className="grid gap-1.5 text-sm">
            Percent to allocate
            <input
              type="number"
              min={1}
              max={100}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              className="rounded-xl border border-border bg-bg px-3 py-2.5"
            />
          </label>
          <ActionButton type="submit" variant="primary">
            Issue Care Quota code
          </ActionButton>
        </form>
        <ul className="mt-5 grid gap-5">
          {codes.map((c) => {
            const usedPct = Number(c.allocated_percent) - Number(c.remaining_percent);
            return (
              <li key={c.code}>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-lg">{c.code}</p>
                  <button
                    type="button"
                    className="copy-btn"
                    onClick={() => copyCode(c.code)}
                    aria-label="Copy code"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-muted">
                  Issued {formatWhen(c.created_at)} · {c.status}
                </p>
                <p className="mt-1 text-sm">
                  {usedPct}% used of {c.allocated_percent}% allocated ·{" "}
                  {c.remaining_percent}% still on this code
                </p>
                {c.status === "active" ? (
                  <ActionButton
                    className="mt-2"
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelCode(c.code)}
                  >
                    Cancel code
                  </ActionButton>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="desk-block">
        <h2 className="text-xl">Activity</h2>
        <ul className="mt-3 grid gap-4">
          {tx.length === 0 ? (
            <li className="text-sm text-muted">No movement yet.</li>
          ) : (
            tx.map((row) => (
              <li key={row.id}>
                <p className="text-sm font-semibold capitalize">
                  {row.kind.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatWhen(row.created_at)}
                </p>
                <p className="mt-1 text-sm">{row.note || "Wallet movement"}</p>
                <p className="mt-1 tabular-nums">
                  {row.amount > 0 ? "+" : ""}
                  {row.amount} Health
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
