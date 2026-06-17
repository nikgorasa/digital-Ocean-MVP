import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatTravelDates(travelDates?: string): string {
  if (!travelDates) return "N/A";
  try {
    const parsed = JSON.parse(travelDates);
    if (parsed.from && parsed.to) {
      return `${formatDate(parsed.from)} - ${formatDate(parsed.to)}`;
    }
    return travelDates;
  } catch {
    return travelDates;
  }
}
