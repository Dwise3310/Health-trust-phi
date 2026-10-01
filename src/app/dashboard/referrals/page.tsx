import { REFERRAL_PERCENT, TIERS, type TierId } from "@/lib/constants";

const ORDER: TierId[] = ["base", "plus", "prime"];

export default function ReferralDashPage() {
  return (
    <main className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="text-3xl">Your referrals</h1>
        <p className="mt-2 text-sm text-muted">
          Share your code. When the person buys a tier, cashback lands in
          Health according to the matrix. Ceiling is 15 percent.
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-card">
            <tr>
              <th className="px-4 py-3">You \ They</th>
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
                <td className="px-4 py-3">{TIERS[you].short}</td>
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
    </main>
  );
}
