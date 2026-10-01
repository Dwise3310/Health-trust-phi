import { LegalLayout } from "@/components/legal-layout";
import {
  CALL_PRICES,
  CARD_PRICE_HEALTH,
  PHYSICAL_PRICES,
  TIERS,
  VIP_CARD_PRICE_HEALTH,
} from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Fees" };

export default function Page() {
  return (
    <LegalLayout title="Prices, with nothing hidden" kicker="Trust">
      <p>
        Every Health price below is also 100 naira per Health. If a
        payment provider later charges a bank fee, that fee will be shown
        on the confirm screen before you pay.
      </p>
      <p>Health Trust Base: {formatPrice(TIERS.base.priceHealth)}</p>
      <p>Health Trust Plus: {formatPrice(TIERS.plus.priceHealth)}</p>
      <p>Health Trust Prime: {formatPrice(TIERS.prime.priceHealth)}</p>
      <p>Normal digital card: {formatPrice(CARD_PRICE_HEALTH)}</p>
      <p>VIP digital card: {formatPrice(VIP_CARD_PRICE_HEALTH)}</p>
      {CALL_PRICES.map((c) => (
        <p key={c.minutes}>
          Audio call {c.minutes} min: {formatPrice(c.health)}
        </p>
      ))}
      {PHYSICAL_PRICES.map((c) => (
        <p key={c.minutes}>
          Physical booking {c.minutes} min: {formatPrice(c.health)}
        </p>
      ))}
    </LegalLayout>
  );
}
