"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { useLoading } from "@/components/loading-provider";
import { useToast } from "@/components/toast";
import { CATALOG } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function ProductsPage() {
  const { toast } = useToast();
  const { start, stop } = useLoading();
  const [group, setGroup] = useState(CATALOG[0].id);
  const [bag, setBag] = useState<{ id: string; name: string; health: number; sku: string }[]>(
    [],
  );
  const [uid, setUid] = useState<string | null>(null);

  const current = useMemo(
    () => CATALOG.find((g) => g.id === group) || CATALOG[0],
    [group],
  );
  const total = bag.reduce((n, item) => n + item.health, 0);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUid(data.user.id);
    });
  }, []);

  function add(id: string, name: string, health: number, sku: string) {
    setBag((list) => [...list, { id, name, health, sku }]);
    toast(`${name} added to bag`);
  }

  async function checkout() {
    const supabase = createClient();
    if (!supabase || !uid) {
      toast("Could not reach the dispensary. Try again.");
      return;
    }
    if (bag.length === 0) return;
    start("Paying the bag");
    for (const item of bag) {
      const { error } = await supabase.rpc("sh_buy_product", {
        p_name: item.name,
        p_sku: item.sku,
        p_amount: item.health,
      });
      if (error) {
        stop();
        toast(error.message);
        return;
      }
    }
    stop();
    setBag([]);
    toast("Dispensary paid from your wallet");
  }

  return (
    <main className="grid gap-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Pharmacy
        </p>
        <h1 className="mt-1 text-3xl">Medicines, devices, surgical stock</h1>
      </div>

      <div className="flex gap-4 overflow-x-auto py-2 text-sm">
        {CATALOG.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGroup(g.id)}
            className={group === g.id ? "text-primary" : "text-muted"}
          >
            {g.title}
          </button>
        ))}
      </div>

      <section className="desk-block">
        <h2 className="text-xl">{current.title}</h2>
        <p className="mt-1 text-sm text-muted">{current.blurb}</p>
        <ul className="mt-4 grid gap-5">
          {current.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3">
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
                  onClick={() => add(item.id, item.name, item.health, item.sku)}
                >
                  Add
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="desk-block">
        <h2 className="text-xl">Bag</h2>
        {bag.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Empty. Stock is paid in Health.</p>
        ) : (
          <>
            <ul className="mt-3 grid gap-2 text-sm">
              {bag.map((item, i) => (
                <li key={`${item.id}-${i}`} className="flex justify-between">
                  <span>
                    {item.name} · {item.sku}
                  </span>
                  <span className="tabular-nums">{item.health} H</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-semibold">Total {formatPrice(total)}</p>
            <ActionButton className="mt-3" variant="primary" onClick={checkout}>
              Pay bag
            </ActionButton>
          </>
        )}
      </section>
    </main>
  );
}
