"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
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

export default function ReferralDashPage() {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [people, setPeople] = useState<Person[]>([]);

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

      const { data: refs } = await supabase
        .from("referrals")
        .select("referred_id, created_at")
        .eq("referrer_id", data.user.id)
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
      setPeople(out);
    });
  }, []);

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
    <main className="grid gap-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Referrals
        </p>
        <h1 className="mt-1 text-3xl">Bring family, earn Health</h1>
        <p className="mt-2 text-sm text-muted">
          Share your code at sign up. Cashback lands when they buy a tier.
          Ceiling is 15 percent, Prime to Prime.
        </p>
      </div>

      <section className="desk-block">
        <p className="text-sm text-muted">Your code</p>
        <div className="mt-2 flex items-center gap-2">
          <p className="font-mono text-2xl tracking-wide">
            {code || "Preparing your code"}
          </p>
          <button type="button" className="copy-btn" onClick={copy} aria-label="Copy">
            <Copy className="size-3.5" />
          </button>
        </div>
      </section>

      <section className="desk-block">
        <h2 className="text-xl">People you brought</h2>
        <p className="mt-1 text-sm text-muted">{people.length} referred</p>
        <ul className="mt-4 grid gap-4">
          {people.length === 0 ? (
            <li className="text-sm text-muted">
              Nobody has used your code yet. They enter it when they create an
              account.
            </li>
          ) : (
            people.map((p) => (
              <li key={p.referred_id}>
                <p className="font-semibold">{p.name}</p>
                <p className="mt-1 text-sm text-muted">
                  Joined {formatWhen(p.created_at)} · {p.plan}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>

      <div className="desk-block overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr>
              <th className="py-3 pr-4">You \ They</th>
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
    </main>
  );
}
