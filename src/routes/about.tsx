import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-shell";

export const Route = createFileRoute("/about")({ component: About });

function About() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-primary">Who we are</p>
        <h1 className="mt-2 text-4xl">Health Trust</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">
          Health is not easily accessible. People reach for what they can afford
          and lose quality. Many end up with self-medication. Effective, fast
          medical care is rare. Health Trust exists to reverse that.
        </p>
        <p className="mt-4 leading-relaxed text-muted">
          The heard name is Health Trust. The sponsor is FarmGreat West Africa
          LLC. Care is delivered through Eastern Ryse Specialist Hospital, a
          physical medical ecosystem in Nigeria: clinical hospital, industrial
          pharmacy, surgery, and drug dispensary.
        </p>
        <p className="mt-4 leading-relaxed text-muted">
          If you register, you become a VIP patient. Baby medical concerns,
          consultation, and diagnosis sit inside your Care Quota. Refer someone
          and you earn a share of what they pay, based on both of your tiers.
          The aim is health and wealth.
        </p>
        <div className="mt-10 grid gap-4 border-t border-border pt-8">
          <h2 className="text-2xl">Partnership</h2>
          <p className="text-muted">
            FarmGreat is the marketing company hosting this programme. Eastern
            Ryse Specialist Hospital is the care home. Full hospital details and
            partnership copy arrive with the next content drop. The skeleton
            here is already the product.
          </p>
        </div>
      </main>
    </PublicShell>
  );
}
