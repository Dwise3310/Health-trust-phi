"use client";

import { Copy } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { useLoading } from "@/components/loading-provider";
import { NavLink } from "@/components/nav-link";
import { PageHeader, Segmented, StatusChip, statusTone } from "@/components/ui";
import { useToast } from "@/components/toast";
import {
  HEALTH_TO_NAIRA,
  KIND_LABELS,
  TEST_FAUCET,
  TIERS,
  type TierId,
} from "@/lib/constants";
import { formatHealth, formatNaira, formatWhen, nairaFromHealth } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

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
type Tab = "overview" | "codes" | "activity";

const CURRENCIES: { id: Currency; label: string }[] = [
  { id: "health", label: "Health" },
  { id: "ngn", label: "NGN" },
  { id: "usd", label: "USD" },
  { id: "eur", label: "EUR" },
];

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "codes", label: "Care codes" },
  { id: "activity", label: "Activity" },
];

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
  const [tab, setTab] = useState<Tab>("overview");
  const [percent, setPercent] = useState("5");

  const naira = nairaFromHealth(balance);
  const display = useMemo(() => {
    if (view === "health") return formatHealth(balance);
    if (view === "ngn") return formatNaira(naira);
    if (!fx) return "Loading rate";
    if (view === "usd")
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(naira * fx.usd);
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }).format(naira * fx.eur);
  }, [view, balance, naira, fx]);

  const load = useCallback(
    async (userId: string) => {
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
    },
    [toast],
  );

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
  }, [load]);

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
      toast("Choose a plan first, then issue a Care Quota code.");
      return;
    }
    if (slice > Number(sub.quota_remaining)) {
      toast("That slice is bigger than the Care Quota you have left.");
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
  const remaining = sub ? Math.max(0, Math.min(100, Number(sub.quota_remaining))) : 0;
  const visibleTx = tx.filter((row) => TEST_FAUCET || row.kind !== "test_credit");

  return (
    <main className="grid gap-6">
      <PageHeader eyebrow="Money" title="Your Health wallet" />

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Balance</p>
          <Segmented label="Show balance in" value={view} options={CURRENCIES} onChange={setView} />
        </div>
        <p className="font-serif text-4xl tabular-nums">{display}</p>
        <p className="text-sm text-muted">
          1 Health is ₦{HEALTH_TO_NAIRA}, fixed. USD and EUR use live naira rates
          {fx ? `, last updated ${fx.asOf}` : ""}.
        </p>
        <div className="flex flex-wrap gap-3">
          <NavLink href="/dashboard/withdraw" className="rounded-full border border-border px-4 py-2 text-sm font-semibold">
            Withdraw
          </NavLink>
          <NavLink href="/dashboard/appointments" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-fg">
            Book a visit
          </NavLink>
        </div>
      </section>

      <Segmented label="Wallet sections" value={tab} options={TABS} onChange={setTab} />

      {tab === "overview" ? (
        <div className="split" style={{ "--cols": 2 } as React.CSSProperties}>
          <section className="grid content-start gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg">Your plan</h2>
              {plan ? <StatusChip label="Active" tone="ok" /> : null}
            </div>
            {plan && sub ? (
              <>
                <p className="text-xl font-semibold">{plan.name}</p>
                <p className="text-sm text-muted">
                  Active until {new Date(sub.expires_at).toLocaleDateString("en-NG")}. Next Care Quota refresh{" "}
                  {new Date(sub.next_refresh_at).toLocaleDateString("en-NG")}.
                </p>
                <div>
                  <div className="flex items-baseline justify-between text-sm">
                    <span>Care Quota left</span>
                    <span className="font-semibold tabular-nums">{remaining}%</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={remaining} aria-label="Care Quota remaining">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${remaining}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted">{used}% already shared out as codes.</p>
                </div>
                {sub.tier !== "prime" ? (
                  <NavLink href="/dashboard/membership" className="text-sm font-semibold text-primary">
                    See upgrade options
                  </NavLink>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-sm text-muted">No plan yet. A plan starts your Care Quota for consultations and diagnosis.</p>
                <NavLink href="/dashboard/membership" className="text-sm font-semibold text-primary">
                  Choose a plan
                </NavLink>
              </>
            )}
          </section>

          <section className="grid content-start gap-3">
            <h2 className="text-lg">Funding account</h2>
            <p className="font-mono text-lg tracking-wide break-all">
              {account || "Preparing your account number"}
            </p>
            <p className="text-sm text-muted">
              Pay into this number from any Nigerian bank. It stays yours. 1 Health is ₦{HEALTH_TO_NAIRA}.
            </p>
            {TEST_FAUCET ? (
              <div className="mt-2 grid gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Test mode
                </p>
                <div className="flex flex-wrap gap-2">
                  {[50, 100, 250].map((n) => (
                    <ActionButton key={n} variant="secondary" size="sm" onClick={() => credit(n)}>
                      Test +{n} Health
                    </ActionButton>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {tab === "codes" ? (
        <div className="grid gap-4">
          <section className="grid gap-4">
            <div>
              <h2 className="text-lg">Share cover with family</h2>
              <p className="mt-1 text-sm text-muted">
                Issue a Care Quota code as a slice of your cover. You cannot give out more than you have left.
                {sub ? ` You have ${remaining}% left.` : " You need a plan first."}
              </p>
            </div>
            <form onSubmit={issueCode} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
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
              <ActionButton type="submit" variant="primary" disabled={!sub}>
                Issue code
              </ActionButton>
            </form>
          </section>

          {codes.length === 0 ? (
            <p className="text-sm text-muted">No codes yet. Codes you issue will appear here.</p>
          ) : (
            <ul className="rows">
              {codes.map((c) => {
                const usedPct = Number(c.allocated_percent) - Number(c.remaining_percent);
                return (
                  <li key={c.code} className="grid gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-lg">{c.code}</p>
                        <button
                          type="button"
                          className="copy-btn"
                          onClick={() => copyCode(c.code)}
                          aria-label={`Copy code ${c.code}`}
                        >
                          <Copy className="size-3.5" />
                        </button>
                      </div>
                      <StatusChip label={c.status} tone={statusTone(c.status)} />
                    </div>
                    <p className="text-sm">
                      {usedPct}% used of {c.allocated_percent}% allocated · {c.remaining_percent}% still on this code
                    </p>
                    <p className="text-xs text-muted">Issued {formatWhen(c.created_at)}</p>
                    {c.status === "active" ? (
                      <div>
                        <ActionButton variant="ghost" size="sm" onClick={() => cancelCode(c.code)}>
                          Cancel code and return quota
                        </ActionButton>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "activity" ? (
        <section className="">
          {visibleTx.length === 0 ? (
            <p className="text-sm text-muted">No movement yet. Deposits, plans, and withdrawals appear here.</p>
          ) : (
            <ul className="grid divide-y divide-border">
              {visibleTx.map((row) => (
                <li key={row.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {KIND_LABELS[row.kind] || row.kind.replaceAll("_", " ")}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{formatWhen(row.created_at)}</p>
                    <p className="mt-1 text-sm text-muted">{row.note || "Wallet movement"}</p>
                  </div>
                  <p className={`shrink-0 font-semibold tabular-nums ${row.amount < 0 ? "text-fg" : "text-ok"}`}>
                    {row.amount > 0 ? "+" : ""}
                    {row.amount} Health
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </main>
  );
}
