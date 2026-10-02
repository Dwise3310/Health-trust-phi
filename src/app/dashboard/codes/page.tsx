"use client";

import { FormEvent, useState } from "react";
import { useLoading } from "@/components/loading-provider";

export default function CodesPage() {
  const { start, stop } = useLoading();
  const [percent, setPercent] = useState("5");
  const [codes, setCodes] = useState<{ code: string; percent: string }[]>([]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    start("Creating code");
    const code = `SH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setCodes((list) => [{ code, percent }, ...list]);
    stop();
  }

  return (
    <main className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="text-3xl">Care Quota codes</h1>
        <p className="mt-2 text-sm text-muted">
          Allocate a slice of your remaining quota. The holder is treated
          with the queue standing of your tier. You cannot allocate more than
          you have left. After SQL is live, remaining percent is enforced
          on the server.
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className="grid gap-3 rounded-2xl border border-border bg-card p-6"
      >
        <label className="grid gap-1.5 text-sm">
          Percent to allocate
          <input
            type="number"
            min={1}
            max={15}
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            className="rounded-xl border border-border bg-bg px-3 py-2.5"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-2.5 text-sm text-primary-fg"
        >
          Issue code
        </button>
      </form>
      <ul className="grid gap-2">
        {codes.map((c) => (
          <li
            key={c.code}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"
          >
            <span className="font-mono">{c.code}</span>
            <span className="text-muted">{c.percent}% reserved</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
