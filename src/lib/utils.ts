import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGBP(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
}

export const formatVatPercent = (rate?: number | null) => {
  const r = Number(rate ?? 0);
  if (!Number.isFinite(r) || r <= 0) return "0%";
  return `${Math.round(r * 100)}%`;
};
