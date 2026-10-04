import { PublicShell } from "@/components/public-shell";

export const metadata = { title: "Roadmap" };

const NOW = [
  {
    title: "Public hospital site",
    body: "Landing, why we are here, utilities, tiers, referrals, legal pages, light and dark mode, heartbeat loader.",
    when: "Live",
  },
  {
    title: "Member accounts",
    body: "Email sign up, verify, sign in, 5 day session. Profile, photo, username lock.",
    when: "Live",
  },
  {
    title: "Wallet and Care Quota desk",
    body: "SH funding number, Health balance, NGN/USD/EUR view, family codes, history, test credit.",
    when: "Live after SQL part 5",
  },
  {
    title: "Membership purchase",
    body: "Pay Base, Plus, or Prime from the wallet. More → Membership.",
    when: "Live after SQL part 5",
  },
  {
    title: "Visit and pharmacy templates",
    body: "Physical and audio booking, digital cards, dispensary shelves as templates.",
    when: "Live after SQL part 5",
  },
];

const NEXT = [
  {
    title: "SQL part 5 (grants and money functions)",
    body: "Stops permission denied. Unlocks referral code, test Health, plan pay, withdraw. You run one file. About 2 minutes.",
    when: "Today",
  },
  {
    title: "Super admin and staff desk",
    body: "Create roles, attach permissions, invite staff, patient folders, verify and debit Care Quota, reception queue, audit log.",
    when: "Next build, about 3 to 5 days",
  },
  {
    title: "Google sign in",
    body: "Button is on the form. Wire hospital Google Cloud keys in Supabase Auth.",
    when: "1 day once keys exist",
  },
];

const LATER = [
  {
    title: "Naira rail into Health",
    body: "Paystack or Flutterwave. Permanent virtual account that actually receives naira. Test credit goes away.",
    when: "About 1 to 2 weeks after provider keys",
  },
  {
    title: "Withdraw to Nigerian banks",
    body: "Form is live. Payouts wait for the same provider plus a staff approve step.",
    when: "Same window as the naira rail",
  },
  {
    title: "In-app audio call",
    body: "Booking is live. The actual internet call (no WhatsApp) needs a media vendor.",
    when: "About 1 week after vendor pick",
  },
  {
    title: "Real pharmacy catalog",
    body: "Swap template SKUs for Eastern Ryse stock, photos, and prices.",
    when: "When the hospital pack arrives",
  },
  {
    title: "Logo, address, FarmGreat story",
    body: "Front page copy and mark from the hospital, not placeholders.",
    when: "When that pack lands",
  },
];

function Block({
  kicker,
  items,
}: {
  kicker: string;
  items: { title: string; body: string; when: string }[];
}) {
  return (
    <section className="mt-12">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {kicker}
      </p>
      <ul className="mt-4 grid gap-3">
        {items.map((item) => (
          <li
            key={item.title}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl">{item.title}</h2>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {item.when}
              </p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function RoadmapPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-primary">Build log</p>
        <h1 className="mt-2 text-4xl md:text-5xl">Where Sure Health stands</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Honest map of what members can already do, what is blocked on one SQL
          file, and what still needs hospital keys or a staff desk. Dates are
          working estimates, not contracts.
        </p>

        <Block kicker="Already in the product" items={NOW} />
        <Block kicker="Immediate" items={NEXT} />
        <Block kicker="After keys and the hospital pack" items={LATER} />

        <section className="mt-12 rounded-2xl border border-border bg-card p-5 text-sm leading-relaxed text-muted">
          <h2 className="text-xl text-fg">How to read this</h2>
          <p className="mt-3">
            Members live on the member desk. Staff will live on a separate
            locked door. Money movement that hits a real bank waits for a
            Nigerian payment provider. Care Quota percent on a live consult is
            still confirmed by the clinician on site. The numbers in Base,
            Plus, and Prime are the membership skeleton so the desk can be used
            while that clinical rule is written.
          </p>
        </section>
      </main>
    </PublicShell>
  );
}
