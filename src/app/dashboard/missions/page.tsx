"use client";

import { useEffect, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { useToast } from "@/components/toast";
import { MISSIONS } from "@/lib/missions";
import { formatHealth } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function MissionsPage() {
  const { toast } = useToast();
  const [uid, setUid] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUid(data.user.id);
      const { data: rows } = await supabase
        .from("user_missions")
        .select("mission_id")
        .eq("user_id", data.user.id);
      setDone((rows || []).map((r: { mission_id: string }) => r.mission_id));
    });
  }, []);

  async function claim(id: string, reward: number) {
    const supabase = createClient();
    if (!supabase || !uid) {
      toast("Connect Supabase, then claim again.");
      return;
    }
    if (done.includes(id)) return;
    const { error } = await supabase.from("user_missions").insert({
      user_id: uid,
      mission_id: id,
    });
    if (error) {
      toast(error.message);
      return;
    }
    const { data: wallet } = await supabase
      .from("wallets")
      .select("health_balance")
      .eq("user_id", uid)
      .maybeSingle();
    const next = Number(wallet?.health_balance || 0) + reward;
    await supabase.from("wallets").update({ health_balance: next }).eq("user_id", uid);
    await supabase.from("wallet_tx").insert({
      user_id: uid,
      amount: reward,
      kind: "mission",
      note: id,
    });
    setDone((list) => [...list, id]);
    toast(`${formatHealth(reward)} landed in the wallet`);
  }

  return (
    <main className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Missions
        </p>
        <h1 className="mt-1 text-3xl">Small acts, Health back</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Finish a desk task, claim the cashback. These are starter missions.
          We will swap rewards when the live program is locked.
        </p>
      </div>
      <ul className="grid gap-3">
        {MISSIONS.map((m) => {
          const claimed = done.includes(m.id);
          return (
            <li
              key={m.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg">{m.title}</h2>
                  <p className="mt-1 text-sm text-muted">{m.body}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-primary">
                  +{m.reward} H
                </p>
              </div>
              <ActionButton
                className="mt-4"
                variant={claimed ? "secondary" : "primary"}
                disabled={claimed}
                onClick={() => claim(m.id, m.reward)}
              >
                {claimed ? "Claimed" : "Mark done and claim"}
              </ActionButton>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
