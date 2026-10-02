import { LegalLayout } from "@/components/legal-layout";
import { HOSPITAL } from "@/lib/constants";

export const metadata = { title: "Privacy policy" };

export default function Page() {
  return (
    <LegalLayout title="Privacy policy" kicker="Sure Health">
      <p>
        Last updated 29 September 2026. Sure Health, operated with{" "}
        {HOSPITAL.name} and {HOSPITAL.sponsor}, collects only what we need
        to run membership, wallets, bookings, and care records.
      </p>
      <h2 className="text-xl text-fg">What we collect</h2>
      <p>
        Account data: name, email, phone, username. Wallet data: Health
        balance, funding account number, transaction notes. Care data:
        appointments, digital cards, Care Quota codes, and staff notes
        written into your hospital folder. Technical data: session
        cookies, theme preference, cookie-consent choice.
      </p>
      <h2 className="text-xl text-fg">What we do not collect</h2>
      <p>
        We do not scrape your contacts. We do not buy marketing lists. We
        do not run hidden advertising pixels. Processors we use (when
        connected) are Supabase for auth and data, and Vercel for hosting.
      </p>
      <h2 className="text-xl text-fg">Why we hold it</h2>
      <p>
        To create your account, keep you signed in, fund and spend Health,
        book care, share codes, and let authorised hospital staff treat
        you. Legal bases: contract for membership, legitimate interest for
        security logs, and consent for optional cookies and newsletters.
      </p>
      <h2 className="text-xl text-fg">Your rights</h2>
      <p>
        You can ask for a copy, a correction, or a deletion. Write to{" "}
        {HOSPITAL.privacyEmail} or use the{" "}
        <a className="text-primary underline" href="/data-deletion">
          data deletion
        </a>{" "}
        form. We keep financial records as Nigerian tax and hospital
        regulation require.
      </p>
    </LegalLayout>
  );
}
