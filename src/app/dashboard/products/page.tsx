"use client";

import { ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { useLoading } from "@/components/loading-provider";
import { PageHeader } from "@/components/ui";
import { useToast } from "@/components/toast";
import { CATALOG, type CatalogItem } from "@/lib/catalog";
import { formatNaira, nairaFromHealth, formatHealth } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type BagLine = { key: number; item: CatalogItem };
type Order = {
  id: number;
  title: string;
  amount: number;
  fulfill: string | null;
  status: string;
  carrier: string | null;
  tracking: string | null;
  address: string | null;
  at: string;
};

const STEP: Record<string, string> = {
  paid: "Paid, waiting on the pharmacy",
  open: "Paid, waiting on the pharmacy",
  preparing: "Pharmacy is preparing it",
  ready: "Ready for pickup at the dispensary",
  dispatched: "On the way",
  delivered: "Delivered",
  done: "Delivered",
};

let nextKey = 1;

export default function PharmacyPage() {
  const { toast } = useToast();
  const { start, stop } = useLoading();
  const [group, setGroup] = useState(CATALOG[0].id);
  const [bag, setBag] = useState<BagLine[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<"pickup" | "delivery">("pickup");
  const [phone, setPhone] = useState("");
  const [stateName, setStateName] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);

  const current = useMemo(() => CATALOG.find((g) => g.id === group) || CATALOG[0], [group]);
  const total = bag.reduce((n, line) => n + line.item.health, 0);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUid(data.user.id);
      const { data: board } = await supabase.rpc("sh_my_board");
      const list = board && typeof board === "object" && "orders" in board
        ? (board as { orders: Order[] }).orders
        : [];
      setOrders(Array.isArray(list) ? list : []);
    });
  }, []);

  function add(item: CatalogItem) {
    setBag((list) => [...list, { key: nextKey++, item }]);
    toast(`${item.name} added`);
  }

  function remove(key: number) {
    setBag((list) => list.filter((l) => l.key !== key));
  }

  async function checkout() {
    const supabase = createClient();
    if (!supabase || !uid) {
      toast("Could not reach the dispensary. Try again.");
      return;
    }
    if (bag.length === 0) return;
    if (method === "delivery" && address.trim().length < 5) {
      toast("Delivery needs a street address.");
      return;
    }
    setBusy(true);
    start("Paying the bag");
    let remaining = [...bag];
    for (const line of bag) {
      const { error } = await supabase.rpc("sh_place_order", {
        p_name: line.item.name,
        p_sku: line.item.sku,
        p_amount: line.item.health,
        p_method: method,
        p_phone: phone,
        p_state: stateName,
        p_address: address,
        p_landmark: landmark,
        p_note: "",
      });
      if (error) {
        stop();
        setBusy(false);
        setBag(remaining);
        toast(`${line.item.name} was not paid: ${error.message}`);
        return;
      }
      remaining = remaining.filter((l) => l.key !== line.key);
    }
    stop();
    setBusy(false);
    setBag([]);
    toast(method === "delivery" ? "Paid. The pharmacy will dispatch it." : "Paid. We will tell you when pickup is ready.");
    const { data: board } = await supabase.rpc("sh_my_board");
    const list = board && typeof board === "object" && "orders" in board
      ? (board as { orders: Order[] }).orders
      : [];
    setOrders(Array.isArray(list) ? list : []);
  }

  return (
    <main className="grid gap-6">
      <PageHeader eyebrow="Care" title="Pharmacy and devices">
        Stock from the campus dispensary. Everything here is paid in Health from your wallet.
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="grid gap-5">
          <div role="tablist" aria-label="Categories" className="flex gap-1 overflow-x-auto border-b border-border">
            {CATALOG.map((g) => {
              const on = g.id === group;
              return (
                <button
                  key={g.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setGroup(g.id)}
                  className={`relative min-h-10 shrink-0 px-3 text-sm font-semibold ${
                    on ? "text-primary" : "text-muted"
                  }`}
                >
                  {g.title}
                  {on ? <span className="tab-mark" /> : null}
                </button>
              );
            })}
          </div>

          <div>
            <h2 className="text-xl">{current.title}</h2>
            <p className="mt-1 text-sm text-muted">{current.blurb}</p>
          </div>

          <ul className="rows">
            {current.items.map((item) => (
              <li key={item.id} className="grid gap-3">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-1 text-sm text-muted">{item.blurb}</p>
                  <p className="mt-2 font-mono text-xs text-muted">{item.sku}</p>
                </div>
                <div className="mt-auto flex items-end justify-between gap-3">
                  <div>
                    <p className="font-semibold tabular-nums">{formatHealth(item.health)}</p>
                    <p className="text-xs text-muted">about {formatNaira(nairaFromHealth(item.health))}</p>
                  </div>
                  <ActionButton variant="secondary" size="sm" onClick={() => add(item)}>
                    Add to bag
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="grid content-start gap-4 border-t border-border pt-6 lg:sticky lg:top-24 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0" aria-label="Bag">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl">
              <ShoppingBag className="size-5 text-primary" aria-hidden /> Bag
            </h2>
            <span className="text-sm text-muted">{bag.length} {bag.length === 1 ? "item" : "items"}</span>
          </div>

          {bag.length === 0 ? (
            <p className="text-sm text-muted">Your bag is empty. Add an item to start.</p>
          ) : (
            <ul className="grid gap-3">
              {bag.map((line) => (
                <li key={line.key} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-semibold">{line.item.name}</p>
                    <p className="text-xs text-muted tabular-nums">{line.item.health} Health</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(line.key)}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:text-fg"
                    aria-label={`Remove ${line.item.name}`}
                    disabled={busy}
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold">How you want it</p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="method" checked={method === "pickup"} onChange={() => setMethod("pickup")} />
                Pickup at the hospital
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="method" checked={method === "delivery"} onChange={() => setMethod("delivery")} />
                Delivery
              </label>
            </div>
            {method === "delivery" ? (
              <div className="mt-3 grid gap-2">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone for the courier" className="rounded-xl border border-border bg-bg px-3 py-2 text-sm" />
                <input value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="State" className="rounded-xl border border-border bg-bg px-3 py-2 text-sm" />
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" className="rounded-xl border border-border bg-bg px-3 py-2 text-sm" />
                <input value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Landmark" className="rounded-xl border border-border bg-bg px-3 py-2 text-sm" />
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted">You will see a notice here when the dispensary says it is ready.</p>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Total</span>
              <span className="font-semibold tabular-nums">{formatHealth(total)}</span>
            </div>
            <p className="mt-1 text-right text-xs text-muted">about {formatNaira(nairaFromHealth(total))}</p>
          </div>

          <ActionButton variant="primary" onClick={checkout} disabled={bag.length === 0 || busy}>
            {busy ? "Paying" : bag.length === 0 ? "Pay bag" : `Pay ${formatHealth(total)}`}
          </ActionButton>
        </aside>
      </div>

      <section className="grid gap-2">
        <h2 className="text-lg">Your orders</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted">Nothing on the way yet. Paid orders show their step here.</p>
        ) : (
          <ul>
            {orders.map((order) => (
              <li key={order.id} className="border-b border-border py-3 text-sm">
                <p className="font-semibold">{order.title}</p>
                <p className="mt-1 text-muted">
                  {order.status === "delivered" && order.fulfill !== "delivery"
                    ? "Collected at the dispensary"
                    : STEP[order.status] || order.status}
                  {order.fulfill === "delivery" ? " · delivery" : " · pickup"}
                  {order.carrier ? ` · ${order.carrier}` : ""}
                  {order.tracking ? ` · waybill ${order.tracking}` : ""}
                </p>
                {order.address ? <p className="text-muted">{order.address}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
