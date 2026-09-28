import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public-shell";
import { Card } from "@/components/ui/card";
import { listUpdates } from "@/lib/health/actions";

export const Route = createFileRoute("/updates")({ component: Updates });

type Item = Awaited<ReturnType<typeof listUpdates>>[number];

function Updates() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    listUpdates()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl">Hospital updates</h1>
        <p className="mt-3 text-muted">News, educative notes, and case stories.</p>
        <div className="mt-10 grid gap-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted">No posts yet.</p>
          ) : (
            items.map((p) => (
              <Card key={p.id} className="grid gap-2">
                <p className="text-xs uppercase tracking-wide text-muted">{p.kind}</p>
                <h2 className="text-2xl">{p.title}</h2>
                <p className="text-sm text-muted">{p.excerpt}</p>
                <p className="text-sm leading-relaxed">{p.body}</p>
              </Card>
            ))
          )}
        </div>
      </main>
    </PublicShell>
  );
}
