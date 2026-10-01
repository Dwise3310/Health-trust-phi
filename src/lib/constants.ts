export const HOSPITAL = {
  name: "Eastern Ryse Specialist Hospital",
  program: "Health Trust",
  sponsor: "FarmGreat West Africa LLC",
  country: "Nigeria",
  email: "care@healthtrust.ng",
  privacyEmail: "privacy@healthtrust.ng",
  legalEmail: "legal@healthtrust.ng",
  supportEmail: "support@healthtrust.ng",
  phone: "+234 000 000 0000",
  address:
    "Eastern Ryse Specialist Hospital, Nigeria. Exact street address will be published once the hospital pack is confirmed.",
};

export const TIERS = {
  base: {
    id: "base" as const,
    name: "Health Trust Base",
    short: "Base",
    priceHealth: 250,
    durationMonths: 6,
    refreshes: 2,
    queue: 3,
    quotaHint: "Entry cover for everyday consults and diagnosis",
    perks: [
      "Care Quota on consultation and diagnosis",
      "Normal digital appointment card",
      "Member wallet and unique funding account",
      "Share a Care Quota code with family",
      "Standard waiting-room standing",
    ],
  },
  plus: {
    id: "plus" as const,
    name: "Health Trust Plus",
    short: "Plus",
    priceHealth: 500,
    durationMonths: 9,
    refreshes: 3,
    queue: 2,
    quotaHint: "Wider cover and faster reception attention",
    perks: [
      "Higher Care Quota than Base",
      "Faster queue than Base at reception",
      "Digital appointment card at member rate",
      "Audio call booking inside the app",
      "Share codes that carry Plus standing",
    ],
  },
  prime: {
    id: "prime" as const,
    name: "Health Trust Prime",
    short: "Prime",
    priceHealth: 1000,
    durationMonths: 12,
    refreshes: 4,
    queue: 1,
    quotaHint: "Highest cover, first in line, Prime lounge standing",
    perks: [
      "Highest Care Quota in the program",
      "Seen first at reception and in the waiting room",
      "Dedicated Prime seating area on site",
      "VIP digital card for immediate consultation",
      "Share codes that carry Prime standing",
    ],
  },
};

export type TierId = keyof typeof TIERS;

export const REFERRAL_PERCENT: Record<TierId, Record<TierId, number>> = {
  base: { base: 3, plus: 5, prime: 7 },
  plus: { base: 5, plus: 8, prime: 11 },
  prime: { base: 7, plus: 11, prime: 15 },
};

export const CARD_PRICE_HEALTH = 50;
export const VIP_CARD_PRICE_HEALTH = 90;

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

export const COVERED_UNDER_QUOTA = [
  "First consult with the assigned clinician",
  "Follow-up consult inside the same Care Quota window",
  "Basic diagnosis work-up the consultant confirms as covered",
  "On-site review of results tied to that consult",
];

export const NOT_COVERED_UNDER_QUOTA = [
  "Surgery and theatre time (priced separately)",
  "In-patient boarding and meals",
  "Drugs from the dispensary (pay from wallet or cash)",
  "Industrial pharmacy special orders",
  "Anything the consultant marks as outside quota on site",
];

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/tiers", label: "Tiers" },
  { href: "/referrals", label: "Referrals" },
  { href: "/updates", label: "Updates" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export const DASH_NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/wallet", label: "Wallet" },
  { href: "/dashboard/codes", label: "Care codes" },
  { href: "/dashboard/appointments", label: "Appointments" },
  { href: "/dashboard/cards", label: "Cards" },
  { href: "/dashboard/referrals", label: "Referrals" },
  { href: "/dashboard/settings", label: "Settings" },
];
