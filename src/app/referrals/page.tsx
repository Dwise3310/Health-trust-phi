import { PublicShell } from "@/components/public-shell";
import { formatHealth } from "@/lib/utils";

export const metadata = { title: "Referrals" };

export default function ReferralsPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-primary">Earn Health</p>
        <h1 className="mt-2 text-4xl md:text-5xl">Referral cashback</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Every member gets a referral code. When someone joins with it and
          buys a tier, a percent of that purchase is credited to your
          wallet as Health. That Health is yours. Spend it in the hospital
          network or withdraw it to a Nigerian bank account.
        </p>
        <section className="mt-10 grid gap-4">
          <h2 className="text-2xl">A worked example</h2>
          <p className="text-sm leading-relaxed text-muted">
            You are on Prime. A friend buys Prime at {formatHealth(1000)}.
            Prime-to-Prime cashback is 15 percent, so {formatHealth(150)}
            lands in your wallet. No extra form. No surprise fee on the
            way in.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Cashback is not a loan and not a medical claim. It is a
            membership reward. It does not increase Care Quota for anyone.
          </p>
        </section>
      </main>
    </PublicShell>
  );
}
