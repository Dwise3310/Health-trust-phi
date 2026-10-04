"use client";

import { FormEvent, useEffect, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { useToast } from "@/components/toast";
import { formatHealth } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function WithdrawPage() {
  const { toast } = useToast();
  const [uid, setUid] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [amount, setAmount] = useState("50");

  async function load(userId: string) {
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
    }
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

  async function saveBank(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase || !uid) return;
    const { error } = await supabase
      .from("wallets")
      .update({
        bank_name: bankName,
        bank_account: bankAccount,
        bank_account_name: bankAccountName,
      })
      .eq("user_id", uid);
    toast(error ? error.message : "Withdrawal details saved");
  }

  async function requestWithdraw(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const n = Number(amount);
    if (!supabase || !uid) return;
    if (!bankName || !bankAccount || !bankAccountName) {
      toast("Save your bank details first.");
      return;
    }
    const { error } = await supabase.rpc("sh_request_withdraw", {
      p_amount: n,
      p_note: `${bankName} ${bankAccountName} ${bankAccount}`,
    });
    if (error) {
      toast(error.message);
      return;
    }
    toast("Withdrawal requested. Health left this wallet.");
    void load(uid);
  }

  return (
    <main className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Withdraw
        </p>
        <h1 className="mt-1 text-3xl">Health back to your bank</h1>
        <p className="mt-2 text-sm text-muted">
          Available {formatHealth(balance)}. Save the account you want paid,
          then issue a withdrawal.
        </p>
      </div>

      <form
        onSubmit={saveBank}
        className="grid gap-3 rounded-2xl border border-border bg-card p-5"
      >
        <h2 className="text-xl">Bank details</h2>
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
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            className="rounded-xl border border-border bg-bg px-3 py-2.5"
            required
          />
        </label>
        <ActionButton type="submit" variant="secondary">
          Save details
        </ActionButton>
      </form>

      <form
        onSubmit={requestWithdraw}
        className="grid gap-3 rounded-2xl border border-border bg-card p-5"
      >
        <h2 className="text-xl">Issue a withdrawal</h2>
        <label className="grid gap-1.5 text-sm">
          Health to send
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-xl border border-border bg-bg px-3 py-2.5"
          />
        </label>
        <ActionButton type="submit" variant="primary">
          Request withdrawal
        </ActionButton>
      </form>
    </main>
  );
}
