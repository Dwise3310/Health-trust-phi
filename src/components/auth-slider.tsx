"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ActionButton } from "./action-button";
import { GoogleButton } from "./google-button";
import { useLoading } from "./loading-provider";
import { NavLink } from "./nav-link";
import { OtpModal } from "./otp-modal";
import { PasswordField } from "./password-field";
import { useToast } from "./toast";

type Panel = "in" | "up" | "forgot";

export function AuthSlider() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const { start, stop } = useLoading();
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);

  const [panel, setPanel] = useState<Panel>("in");
  const [inEmail, setInEmail] = useState("");
  const [inPassword, setInPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [upEmail, setUpEmail] = useState("");
  const [upPassword, setUpPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ageOk, setAgeOk] = useState(false);
  const [termsOk, setTermsOk] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [demoCode, setDemoCode] = useState("5665");

  const [resetEmail, setResetEmail] = useState("");

  const confirmClass =
    confirm.length === 0
      ? ""
      : upPassword === confirm
        ? "pw-match"
        : upPassword.startsWith(confirm)
          ? ""
          : "pw-mismatch";

  async function google(kind: "in" | "up") {
    start(kind === "in" ? "Connecting Google" : "Creating with Google");
    if (!supabase) {
      stop();
      toast(
        "Google button is in place. Connect the hospital Google client in Supabase Auth to finish wiring.",
      );
      return;
    }
    const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      stop();
      toast(error.message);
    }
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      toast("Supabase is not connected yet. Add the project keys in Vercel, then reload.");
      return;
    }
    start("Signing you in");
    const { error } = await supabase.auth.signInWithPassword({
      email: inEmail,
      password: inPassword,
    });
    stop();
    if (error) {
      toast(error.message);
      return;
    }
    void remember;
    toast("Welcome back");
    start("Opening your desk");
    router.replace(next);
    router.refresh();
  }

  async function sendCode() {
    const email = upEmail.trim();
    if (!email.includes("@")) {
      toast("Enter a valid email first");
      return null;
    }
    if (!supabase) {
      const code = String(Math.floor(1000 + Math.random() * 9000));
      setDemoCode(code);
      toast(`Verification code sent. Demo code is ${code} until mail is live.`);
      return `Demo code ${code}`;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      toast(error.message);
      return error.message;
    }
    toast("Code sent. Check your inbox.");
    return "Code sent. Check your inbox.";
  }

  async function verifyCode(code: string) {
    if (!supabase) return code === demoCode;
    const { error } = await supabase.auth.verifyOtp({
      email: upEmail.trim(),
      token: code,
      type: "email",
    });
    if (error) {
      toast(error.message);
      return false;
    }
    return true;
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (!emailVerified) {
      toast("Verify your email first. Tap Send code.");
      return;
    }
    if (!ageOk || !termsOk) {
      toast("Confirm age and accept the terms before creating an account.");
      return;
    }
    if (upPassword !== confirm) {
      toast("Passwords do not match");
      return;
    }
    start("Creating your Sure Health");
    if (!supabase) {
      stop();
      toast("Account form is ready. Connect Supabase to actually create members.");
      return;
    }
    const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signUp({
      email: upEmail,
      password: upPassword,
      options: {
        data: { full_name: name, phone },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    if (error && !error.message.toLowerCase().includes("already")) {
      stop();
      toast(error.message);
      return;
    }
    if (supabase) {
      await supabase.auth.updateUser({
        password: upPassword,
        data: { full_name: name, phone },
      });
    }
    stop();
    toast("Account created. You can sign in now.");
    setPanel("in");
    setInEmail(upEmail);
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      toast("Supabase is not connected yet.");
      return;
    }
    start("Sending reset link");
    const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(
      resetEmail || inEmail,
      { redirectTo: `${origin}/login?reset=1` },
    );
    stop();
    toast(error ? error.message : "If that email exists, a reset link is on the way.");
  }

  const up = panel === "up";

  return (
    <>
      <div className={`ht-auth mx-auto ${up ? "is-up" : ""}`}>
        <section className="form-panel sign-in-panel">
          {panel === "forgot" ? (
            <form className="grid gap-3" onSubmit={sendReset}>
              <p className="text-sm text-muted">Reset access</p>
              <h1 className="text-3xl">Forgot password</h1>
              <p className="text-sm text-muted">
                We will email a reset link. Membership receipts stay on.
              </p>
              <div className="field-group mt-2">
                <input
                  type="email"
                  required
                  value={resetEmail || inEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  autoComplete="email"
                />
                <span className="field-notch">Email</span>
              </div>
              <ActionButton type="submit" variant="primary" feedback="Sending reset">
                Send reset link
              </ActionButton>
              <ActionButton variant="ghost" onClick={() => setPanel("in")}>
                Back to sign in
              </ActionButton>
            </form>
          ) : (
            <form className="grid gap-3" onSubmit={signIn}>
              <p className="text-sm text-muted">Eastern Ryse desk</p>
              <h1 className="text-3xl">Sign in</h1>
              <p className="text-sm text-muted">
                Your wallet, Care Quota, cards, and pharmacy orders sit behind this door.
              </p>
              <GoogleButton
                label="Continue with Google"
                onClick={() => google("in")}
              />
              <p className="text-center text-[11px] uppercase tracking-[0.18em] text-muted">
                or email
              </p>
              <div className="field-group">
                <input
                  type="email"
                  required
                  value={inEmail}
                  onChange={(e) => setInEmail(e.target.value)}
                  autoComplete="email"
                />
                <span className="field-notch">Email</span>
              </div>
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
                <ActionButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setPanel("forgot")}
                >
                  Forgot password?
                </ActionButton>
              </div>
              <ActionButton type="submit" variant="primary" size="lg">
                Sign in
              </ActionButton>
            </form>
          )}
        </section>

        <section className="form-panel sign-up-panel overflow-y-auto">
          <form className="grid gap-3" onSubmit={signUp}>
            <p className="text-sm text-muted">Join the hospital membership</p>
            <h2 className="text-3xl">Create account</h2>
            <GoogleButton
              label="Sign up with Google"
              onClick={() => google("up")}
            />
            <p className="text-center text-[11px] uppercase tracking-[0.18em] text-muted">
              or email
            </p>
            <div className="field-group">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
              <span className="field-notch">Full name</span>
            </div>
            <div className="field-group">
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
              />
              <span className="field-notch">Phone</span>
            </div>
            <div className="field-group">
              <input
                type="email"
                required
                value={upEmail}
                onChange={(e) => {
                  setUpEmail(e.target.value);
                  setEmailVerified(false);
                }}
                autoComplete="email"
                className={emailVerified ? "border-[var(--ok)]" : ""}
              />
              <span className="field-notch">Email</span>
            </div>
            {emailVerified ? (
              <p className="text-xs font-medium text-ok">Email verified</p>
            ) : (
              <ActionButton
                variant="secondary"
                size="sm"
                onClick={async () => {
                  const msg = await sendCode();
                  if (msg !== null && upEmail.includes("@")) setOtpOpen(true);
                }}
              >
                Send verification code
              </ActionButton>
            )}
            <PasswordField
              id="signup-password"
              label="Password"
              value={upPassword}
              onChange={setUpPassword}
              autoComplete="new-password"
            />
            <PasswordField
              id="confirm-password"
              label="Confirm password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              matchClass={confirmClass}
            />
            <label className="flex items-start gap-2 text-xs text-muted">
              <input
                type="checkbox"
                className="mt-0.5 size-4"
                checked={ageOk}
                onChange={(e) => setAgeOk(e.target.checked)}
                required
              />
              I am 18 or older, or a parent is creating this with me.
            </label>
            <label className="flex items-start gap-2 text-xs text-muted">
              <input
                type="checkbox"
                className="mt-0.5 size-4"
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
            <ActionButton type="submit" variant="primary" size="lg">
              Create account
            </ActionButton>
          </form>
        </section>

        <div className="overlay-wrapper">
          <div className="overlay-content">
            <div
              className="overlay-box overlay-left-box bg-cover bg-center"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(110,83,48,0.82), rgba(110,83,48,0.88)), url(/medical/lobby.jpg)",
              }}
            >
              <p className="text-xs tracking-[0.22em] uppercase opacity-80">
                Returning patient
              </p>
              <h2 className="mt-2 text-3xl">Already with us?</h2>
              <p className="mt-3 max-w-xs text-sm opacity-90">
                Sign in to fund Health, book a consult, and pick up from the dispensary.
              </p>
              <ActionButton
                variant="overlay"
                className="mt-6"
                onClick={() => setPanel("in")}
                feedback="Opening sign in"
              >
                Sign in
              </ActionButton>
            </div>
            <div
              className="overlay-box overlay-right-box bg-cover bg-center"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(110,83,48,0.82), rgba(110,83,48,0.88)), url(/medical/pharmacy.jpg)",
              }}
            >
              <p className="text-xs tracking-[0.22em] uppercase opacity-80">
                New patient
              </p>
              <h2 className="mt-2 text-3xl">First visit?</h2>
              <p className="mt-3 max-w-xs text-sm opacity-90">
                Open a wallet, pick a Care Quota, and walk into Eastern Ryse already known.
              </p>
              <ActionButton
                variant="overlay"
                className="mt-6"
                onClick={() => setPanel("up")}
                feedback="Opening create account"
              >
                Create account
              </ActionButton>
            </div>
          </div>
        </div>
      </div>

      <OtpModal
        email={upEmail}
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        onVerified={() => {
          setEmailVerified(true);
          setOtpOpen(false);
          toast("Email verified");
        }}
        sendCode={sendCode}
        verifyCode={verifyCode}
      />
    </>
  );
}
