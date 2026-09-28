import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkCode } from "@/lib/health/actions";

export const Route = createFileRoute("/dashboard/check")({ component: CheckPage });

function CheckPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof checkCode>> | undefined>(undefined);
  const [looked, setLooked] = useState(false);

  async function run() {
    const row = await checkCode({ data: { code } });
    setResult(row);
    setLooked(true);
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl">Check a code</h1>
      <Card className="grid gap-3">
        <Label htmlFor="code">Care Quota code</Label>
        <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} />
        <Button type="button" onClick={run}>
          Search
        </Button>
      </Card>
      {looked && !result ? <p className="text-sm text-muted">No code found.</p> : null}
      {result ? (
        <Card className="grid gap-1">
          <p className="font-medium tracking-wide">{result.code}</p>
          <p className="text-sm text-muted">Created {new Date(result.created_at).toLocaleString()} UTC</p>
          <p className="text-sm">Spendable: {result.remaining_percent}% of {result.allocated_percent}%</p>
          <p className="text-sm">Creator: @{result.username ?? "unknown"} · {result.tier ?? "no live tier"}</p>
          <p className="text-sm">Status: {result.status}</p>
        </Card>
      ) : null}
    </div>
  );
}
