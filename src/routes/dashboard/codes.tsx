import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cancelCareCode, generateCareCode, listMyCodes } from "@/lib/health/actions";

export const Route = createFileRoute("/dashboard/codes")({ component: CodesPage });

function CodesPage() {
  const [codes, setCodes] = useState<Awaited<ReturnType<typeof listMyCodes>>>([]);
  const [percent, setPercent] = useState(20);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setCodes(await listMyCodes());
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function create() {
    setMsg(null);
    try {
      const res = await generateCareCode({ data: { percent } });
      setMsg(`Code ${res.code} created. Share it with reception.`);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl">Care Quota codes</h1>
      <Card className="grid gap-3">
        <Label htmlFor="pct">Allocate remaining cover (%)</Label>
        <Input
          id="pct"
          type="number"
          min={1}
          max={100}
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
        />
        <Button type="button" onClick={create}>
          Generate code
        </Button>
        {msg ? <p className="text-sm text-muted">{msg}</p> : null}
      </Card>
      <div className="grid gap-3">
        {codes.map((c) => (
          <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium tracking-wide">{c.code}</p>
              <p className="text-sm text-muted">
                {c.remaining_percent}% remaining of {c.allocated_percent}% · {c.status}
              </p>
            </div>
            {c.status === "active" ? (
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await cancelCareCode({ data: { id: c.id } });
                  await load();
                }}
              >
                Cancel
              </Button>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
