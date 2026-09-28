import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function nairaFromHealth(health: number) {
  return health * 100;
}

export function formatHealth(amount: number | string) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return `${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })} Health`;
}

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}
