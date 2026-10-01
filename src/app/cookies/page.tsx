import { LegalLayout } from "@/components/legal-layout";

export const metadata = { title: "Cookie policy" };

export default function Page() {
  return (
    <LegalLayout title="Cookie policy" kicker="Trust">
      <p>
        Essential cookies keep your session and remember light or dark
        mode plus your consent choice. They are required for the product
        to work.
      </p>
      <h2 className="text-xl text-fg">Optional</h2>
      <p>
        If you tap Accept all, we may add a privacy-respecting analytics
        cookie later to see which pages help people join. We do not run
        advertising cookies today.
      </p>
      <p>
        You can change your mind by clearing site data in the browser,
        which brings the banner back.
      </p>
    </LegalLayout>
  );
}
