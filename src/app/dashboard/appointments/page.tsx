"use client";

import { FormEvent, useEffect, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { useToast } from "@/components/toast";
import {
  CALL_PRICES,
  CARD_PRICE_HEALTH,
  PHYSICAL_PRICES,
  VIP_CARD_PRICE_HEALTH,
} from "@/lib/constants";
import { formatPrice, formatWhen } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useLoading } from "@/components/loading-provider";

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

export default function AppointmentsPage() {
  const { toast } = useToast();
  const { start, stop } = useLoading();
  const [uid, setUid] = useState<string | null>(null);
  const [kind, setKind] = useState<"physical" | "audio">("physical");
  const [slot, setSlot] = useState("30");
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  const prices = kind === "audio" ? CALL_PRICES : PHYSICAL_PRICES;

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const price = prices.find((p) => String(p.minutes) === slot);
    if (!supabase || !uid || !price) {
      toast("Could not book right now. Try again.");
      return;
    }
    start("Booking visit");
    const { error } = await supabase.rpc("sh_book_visit", {
      p_kind: kind,
      p_minutes: price.minutes,
      p_when: new Date(when).toISOString(),
      p_note: note,
      p_cost: price.health,
    });
    stop();
    if (error) {
      toast(error.message);
      return;
    }
    toast("Visit filed on the clinician board");
    setNote("");
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

  return (
    <main className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Visit
        </p>
        <h1 className="mt-1 text-3xl">Book a consult</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Physical time is priced by the minute. Audio calls stay inside this
          app. Prime members are called first if two bookings collide.
        </p>
      </div>

      <form onSubmit={onSubmit} className="desk-block grid gap-3">
        <fieldset className="grid gap-2 text-sm">
          <legend className="font-semibold">Type</legend>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="kind"
              checked={kind === "physical"}
              onChange={() => {
                setKind("physical");
                setSlot("30");
              }}
            />
            Physical visit
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="kind"
              checked={kind === "audio"}
              onChange={() => {
                setKind("audio");
                setSlot("25");
              }}
            />
            In-app audio call
          </label>
        </fieldset>
        <label className="grid gap-1.5 text-sm">
          Duration
          <select
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            className="rounded-xl border border-border bg-bg px-3 py-2.5"
          >
            {prices.map((p) => (
              <option key={p.minutes} value={p.minutes}>
                {p.minutes} min · {formatPrice(p.health)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm">
          When
          <input
            type="datetime-local"
            required
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="rounded-xl border border-border bg-bg px-3 py-2.5"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          Note for the clinician
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-xl border border-border bg-bg px-3 py-2.5"
          />
        </label>
        <ActionButton type="submit" variant="primary">
          Confirm booking
        </ActionButton>
      </form>

      <section className="desk-block">
        <h2 className="text-xl">Visit receipts</h2>
        <ul className="mt-3 grid gap-4">
          {bookings.length === 0 ? (
            <li className="text-sm text-muted">No visit on the board yet.</li>
          ) : (
            bookings.map((b) => (
              <li key={b.id}>
                <p className="font-semibold capitalize">
                  {b.kind === "audio" ? "In-app audio call" : "Physical visit"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatWhen(b.scheduled_at)} · {b.duration_min} minutes ·{" "}
                  {b.status}
                </p>
                <p className="mt-1 text-sm">{formatPrice(Number(b.health_cost))}</p>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="desk-block">
        <h2 className="text-xl">Digital appointment cards</h2>
        <p className="mt-2 text-sm text-muted">
          Skip the paper queue at reception. A normal card holds your place. A
          VIP card is for immediate consultation. Prime still sits in the Prime
          lounge on arrival.
        </p>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <article>
            <h3 className="font-semibold">Normal card</h3>
            <p className="mt-1 text-sm">{formatPrice(CARD_PRICE_HEALTH)}</p>
            <ActionButton
              className="mt-3"
              variant="secondary"
              onClick={() => buy("normal")}
            >
              Buy normal
            </ActionButton>
          </article>
          <article>
            <h3 className="font-semibold">VIP card</h3>
            <p className="mt-1 text-sm">{formatPrice(VIP_CARD_PRICE_HEALTH)}</p>
            <ActionButton
              className="mt-3"
              variant="primary"
              onClick={() => buy("vip")}
            >
              Buy VIP
            </ActionButton>
          </article>
        </div>
        <ul className="mt-6 grid gap-4">
          {cards.map((c) => (
            <li key={c.id}>
              <p className="font-mono uppercase">
                {c.card_type}-{c.id}
              </p>
              <p className="mt-1 text-sm text-muted">
                Issued {formatWhen(c.created_at)} · {c.status} ·{" "}
                {formatPrice(Number(c.health_cost))}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
