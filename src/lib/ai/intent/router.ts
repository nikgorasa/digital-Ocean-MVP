import { IntentResult, ConversationContext, IntentCategory } from "./types";
import { classifyIntentAI, classifyIntentSync } from "./aiClassifier";

interface RouteResponse {
  intent: IntentResult;
  message: string;
  quickReplies?: string[];
  redirect?: string;
}

const GREETING_RESPONSES = [
  "Namaste! Welcome to GoRASA. I'm here to help you with flights, hotels, holiday planning, or any travel questions.",
  "Hello! Great to see you. I can help you search flights, find hotels, plan holidays, or manage your bookings. What would you like?",
  "Hi there! How can I assist you today? I can help with travel planning, booking management, or answer any questions.",
];

const CLARIFICATION_RESPONSES = [
  "I'm not sure I understand. Could you tell me more about what you're looking for? I can help with:\n• Flights\n• Hotels\n• Holiday packages\n• Booking management",
  "Let me help you better. Are you looking to:\n• Search flights\n• Find hotels\n• Plan a trip\n• Check an existing booking\n• Get support",
];

function getGreetingResponse(): string {
  return GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)];
}

function getClarificationResponse(): string {
  return CLARIFICATION_RESPONSES[Math.floor(Math.random() * CLARIFICATION_RESPONSES.length)];
}

function getIntentSpecificResponse(result: IntentResult): {
  message: string;
  quickReplies?: string[];
} {
  const { intent, entities } = result;

  switch (intent) {
    case "flight_search": {
      const dest = entities.destination ? ` to ${entities.destination}` : "";
      const date = entities.date ? ` on ${entities.date}` : "";
      return {
        message: `I'll help you find flights${dest}${date}. Let me take you to our flight search.`,
        quickReplies: ["Search Flights", "Show Options"],
      };
    }

    case "hotel_search": {
      const dest = entities.destination ? ` in ${entities.destination}` : "";
      return {
        message: `I'll help you find hotels${dest}. Let me take you to our hotel search.`,
        quickReplies: ["Search Hotels", "Show Options"],
      };
    }

    case "holiday_planning": {
      const dest = entities.destination ? ` to ${entities.destination}` : "";
      return {
        message: `Great choice! I'd love to help you plan your holiday${dest}. Our AI planner will create a personalized itinerary for you.`,
        quickReplies: ["Start Planning", "View Packages"],
      };
    }

    case "booking_inquiry": {
      return {
        message: "I'll help you check your booking. Let me take you to your trips.",
        quickReplies: ["View My Trips", "Enter PNR"],
      };
    }

    case "booking_modification": {
      return {
        message: "I can help you modify your booking. Let me connect you with our support team for this.",
        quickReplies: ["View My Trips", "Talk to Agent"],
      };
    }

    case "cancellation": {
      return {
        message: "I understand you want to cancel a booking. Let me take you to your trips where you can manage cancellations.",
        quickReplies: ["View My Trips", "Talk to Agent"],
      };
    }

    case "payment_help": {
      return {
        message: "I can help with payment questions. What specifically do you need help with?",
        quickReplies: ["Payment Failed", "Get Invoice", "Refund Status", "Wallet Top-up"],
      };
    }

    case "loyalty_inquiry": {
      return {
        message: "I'll help you with your loyalty points. Let me take you to your profile.",
        quickReplies: ["View Points", "Redeem Rewards", "Tier Status"],
      };
    }

    case "support_general": {
      return {
        message: "I'm here to help! What can I assist you with today?",
        quickReplies: ["Flight Issue", "Hotel Issue", "Billing", "Talk to Agent"],
      };
    }

    case "greeting": {
      return {
        message: getGreetingResponse(),
        quickReplies: ["Search Flights", "Find Hotels", "Plan Holiday", "My Bookings"],
      };
    }

    default: {
      return {
        message: getClarificationResponse(),
        quickReplies: ["Flights", "Hotels", "Holidays", "My Bookings", "Support"],
      };
    }
  }
}

export async function routeUserMessage(
  message: string,
  context?: ConversationContext
): Promise<RouteResponse> {
  const result = await classifyIntentAI(message, context);
  const response = getIntentSpecificResponse(result);

  return {
    intent: result,
    message: response.message,
    quickReplies: response.quickReplies,
    redirect: result.suggestedRoute || undefined,
  };
}

export function routeUserMessageSync(
  message: string,
  context?: ConversationContext
): RouteResponse {
  const result = classifyIntentSync(message, context);
  const response = getIntentSpecificResponse(result);

  return {
    intent: result,
    message: response.message,
    quickReplies: response.quickReplies,
    redirect: result.suggestedRoute || undefined,
  };
}

export function shouldRedirectToFeature(intent: IntentCategory): boolean {
  const redirectIntents: IntentCategory[] = [
    "flight_search",
    "hotel_search",
    "holiday_planning",
    "booking_inquiry",
    "loyalty_inquiry",
  ];
  return redirectIntents.includes(intent);
}

export function requiresHumanAgent(intent: IntentCategory): boolean {
  const humanIntents: IntentCategory[] = [
    "booking_modification",
    "cancellation",
    "payment_help",
  ];
  return humanIntents.includes(intent);
}
