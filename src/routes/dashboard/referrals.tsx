import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ensureMember, listReferrals } from "@/lib/health/actions";

export const Route = createFileRoute("/dashboard/referrals")({
  component: ReferralsPage,
});

function ReferralsPage() {
  const [code, setCode] = useState("");
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listReferrals>>>([]);

  useEffect(() => {
    ensureMember().then((s) => setCode(s.profile.referral_code)).catch(() => undefined);
    listReferrals().then(setRows).catch(() => undefined);
  }, []);

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl">Referrals</h1>
      <Card>
        <p className="text-sm text-muted">Your referral code</p>
        <p className="mt-2 text-2xl tracking-wide">{code}</p>
        <p className="mt-2 text-sm text-muted">
          New members enter your username or this code when they lock their handle.
        </p>
      </Card>
      {rows.map((r, i) => (
        <Card key={i}>
          <p>@{r.username ?? "member"} · {r.percent}%</p>
          <p className="text-sm text-muted">{new Date(r.created_at).toLocaleString()}</p>
        </Card>
      ))}
    </div>
  );
}
