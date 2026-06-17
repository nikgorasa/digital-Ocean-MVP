import { UnifiedIntent, UnifiedIntentResult, INTENT_ROUTE_MAP } from "./intentTypes";
export type { UnifiedIntentResult } from "./intentTypes";

const INTENT_PATTERNS: Array<{
  intent: UnifiedIntent;
  patterns: RegExp[];
  confidence: number;
}> = [
  // Greeting
  { intent: "greeting", patterns: [/^hi$/i, /^hello$/i, /^hey$/i, /^namaste$/i, /^good morning/i, /^good evening/i], confidence: 1.0 },

  // Flight
  { intent: "flight_search", patterns: [/fly|flight|plane|airline|airport|airfare|air ticket/i], confidence: 0.9 },
  { intent: "flight_search", patterns: [/search.*flight|find.*flight|book.*flight/i], confidence: 0.95 },

  // Hotel
  { intent: "hotel_search", patterns: [/hotel|room|resort|stay|accommodation|lodge|villa/i], confidence: 0.9 },
  { intent: "hotel_search", patterns: [/search.*hotel|find.*hotel|book.*hotel/i], confidence: 0.95 },

  // Holiday
  { intent: "holiday_planning", patterns: [/plan.*trip|plan.*holiday|create.*itinerary|custom.*trip|personalized.*trip/i], confidence: 0.95 },
  { intent: "holiday_planning", patterns: [/holiday|vacation|trip|tour|getaway|planner/i], confidence: 0.85 },
  { intent: "holiday_packages", patterns: [/package|all.*inclusive|tour.*package|travel.*package/i], confidence: 0.85 },

  // Bookings
  { intent: "booking_inquiry", patterns: [/my.*booking|my.*trip|view.*booking|pnr|reference.*number|booking.*status/i], confidence: 0.9 },
  { intent: "booking_modification", patterns: [/modify.*booking|change.*booking|update.*booking|reschedule/i], confidence: 0.9 },
  { intent: "cancellation", patterns: [/cancel|cancellation|refund|money.*back/i], confidence: 0.9 },

  // Payment
  { intent: "payment_help", patterns: [/payment|pay|bill|invoice|receipt|failed.*payment|wallet/i], confidence: 0.85 },

  // Loyalty
  { intent: "loyalty_inquiry", patterns: [/loyalty|points|reward|tier|membership|earn.*point/i], confidence: 0.9 },

  // Support
  { intent: "support_general", patterns: [/help|support|issue|problem|not.*working|error|bug|complaint/i], confidence: 0.8 },

  // Escalation
  { intent: "escalation", patterns: [/talk.*to.*human|talk.*to.*agent|speak.*to|connect.*me|real.*person/i], confidence: 0.95 },
  { intent: "escalation", patterns: [/frustrated|angry|unhappy|terrible|worst|annoyed/i], confidence: 0.9 },
];

export function classifyIntent(message: string): UnifiedIntentResult {
  const normalized = message.toLowerCase().trim();

  // Check each pattern
  for (const { intent, patterns, confidence } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        const routeInfo = INTENT_ROUTE_MAP[intent];
        return {
          intent,
          confidence,
          entities: extractEntities(normalized),
          route: routeInfo.route,
          label: routeInfo.label,
          requiresAuth: routeInfo.requiresAuth,
          escalateToHuman: routeInfo.escalateToHuman,
          handoffToPlanner: routeInfo.handoffToPlanner,
        };
      }
    }
  }

  // Default
  return {
    intent: "unknown",
    confidence: 0.3,
    entities: {},
    route: "",
    label: "How can I help?",
    requiresAuth: false,
    escalateToHuman: false,
    handoffToPlanner: false,
  };
}

function extractEntities(text: string): UnifiedIntentResult["entities"] {
  const entities: UnifiedIntentResult["entities"] = {};

  // Destination
  const destinations = ["goa", "kerala", "maldives", "manali", "rajasthan", "delhi", "mumbai", "bangalore", "chennai"];
  for (const dest of destinations) {
    if (text.includes(dest)) {
      entities.destination = dest.charAt(0).toUpperCase() + dest.slice(1);
      break;
    }
  }

  // Travelers
  const travelerMatch = text.match(/(\d+)\s*(traveler|passenger|person|people|adult)/);
  if (travelerMatch) {
    entities.travelers = parseInt(travelerMatch[1]);
  }

  // Date
  const datePatterns = [/tomorrow|next week|next month|this weekend/i, /(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i];
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      entities.date = match[0];
      break;
    }
  }

  // Budget
  if (/budget|cheap|affordable/i.test(text)) entities.budget = "budget";
  else if (/luxury|premium|expensive/i.test(text)) entities.budget = "luxury";

  // Booking ref
  const pnrMatch = text.match(/pnr\s*[:\s]*([a-z0-9]{6})/i);
  if (pnrMatch) entities.bookingRef = pnrMatch[1].toUpperCase();

  return entities;
}

export function shouldEscalate(message: string, conversationLength: number): boolean {
  const normalized = message.toLowerCase();

  if (/talk.*to.*(human|agent|person)|connect.*me|speak.*to/i.test(normalized)) return true;
  if (/frustrated|angry|unhappy|terrible|worst|annoyed|disappointed/i.test(normalized)) return true;
  if (conversationLength > 5) return true;

  return false;
}
