import { LegalLayout } from "@/components/legal-layout";

export const metadata = { title: "Age and children's data" };

export default function Page() {
  return (
    <LegalLayout title="Age and children's data" kicker="Sure Health">
      <p>
        Sure Health accounts are for people 18 and older. A parent or
        guardian may create an account and then issue a Care Quota code
        for a child who needs treatment.
      </p>
      <p>
        We do not knowingly collect an independent login for a child. If you
        believe a child opened an account alone, write to privacy and we
        will close it and delete the login, keeping only what the
        hospital is legally required to retain from an actual visit.
      </p>
    </LegalLayout>
  );
}
