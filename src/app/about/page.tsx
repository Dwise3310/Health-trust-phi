import { PublicShell } from "@/components/public-shell";
import { HOSPITAL } from "@/lib/constants";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-primary">Who we are</p>
        <h1 className="mt-2 text-4xl md:text-5xl">
          Treatment that people can actually reach
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          {HOSPITAL.program} sits on {HOSPITAL.name} in {HOSPITAL.country},
          sponsored by {HOSPITAL.sponsor}. The hospital is a physical
          medical ecosystem: clinical wards, a surgery sector, an
          industrial pharmacy, and a drug dispensary.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          We are doing this so consultation is not a luxury product. A
          member walks in already known, already covered for the consult
          and diagnosis the consultant confirms, and already able to pay
          the rest from a wallet in their own name. Healthier lives. More
          room to stay on their feet financially.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Partnership notes with FarmGreat, full hospital copy, and the
          official logo land in a later content drop. Until then this page
          tells the honest skeleton: membership, Care Quota, Health as
          the unit of account, and a real hospital behind it.
        </p>
      </main>
    </PublicShell>
  );
}
