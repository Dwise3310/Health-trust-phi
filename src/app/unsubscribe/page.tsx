import { LegalLayout } from "@/components/legal-layout";
import { HOSPITAL } from "@/lib/constants";

export const metadata = { title: "Unsubscribe" };

export default function Page() {
  return (
    <LegalLayout title="Unsubscribe from emails" kicker="Trust">
      <p>
        Membership receipts and security mail still go out. Newsletters
        and hospital updates do not. Use the unsubscribe link in the
        footer of those emails, or write {HOSPITAL.supportEmail} with the
        subject line Unsubscribe.
      </p>
      <p>
        We will not hide the link in pale grey or ask you to log in just
        to leave a mailing list.
      </p>
    </LegalLayout>
  );
}
