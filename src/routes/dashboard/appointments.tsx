import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bookAppointment, listAppointments } from "@/lib/health/actions";
import { CALL_PRICES, PHYSICAL_PRICES } from "@/lib/health/constants";
import { formatHealth } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/appointments")({
  component: AppointmentsPage,
});

function AppointmentsPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listAppointments>>>([]);
  const [kind, setKind] = useState<"physical" | "audio">("audio");
  const [minutes, setMinutes] = useState(25);
  const [when, setWhen] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const prices = kind === "audio" ? CALL_PRICES : PHYSICAL_PRICES;

  async function load() {
    setRows(await listAppointments());
  }
  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function book() {
    setMsg(null);
    try {
      await bookAppointment({
        data: { kind, minutes, when: new Date(when).toISOString() },
      });
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl">Bookings</h1>
      <p className="text-sm text-muted">
        Audio calls stay inside Health Trust. Physical visits are time-priced.
        Prime waiting area at the hospital for Prime members and Prime-issued codes.
      </p>
      <Card className="grid gap-3">
        <div className="flex gap-2">
          <Button type="button" variant={kind === "audio" ? "default" : "outline"} onClick={() => { setKind("audio"); setMinutes(25); }}>
            Audio call
          </Button>
          <Button type="button" variant={kind === "physical" ? "default" : "outline"} onClick={() => { setKind("physical"); setMinutes(30); }}>
            Physical visit
          </Button>
        </div>
        <Label>Duration</Label>
        <div className="flex flex-wrap gap-2">
          {prices.map((p) => (
            <Button
              key={p.minutes}
              type="button"
              size="sm"
              variant={minutes === p.minutes ? "default" : "outline"}
              onClick={() => setMinutes(p.minutes)}
            >
              {p.minutes} min · {formatHealth(p.health)}
            </Button>
          ))}
        </div>
        <Label htmlFor="when">When</Label>
        <Input id="when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        {msg ? <p className="text-sm text-danger">{msg}</p> : null}
        <Button type="button" onClick={book} disabled={!when}>
          Confirm booking
        </Button>
      </Card>
      <div className="grid gap-3">
        {rows.map((r) => (
          <Card key={r.id}>
            <p className="font-medium">
              {r.kind} · {r.duration_min} min
            </p>
            <p className="text-sm text-muted">
              {new Date(r.scheduled_at).toLocaleString()} · {formatHealth(Number(r.health_cost))} · {r.status}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
