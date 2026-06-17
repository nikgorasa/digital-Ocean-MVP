export interface PricingContext {
  category: "HOTEL" | "FLIGHT" | "PACKAGE";
  destination?: string;
  hotelName?: string;
  airlineCode?: string;
  roomType?: string;
}

export interface PricingResult {
  baseRate: number;
  markupAmount: number;
  displayedPrice: number;
  originalPrice: number;
  appliedRuleName: string | null;
  currency: string;
}

export interface PromoValidation {
  valid: boolean;
  discountAmount: number;
  finalPrice: number;
  error?: string;
}

export interface CorporateDiscount {
  discountAmount: number;
  finalPrice: number;
  ruleName: string | null;
}

export interface TaxBreakdown {
  rate: number;
  amount: number;
  label: string;
}

export interface PriceBreakdown {
  baseRate: number;
  markupAmount: number;
  displayedPrice: number;
  originalPrice: number;
  promoDiscount: number;
  corporateDiscount: number;
  subtotal: number;
  tax: TaxBreakdown;
  total: number;
  appliedRuleName: string | null;
  promoCode: string | null;
  corporateRuleName: string | null;
}
