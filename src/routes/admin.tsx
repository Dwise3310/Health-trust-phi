import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkCode, debitCode } from "@/lib/health/actions";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type CodeRow = NonNullable<Awaited<ReturnType<typeof checkCode>>>;

function AdminPage() {
  const { user, isPending } = useCurrentUserState();
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState(10);
  const [slip, setSlip] = useState<CodeRow | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (isPending) return <div className="grid min-h-screen place-items-center bg-bg">Loading…</div>;
  if (!user) return <RedirectToSignIn to="/login" />;

  async function verify() {
    setMsg(null);
    const row = await checkCode({ data: { code } });
    setSlip(row);
    if (!row) setMsg("Code not found");
  }

  async function debit() {
    setMsg(null);
    try {
      const res = await debitCode({ data: { code, percent } });
      setMsg(`Debited. Remaining ${res.remaining}%`);
      await verify();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  function printSlip() {
    window.print();
  }

  return (
    <main className="mx-auto grid max-w-xl gap-4 px-4 py-10">
      <h1 className="text-3xl">Reception</h1>
      <p className="text-sm text-muted">
        Verify a Care Quota code, print a slip, then debit after the consultant
        confirms. Debit requires a staff or super admin role.
      </p>
      <Card className="grid gap-3">
        <Label htmlFor="code">Code</Label>
        <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} />
        <Button type="button" onClick={verify}>
          Verify
        </Button>
      </Card>
      {slip ? (
        <Card id="slip" className="grid gap-1">
          <p className="text-xs uppercase tracking-wide text-muted">Eastern Ryse · Health Trust</p>
          <p className="text-xl tracking-wide">{slip.code}</p>
          <p>Spendable {slip.remaining_percent}%</p>
          <p>Creator @{slip.username} · {slip.tier}</p>
          <p className="text-xs text-muted">{new Date(slip.created_at).toLocaleString()}</p>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="outline" onClick={printSlip}>
              Print slip
            </Button>
          </div>
        </Card>
      ) : null}
      <Card className="grid gap-3">
        <Label htmlFor="pct">Debit percent after consultant sign-off</Label>
        <Input
          id="pct"
          type="number"
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
        />
        <Button type="button" onClick={debit}>
          Debit cover
        </Button>
        {msg ? <p className="text-sm text-muted">{msg}</p> : null}
      </Card>
    </main>
  );
}
