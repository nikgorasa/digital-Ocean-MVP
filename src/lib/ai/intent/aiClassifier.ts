import { generateAIResponse } from "../client";
import { IntentCategory, ExtractedEntities, IntentResult, ConversationContext } from "./types";
import { classifyIntentLocal, extractEntitiesLocal, getIntentResult } from "./classifier";

const INTENT_CLASSIFICATION_PROMPT = `You are GoRASA's intent classification system. Analyze the user message and return a JSON response with their intent and extracted entities.

INTENTS (choose ONE):
- flight_search: User wants to search or book flights
- hotel_search: User wants to search or book hotels
- holiday_planning: User wants to plan a trip/itinerary/vacation
- booking_inquiry: User wants to check status/details of existing booking
- booking_modification: User wants to change an existing booking
- cancellation: User wants to cancel a booking
- payment_help: User needs help with payment/billing
- loyalty_inquiry: User asking about loyalty points/rewards
- support_general: User needs general support/help
- greeting: User is greeting or small talk
- unknown: Cannot determine intent

ENTITIES to extract:
- destination: Travel destination (city/country)
- origin: Starting point for travel
- date/dates: Travel dates
- travelers: Number of travelers
- budget: Budget level (budget/luxury/specific amount)
- bookingRef: Booking reference/PNR
- flightNumber: Flight number
- hotelName: Hotel name
- airline: Airline name

RESPONSE FORMAT (JSON only):
{
  "intent": "intent_name",
  "confidence": 0.0-1.0,
  "entities": {
    "destination": "string or null",
    "origin": "string or null",
    "date": "string or null",
    "travelers": number or null,
    "budget": "string or null",
    "bookingRef": "string or null"
  }
}

Examples:
User: "I want to fly to Goa next week" → {"intent":"flight_search","confidence":0.95,"entities":{"destination":"Goa","date":"next week"}}
User: "Book a hotel in Mumbai" → {"intent":"hotel_search","confidence":0.9,"entities":{"destination":"Mumbai"}}
User: "Plan my holiday to Kerala" → {"intent":"holiday_planning","confidence":0.95,"entities":{"destination":"Kerala"}}
User: "Where is my booking?" → {"intent":"booking_inquiry","confidence":0.85,"entities":{}}
User: "Cancel my flight" → {"intent":"cancellation","confidence":0.9,"entities":{}}
User: "How many loyalty points do I have?" → {"intent":"loyalty_inquiry","confidence":0.95,"entities":{}}
User: "Hello" → {"intent":"greeting","confidence":1.0,"entities":{}}
User: "Help me" → {"intent":"support_general","confidence":0.8,"entities":{}}

Return ONLY the JSON object, no other text.`;

interface AIClassification {
  intent: IntentCategory;
  confidence: number;
  entities: ExtractedEntities;
}

function parseClassification(response: string): AIClassification | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    const validIntents: IntentCategory[] = [
      "flight_search", "hotel_search", "holiday_planning", "booking_inquiry",
      "booking_modification", "cancellation", "payment_help", "loyalty_inquiry",
      "support_general", "greeting", "unknown",
    ];

    if (!validIntents.includes(parsed.intent)) {
      return null;
    }

    return {
      intent: parsed.intent,
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      entities: {
        destination: parsed.entities?.destination || undefined,
        origin: parsed.entities?.origin || undefined,
        date: parsed.entities?.date || undefined,
        travelers: parsed.entities?.travelers || undefined,
        budget: parsed.entities?.budget || undefined,
        bookingRef: parsed.entities?.bookingRef || undefined,
        flightNumber: parsed.entities?.flightNumber || undefined,
        hotelName: parsed.entities?.hotelName || undefined,
        airline: parsed.entities?.airline || undefined,
      },
    };
  } catch {
    return null;
  }
}

export async function classifyIntentAI(
  message: string,
  context?: ConversationContext
): Promise<IntentResult> {
  try {
    const contextNote = context
      ? `\n\nContext: User is on ${context.currentPage || "unknown page"}, has sent ${context.messageCount} messages.`
      : "";

    const response = await generateAIResponse(
      INTENT_CLASSIFICATION_PROMPT + contextNote,
      message
    );

    const classification = parseClassification(response);

    if (classification && classification.confidence >= 0.6) {
      return getIntentResult(classification.intent, classification.entities, context);
    }
  } catch (error) {
    console.error("AI classification failed, falling back to local:", error);
  }

  const localIntent = classifyIntentLocal(message);
  const localEntities = extractEntitiesLocal(message);
  return getIntentResult(localIntent, localEntities, context);
}

export function classifyIntentSync(
  message: string,
  context?: ConversationContext
): IntentResult {
  const intent = classifyIntentLocal(message);
  const entities = extractEntitiesLocal(message);
  return getIntentResult(intent, entities, context);
}
