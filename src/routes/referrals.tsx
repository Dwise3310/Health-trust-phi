import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-shell";
import { REFERRAL_PERCENT, TIERS } from "@/lib/health/constants";

export const Route = createFileRoute("/referrals")({ component: Referrals });

function Referrals() {
  const ids = Object.keys(TIERS) as Array<keyof typeof TIERS>;
  return (
    <PublicShell>
      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl">Referral earnings</h1>
        <p className="mt-3 text-muted">
          The percentage you earn depends on your tier and the tier your referral
          joins. Prime referring Prime is the ceiling at 15% of what they pay.
        </p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-3 pr-4">Referrer \ Referred</th>
                {ids.map((id) => (
                  <th key={id} className="py-3 pr-4">
                    {TIERS[id].short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ids.map((from) => (
                <tr key={from} className="border-b border-border">
                  <td className="py-3 pr-4 font-medium">{TIERS[from].short}</td>
                  {ids.map((to) => (
                    <td key={to} className="py-3 pr-4 tabular-nums">
                      {REFERRAL_PERCENT[from][to]}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </PublicShell>
  );
}
