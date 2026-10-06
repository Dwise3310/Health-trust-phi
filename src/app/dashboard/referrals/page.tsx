"use client";

import { Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";
import { useToast } from "@/components/toast";
import { REFERRAL_PERCENT, TIERS, type TierId } from "@/lib/constants";
import { formatWhen } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const ORDER: TierId[] = ["base", "plus", "prime"];

type Person = {
  referred_id: string;
  created_at: string;
  name: string;
  plan: string;
};

function rateLine(you: TierId | null) {
  if (!you) {
    return "Rates follow your plan. Once you hold a plan you earn a percent of what they pay, up to 15 percent Prime to Prime.";
  }
  const r = REFERRAL_PERCENT[you];
  return `As ${TIERS[you].short} you earn ${r.base}% when they buy Base, ${r.plus}% Plus, and ${r.prime}% Prime.`;
}

export default function ReferralDashPage() {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [tier, setTier] = useState<TierId | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let alive = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const uid = data.user.id;
      const { data: row, error } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", uid)
        .maybeSingle();
      if (!alive) return;
      if (error) {
        toast(error.message);
        return;
      }
      if (row?.referral_code) setCode(row.referral_code);

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("tier")
        .eq("user_id", uid)
        .eq("active", true)
        .maybeSingle();
      if (sub?.tier && (sub.tier === "base" || sub.tier === "plus" || sub.tier === "prime")) {
        setTier(sub.tier);
      }

      const { data: refs } = await supabase
        .from("referrals")
        .select("referred_id, created_at")
        .eq("referrer_id", uid)
        .order("created_at", { ascending: false });
      const list = refs || [];
      const out: Person[] = [];
      for (const r of list) {
        const { data: p } = await supabase
          .from("profiles")
          .select("full_name, username")
          .eq("id", r.referred_id)
          .maybeSingle();
        const { data: s } = await supabase
          .from("subscriptions")
          .select("tier")
          .eq("user_id", r.referred_id)
          .eq("active", true)
          .maybeSingle();
        out.push({
          referred_id: r.referred_id,
          created_at: r.created_at,
          name: p?.full_name || p?.username || "Member",
          plan: s?.tier ? `Sure Health ${s.tier}` : "No plan yet",
        });
      }
      if (alive) setPeople(out);
    });
    return () => {
      alive = false;
    };
  }, [toast]);

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast("Referral code copied");
    } catch {
      toast(code);
    }
  }

  return (
    <main className="grid gap-8">
      <PageHeader eyebrow="Account" title="Referrals">
        {rateLine(tier)} Cashback lands in Health when they buy a plan.
      </PageHeader>

      <section className="grid gap-2">
        <p className="text-sm text-muted">Your code</p>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-2xl tracking-wide break-all">
            {code || "Preparing your code"}
          </p>
          <button type="button" className="copy-btn" onClick={copy} aria-label="Copy referral code">
            <Copy className="size-3.5" />
          </button>
        </div>
      </section>

      <section className="grid gap-3 border-t border-border pt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg">People you brought</h2>
          <p className="text-sm text-muted">{people.length} referred</p>
        </div>
        {people.length === 0 ? (
          <p className="text-sm text-muted">
            Nobody has used your code yet. They enter it when they create an account.
          </p>
        ) : (
          <ul className="rows">
            {people.map((p) => (
              <li key={p.referred_id}>
                <p className="font-semibold">{p.name}</p>
                <p className="mt-1 text-sm text-muted">
                  Joined {formatWhen(p.created_at)} · {p.plan}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="border-t border-border pt-8">
        <summary className="cursor-pointer text-sm font-semibold text-primary">
          Full cashback table
        </summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr>
                <th className="py-3 pr-4">You / they buy</th>
                {ORDER.map((id) => (
                  <th key={id} className="py-3 pr-4">
                    {TIERS[id].short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ORDER.map((you) => (
                <tr key={you} className="border-t border-border">
                  <td className="py-3 pr-4">{TIERS[you].short}</td>
                  {ORDER.map((they) => (
                    <td key={they} className="py-3 pr-4 tabular-nums">
                      {REFERRAL_PERCENT[you][they]}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </main>
  );
}
