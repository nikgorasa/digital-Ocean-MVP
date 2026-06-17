import { SupportResponse, SupportContext } from "./types";
import { matchFAQ } from "./faqEngine";
import { detectIntent, shouldEscalate } from "./intentRouter";
import { getQuickActions } from "./quickActions";

export function getSupportResponse(
  message: string,
  context: SupportContext
): SupportResponse {
  const normalized = message.toLowerCase().trim();

  // 1. Check for escalation first
  if (shouldEscalate(message, context.conversationLength)) {
    return {
      message: `I understand you need more help. Let me connect you with our support team.

📞 **Phone:** +91 95285 00383
📧 **Email:** rasatravelindia@gmail.com
💬 **WhatsApp:** Click below for instant response

Our team is available Monday-Saturday, 9 AM - 9 PM IST.`,
      quickReplies: ["Open WhatsApp", "Call Support", "Email Support"],
      quickActions: getQuickActions("contact"),
      escalate: true,
    };
  }

  // 2. Try FAQ match first (free, instant)
  const faqMatch = matchFAQ(message);
  if (faqMatch) {
    const quickActions = faqMatch.relatedPages?.length
      ? getQuickActions(faqMatch.category === "flights" ? "flight_search" : 
                         faqMatch.category === "hotels" ? "hotel_search" :
                         faqMatch.category === "holidays" ? "holiday_planning" :
                         faqMatch.category === "bookings" ? "my_bookings" :
                         faqMatch.category === "profile" ? "loyalty_points" :
                         "unknown")
      : [];

    return {
      message: faqMatch.response,
      quickReplies: faqMatch.quickActions || [],
      quickActions,
      route: faqMatch.relatedPages?.[0],
      faqMatched: true,
    };
  }

  // 3. Try intent detection (free, instant)
  const intentResult = detectIntent(message);
  if (intentResult.confidence >= 0.8 && intentResult.label) {
    const quickActions = getQuickActions(intentResult.intent);

    // Special handling for holiday planning intent
    if (intentResult.intent === "holiday_planning") {
      return {
        message: `Great choice! I'll take you to our AI Holiday Planner where you can create a personalized itinerary for your trip.`,
        quickReplies: ["Start Planning", "View Packages"],
        quickActions,
        route: "/planner",
        intentDetected: intentResult.intent,
      };
    }

    return {
      message: `I'll take you to ${intentResult.label}. Click below or use the navigation.`,
      quickReplies: [intentResult.label],
      quickActions,
      route: intentResult.route,
      intentDetected: intentResult.intent,
    };
  }

  // 4. Personalized response if user is logged in
  if (context.user) {
    const personalizedMessage = getPersonalizedResponse(context);
    if (personalizedMessage) {
      return personalizedMessage;
    }
  }

  // 5. Default helpful response
  return {
    message: `I can help you with:

✈️ **Flights** — Search, book, manage bookings
🏨 **Hotels** — Find and book accommodation
🌴 **Holidays** — Packages and custom planning
🎫 **Bookings** — View, modify, or cancel
💎 **Loyalty** — Points, rewards, tier status

**What would you like to do?**`,
    quickReplies: ["Search Flights", "Search Hotels", "View Packages", "My Bookings"],
    quickActions: getQuickActions("unknown"),
  };
}

function getPersonalizedResponse(context: SupportContext): SupportResponse | null {
  const { user } = context;
  if (!user) return null;

  // If user has loyalty points, mention them
  if (user.loyaltyPoints && user.loyaltyPoints > 0) {
    return {
      message: `Welcome back, ${user.name}! 👋

You have **${user.loyaltyPoints.toLocaleString()} loyalty points** (${user.loyaltyTier || "Silver"} tier).

How can I help you today?`,
      quickReplies: ["Search Flights", "Search Hotels", "My Bookings", "Redeem Points"],
      quickActions: getQuickActions("greeting"),
    };
  }

  // Default personalized greeting
  return {
    message: `Welcome back, ${user.name}! 👋

How can I help you today?`,
    quickReplies: ["Search Flights", "Search Hotels", "View Packages", "My Bookings"],
    quickActions: getQuickActions("greeting"),
  };
}

export function getFollowUpSuggestions(
  lastIntent: string,
  context: SupportContext
): string[] {
  const suggestions: Record<string, string[]> = {
    flight_search: ["Check flight status", "View my bookings", "Flight deals"],
    hotel_search: ["View my bookings", "Hotel deals", "Popular destinations"],
    holiday_planning: ["View packages", "Popular destinations", "Contact agent"],
    my_bookings: ["Cancel booking", "Modify booking", "Download invoice"],
    loyalty_points: ["Redeem points", "Check tier benefits", "Earn more points"],
    contact: ["Open WhatsApp", "Call us", "Email us"],
  };

  return suggestions[lastIntent] || ["Search Flights", "Search Hotels", "My Bookings"];
}
