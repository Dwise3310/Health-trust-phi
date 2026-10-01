"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLoading } from "./loading-provider";
import { NavLink } from "./nav-link";
import { PasswordField } from "./password-field";

type Panel = "in" | "up" | "forgot";

export function AuthSlider() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const { start, stop } = useLoading();
  const supabase = useMemo(() => createClient(), []);

  const [panel, setPanel] = useState<Panel>("in");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [inEmail, setInEmail] = useState("");
  const [inPassword, setInPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [upEmail, setUpEmail] = useState("");
  const [upPassword, setUpPassword] = useState("");
  const [ageOk, setAgeOk] = useState(false);
  const [termsOk, setTermsOk] = useState(false);

  const [resetEmail, setResetEmail] = useState("");

  function note(kind: "error" | "info", message: string) {
    setError(kind === "error" ? message : null);
    setInfo(kind === "info" ? message : null);
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      note("error", "Supabase is not connected yet. Add the project URL and anon key in Vercel env, then reload.");
      return;
    }
    start("Signing in");
    note("error", "");
    const { error: err } = await supabase.auth.signInWithPassword({
      email: inEmail,
      password: inPassword,
    });
    stop();
    if (err) {
      note("error", err.message);
      return;
    }
    if (!remember) {
      // Session still uses cookies. Remember-me is a product flag for later hard expiry.
    }
    start("Opening dashboard");
    router.replace(next);
    router.refresh();
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (!ageOk || !termsOk) {
      note("error", "Please confirm age and accept the terms before creating an account.");
      return;
    }
    if (!supabase) {
      note("error", "Supabase is not connected yet. Add the project URL and anon key in Vercel env, then reload.");
      return;
    }
    start("Creating account");
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error: err } = await supabase.auth.signUp({
      email: upEmail,
      password: upPassword,
      options: {
        data: { full_name: name, phone },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    stop();
    if (err) {
      note("error", err.message);
      return;
    }
    note(
      "info",
      "Account created. If email confirmation is on, check your inbox, then sign in.",
    );
    setPanel("in");
    setInEmail(upEmail);
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      note("error", "Supabase is not connected yet.");
      return;
    }
    start("Sending reset link");
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      resetEmail || inEmail,
      { redirectTo: `${origin}/login?reset=1` },
    );
    stop();
    if (err) {
      note("error", err.message);
      return;
    }
    note(
      "info",
      "If that email exists, a reset link is on the way. Check your inbox.",
    );
  }

  const showForgot = panel === "forgot";
  const showSignUp = panel === "up";

  return (
    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_60px_rgba(23,33,28,0.08)]">
      <div className="relative grid min-h-[560px] md:grid-cols-2">
        <section className="grid content-center gap-5 p-6 md:p-10">
          <div>
            <p className="text-sm text-muted">Welcome back</p>
            <h1 className="mt-1 text-3xl">Sign in</h1>
            <p className="mt-2 text-sm text-muted">
              Use the email on your Health Trust account. Your wallet, Care
              Quota, and cards sit behind this door.
            </p>
          </div>
          {showForgot ? (
            <form className="grid gap-3" onSubmit={sendReset}>
              <label className="grid gap-1.5 text-sm">
                Email
                <input
                  type="email"
                  required
                  value={resetEmail || inEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  autoComplete="email"
                  className="rounded-xl border border-border bg-bg px-3 py-2.5"
                />
              </label>
              <button
                type="submit"
                className="rounded-full bg-primary px-4 py-2.5 text-sm text-primary-fg"
              >
                Send reset link
              </button>
              <button
                type="button"
                className="text-sm text-primary"
                onClick={() => setPanel("in")}
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <form className="grid gap-3" onSubmit={signIn}>
              <label className="grid gap-1.5 text-sm">
                Email
                <input
                  type="email"
                  required
                  value={inEmail}
                  onChange={(e) => setInEmail(e.target.value)}
                  autoComplete="email"
                  className="rounded-xl border border-border bg-bg px-3 py-2.5"
                />
              </label>
              <PasswordField
                id="signin-password"
                label="Password"
                value={inPassword}
                onChange={setInPassword}
                autoComplete="current-password"
              />
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-4"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-sm text-primary"
                  onClick={() => setPanel("forgot")}
                >
                  Forgot password?
                </button>
              </div>
              <button
                type="submit"
                className="rounded-full bg-primary px-4 py-2.5 text-sm text-primary-fg"
              >
                Sign in
              </button>
            </form>
          )}
          <p className="text-sm text-muted md:hidden">
            New here?{" "}
            <button
              type="button"
              className="text-primary"
              onClick={() => setPanel("up")}
            >
              Create an account
            </button>
          </p>
        </section>

        <section className="grid content-center gap-5 border-t border-border p-6 md:border-l md:border-t-0 md:p-10">
          <div>
            <p className="text-sm text-muted">Join Health Trust</p>
            <h2 className="mt-1 text-3xl">Create account</h2>
            <p className="mt-2 text-sm text-muted">
              Signup opens a wallet, a unique funding account number, and a
              member folder at Eastern Ryse.
            </p>
          </div>
          <form className="grid gap-3" onSubmit={signUp}>
            <label className="grid gap-1.5 text-sm">
              Full name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="rounded-xl border border-border bg-bg px-3 py-2.5"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Phone
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                className="rounded-xl border border-border bg-bg px-3 py-2.5"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Email
              <input
                type="email"
                required
                value={upEmail}
                onChange={(e) => setUpEmail(e.target.value)}
                autoComplete="email"
                className="rounded-xl border border-border bg-bg px-3 py-2.5"
              />
            </label>
            <PasswordField
              id="signup-password"
              label="Password"
              value={upPassword}
              onChange={setUpPassword}
              autoComplete="new-password"
            />
            <label className="flex items-start gap-2 text-sm text-muted">
              <input
                type="checkbox"
                className="mt-1 size-4"
                checked={ageOk}
                onChange={(e) => setAgeOk(e.target.checked)}
                required
              />
              I am 18 or older, or I have a parent or guardian creating this
              account with me.
            </label>
            <label className="flex items-start gap-2 text-sm text-muted">
              <input
                type="checkbox"
                className="mt-1 size-4"
                checked={termsOk}
                onChange={(e) => setTermsOk(e.target.checked)}
                required
              />
              I agree to the{" "}
              <NavLink href="/terms" className="text-primary underline">
                terms
              </NavLink>{" "}
              and{" "}
              <NavLink href="/privacy" className="text-primary underline">
                privacy policy
              </NavLink>
              .
            </label>
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-2.5 text-sm text-primary-fg"
            >
              Create account
            </button>
          </form>
          <p className="text-sm text-muted md:hidden">
            Already a member?{" "}
            <button
              type="button"
              className="text-primary"
              onClick={() => setPanel("in")}
            >
              Sign in
            </button>
          </p>
        </section>

        <div
          className={`slider-panel absolute inset-y-0 z-20 hidden w-1/2 bg-primary text-primary-fg md:grid ${
            showSignUp ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="grid place-content-center gap-4 p-10 text-center">
            {showSignUp ? (
              <>
                <h2 className="text-3xl">Already a member?</h2>
                <p className="text-sm opacity-90">
                  Sign in to fund your wallet, book, and share Care Quota
                  codes.
                </p>
                <button
                  type="button"
                  className="mx-auto rounded-full border border-primary-fg/40 px-5 py-2.5 text-sm"
                  onClick={() => setPanel("in")}
                >
                  Sign in instead
                </button>
              </>
            ) : (
              <>
                <h2 className="text-3xl">New here?</h2>
                <p className="text-sm opacity-90">
                  Membership turns you into a Health Trust VIP patient at
                  Eastern Ryse. Create an account in a minute.
                </p>
                <button
                  type="button"
                  className="mx-auto rounded-full border border-primary-fg/40 px-5 py-2.5 text-sm"
                  onClick={() => setPanel("up")}
                >
                  Create an account
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {error ? (
        <p className="border-t border-danger/30 bg-danger/10 px-6 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="border-t border-border px-6 py-3 text-sm text-muted">
          {info}
        </p>
      ) : null}
    </div>
  );
}
