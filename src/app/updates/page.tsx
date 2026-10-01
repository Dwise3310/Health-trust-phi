import { PublicShell } from "@/components/public-shell";

export const metadata = { title: "Updates" };

const POSTS = [
  {
    title: "Health Trust opens membership",
    kind: "Hospital",
    excerpt:
      "Base, Plus, and Prime are live as a skeleton. Hospital copy, FarmGreat partnership notes, and the official logo follow in the next content pack.",
  },
  {
    title: "What Care Quota is (and is not)",
    kind: "Education",
    excerpt:
      "Quota is a consultant-confirmed percentage on consultation and diagnosis. It is not a blank cheque for surgery, drugs, or boarding.",
  },
  {
    title: "Paying in Health",
    kind: "Wallet",
    excerpt:
      "1 Health equals 100 naira. USD display will follow the public naira-dollar rate for members who think in dollars. The unit of spend stays Health.",
  },
];

export default function UpdatesPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-primary">From the hospital</p>
        <h1 className="mt-2 text-4xl">Updates and education</h1>
        <p className="mt-3 text-sm text-muted">
          Short, factual notes. No invented outcomes. No paid testimonials
          dressed up as reviews.
        </p>
        <div className="mt-10 grid gap-4">
          {POSTS.map((p) => (
            <article
              key={p.title}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <p className="text-xs uppercase tracking-wide text-primary">
                {p.kind}
              </p>
              <h2 className="mt-2 text-2xl">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {p.excerpt}
              </p>
            </article>
          ))}
        </div>
      </main>
    </PublicShell>
  );
}
