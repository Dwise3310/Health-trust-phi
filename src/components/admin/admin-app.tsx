"use client";

import { FormEvent, useEffect, useState } from "react";
import QRCode from "qrcode";
import { HeartbeatLoader } from "@/components/heartbeat-loader";
import { PasswordField } from "@/components/password-field";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/components/toast";
import { AdminDesk } from "@/components/admin/admin-desk";
import type { AdminStatus } from "@/lib/admin";
import { HOSPITAL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

type Phase = "boot" | "login" | "enroll" | "code" | "desk" | "blocked";

async function rpc<T>(name: string, args?: Record<string, unknown>) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not connected on this deploy.");
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export function AdminApp() {
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("boot");
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [secret, setSecret] = useState("");
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);

  async function applyStatus(next: AdminStatus, enrolledSecret?: string) {
    setStatus(next);
    if (!next.allowed) {
      setPhase("blocked");
      return;
    }
    if (!next.totp_enabled) {
      setPhase("enroll");
      if (!enrolledSecret) {
        const enroll = await rpc<{ secret: string; otpauth: string }>("sh_admin_enroll_totp");
        setSecret(enroll.secret);
        setQr(await QRCode.toDataURL(enroll.otpauth, { margin: 1, width: 220 }));
      }
      return;
    }
    if (!next.verified) {
      setPhase("code");
      return;
    }
    setPhase("desk");
  }

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setPhase("login");
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        setPhase("login");
        return;
      }
      try {
        const next = await rpc<AdminStatus>("sh_admin_status");
        await applyStatus(next);
      } catch (err) {
        toast(err instanceof Error ? err.message : "Could not open the desk");
        setPhase("login");
      }
    });
    // applyStatus closes over toast only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      toast("Supabase is not connected on this deploy.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      toast(error.message);
      return;
    }
    try {
      await rpc("sh_admin_lock");
      const next = await rpc<AdminStatus>("sh_admin_status");
      if (!next.allowed) {
        await supabase.auth.signOut();
        setPhase("blocked");
        setBusy(false);
        return;
      }
      await applyStatus(next);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not open the desk");
    } finally {
      setBusy(false);
    }
  }

  async function confirmTotp(enroll: boolean) {
    setBusy(true);
    try {
      const next = await rpc<AdminStatus>(
        enroll ? "sh_admin_confirm_totp" : "sh_admin_verify_totp",
        { p_code: code },
      );
      setCode("");
      await applyStatus(next, secret);
      toast(enroll ? "Authenticator is on" : "Desk unlocked");
    } catch (err) {
      toast(err instanceof Error ? err.message : "That code is not right");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const supabase = createClient();
    try {
      await rpc("sh_admin_lock");
    } catch {
      /* still leave */
    }
    await supabase?.auth.signOut();
    setStatus(null);
    setPhase("login");
    setCode("");
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Staff desk</p>
          <p className="text-sm font-semibold">{HOSPITAL.program}</p>
        </div>
        <ThemeToggle />
      </header>

      {phase === "boot" ? (
        <div className="grid min-h-[60vh] place-items-center">
          <HeartbeatLoader label="Opening the staff desk" />
        </div>
      ) : null}

      {phase === "blocked" ? (
        <main className="mx-auto max-w-md px-4 py-16">
          <h1 className="text-3xl">This door is for hospital staff</h1>
          <p className="mt-3 text-sm text-muted">
            {email || status?.email || "That account"} is not on the staff list. Members use the member desk.
          </p>
          <button type="button" className="mt-6 text-sm font-semibold text-primary" onClick={() => void signOut()}>
            Use a different account
          </button>
        </main>
      ) : null}

      {phase === "login" ? (
        <main className="mx-auto grid max-w-md gap-4 px-4 py-12">
          <h1 className="text-3xl">Staff sign in</h1>
          <p className="text-sm text-muted">
            Email and password, then the authenticator code. Super admin, reception, pharmacy, and anyone you invite come through here.
          </p>
          <form className="grid gap-3" onSubmit={signIn}>
            <label className="grid gap-1.5 text-sm">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                className="rounded-xl border border-border bg-bg px-3 py-2.5"
              />
            </label>
            <PasswordField
              id="admin-password"
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
            <button
              type="submit"
              disabled={busy}
              className="btn-press rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-fg"
            >
              {busy ? "Checking" : "Continue"}
            </button>
          </form>
        </main>
      ) : null}

      {phase === "enroll" ? (
        <main className="mx-auto grid max-w-md gap-4 px-4 py-12">
          <h1 className="text-3xl">Turn on the authenticator</h1>
          <p className="text-sm text-muted">
            Scan this with Google Authenticator, Authy, or 1Password. Then enter the 6 digit code. You will need it every time you sign in.
          </p>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Authenticator QR code" className="w-48 rounded-lg bg-white p-2" />
          ) : (
            <HeartbeatLoader label="Preparing the code" />
          )}
          <p className="break-all font-mono text-sm">{secret}</p>
          <p className="text-xs text-muted">If the camera will not scan, type that key in by hand.</p>
          <label className="grid gap-1.5 text-sm">
            6 digit code
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="rounded-xl border border-border bg-bg px-3 py-2.5 font-mono tracking-[0.3em]"
            />
          </label>
          <button
            type="button"
            disabled={busy || code.length < 6}
            className="btn-press rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-fg"
            onClick={() => void confirmTotp(true)}
          >
            {busy ? "Checking" : "Turn on and enter"}
          </button>
        </main>
      ) : null}

      {phase === "code" ? (
        <main className="mx-auto grid max-w-md gap-4 px-4 py-12">
          <h1 className="text-3xl">Authenticator code</h1>
          <p className="text-sm text-muted">
            Enter the current 6 digit code for {status?.email}. The desk stays open for 12 hours, then asks again.
          </p>
          <label className="grid gap-1.5 text-sm">
            6 digit code
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="rounded-xl border border-border bg-bg px-3 py-2.5 font-mono tracking-[0.3em]"
            />
          </label>
          <button
            type="button"
            disabled={busy || code.length < 6}
            className="btn-press rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-fg"
            onClick={() => void confirmTotp(false)}
          >
            {busy ? "Checking" : "Unlock desk"}
          </button>
          <button type="button" className="text-sm text-muted" onClick={() => void signOut()}>
            Sign out
          </button>
        </main>
      ) : null}

      {phase === "desk" && status ? <AdminDesk status={status} onSignOut={() => void signOut()} /> : null}
    </div>
  );
}
