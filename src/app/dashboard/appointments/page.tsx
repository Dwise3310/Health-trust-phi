"use client";

import { FormEvent, useState } from "react";
import { useLoading } from "@/components/loading-provider";
import { CALL_PRICES, PHYSICAL_PRICES } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export default function AppointmentsPage() {
  const { start, stop } = useLoading();
  const [kind, setKind] = useState<"physical" | "audio">("physical");
  const [slot, setSlot] = useState("30");
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState<string | null>(null);

  const prices = kind === "audio" ? CALL_PRICES : PHYSICAL_PRICES;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    start("Booking");
    const price = prices.find((p) => String(p.minutes) === slot);
    setDone(
      `Booked a ${slot} minute ${kind} visit for ${formatPrice(price?.health ?? 0)}. A clinician will see it on the staff board.`,
    );
    stop();
  }

  return (
    <main className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="text-3xl">Appointments</h1>
        <p className="mt-2 text-sm text-muted">
          Physical bookings are time-priced. Audio calls run inside this
          product over the internet, no WhatsApp hop. Prime members are
          called first if two bookings collide.
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className="grid gap-3 rounded-2xl border border-border bg-card p-6"
      >
        <fieldset className="grid gap-2 text-sm">
          <legend>Type</legend>
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
        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-2.5 text-sm text-primary-fg"
        >
          Confirm booking
        </button>
        {done ? <p className="text-sm text-muted">{done}</p> : null}
      </form>
    </main>
  );
}
