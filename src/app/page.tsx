import {
  ArrowRight,
  HeartPulse,
  Shield,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react";
import { NavLink } from "@/components/nav-link";
import { PublicShell } from "@/components/public-shell";
import { HOSPITAL, TIERS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

const FEATURES = [
  {
    icon: HeartPulse,
    title: "Care Quota",
    body: "A percentage of consultation and diagnosis the consultant confirms on site. It refreshes every three months for the life of your plan. You always know what is covered before you walk in.",
  },
  {
    icon: Shield,
    title: "Priority by tier",
    body: "Prime is seen first, then Plus, then Base. Shared codes carry the generator's queue standing, so family using your cover is treated with your rank.",
  },
  {
    icon: Users,
    title: "Share cover",
    body: "Issue a Care Quota code from your dashboard. A friend or family member presents it at Eastern Ryse and draws from the percent you allocated.",
  },
];

const STEPS = [
  {
    n: "01",
    t: "Create an account",
    d: "Email, phone, and a password. A wallet and a unique funding account number are created with you.",
  },
  {
    n: "02",
    t: "Fund Health",
    d: "1 Health equals 100 naira. Pay into your permanent account number. Then pay for membership, cards, calls, and drugs from the wallet.",
  },
  {
    n: "03",
    t: "Pick a tier",
    d: "Base, Plus, or Prime. Each one sets your Care Quota, your queue standing, and how long the plan runs.",
  },
  {
    n: "04",
    t: "Use care",
    d: "Book a physical visit, buy a digital card, or schedule an in-app audio call. Present your code or your membership at the desk.",
  },
];

export default function HomePage() {
  return (
    <PublicShell>
      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="rise text-sm font-medium tracking-wide text-primary">
            {HOSPITAL.sponsor} · {HOSPITAL.name}
          </p>
          <h1 className="rise-2 mt-4 max-w-3xl text-4xl leading-[1.1] md:text-6xl">
            Health is not a luxury. Care should reach you before the bill does.
          </h1>
          <p className="rise-3 mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Register and you become a Health Trust VIP patient. Consultation
            and diagnosis sit inside your Care Quota. Referrals pay you back
            in Health. The aim is simple: healthier lives, and wealthier ones
            too.
          </p>
          <div className="rise-4 mt-8 flex flex-wrap gap-3">
            <NavLink
              href="/tiers"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm text-primary-fg"
            >
              Become a member <ArrowRight className="size-4" />
            </NavLink>
            <NavLink
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm"
            >
              See how Care Quota works
            </NavLink>
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
            {FEATURES.map((item) => (
              <article key={item.title} className="grid gap-3">
                <item.icon className="size-6 text-primary" aria-hidden />
                <h2 className="text-2xl">{item.title}</h2>
                <p className="text-sm leading-relaxed text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-primary">Membership</p>
              <h2 className="mt-1 text-3xl md:text-4xl">Three ways in</h2>
            </div>
            <NavLink href="/tiers" className="text-sm text-primary">
              Compare tiers in full
            </NavLink>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {Object.values(TIERS).map((t) => (
              <article
                key={t.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6"
              >
                <p className="text-sm text-muted">{t.short}</p>
                <h3 className="text-2xl">{t.name}</h3>
                <p className="text-lg tabular-nums">{formatPrice(t.priceHealth)}</p>
                <p className="text-sm text-muted">
                  {t.durationMonths} months of Care Quota. Refreshes every 3
                  months ({t.refreshes} auto-renewals).
                </p>
                <p className="text-sm">{t.quotaHint}</p>
                <NavLink
                  href="/login"
                  className="mt-auto inline-flex rounded-full bg-primary px-4 py-2 text-center text-sm text-primary-fg"
                >
                  Start with {t.short}
                </NavLink>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-3xl md:text-4xl">How a visit actually works</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-4">
              {STEPS.map((s) => (
                <article key={s.n} className="grid gap-2">
                  <p className="text-xs tracking-[0.2em] text-primary">{s.n}</p>
                  <h3 className="text-xl">{s.t}</h3>
                  <p className="text-sm leading-relaxed text-muted">{s.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card p-6">
            <Wallet className="size-6 text-primary" aria-hidden />
            <h2 className="mt-4 text-2xl">The Health wallet</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Every account gets a wallet and a permanent account number you
              can pay into. Spend Health on membership, digital cards, audio
              calls, physical bookings, and dispensary items. Referral
              cashback lands in the same wallet. Withdraw Health to a local
              Nigerian bank when you need the naira back.
            </p>
          </article>
          <article className="rounded-2xl border border-border bg-card p-6">
            <Stethoscope className="size-6 text-primary" aria-hidden />
            <h2 className="mt-4 text-2xl">A full medical campus</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Eastern Ryse is a physical ecosystem: clinical hospital, surgery
              sector, industrial pharmacy, and drug dispensary. Health Trust
              is the membership layer on top of that campus, so people can
              walk in with cover already sitting in their name.
            </p>
          </article>
        </section>

        <section className="border-t border-border bg-primary px-4 py-14 text-primary-fg">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl">Ready when you are</h2>
              <p className="mt-2 max-w-xl text-sm opacity-90">
                Create an account, fund Health, pick a tier. No hidden
                add-ons at checkout. Prices you see in Health are the prices
                you pay.
              </p>
            </div>
            <NavLink
              href="/login"
              className="inline-flex rounded-full bg-primary-fg px-5 py-3 text-sm text-primary"
            >
              Open your account
            </NavLink>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
