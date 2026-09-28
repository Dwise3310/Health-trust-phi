import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "up") {
        const res = await authClient.signUp.email({ email, password, name });
        if (res.error) throw new Error(res.error.message);
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) throw new Error(res.error.message);
      }
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicShell>
      <main className="mx-auto grid max-w-md gap-6 px-4 py-16">
        <div>
          <p className="text-sm text-muted">Member access</p>
          <h1 className="mt-1 text-3xl">Sign in to Health Trust</h1>
        </div>
        <Card className="grid gap-4">
          {authEnabled ? (
            <>
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="outline"
                  onClick={() => signIn(p.providerId, { callbackURL: "/dashboard" })}
                >
                  Continue with {p.label}
                </Button>
              ))}
              <div className="flex items-center gap-3 text-xs text-muted">
                <span className="h-px flex-1 bg-border" />
                or email
                <span className="h-px flex-1 bg-border" />
              </div>
              <form className="grid gap-3" onSubmit={onEmail}>
                {mode === "up" ? (
                  <div className="grid gap-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                ) : null}
                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                {error ? <p className="text-sm text-danger">{error}</p> : null}
                <Button type="submit" disabled={busy}>
                  {busy ? "Please wait…" : mode === "up" ? "Create account" : "Sign in"}
                </Button>
              </form>
              <button
                type="button"
                className="text-sm text-muted hover:text-fg"
                onClick={() => setMode(mode === "up" ? "in" : "up")}
              >
                {mode === "up" ? "Already a member? Sign in" : "New here? Create an account"}
              </button>
            </>
          ) : (
            <p className="text-sm text-muted">Sign-in is disabled.</p>
          )}
        </Card>
        <Link to="/" className="text-center text-sm text-muted">
          Back home
        </Link>
      </main>
    </PublicShell>
  );
}
