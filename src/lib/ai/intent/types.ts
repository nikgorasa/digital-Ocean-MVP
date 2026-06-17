export type IntentCategory =
  | "flight_search"
  | "hotel_search"
  | "holiday_planning"
  | "booking_inquiry"
  | "booking_modification"
  | "cancellation"
  | "payment_help"
  | "loyalty_inquiry"
  | "support_general"
  | "greeting"
  | "unknown";

export interface ExtractedEntities {
  destination?: string;
  origin?: string;
  date?: string;
  dates?: { checkIn?: string; checkOut?: string };
  travelers?: number;
  budget?: string;
  bookingRef?: string;
  flightNumber?: string;
  hotelName?: string;
  airline?: string;
}

export interface IntentResult {
  intent: IntentCategory;
  confidence: number;
  entities: ExtractedEntities;
  suggestedRoute: string;
  suggestedAction: string;
  requiresAuth: boolean;
  handoffToAI: boolean;
}

export interface ConversationContext {
  userId?: string;
  userName?: string;
  userRole?: string;
  currentPage?: string;
  previousIntents: IntentCategory[];
  collectedEntities: ExtractedEntities;
  messageCount: number;
}
