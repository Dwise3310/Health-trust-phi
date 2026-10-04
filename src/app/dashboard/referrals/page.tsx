"use client";

import { useEffect, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { useToast } from "@/components/toast";
import { REFERRAL_PERCENT, TIERS, type TierId } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

const ORDER: TierId[] = ["base", "plus", "prime"];

export default function ReferralDashPage() {
  const { toast } = useToast();
  const [code, setCode] = useState("");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: row, error } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", data.user.id)
        .maybeSingle();
      if (error) {
        toast(error.message);
        return;
      }
      if (row?.referral_code) setCode(row.referral_code);
    });
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast("Referral code copied");
    } catch {
      toast(code);
    }
  }

  return (
    <main className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Referrals
        </p>
        <h1 className="mt-1 text-3xl">Bring family, earn Health</h1>
        <p className="mt-2 text-sm text-muted">
          Share your code. When they buy a tier, cashback lands in Health.
          Ceiling is 15 percent, Prime to Prime.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted">Your code</p>
        <p className="mt-2 font-mono text-2xl tracking-wide">
          {code || "Preparing your code"}
        </p>
        <ActionButton className="mt-4" variant="primary" onClick={copy}>
          Copy code
        </ActionButton>
      </section>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-card">
            <tr>
              <th className="px-4 py-3">You \ They</th>
              {ORDER.map((id) => (
                <th key={id} className="px-4 py-3">
                  {TIERS[id].short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ORDER.map((you) => (
              <tr key={you} className="border-t border-border">
                <td className="px-4 py-3">{TIERS[you].short}</td>
                {ORDER.map((they) => (
                  <td key={they} className="px-4 py-3 tabular-nums">
                    {REFERRAL_PERCENT[you][they]}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
