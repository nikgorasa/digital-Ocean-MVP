export type UnifiedIntent =
  | "greeting"
  | "flight_search"
  | "hotel_search"
  | "holiday_planning"
  | "holiday_packages"
  | "booking_inquiry"
  | "booking_modification"
  | "cancellation"
  | "payment_help"
  | "loyalty_inquiry"
  | "support_general"
  | "escalation"
  | "unknown";

export interface UnifiedIntentResult {
  intent: UnifiedIntent;
  confidence: number;
  entities: {
    destination?: string;
    origin?: string;
    date?: string;
    travelers?: number;
    budget?: string;
    bookingRef?: string;
  };
  route: string;
  label: string;
  requiresAuth: boolean;
  escalateToHuman: boolean;
  handoffToPlanner: boolean;
}

export const INTENT_ROUTE_MAP: Record<UnifiedIntent, {
  route: string;
  label: string;
  requiresAuth: boolean;
  escalateToHuman: boolean;
  handoffToPlanner: boolean;
}> = {
  greeting: { route: "", label: "Welcome", requiresAuth: false, escalateToHuman: false, handoffToPlanner: false },
  flight_search: { route: "/flights", label: "Search Flights", requiresAuth: false, escalateToHuman: false, handoffToPlanner: false },
  hotel_search: { route: "/hotels", label: "Search Hotels", requiresAuth: false, escalateToHuman: false, handoffToPlanner: false },
  holiday_planning: { route: "/planner", label: "Plan Holiday", requiresAuth: false, escalateToHuman: false, handoffToPlanner: true },
  holiday_packages: { route: "/holidays", label: "View Packages", requiresAuth: false, escalateToHuman: false, handoffToPlanner: false },
  booking_inquiry: { route: "/trips", label: "View Bookings", requiresAuth: true, escalateToHuman: false, handoffToPlanner: false },
  booking_modification: { route: "/trips", label: "Modify Booking", requiresAuth: true, escalateToHuman: true, handoffToPlanner: false },
  cancellation: { route: "/trips", label: "Cancel Booking", requiresAuth: true, escalateToHuman: true, handoffToPlanner: false },
  payment_help: { route: "/trips", label: "Payment Support", requiresAuth: true, escalateToHuman: true, handoffToPlanner: false },
  loyalty_inquiry: { route: "/profile", label: "View Loyalty", requiresAuth: true, escalateToHuman: false, handoffToPlanner: false },
  support_general: { route: "/support", label: "Get Support", requiresAuth: false, escalateToHuman: false, handoffToPlanner: false },
  escalation: { route: "", label: "Talk to Agent", requiresAuth: false, escalateToHuman: true, handoffToPlanner: false },
  unknown: { route: "", label: "How can I help?", requiresAuth: false, escalateToHuman: false, handoffToPlanner: false },
};
