import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendEnquiry } from "@/lib/health/actions";

export const Route = createFileRoute("/contact")({ component: Contact });

function Contact() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    try {
      await sendEnquiry({
        data: {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          message: String(fd.get("message") ?? ""),
        },
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send");
    }
  }

  return (
    <PublicShell>
      <main className="mx-auto grid max-w-4xl gap-8 px-4 py-16 md:grid-cols-2">
        <div>
          <h1 className="text-4xl">Enquire</h1>
          <p className="mt-3 text-muted">
            Eastern Ryse Specialist Hospital, Nigeria. Write to us about
            membership, visits, or partnership.
          </p>
        </div>
        <Card>
          {sent ? (
            <p>Received. We will reply by email.</p>
          ) : (
            <form className="grid gap-3" onSubmit={onSubmit}>
              <div className="grid gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" required />
              </div>
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <Button type="submit">Send enquiry</Button>
            </form>
          )}
        </Card>
      </main>
    </PublicShell>
  );
}
