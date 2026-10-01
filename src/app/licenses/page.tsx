import { LegalLayout } from "@/components/legal-layout";

export const metadata = { title: "Licenses" };

export default function Page() {
  return (
    <LegalLayout title="Licenses for fonts and images" kicker="Trust">
      <p>
        Type: Outfit and Fraunces, served by next/font from Google Fonts,
        under the SIL Open Font License.
      </p>
      <p>
        Icons: Lucide, ISC license. Heartbeat loader is original line
        work drawn for Health Trust. It is not a stock medical device
        mark and it is not a clinical reading.
      </p>
      <p>
        Hospital photography and the official logo will be added under
        the hospital licence when that pack arrives. Until then we
        do not use random stock faces or fabricated patient photos.
      </p>
    </LegalLayout>
  );
}
