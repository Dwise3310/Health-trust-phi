import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { HEALTH_TO_NAIRA } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function nairaFromHealth(health: number) {
  return health * HEALTH_TO_NAIRA;
}

export function formatNaira(naira: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(naira);
}

export function formatHealth(health: number) {
  return `${health.toLocaleString("en-NG")} Health`;
}

export function formatPrice(health: number) {
  return `${formatHealth(health)} (${formatNaira(nairaFromHealth(health))})`;
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
