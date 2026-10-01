"use client";

import { FormEvent, useState } from "react";
import { PublicShell } from "@/components/public-shell";
import { HOSPITAL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useLoading } from "@/components/loading-provider";

export default function ContactPage() {
  const { start, stop } = useLoading();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!consent) {
      setStatus("Please confirm we may use this message to reply to you.");
      return;
    }
    start("Sending enquiry");
    const supabase = createClient();
    if (!supabase) {
      stop();
      setStatus(
        "Message stored locally for now. Connect Supabase to deliver enquiries to the hospital desk.",
      );
      return;
    }
    const { error } = await supabase.from("enquiries").insert({
      name,
      email,
      message,
    });
    stop();
    setStatus(
      error
        ? error.message
        : "Received. A staff member will reply from the hospital desk.",
    );
  }

  return (
    <PublicShell>
      <main className="mx-auto max-w-xl px-4 py-16">
        <p className="text-sm text-primary">Talk to us</p>
        <h1 className="mt-2 text-4xl">Make an enquiry</h1>
        <p className="mt-3 text-sm text-muted">
          For membership questions, billing, or a medical case report that
          is not an emergency. Emergencies go to local services, then to{" "}
          {HOSPITAL.name}.
        </p>
        <form className="mt-8 grid gap-3" onSubmit={onSubmit}>
          <label className="grid gap-1.5 text-sm">
            Name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2.5"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2.5"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            Message
            <textarea
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2.5"
            />
          </label>
          <label className="flex items-start gap-2 text-sm text-muted">
            <input
              type="checkbox"
              className="mt-1 size-4"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
            />
            I agree that Health Trust may use this form to reply. We do not
            sell enquiry data.
          </label>
          <button
            type="submit"
            className="rounded-full bg-primary px-4 py-2.5 text-sm text-primary-fg"
          >
            Send
          </button>
          {status ? <p className="text-sm text-muted">{status}</p> : null}
        </form>
        <p className="mt-8 text-xs text-muted">
          Direct mail: {HOSPITAL.supportEmail}. Privacy: {HOSPITAL.privacyEmail}.
        </p>
      </main>
    </PublicShell>
  );
}
