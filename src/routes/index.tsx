import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, HeartPulse, Shield, Users } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { TIERS } from "@/lib/health/constants";
import { formatHealth, formatNaira, nairaFromHealth } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, isPending } = useCurrentUserState();
  const memberHref = !isPending && user ? "/dashboard" : "/tiers";

  return (
    <PublicShell>
      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="text-sm font-medium tracking-wide text-primary">
            FarmGreat West Africa LLC · Eastern Ryse Specialist Hospital
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl leading-tight md:text-6xl">
            Health is not a luxury. Care should reach you before the bill does.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            Register and you become a Health Trust VIP patient. Consultation and
            diagnosis sit inside your Care Quota. Referrals pay you back. The
            aim is simple: healthier, wealthier lives.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={memberHref}>
                {user ? "Go to dashboard" : "Become a member"}{" "}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/how-it-works">See how Care Quota works</Link>
            </Button>
          </div>
        </section>

        <section className="border-y border-border bg-surface">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-3">
            {[
              {
                icon: HeartPulse,
                title: "Care Quota",
                body: "A percentage cover the consultant confirms on site. It refreshes every three months for the life of your plan.",
              },
              {
                icon: Shield,
                title: "Priority by tier",
                body: "Prime is seen first, then Plus, then Base. Shared codes carry the generator’s queue standing.",
              },
              {
                icon: Users,
                title: "Share cover",
                body: "Issue a code from your dashboard so a friend or family member can walk into Eastern Ryse with your cover.",
              },
            ].map((item) => (
              <div key={item.title} className="grid gap-3">
                <item.icon className="size-6 text-primary" />
                <h2 className="text-xl">{item.title}</h2>
                <p className="text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl">Three ways in</h2>
            <Link to="/tiers" className="text-sm text-primary">
              Compare tiers
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {Object.values(TIERS).map((t) => (
              <Card key={t.id} className="flex flex-col gap-3">
                <p className="text-sm text-muted">{t.short}</p>
                <h3 className="text-2xl">{t.name}</h3>
                <p className="font-medium tabular-nums">
                  {formatHealth(t.priceHealth)}
                  <span className="ml-2 text-sm font-normal text-muted">
                    {formatNaira(nairaFromHealth(t.priceHealth))}
                  </span>
                </p>
                <p className="text-sm text-muted">
                  {t.durationMonths} months of Care Quota · refreshes every 3 months
                  ({t.refreshes} auto-renewals)
                </p>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
