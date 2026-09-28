import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-shell";

export const Route = createFileRoute("/how-it-works")({ component: How });

const steps = [
  {
    n: "01",
    t: "Join a tier",
    d: "Base, Plus, or Prime. Pay in Health (1 Health = ₦100). Your wallet is created the moment you sign up, with a unique account number for funding.",
  },
  {
    n: "02",
    t: "Care Quota activates",
    d: "Cover starts at 100%. It lasts 6, 9, or 12 months depending on tier, and snaps back to 100% every three months until the plan ends.",
  },
  {
    n: "03",
    t: "Generate a code",
    d: "From your dashboard allocate a percentage to a code. Use it yourself or send it to family. No remaining quota means no code.",
  },
  {
    n: "04",
    t: "Walk into Eastern Ryse",
    d: "Reception verifies the code, prints a small slip, stamps it. The consultant confirms spendable cover, signs, then debit happens before service starts.",
  },
];

export function How() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl">How it works</h1>
        <p className="mt-4 text-muted">
          The consultant decides what a visit costs against your Care Quota. The
          site tracks percentage, not a public price list.
        </p>
        <ol className="mt-10 grid gap-8">
          {steps.map((s) => (
            <li key={s.n} className="grid gap-2 border-t border-border pt-6">
              <p className="text-xs tracking-widest text-primary">{s.n}</p>
              <h2 className="text-2xl">{s.t}</h2>
              <p className="text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 text-sm text-muted">
          Covered for now: general consultation, basic diagnosis and common lab
          tests, follow-up, treatment advice. Not covered: major surgery,
          long-term stay, expensive specialist procedures, high-cost drugs
          (paid separately).
        </div>
      </main>
    </PublicShell>
  );
}
