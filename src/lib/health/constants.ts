export const TIERS = {
  base: {
    id: "base" as const,
    name: "Health Trust Base",
    short: "Base",
    priceHealth: 250,
    durationMonths: 6,
    refreshes: 2,
    queue: 3,
  },
  plus: {
    id: "plus" as const,
    name: "Health Trust Plus",
    short: "Plus",
    priceHealth: 500,
    durationMonths: 9,
    refreshes: 3,
    queue: 2,
  },
  prime: {
    id: "prime" as const,
    name: "Health Trust Prime",
    short: "Prime",
    priceHealth: 1000,
    durationMonths: 12,
    refreshes: 4,
    queue: 1,
  },
};

export type TierId = keyof typeof TIERS;

export const REFERRAL_PERCENT: Record<TierId, Record<TierId, number>> = {
  base: { base: 3, plus: 5, prime: 7 },
  plus: { base: 5, plus: 8, prime: 11 },
  prime: { base: 7, plus: 11, prime: 15 },
};

export const CARD_PRICE_HEALTH = 50;
export const CALL_PRICES = [
  { minutes: 25, health: 50 },
  { minutes: 60, health: 110 },
];
export const PHYSICAL_PRICES = [
  { minutes: 30, health: 40 },
  { minutes: 60, health: 80 },
  { minutes: 90, health: 110 },
];

export const HEALTH_TO_NAIRA = 100;
