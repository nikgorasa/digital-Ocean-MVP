export type FareType = "Value" | "Promo" | "Classic" | "Flex" | "Corporate" | "Unknown";

export interface ParsedFareInclusions {
  baggageIncluded: boolean;
  cabinBaggageIncluded: boolean;
  mealsIncluded: boolean;
  loungeIncluded: boolean;
  freeReissue: boolean;
  freeCancellation: boolean;
  refundable: boolean;
  seatSelection: boolean;
  priorityCheckin: boolean;
  rawInclusions: string[];
}

export function parseFareType(airlineRemark: string | undefined): FareType {
  if (!airlineRemark) return "Unknown";
  const remark = airlineRemark.toLowerCase();
  if (remark.includes("promo")) return "Promo";
  if (remark.includes("corporate")) return "Corporate";
  if (remark.includes("flex")) return "Flex";
  if (remark.includes("classic")) return "Classic";
  if (remark.includes("value")) return "Value";
  return "Unknown";
}

export function parseFareInclusions(inclusions: string[] | undefined): ParsedFareInclusions {
  const raw = inclusions || [];
  const text = raw.join(" | ").toLowerCase();

  return {
    baggageIncluded: text.includes("check-in baggage included") || text.includes("baggage"),
    cabinBaggageIncluded: text.includes("cabin baggage included") || text.includes("hand baggage"),
    mealsIncluded: text.includes("meal:included") || text.includes("meal - included"),
    loungeIncluded: text.includes("lounge pass - included") || text.includes("lounge:included"),
    freeReissue: text.includes("reissue fees free") || text.includes("reissue free"),
    freeCancellation: text.includes("cancellation fees apply") === false && text.includes("non-refundable") === false,
    refundable: !text.includes("non-refundable") && !text.includes("non-voidable"),
    seatSelection: text.includes("seat - included") || text.includes("seats are chargeable") === false,
    priorityCheckin: text.includes("priority checkin - included") || text.includes("priority check-in:included"),
    rawInclusions: raw,
  };
}

export function hasFeature(inclusions: string[] | undefined, feature: string): boolean {
  if (!inclusions) return false;
  const text = inclusions.join(" | ").toLowerCase();
  return text.includes(feature.toLowerCase());
}

export function getFareTypeColor(fareType: FareType): string {
  switch (fareType) {
    case "Value": return "bg-violet-100 text-violet-700";
    case "Promo": return "bg-orange-100 text-orange-700";
    case "Classic": return "bg-blue-100 text-blue-700";
    case "Flex": return "bg-emerald-100 text-emerald-700";
    case "Corporate": return "bg-slate-100 text-slate-700";
    default: return "bg-slate-100 text-slate-500";
  }
}

export function getFareTypeBgColor(fareType: FareType): string {
  switch (fareType) {
    case "Value": return "#8b5cf6";
    case "Promo": return "#f97316";
    case "Classic": return "#3b82f6";
    case "Flex": return "#10b981";
    case "Corporate": return "#64748b";
    default: return "#94a3b8";
  }
}

export function formatFareType(fareType: FareType): string {
  switch (fareType) {
    case "Value": return "Value";
    case "Promo": return "Promo";
    case "Classic": return "Classic";
    case "Flex": return "Flex";
    case "Corporate": return "Corporate";
    default: return "Standard";
  }
}
