import { generateAIResponse } from "./client";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Activity {
  time: string;
  activity: string;
  duration?: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: Activity[];
  hotel: string;
  estimatedCost: number;
}

export interface Itinerary {
  destination: string;
  days: number;
  travelers: number;
  budget: string;
  specialRequests: string;
  itinerary: ItineraryDay[];
  totalEstimatedCost: number;
  inclusions: string[];
  exclusions: string[];
}

interface PlannerResponse {
  message: string;
  itinerary: Itinerary | null;
  quickReplies: string[];
  state: string;
}

const SYSTEM_PROMPT = `You are GoRASA's AI Travel Planner — a warm, knowledgeable travel expert for Indian travelers.

YOUR ROLE:
- Help users plan personalized holiday itineraries
- Ask clarifying questions to understand their needs
- Generate detailed day-by-day plans
- Refine itineraries based on feedback
- Hand off to human experts when user is ready

PERSONALITY:
- Warm and professional (use "Namaste" for greeting)
- Enthusiastic about travel
- Knowledgeable about Indian and international destinations
- Concise in responses (2-4 sentences unless detailing itinerary)

RESPONSE FORMAT:
- Use emojis sparingly for warmth (✈️ 🏨 🍽️ 🎭)
- Structure itineraries with clear day headings
- Include estimated costs where possible
- Always end with a question or next step

RULES:
- Never fabricate specific hotel names or prices
- Use "Estimated ₹X,XXX" for costs
- If unsure about a destination, say so honestly
- Always offer to connect with a human expert
- Keep conversations focused on travel planning

QUICK REPLIES:
When appropriate, suggest quick reply options in this format at the end of your response:
[QUICK_REPLIES: option1, option2, option3]

ITINERARY GENERATION:
When generating an itinerary, include it in your response in this exact JSON format within a code block:
[ITINERARY_JSON]
{
  "destination": "string",
  "days": number,
  "travelers": number,
  "budget": "string",
  "specialRequests": "string",
  "itinerary": [
    {
      "day": number,
      "title": "string",
      "activities": [
        { "time": "HH:MM", "activity": "string", "duration": "Xh" }
      ],
      "hotel": "string",
      "estimatedCost": number
    }
  ],
  "totalEstimatedCost": number,
  "inclusions": ["string"],
  "exclusions": ["string"]
}
[/ITINERARY_JSON]

STATE DETECTION:
Detect the conversation state and include it in your response:
[STATE: GREETING|CLARIFYING|GENERATING|REFINING|HANDOFF_READY]`;

function parseAIResponse(response: string): {
  message: string;
  itinerary: Itinerary | null;
  quickReplies: string[];
  state: string;
} {
  let message = response;
  let itinerary: Itinerary | null = null;
  let quickReplies: string[] = [];
  let state = "CLARIFYING";

  const itineraryMatch = response.match(/\[ITINERARY_JSON\]([\s\S]*?)\[\/ITINERARY_JSON\]/);
  if (itineraryMatch) {
    try {
      itinerary = JSON.parse(itineraryMatch[1].trim());
      message = message.replace(/\[ITINERARY_JSON\][\s\S]*?\[\/ITINERARY_JSON\]/, "").trim();
    } catch (e) {
      console.error("Failed to parse itinerary JSON:", e);
    }
  }

  const quickRepliesMatch = response.match(/\[QUICK_REPLIES:\s*([^\]]+)\]/);
  if (quickRepliesMatch) {
    quickReplies = quickRepliesMatch[1].split(",").map((r) => r.trim());
    message = message.replace(/\[QUICK_REPLIES:\s*[^\]]+\]/, "").trim();
  }

  const stateMatch = response.match(/\[STATE:\s*(\w+)\]/);
  if (stateMatch) {
    state = stateMatch[1];
    message = message.replace(/\[STATE:\s*\w+\]/, "").trim();
  }

  return { message, itinerary, quickReplies, state };
}

export async function generateHolidayResponse(
  messages: Message[],
  context?: { userId?: string; previousItinerary?: Itinerary | null }
): Promise<PlannerResponse> {
  const userMessages = messages.filter((m) => m.role === "user");

  if (userMessages.length === 0) {
    return {
      message: "Namaste! I'm your GoRASA travel planning assistant. Where would you love to go for your next holiday?",
      itinerary: null,
      quickReplies: ["Goa", "Kerala", "Maldives", "Manali", "Rajasthan", "Surprise me"],
      state: "GREETING",
    };
  }

  const history = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const contextNote = context?.previousItinerary
    ? `\n\nPREVIOUS ITINERARY (if refining):\n${JSON.stringify(context.previousItinerary, null, 2)}`
    : "";

  const userMessage = userMessages[userMessages.length - 1].content;

  try {
    const response = await generateAIResponse(SYSTEM_PROMPT + contextNote, userMessage, history.slice(0, -1));
    return parseAIResponse(response);
  } catch (error) {
    console.error("AI generation failed, falling back to rule-based:", error);
    return fallbackResponse(userMessages);
  }
}

function fallbackResponse(userMessages: Message[]): PlannerResponse {
  const count = userMessages.length;

  if (count === 1) {
    return {
      message: "Great choice! How many days are you planning for?",
      itinerary: null,
      quickReplies: ["3 days", "5 days", "7 days", "10+ days"],
      state: "CLARIFYING",
    };
  }

  if (count === 2) {
    return {
      message: "Perfect! And how many travelers will there be?",
      itinerary: null,
      quickReplies: ["Solo (1)", "Couple (2)", "Family (3-4)", "Group (5+)"],
      state: "CLARIFYING",
    };
  }

  if (count === 3) {
    return {
      message: "Lovely! What's your budget range?",
      itinerary: null,
      quickReplies: ["Budget-friendly", "Comfortable", "Luxury", "No limit"],
      state: "CLARIFYING",
    };
  }

  return {
    message: "I'd love to help! Let me connect you with our travel expert who can create the perfect itinerary for you.",
    itinerary: null,
    quickReplies: ["Get Full Quote"],
    state: "HANDOFF_READY",
  };
}
