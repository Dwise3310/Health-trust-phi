"use client";

import { useMemo, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { useToast } from "@/components/toast";
import { CATALOG } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";

export default function ProductsPage() {
  const { toast } = useToast();
  const [group, setGroup] = useState(CATALOG[0].id);
  const [bag, setBag] = useState<{ id: string; name: string; health: number }[]>(
    [],
  );

  const current = useMemo(
    () => CATALOG.find((g) => g.id === group) || CATALOG[0],
    [group],
  );

  function add(id: string, name: string, health: number) {
    setBag((list) => [...list, { id, name, health }]);
    toast(`${name} added to bag`);
  }

  const total = bag.reduce((n, item) => n + item.health, 0);

  return (
    <main className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Pharmacy
        </p>
        <h1 className="mt-1 text-3xl">Dispensary and campus stock</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          These are template shelves. Names, prices, and photos will be swapped
          for real Eastern Ryse stock when the hospital pack lands. Add items
          now so the flow is already in place.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATALOG.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGroup(g.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              group === g.id
                ? "bg-primary text-primary-fg"
                : "border border-border bg-card"
            }`}
          >
            {g.title}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-xl">{current.title}</h2>
        <p className="mt-1 text-sm text-muted">{current.blurb}</p>
        <ul className="mt-4 grid gap-3">
          {current.items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="mt-1 text-xs text-muted">{item.blurb}</p>
                <p className="mt-1 font-mono text-[11px] text-muted">{item.sku}</p>
              </div>
              <div className="grid shrink-0 justify-items-end gap-2">
                <p className="text-sm tabular-nums">{formatPrice(item.health)}</p>
                <ActionButton
                  variant="secondary"
                  size="sm"
                  onClick={() => add(item.id, item.name, item.health)}
                >
                  Add
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-xl">Bag</h2>
        {bag.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Empty. Stock is paid in Health.</p>
        ) : (
          <>
            <ul className="mt-3 grid gap-2 text-sm">
              {bag.map((item, i) => (
                <li key={`${item.id}-${i}`} className="flex justify-between">
                  <span>{item.name}</span>
                  <span className="tabular-nums">{item.health} H</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-semibold">Total {formatPrice(total)}</p>
            <ActionButton
              className="mt-3"
              variant="primary"
              onClick={() =>
                toast("Checkout waits for the live pharmacy catalog.")
              }
            >
              Request dispense
            </ActionButton>
          </>
        )}
      </section>
    </main>
  );
}
