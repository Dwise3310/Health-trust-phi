"use client";

import { Phone, Stethoscope } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { useLoading } from "@/components/loading-provider";
import { PageHeader, StatusChip, statusTone } from "@/components/ui";
import { useToast } from "@/components/toast";
import {
  CALL_PRICES,
  CARD_PRICE_HEALTH,
  PHYSICAL_PRICES,
  VIP_CARD_PRICE_HEALTH,
} from "@/lib/constants";
import { formatHealth, formatNaira, formatWhen, nairaFromHealth } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Booking = {
  id: number;
  kind: string;
  duration_min: number;
  scheduled_at: string;
  health_cost: number;
  status: string;
};

type Card = {
  id: number;
  card_type: string;
  health_cost: number;
  status: string;
  created_at: string;
};

type Kind = "physical" | "audio";

export default function AppointmentsPage() {
  const { toast } = useToast();
  const { start, stop } = useLoading();
  const [uid, setUid] = useState<string | null>(null);
  const [kind, setKind] = useState<Kind>("physical");
  const [slot, setSlot] = useState("30");
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [busy, setBusy] = useState(false);

  const prices = kind === "audio" ? CALL_PRICES : PHYSICAL_PRICES;
  const price = prices.find((p) => String(p.minutes) === slot) ?? prices[0];

  async function load(userId: string) {
    const supabase = createClient();
    if (!supabase) return;
    const { data: a } = await supabase
      .from("appointments")
      .select("id, kind, duration_min, scheduled_at, health_cost, status")
      .eq("user_id", userId)
      .order("scheduled_at", { ascending: false });
    setBookings((a as Booking[]) || []);
    const { data: c } = await supabase
      .from("appointment_cards")
      .select("id, card_type, health_cost, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setCards((c as Card[]) || []);
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

  function pickKind(next: Kind) {
    setKind(next);
    setSlot(next === "audio" ? "25" : "30");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase || !uid || !price) {
      toast("Could not book right now. Try again.");
      return;
    }
    if (!when) {
      toast("Choose a date and time first.");
      return;
    }
    setBusy(true);
    start("Booking visit");
    const { error } = await supabase.rpc("sh_book_visit", {
      p_kind: kind,
      p_minutes: price.minutes,
      p_when: new Date(when).toISOString(),
      p_note: note,
      p_cost: price.health,
    });
    stop();
    setBusy(false);
    if (error) {
      toast(error.message);
      return;
    }
    toast("Visit booked");
    setNote("");
    setWhen("");
    void load(uid);
  }

  async function buy(type: "normal" | "vip") {
    const supabase = createClient();
    if (!supabase || !uid) {
      toast("Could not issue a card right now. Try again.");
      return;
    }
    start("Issuing card");
    const { error } = await supabase.rpc("sh_buy_card", { p_type: type });
    stop();
    if (error) {
      toast(error.message);
      return;
    }
    toast(`${type === "vip" ? "VIP" : "Normal"} card issued`);
    void load(uid);
  }

  const upcoming = bookings.filter((b) => new Date(b.scheduled_at) >= new Date() && b.status !== "cancelled");
  const past = bookings.filter((b) => !upcoming.includes(b));

  return (
    <main className="grid gap-6">
      <PageHeader eyebrow="Care" title="Book a visit">
        Physical time is priced by the minute. Audio calls stay inside this app. Prime members are
        called first if two bookings collide.
      </PageHeader>

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
        <div className="grid gap-6">
          <section className="grid gap-3">
            <h2 className="text-lg">1. Type of visit</h2>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  { id: "physical", label: "Physical visit", hint: "At Eastern Ryse", Icon: Stethoscope },
                  { id: "audio", label: "Audio call", hint: "In this app", Icon: Phone },
                ] as const
              ).map((o) => {
                const on = kind === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => pickKind(o.id)}
                    className={`flex items-center gap-3 rounded-full border px-5 py-3 text-left transition-colors ${
                      on ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    <o.Icon className="size-5 text-primary" aria-hidden />
                    <span>
                      <span className="block font-semibold">{o.label}</span>
                      <span className="block text-sm text-muted">{o.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid gap-3">
            <h2 className="text-lg">2. Length</h2>
            <div className="flex flex-wrap gap-3">
              {prices.map((p) => {
                const on = String(p.minutes) === slot;
                return (
                  <button
                    key={p.minutes}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSlot(String(p.minutes))}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${on ? "border-primary bg-primary/10" : "border-border"}`}
                  >
                    <span className="block font-semibold">{p.minutes} minutes</span>
                    <span className="mt-1 block text-sm tabular-nums text-muted">{formatHealth(p.health)}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid gap-4">
            <h2 className="text-lg">3. Time and note</h2>
            <label className="grid gap-1.5 text-sm">
              Date and time
              <input
                type="datetime-local"
                required
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="rounded-xl border border-border bg-bg px-3 py-2.5"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Note for the clinician (optional)
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="rounded-xl border border-border bg-bg px-3 py-2.5"
              />
            </label>
          </section>
        </div>

        <aside className="grid content-start gap-4 border-t border-border pt-6 lg:sticky lg:top-24 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0" aria-label="Booking summary">
          <h2 className="text-lg">Summary</h2>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Visit</dt>
              <dd className="font-semibold">{kind === "audio" ? "Audio call" : "Physical visit"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Length</dt>
              <dd className="font-semibold">{price?.minutes} minutes</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">When</dt>
              <dd className="text-right font-semibold">{when ? formatWhen(new Date(when).toISOString()) : "Not chosen"}</dd>
            </div>
          </dl>
          <div className="border-t border-border pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Cost</span>
              <span className="font-semibold tabular-nums">{formatHealth(price?.health ?? 0)}</span>
            </div>
            <p className="mt-1 text-right text-xs text-muted">
              about {formatNaira(nairaFromHealth(price?.health ?? 0))}
            </p>
          </div>
          <ActionButton type="submit" variant="primary" disabled={busy || !when}>
            {busy ? "Booking" : "Confirm booking"}
          </ActionButton>
        </aside>
      </form>

      <section className="grid gap-3">
        <h2 className="text-lg">Your visits</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted">No visits yet. Your bookings will appear here.</p>
        ) : (
          <ul className="rows">
            {[...upcoming, ...past].map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {b.kind === "audio" ? "Audio call" : "Physical visit"} · {b.duration_min} min
                  </p>
                  <p className="mt-1 text-sm text-muted">{formatWhen(b.scheduled_at)}</p>
                  <p className="mt-1 text-sm tabular-nums">{formatHealth(Number(b.health_cost))}</p>
                </div>
                <StatusChip label={b.status} tone={statusTone(b.status)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg">Appointment cards</h2>
        <p className="text-sm text-muted">
          A normal card holds your place at reception. A VIP card is for immediate consultation. Prime
          members still sit in the Prime lounge on arrival.
        </p>
        <div className="split" style={{ "--cols": 2 } as React.CSSProperties}>
          <article className="flex flex-col gap-3">
            <div>
              <h3 className="font-semibold">Normal card</h3>
              <p className="mt-1 text-sm tabular-nums">{formatPriceLine(CARD_PRICE_HEALTH)}</p>
            </div>
            <ActionButton variant="secondary" className="mt-auto" onClick={() => buy("normal")}>
              Buy normal card
            </ActionButton>
          </article>
          <article className="flex flex-col gap-3">
            <div>
              <h3 className="font-semibold">VIP card</h3>
              <p className="mt-1 text-sm tabular-nums">{formatPriceLine(VIP_CARD_PRICE_HEALTH)}</p>
            </div>
            <ActionButton variant="primary" className="mt-auto" onClick={() => buy("vip")}>
              Buy VIP card
            </ActionButton>
          </article>
        </div>

        {cards.length > 0 ? (
          <ul className="mt-2 grid gap-3">
            {cards.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono uppercase">
                    {c.card_type}-{c.id}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Issued {formatWhen(c.created_at)} · {formatHealth(Number(c.health_cost))}
                  </p>
                </div>
                <StatusChip label={c.status} tone={statusTone(c.status)} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}

function formatPriceLine(health: number) {
  return `${formatHealth(health)} · about ${formatNaira(nairaFromHealth(health))}`;
}
