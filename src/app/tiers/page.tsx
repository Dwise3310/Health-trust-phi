import { NavLink } from "@/components/nav-link";
import { PublicShell } from "@/components/public-shell";
import { REFERRAL_PERCENT, TIERS, type TierId } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Tiers" };

const ORDER: TierId[] = ["base", "plus", "prime"];

export default function TiersPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-sm text-primary">Membership</p>
        <h1 className="mt-2 max-w-3xl text-4xl md:text-5xl">
          Sure Health Base, Plus, and Prime
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Pick the standing you want at Eastern Ryse. Higher tiers cost more
          Health, last longer, refresh more times, and are seen first.
        </p>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {Object.values(TIERS).map((t) => (
            <article
              key={t.id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"
            >
              <p className="text-sm text-muted">{t.short}</p>
              <h2 className="text-2xl">{t.name}</h2>
              <p className="text-xl tabular-nums">{formatPrice(t.priceHealth)}</p>
              <p className="text-sm text-muted">
                {t.durationMonths} months · {t.refreshes} quota refreshes ·
                queue rank {t.queue}
              </p>
              <ul className="grid gap-2 text-sm text-muted">
                {t.perks.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <NavLink
                href="/login?next=/dashboard/membership"
                className="mt-auto rounded-full bg-primary px-4 py-2 text-center text-sm text-primary-fg"
              >
                Choose {t.short}
              </NavLink>
            </article>
          ))}
        </div>

        <section className="mt-16">
          <h2 className="text-3xl">Referral cashback matrix</h2>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            When someone you invited buys a tier, you earn a percent of that
            purchase in Health. The percent depends on your tier and theirs.
            The ceiling is 15 percent, Prime to Prime.
          </p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-card">
                <tr>
                  <th className="px-4 py-3">You \ They buy</th>
                  {ORDER.map((id) => (
                    <th key={id} className="px-4 py-3">
                      {TIERS[id].short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ORDER.map((you) => (
                  <tr key={you} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{TIERS[you].short}</td>
                    {ORDER.map((they) => (
                      <td key={they} className="px-4 py-3 tabular-nums">
                        {REFERRAL_PERCENT[you][they]}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
