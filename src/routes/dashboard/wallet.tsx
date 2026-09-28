import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ensureMember, fundWalletDemo, listTx } from "@/lib/health/actions";
import { formatHealth } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/wallet")({ component: WalletPage });

function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [account, setAccount] = useState("");
  const [tx, setTx] = useState<Awaited<ReturnType<typeof listTx>>>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const snap = await ensureMember();
    setBalance(Number(snap.wallet?.health_balance ?? 0));
    setAccount(snap.wallet?.account_number ?? "");
    setTx(await listTx());
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function fund(amount: number) {
    setMsg(null);
    try {
      await fundWalletDemo({ data: { amount } });
      await load();
      setMsg(`Added ${amount} Health. Bank funding will replace this once payments go live.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl">Wallet</h1>
      <Card>
        <p className="text-sm text-muted">Health balance</p>
        <p className="mt-2 text-3xl tabular-nums">{formatHealth(balance)}</p>
        <p className="mt-2 text-sm text-muted">
          Unique funding account: <span className="font-medium text-fg">{account}</span>
        </p>
        <p className="mt-1 text-xs text-muted">1 Health = ₦100. USD shown later from the live rate.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={() => fund(250)}>
            Add 250 Health
          </Button>
          <Button type="button" variant="outline" onClick={() => fund(1000)}>
            Add 1,000 Health
          </Button>
        </div>
        {msg ? <p className="mt-3 text-sm text-muted">{msg}</p> : null}
      </Card>
      <Card className="grid gap-3">
        <h2 className="text-xl">Activity</h2>
        {tx.length === 0 ? (
          <p className="text-sm text-muted">No movements yet.</p>
        ) : (
          <ul className="grid gap-2 text-sm">
            {tx.map((row) => (
              <li key={row.id} className="flex justify-between border-b border-border py-2">
                <span>
                  {row.kind}
                  {row.note ? ` · ${row.note}` : ""}
                </span>
                <span className="tabular-nums">{Number(row.amount) > 0 ? "+" : ""}{row.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
