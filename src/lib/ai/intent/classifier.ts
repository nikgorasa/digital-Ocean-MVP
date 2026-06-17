import { IntentCategory, ExtractedEntities, IntentResult, ConversationContext } from "./types";

const INTENT_KEYWORDS: Record<IntentCategory, string[]> = {
  flight_search: [
    "flight", "fly", "airline", "airport", "boarding", "departure", "arrival",
    "take off", "land", "airfare", "plane", "indigo", "spicejet", "air india",
    "vistara", "go first", "from", "to", "one way", "round trip", "return",
  ],
  hotel_search: [
    "hotel", "room", "resort", "stay", "accommodation", "check in", "check out",
    "book a room", "lodge", "guesthouse", "villa", "homestay", "apartment",
  ],
  holiday_planning: [
    "holiday", "vacation", "trip", "travel", "tour", "itinerary", "package",
    "getaway", "escape", "explore", "visit", "destination", "plan my",
    "dream holiday", "where should i go",
  ],
  booking_inquiry: [
    "my booking", "my trip", "booking status", "where is my", "confirm",
    "itinerary", "details", "show me my", "view booking", "pnr", "reference",
  ],
  booking_modification: [
    "change", "modify", "update", "reschedule", "change date", "change hotel",
    "add passenger", "remove passenger", "upgrade", "downgrade",
  ],
  cancellation: [
    "cancel", "cancellation", "refund", "money back", "void", "delete booking",
  ],
  payment_help: [
    "payment", "pay", "bill", "invoice", "receipt", "failed payment", "refund",
    "wallet", "upi", "card", "emi",
  ],
  loyalty_inquiry: [
    "loyalty", "points", "rewards", "redeem", "tier", "membership", "gold",
    "platinum", "silver", "earn points", "balance",
  ],
  support_general: [
    "help", "support", "issue", "problem", "not working", "error", "bug",
    "complaint", "agent", "human", "talk to someone", "call me",
  ],
  greeting: [
    "hello", "hi", "hey", "namaste", "good morning", "good evening",
    "how are you", "what can you do",
  ],
  unknown: [],
};

export function classifyIntentLocal(message: string): IntentCategory {
  const lower = message.toLowerCase().trim();
  const words = lower.split(/\s+/);

  const scores: Record<IntentCategory, number> = {
    flight_search: 0,
    hotel_search: 0,
    holiday_planning: 0,
    booking_inquiry: 0,
    booking_modification: 0,
    cancellation: 0,
    payment_help: 0,
    loyalty_inquiry: 0,
    support_general: 0,
    greeting: 0,
    unknown: 0,
  };

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        scores[intent as IntentCategory] += keyword.split(" ").length;
      }
    }
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return "unknown";

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  return sorted[0][0] as IntentCategory;
}

export function extractEntitiesLocal(message: string): ExtractedEntities {
  const lower = message.toLowerCase();
  const entities: ExtractedEntities = {};

  const destinations = [
    "goa", "kerala", "maldives", "manali", "rajasthan", "delhi", "mumbai",
    "bangalore", "chennai", "kolkata", "jaipur", "udaipur", "ladakh",
    "himachal", "andaman", "dubai", "singapore", "bali", "thailand",
  ];

  for (const dest of destinations) {
    if (lower.includes(dest)) {
      entities.destination = dest.charAt(0).toUpperCase() + dest.slice(1);
      break;
    }
  }

  const datePatterns = [
    /(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*/i,
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{1,2})/i,
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
    /tomorrow|next week|next month|this weekend/i,
  ];

  for (const pattern of datePatterns) {
    const match = lower.match(pattern);
    if (match) {
      entities.date = match[0];
      break;
    }
  }

  const travelerMatch = lower.match(/(\d+)\s*(traveler|passenger|person|people|adult|guest)/);
  if (travelerMatch) {
    entities.travelers = parseInt(travelerMatch[1]);
  }

  if (lower.includes("solo") || lower.includes("myself")) {
    entities.travelers = 1;
  } else if (lower.includes("couple") || lower.includes("two")) {
    entities.travelers = 2;
  } else if (lower.includes("family")) {
    entities.travelers = 3;
  }

  const budgetMatch = lower.match(/budget|cheap|affordable|luxury|premium|expensive|under\s*(\d+)/);
  if (budgetMatch) {
    if (lower.includes("cheap") || lower.includes("budget") || lower.includes("affordable")) {
      entities.budget = "budget";
    } else if (lower.includes("luxury") || lower.includes("premium")) {
      entities.budget = "luxury";
    } else if (budgetMatch[1]) {
      entities.budget = budgetMatch[1];
    }
  }

  const pnrMatch = lower.match(/pnr\s*[:\s]*([a-z0-9]{6})/);
  if (pnrMatch) {
    entities.bookingRef = pnrMatch[1].toUpperCase();
  }

  return entities;
}

const ROUTE_MAP: Record<IntentCategory, { route: string; action: string; auth: boolean; handoff: boolean }> = {
  flight_search: { route: "/flights", action: "Search for flights", auth: false, handoff: false },
  hotel_search: { route: "/hotels", action: "Search for hotels", auth: false, handoff: false },
  holiday_planning: { route: "/planner", action: "Plan your holiday with AI", auth: false, handoff: true },
  booking_inquiry: { route: "/trips", action: "View your bookings", auth: true, handoff: false },
  booking_modification: { route: "/trips", action: "Modify your booking", auth: true, handoff: true },
  cancellation: { route: "/trips", action: "Cancel your booking", auth: true, handoff: true },
  payment_help: { route: "/trips", action: "Payment support", auth: true, handoff: true },
  loyalty_inquiry: { route: "/profile", action: "View loyalty points", auth: true, handoff: false },
  support_general: { route: "/support", action: "Get support", auth: false, handoff: true },
  greeting: { route: "", action: "Respond to greeting", auth: false, handoff: false },
  unknown: { route: "", action: "Ask for clarification", auth: false, handoff: false },
};

export function getIntentResult(
  intent: IntentCategory,
  entities: ExtractedEntities,
  context?: ConversationContext
): IntentResult {
  const routeInfo = ROUTE_MAP[intent];

  const confidence = intent === "unknown" ? 0.3 : 0.8;

  return {
    intent,
    confidence,
    entities,
    suggestedRoute: routeInfo.route,
    suggestedAction: routeInfo.action,
    requiresAuth: routeInfo.auth,
    handoffToAI: routeInfo.handoff,
  };
}
