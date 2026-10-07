"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { NavLink } from "@/components/nav-link";
import { PageHeader, StatusChip } from "@/components/ui";
import { useToast } from "@/components/toast";
import { HEALTH_TO_NAIRA } from "@/lib/constants";
import { formatHealth, formatNaira, nairaFromHealth } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Step = "bank" | "amount" | "review" | "done";
const STEPS: { id: Step; label: string }[] = [
  { id: "bank", label: "Bank" },
  { id: "amount", label: "Amount" },
  { id: "review", label: "Review" },
];

const QUICK = [50, 100, 250];

function mask(account: string) {
  const digits = account.replace(/\s+/g, "");
  return digits.length > 4 ? `•••• ${digits.slice(-4)}` : digits;
}

export default function WithdrawPage() {
  const { toast } = useToast();
  const [uid, setUid] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [amount, setAmount] = useState("50");
  const [step, setStep] = useState<Step>("bank");
  const [loaded, setLoaded] = useState(false);
  const [hasSavedBank, setHasSavedBank] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(0);

  const load = useCallback(
    async (userId: string) => {
      const supabase = createClient();
      if (!supabase) return;
      const { data: wallet, error } = await supabase
        .from("wallets")
        .select("health_balance, bank_name, bank_account, bank_account_name")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        toast(error.message);
        return;
      }
      if (wallet) {
        setBalance(Number(wallet.health_balance || 0));
        setBankName(wallet.bank_name || "");
        setBankAccount(wallet.bank_account || "");
        setBankAccountName(wallet.bank_account_name || "");
        setHasSavedBank(
          Boolean(wallet.bank_name && wallet.bank_account && wallet.bank_account_name),
        );
      }
    },
    [toast],
  );

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUid(data.user.id);
      void load(data.user.id).then(() => setLoaded(true));
    });
  }, [load]);

  // Skip the bank form only if a complete account was already saved on the server.
  // Do not watch live typing. One digit must not jump the step.
  useEffect(() => {
    if (loaded && hasSavedBank) setStep("amount");
  }, [loaded, hasSavedBank]);

  const n = Number(amount);
  const amountError =
    !amount || Number.isNaN(n) || n <= 0
      ? "Enter an amount above 0 Health."
      : n > balance
        ? `You have ${formatHealth(balance)}. Choose a smaller amount.`
        : null;

  async function saveBank(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase || !uid) return;
    const digits = bankAccount.replace(/\D/g, "");
    if (!bankName.trim() || !bankAccountName.trim()) {
      toast("Fill bank name and account name first.");
      return;
    }
    if (digits.length !== 10) {
      toast("Enter the 10-digit NUBAN account number, then tap Save and continue.");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("wallets")
      .update({
        bank_name: bankName.trim(),
        bank_account: digits,
        bank_account_name: bankAccountName.trim(),
      })
      .eq("user_id", uid);
    setBusy(false);
    if (error) {
      toast(error.message);
      return;
    }
    setBankAccount(digits);
    setHasSavedBank(true);
    toast("Bank details saved");
    setStep("amount");
  }

  async function requestWithdraw() {
    const supabase = createClient();
    if (!supabase || !uid || amountError) return;
    setBusy(true);
    const { error } = await supabase.rpc("sh_request_withdraw", {
      p_amount: n,
      p_note: `${bankName} ${bankAccountName} ${bankAccount}`,
    });
    setBusy(false);
    if (error) {
      toast(error.message);
      return;
    }
    setSent(n);
    setStep("done");
    void load(uid);
  }

  if (!loaded) {
    return (
      <main className="grid gap-6">
        <PageHeader eyebrow="Money" title="Withdraw to your bank" />
        <div className="h-40 animate-pulse" aria-hidden />
      </main>
    );
  }

  return (
    <main className="grid gap-6">
      <PageHeader eyebrow="Money" title="Withdraw to your bank">
        Available {formatHealth(balance)}, about {formatNaira(nairaFromHealth(balance))}.
      </PageHeader>

      {step !== "done" ? (
        <ol className="flex items-center gap-2 text-sm" aria-label="Withdrawal steps">
          {STEPS.map((s, i) => {
            const idx = STEPS.findIndex((x) => x.id === step);
            const on = i <= idx;
            return (
              <li key={s.id} className="flex flex-1 items-center gap-2">
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                    on ? "bg-primary text-primary-fg" : "border border-border text-muted"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={on ? "font-semibold" : "text-muted"}>{s.label}</span>
                {i < STEPS.length - 1 ? <span className="mx-1 h-px flex-1 bg-border" aria-hidden /> : null}
              </li>
            );
          })}
        </ol>
      ) : null}

      {step === "bank" ? (
        <form onSubmit={saveBank} className="grid gap-4">
          <div>
            <h2 className="text-xl">Where should we pay?</h2>
            <p className="mt-1 text-sm text-muted">Use an account in your own name. The account name must match the bank.</p>
          </div>
          <label className="grid gap-1.5 text-sm">
            Bank name
            <input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="rounded-xl border border-border bg-bg px-3 py-2.5"
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            Account name
            <input
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              className="rounded-xl border border-border bg-bg px-3 py-2.5"
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            Account number
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              minLength={10}
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="rounded-xl border border-border bg-bg px-3 py-2.5"
              required
            />
            <span className="text-xs text-muted">
              10 digits. You must tap Save and continue. Typing does not move you on.
            </span>
          </label>
          <ActionButton type="submit" variant="primary" disabled={busy}>
            {busy ? "Saving" : "Save and continue"}
          </ActionButton>
        </form>
      ) : null}

      {step === "amount" ? (
        <section className="grid gap-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Paying to</p>
              <p className="font-semibold">
                {bankAccountName} · {bankName}
              </p>
              <p className="font-mono text-sm text-muted">{mask(bankAccount)}</p>
            </div>
            <button type="button" className="text-sm font-semibold text-primary" onClick={() => setStep("bank")}>
              Change
            </button>
          </div>

          <div className="grid gap-3">
            <label className="grid gap-1.5 text-sm">
              Health to send
              <input
                type="number"
                min={1}
                max={balance}
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-xl border border-border bg-bg px-3 py-2.5 text-lg tabular-nums"
                aria-invalid={Boolean(amountError)}
                aria-describedby="amount-help"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK.filter((q) => q <= balance).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  className="rounded-full border border-border px-3 py-1.5 text-sm"
                >
                  {q}
                </button>
              ))}
              {balance > 0 ? (
                <button
                  type="button"
                  onClick={() => setAmount(String(balance))}
                  className="rounded-full border border-border px-3 py-1.5 text-sm"
                >
                  All ({balance})
                </button>
              ) : null}
            </div>
            <p id="amount-help" className={`text-sm ${amountError ? "text-danger" : "text-muted"}`}>
              {amountError ?? `That is about ${formatNaira(nairaFromHealth(n))}. 1 Health is ₦${HEALTH_TO_NAIRA}.`}
            </p>
          </div>

          <ActionButton variant="primary" disabled={Boolean(amountError)} onClick={() => setStep("review")}>
            Review withdrawal
          </ActionButton>
        </section>
      ) : null}

      {step === "review" ? (
        <section className="grid gap-5">
          <div>
            <h2 className="text-xl">Check before you send</h2>
            <p className="mt-1 text-sm text-muted">
              Health leaves your wallet as soon as the request is made. The desk then pays the bank.
            </p>
          </div>
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-border pb-3">
              <dt className="text-muted">Bank</dt>
              <dd className="text-right font-semibold">{bankName}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-3">
              <dt className="text-muted">Account name</dt>
              <dd className="text-right font-semibold">{bankAccountName}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-3">
              <dt className="text-muted">Account</dt>
              <dd className="text-right font-mono">{mask(bankAccount)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-3">
              <dt className="text-muted">Health</dt>
              <dd className="text-right font-semibold tabular-nums">{formatHealth(n)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Naira value</dt>
              <dd className="text-right font-semibold tabular-nums">{formatNaira(nairaFromHealth(n))}</dd>
            </div>
          </dl>
          <div className="grid gap-2">
            <ActionButton variant="primary" onClick={requestWithdraw} disabled={busy}>
              {busy ? "Sending request" : "Confirm withdrawal"}
            </ActionButton>
            <ActionButton variant="ghost" onClick={() => setStep("amount")} disabled={busy}>
              Go back and edit
            </ActionButton>
          </div>
        </section>
      ) : null}

      {step === "done" ? (
        <section className="grid gap-4 text-center">
          <div className="mx-auto">
            <StatusChip label="Requested" tone="warn" />
          </div>
          <h2 className="text-2xl">Withdrawal requested</h2>
          <p className="text-sm text-muted">
            {formatHealth(sent)} (about {formatNaira(nairaFromHealth(sent))}) has left your wallet and is with the desk.
          </p>
          <div className="mx-auto flex flex-wrap justify-center gap-3">
            <NavLink href="/dashboard/wallet" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-fg">
              Back to wallet
            </NavLink>
            <button
              type="button"
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
              onClick={() => {
                setAmount("50");
                setStep("amount");
              }}
            >
              Another withdrawal
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
