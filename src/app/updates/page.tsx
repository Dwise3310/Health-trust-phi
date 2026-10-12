import { PublicShell } from "@/components/public-shell";

export const metadata = { title: "Updates" };

const POSTS = [
  {
    date: "October 2026",
    kind: "Hospital",
    title: "Sure Health opens membership",
    excerpt:
      "Base, Plus, and Prime are open as a working skeleton. The hospital copy, the FarmGreat partnership notes, and the official logo will follow once that pack is confirmed.",
  },
  {
    date: "October 2026",
    kind: "Education",
    title: "What Care Quota is, and what it is not",
    excerpt:
      "Quota is a consultant-confirmed percentage on consultation and diagnosis. It is not a blank cheque for surgery, drugs, or boarding. The desk records what was used.",
  },
  {
    date: "October 2026",
    kind: "Wallet",
    title: "Paying in Health",
    excerpt:
      "1 Health equals 100 naira. A dollar figure can sit beside it using the public naira rate. The unit you spend is still Health.",
  },
  {
    date: "October 2026",
    kind: "Desk",
    title: "How a visit is confirmed",
    excerpt:
      "Book on your phone, then reception confirms the time. Prime is called before Plus, and Plus before Base, when two people are waiting.",
  },
  {
    date: "October 2026",
    kind: "Pharmacy",
    title: "Pickup or delivery",
    excerpt:
      "Pay for a dispensary item from your wallet, then choose pickup at the hospital or delivery to an address. The pharmacy page shows each step, including a waybill when a courier is used.",
  },
];

export default function UpdatesPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">From the hospital</p>
        <h1 className="mt-2 max-w-xl text-4xl leading-tight">Updates and education</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Short notes from Eastern Ryse. No invented outcomes, and no paid lines dressed up as reviews.
        </p>
        <div className="mt-8">
          {POSTS.map((post) => (
            <article
              key={post.title}
              className="grid gap-2 border-b border-border py-8 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-start sm:gap-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {post.kind}
                <span className="mt-1 block font-normal normal-case tracking-normal text-muted">{post.date}</span>
              </p>
              <div className="min-w-0">
                <h2 className="text-left text-2xl leading-snug">{post.title}</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{post.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </main>
    </PublicShell>
  );
}
