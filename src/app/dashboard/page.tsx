"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "@/components/nav-link";
import { TIERS, type TierId } from "@/lib/constants";
import { MISSIONS } from "@/lib/missions";
import { createClient } from "@/lib/supabase/client";
import { formatHealth, formatNaira, formatWhen, nairaFromHealth } from "@/lib/utils";

type Sub = {
  tier: TierId;
  expires_at: string;
  quota_remaining: number;
  next_refresh_at: string;
};

type Visit = { id: number; kind: string; scheduled_at: string; duration_min: number };
type Notice = { id: number; title: string; body: string; at: string };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <NavLink href={href} className="text-sm font-semibold text-primary hover:underline">
      {children}
    </NavLink>
  );
}

export default function HomePage() {
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState(0);
  const [sub, setSub] = useState<Sub | null>(null);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [doneMissions, setDoneMissions] = useState<string[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let alive = true;

    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id;
      if (!uid || !alive) return;

      const [profile, wallet, subRow, visitRow, missionRows] = await Promise.all([
        supabase.from("profiles").select("full_name, username").eq("id", uid).maybeSingle(),
        supabase.from("wallets").select("health_balance").eq("user_id", uid).maybeSingle(),
        supabase
          .from("subscriptions")
          .select("tier, expires_at, quota_remaining, next_refresh_at")
          .eq("user_id", uid)
          .eq("active", true)
          .maybeSingle(),
        supabase
          .from("appointments")
          .select("id, kind, scheduled_at, duration_min")
          .eq("user_id", uid)
          .neq("status", "cancelled")
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase.from("user_missions").select("mission_id").eq("user_id", uid),
      ]);

      if (!alive) return;
      const first = (profile.data?.full_name || profile.data?.username || "").split(" ")[0];
      setName(first);
      setBalance(Number(wallet.data?.health_balance || 0));
      setSub((subRow.data as Sub) || null);
      setVisit((visitRow.data as Visit) || null);
      setDoneMissions((missionRows.data || []).map((r: { mission_id: string }) => r.mission_id));
      const { data: board } = await supabase.rpc("sh_my_board");
      const list = board && typeof board === "object" && "notices" in board
        ? (board as { notices: Notice[] }).notices
        : [];
      setNotices(Array.isArray(list) ? list.slice(0, 5) : []);
      setLoaded(true);
    });

    return () => {
      alive = false;
    };
  }, []);

  const plan = sub ? TIERS[sub.tier] : null;
  const remaining = sub ? Math.max(0, Math.min(100, Number(sub.quota_remaining))) : 0;
  const nextSteps = MISSIONS.filter((m) => !doneMissions.includes(m.id)).slice(0, 3);

  return (
    <main className="grid gap-10">
      <header>
        <h1 className="text-3xl">
          {loaded ? `${greeting()}${name ? `, ${name}` : ""}` : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted">Your plan, wallet and next visit at Eastern Ryse.</p>
      </header>

      <div className="split">
        <section className="grid content-start gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Membership</h2>
            <SectionLink href="/dashboard/membership">{sub ? "Manage" : "Choose a plan"}</SectionLink>
          </div>
          {plan && sub ? (
            <>
              <p className="text-2xl font-serif">{plan.name}</p>
              <p className="text-sm text-muted">
                Active until {new Date(sub.expires_at).toLocaleDateString("en-NG")}
              </p>
              <div>
                <div className="flex items-baseline justify-between text-sm">
                  <span>Care Quota left</span>
                  <span className="font-semibold tabular-nums">{remaining}%</span>
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={remaining}
                  aria-label="Care Quota remaining"
                >
                  <div className="h-full rounded-full bg-primary" style={{ width: `${remaining}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted">
                  Refreshes {new Date(sub.next_refresh_at).toLocaleDateString("en-NG")}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-muted">
              No plan yet. A plan starts your Care Quota for consultations and diagnosis.
            </p>
          )}
        </section>

        <section className="grid content-start gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Wallet</h2>
            <SectionLink href="/dashboard/wallet">Open</SectionLink>
          </div>
          <p className="font-serif text-4xl tabular-nums">{formatHealth(balance)}</p>
          <p className="text-sm text-muted">About {formatNaira(nairaFromHealth(balance))}. 1 Health is ₦100.</p>
        </section>
      </div>

      <div className="split">
        <section className="grid content-start gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Next visit</h2>
            <SectionLink href="/dashboard/appointments">{visit ? "Details" : "Book"}</SectionLink>
          </div>
          {visit ? (
            <>
              <p className="font-semibold">
                {visit.kind === "audio" ? "Audio call" : "Physical visit"} · {visit.duration_min} minutes
              </p>
              <p className="text-sm text-muted">{formatWhen(visit.scheduled_at)}</p>
            </>
          ) : (
            <p className="text-sm text-muted">Nothing booked. Book a consult when you are ready.</p>
          )}
        </section>

        <section className="grid content-start gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Next steps</h2>
            <SectionLink href="/dashboard/missions">All missions</SectionLink>
          </div>
          {nextSteps.length === 0 ? (
            <p className="text-sm text-muted">You have finished the current steps.</p>
          ) : (
            <ul className="rows">
              {nextSteps.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{m.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{m.body}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-primary">+{m.reward} Health</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {notices.length > 0 ? (
        <section className="grid gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">From the desk</h2>
          <ul>
            {notices.map((note) => (
              <li key={note.id} className="border-b border-border py-3 text-sm">
                <p className="font-semibold">{note.title}</p>
                <p className="mt-1 text-muted">{note.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Do something</h2>
        <ul className="rows">
          {[
            { href: "/dashboard/appointments", label: "Book a visit" },
            { href: "/dashboard/wallet", label: "Fund your wallet" },
            { href: "/dashboard/products", label: "Order from the pharmacy" },
          ].map((a) => (
            <li key={a.href}>
              <NavLink href={a.href} className="flex items-center justify-between gap-3 py-1 text-base font-semibold hover:text-primary">
                {a.label}
                <ArrowRight className="size-4 text-muted" aria-hidden />
              </NavLink>
            </li>
          ))}
        </ul>
      </section>

      {!sub ? (
        <p className="text-sm text-muted">
          Compare the{" "}
          <NavLink href="/dashboard/membership" className="font-semibold text-primary hover:underline">
            Base, Plus and Prime plans
          </NavLink>
          .
        </p>
      ) : null}
    </main>
  );
}
