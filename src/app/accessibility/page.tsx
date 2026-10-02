import { LegalLayout } from "@/components/legal-layout";
import { HOSPITAL } from "@/lib/constants";

export const metadata = { title: "Accessibility" };

export default function Page() {
  return (
    <LegalLayout title="Accessibility" kicker="Sure Health">
      <p>
        We aim for WCAG 2.2 AA on public pages: keyboard paths, visible
        focus, contrast that holds in light and dark, labels on form
        fields, and alt text on meaningful images.
      </p>
      <p>
        Decorative loaders are marked aria-hidden. The heartbeat overlay
        uses a live status so screen readers hear Loading and then
        silence when the page answers.
      </p>
      <p>
        If something blocks you, write {HOSPITAL.supportEmail} with the
        page URL and the assistive tool you use. We treat that as a
        defect, not a suggestion box.
      </p>
    </LegalLayout>
  );
}
