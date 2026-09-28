import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buyCard, listCards } from "@/lib/health/actions";
import { CARD_PRICE_HEALTH } from "@/lib/health/constants";
import { formatHealth } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/cards")({ component: CardsPage });

function CardsPage() {
  const [cards, setCards] = useState<Awaited<ReturnType<typeof listCards>>>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setCards(await listCards());
  }
  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function buy(cardType: "normal" | "vip") {
    setMsg(null);
    try {
      await buyCard({ data: { cardType } });
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl">Digital appointment cards</h1>
      <p className="text-sm text-muted">
        Skip the physical queue for an access card. Skeleton price {formatHealth(CARD_PRICE_HEALTH)} each.
        VIP is for immediate consultation.
      </p>
      {msg ? <p className="text-sm text-danger">{msg}</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="grid gap-3">
          <h2>Normal card</h2>
          <Button type="button" onClick={() => buy("normal")}>
            Buy normal
          </Button>
        </Card>
        <Card className="grid gap-3">
          <h2>VIP card</h2>
          <Button type="button" onClick={() => buy("vip")}>
            Buy VIP
          </Button>
        </Card>
      </div>
      <div className="grid gap-3">
        {cards.map((c) => (
          <Card key={c.id}>
            <p className="font-medium uppercase">{c.card_type}</p>
            <p className="text-sm text-muted">
              {c.status} · {new Date(c.created_at).toLocaleString()}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
