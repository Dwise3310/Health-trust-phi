import { LegalLayout } from "@/components/legal-layout";
import { HOSPITAL } from "@/lib/constants";

export const metadata = { title: "Terms of service" };

export default function Page() {
  return (
    <LegalLayout title="Terms of service" kicker="Sure Health">
      <p>
        By creating an account you join {HOSPITAL.program} at{" "}
        {HOSPITAL.name}. Membership is a paid plan. It is not a licensed
        insurance policy and it is not a promise of unlimited treatment.
      </p>
      <h2 className="text-xl text-fg">Care Quota</h2>
      <p>
        The consultant confirms what sits inside quota on site. Surgery,
        boarding, and drugs are outside quota unless a clinician writes
        otherwise in your folder. Shared codes spend remaining percent from the generator.
      </p>
      <h2 className="text-xl text-fg">Health</h2>
      <p>
        1 Health equals 100 naira. Wallet credits from funding, cashback,
        or refunds can be spent in the network or withdrawn to a local
        bank. Conversion to other currencies is display only.
      </p>
      <h2 className="text-xl text-fg">Conduct</h2>
      <p>
        Do not share login details. Do not sell Care Quota codes. Do not
        present another membership as your own. Staff may freeze
        an account that is used to defraud the hospital.
      </p>
      <h2 className="text-xl text-fg">Changes</h2>
      <p>
        Prices, quota rules, and these terms can change. Material changes
        will be posted on Updates and, where we have an email, sent to
        you. Continued use after the notice date means you accept the new
        terms.
      </p>
    </LegalLayout>
  );
}
