"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { useLoading } from "@/components/loading-provider";
import { PageHeader, StatusChip } from "@/components/ui";
import { useToast } from "@/components/toast";
import { MISSIONS } from "@/lib/missions";
import { createClient } from "@/lib/supabase/client";

export default function MissionsPage() {
  const { toast } = useToast();
  const { start, stop } = useLoading();
  const [uid, setUid] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [ready, setReady] = useState<Record<string, boolean>>({});

  const inspect = useCallback(async (userId: string) => {
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
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUid(data.user.id);
      void inspect(data.user.id);
    });
  }, [inspect]);

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
    <main className="grid gap-8">
      <PageHeader eyebrow="Account" title="Missions">
        The desk checks the real record. An unfinished task will not pay.
      </PageHeader>

      <ul className="rows">
        {MISSIONS.map((m) => {
          const claimed = done.includes(m.id);
          const open = Boolean(ready[m.id]);
          return (
            <li key={m.id} className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg">{m.title}</h2>
                <p className="mt-1 text-sm text-muted">{m.body}</p>
                <div className="mt-2">
                  <StatusChip
                    label={claimed ? "Claimed" : open ? "Ready to claim" : "Not finished"}
                    tone={claimed ? "ok" : open ? "warn" : "muted"}
                  />
                </div>
              </div>
              <div className="grid shrink-0 justify-items-end gap-2">
                <p className="text-sm font-semibold text-primary">+{m.reward} Health</p>
                <ActionButton
                  variant={claimed || !open ? "secondary" : "primary"}
                  disabled={claimed || !open}
                  onClick={() => claim(m.id)}
                >
                  {claimed ? "Claimed" : open ? "Claim reward" : "Locked"}
                </ActionButton>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
