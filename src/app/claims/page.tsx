import { LegalLayout } from "@/components/legal-layout";

export const metadata = { title: "How we speak" };

export default function Page() {
  return (
    <LegalLayout title="No fake reviews, no wild claims" kicker="Trust">
      <p>
        We do not publish invented five-star quotes. When member stories
        appear, they will be named, dated, and given with permission.
      </p>
      <p>
        We do not claim Health Trust cures disease, replaces emergency
        care, or is licensed insurance. Care Quota is a membership
        percentage confirmed by a clinician. Referral cashback is a
        wallet credit, not a medical outcome.
      </p>
      <p>
        If a sentence on this site overreaches, write legal and we will
        correct it in public.
      </p>
    </LegalLayout>
  );
}
