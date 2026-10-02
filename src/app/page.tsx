import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  HeartPulse,
  MessageCircle,
  Phone,
  Pill,
  Shield,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react";
import { NavLink } from "@/components/nav-link";
import { PublicShell } from "@/components/public-shell";
import { HOSPITAL, TIERS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

const UTILITIES = [
  {
    icon: HeartPulse,
    title: "Care Quota",
    body: "Consultation and diagnosis sit inside a percentage the consultant confirms on site. It refreshes every three months while your plan is alive.",
  },
  {
    icon: Stethoscope,
    title: "Book a visit",
    body: "Physical slots are time-priced in Health. Longer consults cost more. Prime is seen first at reception.",
  },
  {
    icon: Phone,
    title: "Audio consult",
    body: "Call the clinician inside the product. Pick 25 or 60 minutes, pay from the wallet, and skip WhatsApp hops.",
  },
  {
    icon: Pill,
    title: "Pharmacy and drugs",
    body: "Order from the industrial pharmacy and the dispensary. Pay with Health. Drugs sit outside Care Quota unless a clinician writes otherwise.",
  },
  {
    icon: Shield,
    title: "Digital appointment card",
    body: "Skip the card queue. A normal card holds your place. A VIP card is for immediate consultation.",
  },
  {
    icon: Wallet,
    title: "Health wallet",
    body: "Every account gets a wallet and a permanent account number. 1 Health equals 100 naira. Cashback lands here. Withdraw to a Nigerian bank.",
  },
  {
    icon: Users,
    title: "Share cover",
    body: "Issue a Care Quota code so family can walk into Eastern Ryse on your standing. You cannot allocate more than you have left.",
  },
  {
    icon: BookOpen,
    title: "Updates and education",
    body: "Hospital notes, case explainers, and public health posts. Factual, dated, no invented reviews.",
  },
  {
    icon: MessageCircle,
    title: "Enquiries",
    body: "Ask the desk a question or report a non-emergency medical case. Emergencies still go to local services first.",
  },
];

export default function HomePage() {
  return (
    <PublicShell>
      <main>
        <section className="relative overflow-hidden">
          <Image
            src="/medical/lobby.jpg"
            alt="Eastern Ryse hospital lobby in warm morning light"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--bg)_78%,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
            <p className="rise text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Why we are here
            </p>
            <h1 className="rise-2 mt-4 max-w-3xl text-4xl leading-[1.12] md:text-6xl">
              Treatment should reach you before the bill does.
            </h1>
            <p className="rise-3 mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              {HOSPITAL.program} sits on {HOSPITAL.name}. We built a membership
              so consultation is not a luxury product, so a family can walk in
              already known, and so a healthier life can also be a wealthier one.
              Sponsored by {HOSPITAL.sponsor}.
            </p>
            <div className="rise-4 mt-8 flex flex-wrap gap-3">
              <NavLink
                href="/login"
                className="btn-press inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[0.95rem] font-semibold text-primary-fg"
              >
                Open an account <ArrowRight className="size-4" />
              </NavLink>
              <NavLink
                href="/how-it-works"
                className="btn-press inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-6 py-3 text-sm"
              >
                Read the Care Quota
              </NavLink>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            What you can do here
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl md:text-4xl">
            A hospital desk in your pocket, not only a price list
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Care Quota is the flagship. Around it sit the daily tools: booking,
            pharmacy, cards, calls, wallet, family codes, and hospital updates.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {UTILITIES.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <item.icon className="size-5 text-primary" aria-hidden />
                <h3 className="mt-3 text-xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Image
                src="/medical/still-life.jpg"
                alt="Stethoscope and medicine bottles on cream linen"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Care Quota
              </p>
              <h2 className="mt-2 text-3xl md:text-4xl">
                Cover for the consult, not a blank cheque
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                The clinician confirms the percentage on site. Surgery, boarding,
                and dispensary drugs sit outside unless written into your folder.
                Share a code and family is treated with your queue standing.
              </p>
              <NavLink
                href="/how-it-works"
                className="btn-press mt-6 inline-flex rounded-full border border-border px-5 py-2.5 text-sm"
              >
                How quota works
              </NavLink>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Campus
            </p>
            <h2 className="mt-2 text-3xl">Clinical, surgery, pharmacy, dispensary</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Eastern Ryse is a physical medical ecosystem. Sure Health is the
              membership layer on top, so people arrive with cover and a wallet
              already in their name.
            </p>
          </div>
          <div className="relative order-1 aspect-[16/10] overflow-hidden rounded-2xl md:order-2">
            <Image
              src="/medical/corridor.jpg"
              alt="Quiet hospital corridor with cream walls"
              fill
              className="object-cover"
            />
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Membership
                </p>
                <h2 className="mt-2 text-3xl">Base, Plus, Prime</h2>
                <p className="mt-2 max-w-xl text-sm text-muted">
                  Standing and duration change with the tier. Full prices live on
                  the tiers page. Nothing extra is added at checkout.
                </p>
              </div>
              <NavLink href="/tiers" className="text-sm font-semibold text-primary">
                Compare in full
              </NavLink>
            </div>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {Object.values(TIERS).map((t) => (
                <article
                  key={t.id}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <p className="text-sm text-muted">{t.short}</p>
                  <h3 className="mt-1 text-xl">{t.name}</h3>
                  <p className="mt-2 text-sm tabular-nums">
                    {formatPrice(t.priceHealth)} · {t.durationMonths} months
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-primary px-4 py-14 text-primary-fg">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl">Ready when you are</h2>
              <p className="mt-2 max-w-xl text-sm opacity-90">
                Create an account, fund Health, use the desk. No hidden add-ons.
              </p>
            </div>
            <NavLink
              href="/login"
              className="btn-press inline-flex rounded-full bg-primary-fg px-6 py-3 text-sm font-semibold text-primary"
            >
              Open your account
            </NavLink>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
