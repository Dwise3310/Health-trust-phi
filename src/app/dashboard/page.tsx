import { NavLink } from "@/components/nav-link";
import { TIERS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export default function DashboardHome() {
  return (
    <main className="mx-auto grid max-w-4xl gap-6">
      <div>
        <p className="text-sm text-primary">Member home</p>
        <h1 className="mt-1 text-3xl">Your Sure Health</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          This is the working desk. Fund the wallet, buy a tier, issue a
          Care Quota code, book a visit or an audio call, and keep a
          digital card on your phone instead of standing in a card queue.
        </p>
      </div>
      <section className="grid gap-3 md:grid-cols-3">
        {Object.values(TIERS).map((t) => (
          <article
            key={t.id}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <p className="text-sm text-muted">{t.short}</p>
            <h2 className="mt-1 text-xl">{t.name}</h2>
            <p className="mt-2 text-sm tabular-nums">
              {formatPrice(t.priceHealth)}
            </p>
            <NavLink
              href="/dashboard/wallet"
              className="mt-4 inline-block text-sm text-primary"
            >
              Pay from wallet
            </NavLink>
          </article>
        ))}
      </section>
      <section className="grid gap-3 md:grid-cols-2">
        <NavLink
          href="/dashboard/appointments"
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h2 className="text-xl">Book care</h2>
          <p className="mt-2 text-sm text-muted">
            Physical slot or in-app audio call. Time is priced in Health.
          </p>
        </NavLink>
        <NavLink
          href="/dashboard/codes"
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h2 className="text-xl">Share quota</h2>
          <p className="mt-2 text-sm text-muted">
            Allocate a percent to a code your family can present at the desk.
          </p>
        </NavLink>
      </section>
    </main>
  );
}
