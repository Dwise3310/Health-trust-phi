import { LegalLayout } from "@/components/legal-layout";
import { HOSPITAL } from "@/lib/constants";

export const metadata = { title: "Business details" };

export default function Page() {
  return (
    <LegalLayout title="Business details" kicker="Sure Health">
      <p>Program: {HOSPITAL.program}</p>
      <p>Hospital: {HOSPITAL.name}</p>
      <p>Sponsor: {HOSPITAL.sponsor}</p>
      <p>Country of operation: {HOSPITAL.country}</p>
      <p>Address: {HOSPITAL.address}</p>
      <p>Care: {HOSPITAL.email}</p>
      <p>Support: {HOSPITAL.supportEmail}</p>
      <p>Privacy: {HOSPITAL.privacyEmail}</p>
      <p>Legal: {HOSPITAL.legalEmail}</p>
      <p>
        Phone placeholder: {HOSPITAL.phone}. The live switchboard number
        ships with the hospital information pack.
      </p>
      <p>
        Registration numbers, tax IDs, and the FarmGreat partnership
        filing will be published on this page as soon as they are issued.
        We will not invent them.
      </p>
    </LegalLayout>
  );
}
