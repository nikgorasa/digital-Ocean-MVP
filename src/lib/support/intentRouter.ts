import { IntentResult } from "./types";

const INTENT_PATTERNS: Array<{
  intent: string;
  patterns: RegExp[];
  route: string;
  label: string;
  confidence: number;
}> = [
  // Flight intents
  {
    intent: "flight_search",
    patterns: [/fly|flight|plane|airline|airport|airfare|air ticket/i],
    route: "/flights",
    label: "Search Flights",
    confidence: 0.9,
  },
  {
    intent: "flight_status",
    patterns: [/flight.*status|flight.*track|where.*flight/i],
    route: "/trips",
    label: "Check Flight Status",
    confidence: 0.85,
  },

  // Hotel intents
  {
    intent: "hotel_search",
    patterns: [/hotel|room|resort|stay|accommodation|lodge|villa/i],
    route: "/hotels",
    label: "Search Hotels",
    confidence: 0.9,
  },

  // Holiday intents
  {
    intent: "holiday_planning",
    patterns: [/holiday|vacation|trip|tour|package|planner|getaway|itinerary/i],
    route: "/planner",
    label: "Plan Holiday",
    confidence: 0.9,
  },
  {
    intent: "holiday_packages",
    patterns: [/package.*deal|travel.*package|tour.*package|all.*inclusive/i],
    route: "/holidays",
    label: "View Packages",
    confidence: 0.85,
  },

  // Booking intents
  {
    intent: "my_bookings",
    patterns: [/my.*booking|my.*trip|view.*booking|pnr|reference.*number/i],
    route: "/trips",
    label: "View My Trips",
    confidence: 0.9,
  },
  {
    intent: "cancel_booking",
    patterns: [/cancel.*booking|cancellation|refund|money.*back/i],
    route: "/trips",
    label: "Cancel Booking",
    confidence: 0.85,
  },
  {
    intent: "modify_booking",
    patterns: [/modify.*booking|change.*booking|update.*booking|reschedule/i],
    route: "/trips",
    label: "Modify Booking",
    confidence: 0.85,
  },

  // Profile intents
  {
    intent: "loyalty_points",
    patterns: [/loyalty|points|reward|tier|membership|earn.*point/i],
    route: "/profile",
    label: "View Loyalty Points",
    confidence: 0.9,
  },
  {
    intent: "my_profile",
    patterns: [/my.*profile|account|settings|preferences/i],
    route: "/profile",
    label: "View Profile",
    confidence: 0.8,
  },

  // Support intents
  {
    intent: "contact",
    patterns: [/contact|support|help|agent|human|call|phone/i],
    route: "",
    label: "Contact Support",
    confidence: 0.8,
  },
  {
    intent: "whatsapp",
    patterns: [/whatsapp|chat.*direct|message.*support/i],
    route: "",
    label: "WhatsApp Support",
    confidence: 0.8,
  },
];

export function detectIntent(message: string): IntentResult {
  const normalized = message.toLowerCase().trim();

  for (const intentDef of INTENT_PATTERNS) {
    for (const pattern of intentDef.patterns) {
      if (pattern.test(normalized)) {
        return {
          intent: intentDef.intent,
          confidence: intentDef.confidence,
          route: intentDef.route,
          label: intentDef.label,
        };
      }
    }
  }

  return {
    intent: "unknown",
    confidence: 0.3,
  };
}

export function shouldEscalate(message: string, conversationLength: number): boolean {
  const normalized = message.toLowerCase();

  // Explicit escalation requests
  if (/talk to (human|agent|person)|connect me|speak to|talk to someone/i.test(normalized)) {
    return true;
  }

  // Frustration signals
  if (/frustrated|angry|unhappy|terrible|worst|annoyed|disappointed/i.test(normalized)) {
    return true;
  }

  // Multiple failed attempts
  if (conversationLength > 5) {
    return true;
  }

  // Complex requests
  if (/complex|complicated|multiple|several|all of them|everything/i.test(normalized)) {
    return true;
  }

  return false;
}
