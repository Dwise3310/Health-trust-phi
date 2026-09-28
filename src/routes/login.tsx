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

function Login() {
  const [mode, setMode] = useState<"in" | "up" | "verify">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "up") {
        const res = await authClient.signUp.email({ email, password, name });
        if (res.error) throw new Error(res.error.message);
        setInfo("Account created. If email verification is enabled, enter the code we sent you.");
        setMode("verify");
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
      const res = await authClient.signIn.email({ email, password });
      if (res.error) throw new Error(res.error.message);
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete request");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicShell>
      <main className="mx-auto grid max-w-md gap-6 px-4 py-16">
        <div>
          <p className="text-sm text-muted">Member access</p>
          <h1 className="mt-1 text-3xl">
            {mode === "verify" ? "Verify your email" : "Sign in to Health Trust"}
          </h1>
        </div>
        <Card className="grid gap-4">
          {authEnabled ? (
            <form className="grid gap-3" onSubmit={onEmail}>
              {mode === "up" ? (
                <div className="grid gap-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              ) : null}

              {mode !== "verify" ? (
                <>
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
                  <div className="grid gap-1.5">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required
                        autoComplete={mode === "up" ? "new-password" : "current-password"}
                        className="pr-11"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 grid size-9 place-items-center rounded-md text-muted hover:text-fg"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid gap-1.5">
                  <Label htmlFor="otp">Verification code</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter code from email"
                    required
                    autoComplete="one-time-code"
                  />
                  <p className="text-xs text-muted">
                    Sent to {email}. Check spam if you do not see it.
                  </p>
                </div>
              )}

              {error ? <p className="text-sm text-danger">{error}</p> : null}
              {info ? <p className="text-sm text-muted">{info}</p> : null}

              <Button type="submit" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : mode === "up"
                    ? "Create account"
                    : mode === "verify"
                      ? "Verify email"
                      : "Sign in"}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted">Sign-in is disabled.</p>
          )}

          {mode !== "verify" ? (
            <button
              type="button"
              className="text-sm text-muted hover:text-fg"
              onClick={() => {
                setMode(mode === "up" ? "in" : "up");
                setError(null);
                setInfo(null);
              }}
            >
              {mode === "up" ? "Already a member? Sign in" : "New here? Create an account"}
            </button>
          ) : (
            <button
              type="button"
              className="text-sm text-muted hover:text-fg"
              onClick={() => {
                setMode("in");
                setError(null);
                setInfo(null);
              }}
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
