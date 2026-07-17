import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  IN: "INR", AE: "AED", TH: "THB", SG: "SGD", MY: "MYR", US: "USD",
  GB: "GBP", EU: "EUR", DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR",
  JP: "JPY", KR: "KRW", AU: "AUD", NZ: "NZD", CA: "CAD", CH: "CHF",
  LK: "LKR", MV: "MVR", NP: "NPR", BD: "BDT", PK: "PKR", PH: "PHP",
  ID: "IDR", VN: "VND", HK: "HKD", TW: "TWD", CN: "CNY", SA: "SAR",
  QA: "QAR", KW: "KWD", BH: "BHD", OM: "OMR", ZA: "ZAR", EG: "EGP",
  NG: "NGN", KE: "KES", TZ: "TZS", RU: "RUB", BR: "BRL", MX: "MXN",
};

export function getCurrencyForCountry(countryCode: string): string {
  return COUNTRY_CURRENCY_MAP[countryCode] || "INR";
}

export function getLocaleForCurrency(currency: string): string {
  const localeMap: Record<string, string> = {
    INR: "en-IN", AED: "en-AE", THB: "th-TH", SGD: "en-SG", MYR: "ms-MY",
    USD: "en-US", GBP: "en-GB", EUR: "de-DE", JPY: "ja-JP", KRW: "ko-KR",
    AUD: "en-AU", NZD: "en-NZ", CAD: "en-CA", CHF: "de-CH", LKR: "si-LK",
  };
  return localeMap[currency] || "en-US";
}

export function formatCurrency(amount: number, currency: string = "INR"): string {
  const locale = getLocaleForCurrency(currency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
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
