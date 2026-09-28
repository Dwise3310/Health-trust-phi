import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState, type FormEvent } from "react";
import { authClient, authEnabled } from "@/lib/auth/client";
import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({ component: Login });

type Mode = "in" | "up" | "verify" | "forgot" | "reset";

function Login() {
  const [mode, setMode] = useState<Mode>("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "up") {
        const res = await authClient.signUp.email({ email, password, name });
        if (res.error) throw new Error(res.error.message);
        setInfo("Account created. Check your email for a code if verification is on.");
        switchMode("verify");
        return;
      }

      if (mode === "verify") {
        const res = await authClient.verifyEmail({
          query: { token: otp.trim() },
        });
        if (res.error) throw new Error(res.error.message ?? "Invalid or expired code");
        window.location.assign("/dashboard");
        return;
      }

      if (mode === "forgot") {
        const res = await authClient.forgetPassword({
          email,
          redirectTo: `${window.location.origin}/login`,
        });
        if (res.error) throw new Error(res.error.message ?? "Could not send reset email");
        setInfo("If that email exists, a reset link or code was sent. Check your inbox.");
        return;
      }

      if (mode === "reset") {
        const res = await authClient.resetPassword({
          newPassword: password,
          token: otp.trim(),
        });
        if (res.error) throw new Error(res.error.message ?? "Could not reset password");
        setInfo("Password updated. Sign in with your new password.");
        switchMode("in");
        return;
      }

      // Sign in
      const res = await authClient.signIn.email({
        email,
        password,
        rememberMe: remember,
      });
      if (res.error) throw new Error(res.error.message);
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete request");
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "verify"
      ? "Verify your email"
      : mode === "forgot"
        ? "Reset password"
        : mode === "reset"
          ? "Set a new password"
          : mode === "up"
            ? "Create your account"
            : "Sign in to Health Trust";

  return (
    <PublicShell>
      <main className="mx-auto grid max-w-md gap-6 px-4 py-16">
        <div>
          <p className="text-sm text-muted">Member access</p>
          <h1 className="mt-1 text-3xl">{title}</h1>
        </div>

        <Card className="grid gap-4">
          {authEnabled ? (
            <form className="grid gap-3" onSubmit={onSubmit}>
              {mode === "up" ? (
                <div className="grid gap-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              ) : null}

              {mode === "verify" || mode === "reset" ? (
                <div className="grid gap-1.5">
                  <Label htmlFor="otp">
                    {mode === "reset" ? "Reset code from email" : "Verification code"}
                  </Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter code"
                    required
                    autoComplete="one-time-code"
                  />
                  {mode === "verify" ? (
                    <p className="text-xs text-muted">
                      Sent to {email || "your email"}. Check spam if needed.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {mode === "in" || mode === "up" || mode === "forgot" ? (
                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              ) : null}

              {mode === "in" || mode === "up" || mode === "reset" ? (
                <div className="grid gap-1.5">
                  <Label htmlFor="password">
                    {mode === "reset" ? "New password" : "Password"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                      required
                      autoComplete={
                        mode === "up" || mode === "reset" ? "new-password" : "current-password"
                      }
                      className="pr-11"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted hover:text-fg"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              ) : null}

              {mode === "in" ? (
                <div className="flex items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="size-4 rounded border-border accent-[var(--color-primary,#1B5C48)]"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => switchMode("forgot")}
                  >
                    Forgot password?
                  </button>
                </div>
              ) : null}

              {error ? <p className="text-sm text-danger">{error}</p> : null}
              {info ? <p className="text-sm text-muted">{info}</p> : null}

              <Button type="submit" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : mode === "up"
                    ? "Create account"
                    : mode === "verify"
                      ? "Verify email"
                      : mode === "forgot"
                        ? "Send reset link"
                        : mode === "reset"
                          ? "Update password"
                          : "Sign in"}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted">Sign-in is disabled.</p>
          )}

          {mode === "in" || mode === "up" ? (
            <button
              type="button"
              className="text-sm text-muted hover:text-fg"
              onClick={() => switchMode(mode === "up" ? "in" : "up")}
            >
              {mode === "up" ? "Already a member? Sign in" : "New here? Create an account"}
            </button>
          ) : (
            <button
              type="button"
              className="text-sm text-muted hover:text-fg"
              onClick={() => switchMode("in")}
            >
              Back to sign in
            </button>
          )}
        </Card>

        <Link to="/" className="text-center text-sm text-muted">
          Back home
        </Link>
      </main>
    </PublicShell>
  );
}
