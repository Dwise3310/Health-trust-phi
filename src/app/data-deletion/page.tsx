"use client";

import { FormEvent, useState } from "react";
import { PublicShell } from "@/components/public-shell";
import { HOSPITAL } from "@/lib/constants";

export default function DataDeletionPage() {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setDone(true);
  }

  return (
    <PublicShell>
      <main className="mx-auto max-w-xl px-4 py-16">
        <p className="text-sm text-primary">Your data</p>
        <h1 className="mt-2 text-4xl">Request deletion</h1>
        <p className="mt-3 text-sm text-muted">
          We will delete the account, wallet login, and marketing records.
          Visit notes the hospital is required to keep stay in the clinical
          archive, not on this website. Mail {HOSPITAL.privacyEmail} if
          you cannot use the form.
        </p>
        {done ? (
          <p className="mt-8 text-sm">
            Request noted for {email}. Staff will confirm from the privacy
            desk. This is not instant while we check for open bills or an
            active visit.
          </p>
        ) : (
          <form className="mt-8 grid gap-3" onSubmit={onSubmit}>
            <label className="grid gap-1.5 text-sm">
              Account email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-border bg-card px-3 py-2.5"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Anything we should know
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="rounded-xl border border-border bg-card px-3 py-2.5"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-2.5 text-sm text-primary-fg"
            >
              Submit deletion request
            </button>
          </form>
        )}
      </main>
    </PublicShell>
  );
}
