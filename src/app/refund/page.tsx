import { LegalLayout } from "@/components/legal-layout";

export const metadata = { title: "Refund policy" };

export default function Page() {
  return (
    <LegalLayout title="Refund policy" kicker="Trust">
      <p>
        Unused Health in your wallet can be withdrawn to a Nigerian bank,
        subject to identity checks. That is a withdrawal, not a refund.
      </p>
      <h2 className="text-xl text-fg">Membership</h2>
      <p>
        Tier purchases are for a dated plan. If you have not used Care
        Quota, a card, a call, or a physical booking, you may ask for a
        full Health credit within 7 days of purchase. After first use, we
        do not reverse the remaining months as cash.
      </p>
      <h2 className="text-xl text-fg">Cards, calls, drugs</h2>
      <p>
        Digital cards and completed audio calls are not refundable. Drugs
        that have left the dispensary are not refundable. A call that the
        clinician cancelled is credited back in Health automatically.
      </p>
      <p>
        No surprise restocking fee. If a fee ever applies, it will be
        shown before you confirm.
      </p>
    </LegalLayout>
  );
}
