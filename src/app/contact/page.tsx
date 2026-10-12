"use client";

import { FormEvent, useEffect, useState } from "react";
import { PublicShell } from "@/components/public-shell";
import { HOSPITAL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useLoading } from "@/components/loading-provider";

type Reply = { id: number; title: string; detail: string; status: string; reply: string | null; at: string };

export default function ContactPage() {
  const { start, stop } = useLoading();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const meta = data.session.user.user_metadata?.full_name as string | undefined;
      if (meta) setName((n) => n || meta);
      if (data.session.user.email) setEmail((v) => v || data.session.user.email || "");
      const { data: board } = await supabase.rpc("sh_my_board");
      const list = board && typeof board === "object" && "enquiries" in board
        ? (board as { enquiries: Reply[] }).enquiries
        : [];
      setReplies(Array.isArray(list) ? list : []);
    });
  }, [sent]);

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
      setStatus("Could not send that just now. Try again in a moment.");
      return;
    }
    const { data: session } = await supabase.auth.getSession();
    const { error } = await supabase.from("enquiries").insert({
      name,
      email,
      message,
      user_id: session.session?.user.id ?? null,
    });
    stop();
    if (error) {
      setSent(false);
      setStatus(error.message);
      return;
    }
    setName("");
    setEmail("");
    setMessage("");
    setConsent(false);
    setSent(true);
    setStatus("The desk has your enquiry. If you are signed in, the reply shows on this page and on your member home under From the desk.");
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
        {sent ? (
          <div className="mt-10 grid justify-items-start gap-4">
            <svg viewBox="0 0 48 48" className="size-16 text-ok" aria-hidden>
              <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="2" />
              <path
                className="sent-tick"
                d="M14 25 l7 7 l13 -15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h2 className="text-2xl">Enquiry sent</h2>
            <p className="max-w-md text-sm leading-relaxed text-muted">{status}</p>
            <button
              type="button"
              className="btn-press text-sm font-semibold text-primary"
              onClick={() => {
                setSent(false);
                setStatus(null);
              }}
            >
              Send another
            </button>
          </div>
        ) : (
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
            I agree that Sure Health may use this form to reply. We do not
            sell enquiry data.
          </label>
          <button
            type="submit"
            className="btn-press rounded-full bg-primary px-4 py-2.5 text-sm text-primary-fg"
          >
            Send
          </button>
          {!sent && status ? <p className="text-sm text-muted">{status}</p> : null}
        </form>
        )}
        {replies.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-lg">Replies to you</h2>
            <ul>
              {replies.map((item) => (
                <li key={item.id} className="border-b border-border py-3 text-sm">
                  <p className="text-muted">{new Date(item.at).toLocaleString("en-NG")}</p>
                  <p className="mt-1 whitespace-pre-wrap">{item.detail}</p>
                  <p className="mt-2 font-semibold">
                    {item.reply ? `Hospital: ${item.reply}` : "Waiting on the desk"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <p className="mt-8 text-xs text-muted">
          Direct mail: {HOSPITAL.supportEmail}. Privacy: {HOSPITAL.privacyEmail}.
        </p>
      </main>
    </PublicShell>
  );
}
