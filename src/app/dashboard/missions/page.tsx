"use client";

import { useEffect, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { useLoading } from "@/components/loading-provider";
import { useToast } from "@/components/toast";
import { MISSIONS } from "@/lib/missions";
import { createClient } from "@/lib/supabase/client";

export default function MissionsPage() {
  const { toast } = useToast();
  const { start, stop } = useLoading();
  const [uid, setUid] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [ready, setReady] = useState<Record<string, boolean>>({});

  async function inspect(userId: string) {
    const supabase = createClient();
    if (!supabase) return;
    const { data: claimed } = await supabase
      .from("user_missions")
      .select("mission_id")
      .eq("user_id", userId);
    setDone((claimed || []).map((r: { mission_id: string }) => r.mission_id));

    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, phone, state_of_origin, next_of_kin_name, username_locked")
      .eq("id", userId)
      .maybeSingle();
    const { data: txs } = await supabase
      .from("wallet_tx")
      .select("amount, kind")
      .eq("user_id", userId);
    const { data: cards } = await supabase
      .from("appointment_cards")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
    const { data: books } = await supabase
      .from("appointments")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
    const { data: codes } = await supabase
      .from("care_codes")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
    const { data: refs } = await supabase
      .from("referrals")
      .select("id")
      .eq("referrer_id", userId)
      .limit(1);

    setReady({
      profile: Boolean(
        profile?.avatar_url &&
          profile?.phone &&
          profile?.state_of_origin &&
          profile?.next_of_kin_name,
      ),
      username: Boolean(profile?.username_locked),
      deposit: Boolean((txs || []).some((t) => Number(t.amount) > 0)),
      product: Boolean((txs || []).some((t) => t.kind === "product")),
      card: Boolean(cards && cards.length),
      booking: Boolean(books && books.length),
      share: Boolean(codes && codes.length),
      refer: Boolean(refs && refs.length),
    });
  }

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUid(data.user.id);
      void inspect(data.user.id);
    });
  }, []);

  async function claim(id: string) {
    const supabase = createClient();
    if (!supabase || !uid) return;
    if (!ready[id]) {
      toast("Finish the task first. This will not credit a skip.");
      return;
    }
    start("Checking mission");
    const { error } = await supabase.rpc("sh_claim_mission", { p_id: id });
    stop();
    if (error) {
      toast(error.message);
      return;
    }
    toast("Reward landed in your wallet");
    void inspect(uid);
  }

  return (
    <main className="grid gap-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Missions
        </p>
        <h1 className="mt-1 text-3xl">Small acts, Health back</h1>
        <p className="mt-2 text-sm text-muted">
          The desk checks the real record. An unfinished task will not pay.
        </p>
      </div>
      <ul className="grid gap-2">
        {MISSIONS.map((m) => {
          const claimed = done.includes(m.id);
          const open = Boolean(ready[m.id]);
          return (
            <li key={m.id} className="desk-block">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg">{m.title}</h2>
                  <p className="mt-1 text-sm text-muted">{m.body}</p>
                  <p className="mt-1 text-xs text-muted">
                    {claimed ? "Claimed" : open ? "Ready to claim" : "Not finished"}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-primary">
                  +{m.reward} H
                </p>
              </div>
              <ActionButton
                className="mt-4"
                variant={claimed || !open ? "secondary" : "primary"}
                disabled={claimed || !open}
                onClick={() => claim(m.id)}
              >
                {claimed ? "Claimed" : open ? "Claim reward" : "Locked"}
              </ActionButton>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
