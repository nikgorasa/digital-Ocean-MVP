import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, currency: string = "INR"): string {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
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
