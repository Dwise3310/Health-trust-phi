"use client";

import { useState } from "react";
import { useLoading } from "@/components/loading-provider";
import { CARD_PRICE_HEALTH, VIP_CARD_PRICE_HEALTH } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export default function CardsPage() {
  const { start, stop } = useLoading();
  const [owned, setOwned] = useState<string[]>([]);

  function buy(type: "Normal" | "VIP") {
    start("Issuing card");
    const id = `${type}-${Date.now().toString().slice(-6)}`;
    setOwned((list) => [id, ...list]);
    stop();
  }

  return (
    <main className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="text-3xl">Digital appointment cards</h1>
        <p className="mt-2 text-sm text-muted">
          Skip the physical card queue. A normal card books your place. A
          VIP card is for immediate consultation. Prime members still sit
          in the Prime area when they arrive.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-xl">Normal card</h2>
          <p className="mt-2 text-sm">{formatPrice(CARD_PRICE_HEALTH)}</p>
          <button
            type="button"
            onClick={() => buy("Normal")}
            className="mt-4 rounded-full bg-primary px-4 py-2 text-sm text-primary-fg"
          >
            Buy normal card
          </button>
        </article>
        <article className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-xl">VIP card</h2>
          <p className="mt-2 text-sm">{formatPrice(VIP_CARD_PRICE_HEALTH)}</p>
          <button
            type="button"
            onClick={() => buy("VIP")}
            className="mt-4 rounded-full bg-primary px-4 py-2 text-sm text-primary-fg"
          >
            Buy VIP card
          </button>
        </article>
      </div>
      <ul className="grid gap-2">
        {owned.map((id) => (
          <li
            key={id}
            className="rounded-xl border border-border bg-card px-4 py-3 font-mono text-sm"
          >
            {id}
          </li>
        ))}
      </ul>
    </main>
  );
}
