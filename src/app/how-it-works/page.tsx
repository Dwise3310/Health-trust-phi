import { PublicShell } from "@/components/public-shell";
import {
  COVERED_UNDER_QUOTA,
  HOSPITAL,
  NOT_COVERED_UNDER_QUOTA,
} from "@/lib/constants";

export const metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-primary">The mechanics</p>
        <h1 className="mt-2 text-4xl md:text-5xl">How Sure Health works</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Sure Health is a membership, not an insurance policy and not a
          free clinic. You buy a tier. That tier gives you a Care Quota: a
          percentage of consultation and diagnosis that {HOSPITAL.name} will
          treat as covered, for the life of the plan, refreshing every three
          months.
        </p>

        <section className="mt-12 grid gap-4">
          <h2 className="text-2xl">Care Quota, in plain words</h2>
          <p className="text-sm leading-relaxed text-muted">
            The exact percent is confirmed by the consultant on site. The
            site never invents a medical percentage for you. What you see
            here is the membership frame: Base, Plus, and Prime, each with a
            stronger standing and a longer plan. Gold-to-gold style cover
            tops out at 15 percent referral cashback between Prime members.
            Quota itself is a separate number the clinician confirms when
            you (or a code holder) present.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Quota refreshes every 3 months while the plan is active. Unused
            quota does not pile into a private insurance pool. It resets so
            the hospital can keep care available for the whole membership.
          </p>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-xl">Usually inside quota</h3>
            <ul className="mt-3 grid gap-2 text-sm text-muted">
              {COVERED_UNDER_QUOTA.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xl">Outside quota</h3>
            <ul className="mt-3 grid gap-2 text-sm text-muted">
              {NOT_COVERED_UNDER_QUOTA.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-12 grid gap-4">
          <h2 className="text-2xl">Digital cards and calls</h2>
          <p className="text-sm leading-relaxed text-muted">
            A digital appointment card is 50 Health (5,000 naira) for a
            normal card. A VIP card costs more and jumps the physical queue
            for immediate consultation. Physical bookings are time-priced:
            longer slots cost more Health. Audio calls run inside the
            product, 25 minutes or 60 minutes, paid up front from the
            wallet. The clinician sees the booking on the staff side and
            prepares.
          </p>
        </section>

        <section className="mt-12 grid gap-4">
          <h2 className="text-2xl">Sharing a code</h2>
          <p className="text-sm leading-relaxed text-muted">
            You allocate a slice of your remaining Care Quota to a code.
            The person who presents that code is treated with the queue standing of your tier.
            Debits come off the remaining percent on that
            code, then off your membership record. You can issue more than
            one code. You cannot allocate more than you have left.
          </p>
        </section>
      </main>
    </PublicShell>
  );
}
