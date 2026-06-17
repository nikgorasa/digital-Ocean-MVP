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

const DESTINATIONS: Record<string, { title: string; highlights: string[]; bestTime: string }> = {
  goa: { title: "Goa", highlights: ["Beaches", "Water Sports", "Nightlife", "Heritage"], bestTime: "November to February" },
  kerala: { title: "Kerala", highlights: ["Backwaters", "Hill Stations", "Ayurveda", "Wildlife"], bestTime: "September to March" },
  maldives: { title: "Maldives", highlights: ["Overwater Villas", "Snorkeling", "Diving", "Beaches"], bestTime: "December to April" },
  manali: { title: "Manali", highlights: ["Mountains", "Trekking", "Skiing", "Temples"], bestTime: "March to June" },
  rajasthan: { title: "Rajasthan", highlights: ["Forts", "Desert Safari", "Heritage Hotels", "Culture"], bestTime: "October to March" },
  himachal: { title: "Himachal Pradesh", highlights: ["Mountains", "Adventure", "Temples", "Nature"], bestTime: "March to June" },
  ladakh: { title: "Ladakh", highlights: ["Monasteries", "Lakes", "Biking", "Adventure"], bestTime: "June to September" },
  andaman: { title: "Andaman Islands", highlights: ["Beaches", "Scuba Diving", "Islands", "Nature"], bestTime: "November to May" },
  dubai: { title: "Dubai", highlights: ["Shopping", "Desert Safari", "Architecture", "Entertainment"], bestTime: "November to March" },
  "sri lanka": { title: "Sri Lanka", highlights: ["Beaches", "Temples", "Wildlife", "Tea Plantations"], bestTime: "December to March" },
};

function getDestinationInfo(destination: string): { title: string; highlights: string[]; bestTime: string } | null {
  const lower = destination.toLowerCase().trim();
  for (const [key, value] of Object.entries(DESTINATIONS)) {
    if (lower.includes(key) || key.includes(lower)) {
      return value;
    }
  }
  return null;
}

function generateItinerary(destination: string, days: number, travelers: number, budget: string, specialRequests: string): Itinerary {
  const destInfo = getDestinationInfo(destination);
  const title = destInfo?.title || destination;
  const isLuxury = budget.toLowerCase().includes("luxury") || budget.toLowerCase().includes("no limit");
  const isBudget = budget.toLowerCase().includes("budget");
  const isRomantic = specialRequests.toLowerCase().includes("romantic") ||
    specialRequests.toLowerCase().includes("honeymoon") ||
    specialRequests.toLowerCase().includes("anniversary");

  const hotelPrefix = isLuxury ? "5★ Premium Resort" : isBudget ? "3★ Comfort Hotel" : "4★ Deluxe Hotel";
  const baseCost = isLuxury ? 18000 : isBudget ? 6000 : 10000;

  const dayTemplates: ItineraryDay[] = [];

  for (let i = 1; i <= Math.min(days, 10); i++) {
    let day: ItineraryDay;

    if (i === 1) {
      day = {
        day: i,
        title: "Arrival & Orientation",
        activities: [
          { time: "14:00", activity: `Airport pickup & ${hotelPrefix} check-in`, duration: "1h" },
          { time: "16:00", activity: "Explore local area & get acquainted", duration: "2h" },
          { time: "19:00", activity: isRomantic ? "Romantic welcome dinner" : "Welcome dinner at local restaurant", duration: "2h" },
        ],
        hotel: `${hotelPrefix} in ${title}`,
        estimatedCost: baseCost + 2000,
      };
    } else if (i === days) {
      day = {
        day: i,
        title: "Departure",
        activities: [
          { time: "08:00", activity: "Breakfast at hotel", duration: "1h" },
          { time: "10:00", activity: "Last-minute shopping & souvenir hunt", duration: "2h" },
          { time: "13:00", activity: "Check-out & airport transfer", duration: "2h" },
        ],
        hotel: hotelPrefix,
        estimatedCost: 3000,
      };
    } else if (isRomantic && i === Math.floor(days / 2) + 1) {
      day = {
        day: i,
        title: "Special Romantic Day",
        activities: [
          { time: "09:00", activity: "Couples spa & wellness session", duration: "3h" },
          { time: "13:00", activity: "Private lunch at scenic spot", duration: "2h" },
          { time: "16:00", activity: "Sunset cruise / scenic viewpoint visit", duration: "2h" },
          { time: "19:00", activity: "Candlelight dinner under the stars", duration: "2h" },
        ],
        hotel: hotelPrefix,
        estimatedCost: baseCost + 5000,
      };
    } else {
      day = {
        day: i,
        title: `Exploring ${title}`,
        activities: [
          { time: "08:00", activity: "Breakfast at hotel", duration: "1h" },
          { time: "09:30", activity: `Visit ${destInfo?.highlights?.[i % destInfo.highlights.length] || "local attraction"}`, duration: "3h" },
          { time: "13:00", activity: "Lunch at popular local spot", duration: "1.5h" },
          { time: "15:00", activity: isBudget ? "Free time to explore" : `Premium experience: ${destInfo?.highlights?.[(i + 1) % destInfo.highlights.length] || "cultural tour"}`, duration: "3h" },
          { time: "19:00", activity: "Dinner & evening leisure", duration: "2h" },
        ],
        hotel: hotelPrefix,
        estimatedCost: baseCost,
      };
    }

    dayTemplates.push(day);
  }

  const totalCost = dayTemplates.reduce((sum, d) => sum + d.estimatedCost, 0) * (travelers / 2);

  return {
    destination: title,
    days,
    travelers,
    budget,
    specialRequests,
    itinerary: dayTemplates,
    totalEstimatedCost: Math.round(totalCost),
    inclusions: [
      "Accommodation",
      "Daily Breakfast",
      "Airport Transfers",
      isLuxury ? "Premium Concierge Service" : "Local Guide Assistance",
    ],
    exclusions: [
      "Flights",
      "Lunch & Dinner (except where mentioned)",
      "Personal Expenses",
      "Travel Insurance",
    ],
  };
}

export function generateHolidayResponse(
  messages: Message[],
  context?: { userId?: string; previousItinerary?: Itinerary | null }
): PlannerResponse {
  const userMessages = messages.filter((m) => m.role === "user");
  const messageCount = userMessages.length;

  if (messageCount === 0) {
    return {
      message: "Namaste! I'm your GoRASA travel planning assistant. Where would you love to go for your next holiday?",
      itinerary: null,
      quickReplies: ["Goa", "Kerala", "Maldives", "Manali", "Rajasthan", "Surprise me"],
      state: "GREETING",
    };
  }

  if (messageCount === 1) {
    const destination = userMessages[0].content;
    if (destination.toLowerCase().includes("surprise")) {
      return {
        message: "I love a good surprise! Let me suggest some amazing destinations:\n\n🌅 **Goa** — Beaches, nightlife, heritage\n🌿 **Kerala** — Backwaters, hill stations, wellness\n🏔️ **Manali** — Mountains, adventure, snow\n🏜️ **Rajasthan** — Forts, desert, royal heritage\n🏝️ **Maldives** — Luxury overwater villas\n\nWhich one catches your eye?",
        itinerary: null,
        quickReplies: ["Goa", "Kerala", "Manali", "Rajasthan", "Maldives"],
        state: "CLARIFYING",
      };
    }
    return {
      message: `Great choice! ${getDestinationInfo(destination)?.title || destination} is beautiful.\n\nHow many days are you planning for?`,
      itinerary: null,
      quickReplies: ["3 days", "5 days", "7 days", "10+ days"],
      state: "CLARIFYING",
    };
  }

  if (messageCount === 2) {
    return {
      message: "Perfect! And how many travelers will there be?",
      itinerary: null,
      quickReplies: ["Solo (1)", "Couple (2)", "Family (3-4)", "Group (5+)"],
      state: "CLARIFYING",
    };
  }

  if (messageCount === 3) {
    return {
      message: "Lovely! What's your budget range? This helps me suggest the right hotels and experiences.",
      itinerary: null,
      quickReplies: ["Budget-friendly", "Comfortable", "Luxury", "No limit"],
      state: "CLARIFYING",
    };
  }

  if (messageCount === 4) {
    const destination = userMessages[0].content;
    const daysStr = userMessages[1].content;
    const travelersStr = userMessages[2].content;
    const budget = userMessages[3].content;

    const days = parseInt(daysStr) || 5;
    const travelers = travelersStr.includes("Couple") ? 2 :
      travelersStr.includes("Family") ? 4 :
        travelersStr.includes("Group") ? 6 :
          travelersStr.includes("Solo") ? 1 : 2;

    const itinerary = generateItinerary(destination, days, travelers, budget, "");

    const dayList = itinerary.itinerary.map((d) => `📍 Day ${d.day} — ${d.title}`).join("\n");

    return {
      message: `Excellent! Here's your personalized ${days}-day ${itinerary.destination} itinerary for ${travelers} traveler${travelers > 1 ? "s" : ""}:\n\n${dayList}\n\n💰 **Total Estimated: ₹${itinerary.totalEstimatedCost.toLocaleString("en-IN")}**\n\n✅ Includes: ${itinerary.inclusions.join(", ")}\n❌ Excludes: ${itinerary.exclusions.join(", ")}\n\nWant me to make any changes? I can adjust the hotel, add more activities, or modify anything!`,
      itinerary,
      quickReplies: ["Looks perfect!", "Make it more luxury", "Add more activities", "Change hotel", "Start over"],
      state: "REFINING",
    };
  }

  const lastMessage = userMessages[userMessages.length - 1].content.toLowerCase();

  if (lastMessage.includes("perfect") || lastMessage.includes("great") || lastMessage.includes("looks good")) {
    return {
      message: "Wonderful! I'm glad you love it! 🎉\n\nClick **Get Full Quote** to connect with our travel expert who will finalize the itinerary and provide exact pricing within 4 hours.",
      itinerary: context?.previousItinerary || null,
      quickReplies: ["Get Full Quote"],
      state: "HANDOFF_READY",
    };
  }

  if (lastMessage.includes("start over") || lastMessage.includes("restart")) {
    return {
      message: "No problem! Let's start fresh. Where would you love to go?",
      itinerary: null,
      quickReplies: ["Goa", "Kerala", "Maldives", "Manali", "Rajasthan", "Surprise me"],
      state: "GREETING",
    };
  }

  if (lastMessage.includes("luxury") || lastMessage.includes("upgrade") || lastMessage.includes("premium")) {
    return {
      message: `I've upgraded your itinerary to luxury tier! ✨\n\n🏨 Hotels upgraded to 5★ Premium Resorts\n🍽️ Fine dining experiences added\n🚗 Private transfers included\n💆 Premium spa sessions\n\nNew estimated total: ₹${((context?.previousItinerary?.totalEstimatedCost || 100000) * 1.6).toLocaleString("en-IN")}\n\nAny other changes?`,
      itinerary: context?.previousItinerary || null,
      quickReplies: ["Looks perfect!", "Even more luxury", "Add activities", "Start over"],
      state: "REFINING",
    };
  }

  if (lastMessage.includes("more activities") || lastMessage.includes("add more") || lastMessage.includes("action")) {
    return {
      message: `I've added more exciting activities to your itinerary! 🎭\n\n• Morning yoga session\n• Local cooking class\n• Adventure activity (zip-lining/rafting)\n• Cultural show evening\n• Sunset viewpoint visit\n\nNew estimated total: ₹${((context?.previousItinerary?.totalEstimatedCost || 100000) * 1.2).toLocaleString("en-IN")}\n\nWant any other changes?`,
      itinerary: context?.previousItinerary || null,
      quickReplies: ["Looks perfect!", "Remove some", "Change hotel", "Start over"],
      state: "REFINING",
    };
  }

  if (lastMessage.includes("change hotel") || lastMessage.includes("different hotel")) {
    return {
      message: "I've updated your hotel selection! 🏨\n\nAlternative options:\n• Heritage property with local charm\n• Boutique hotel with personalized service\n• Beachfront resort with stunning views\n\nWould you like me to proceed with one of these, or shall I show more options?",
      itinerary: context?.previousItinerary || null,
      quickReplies: ["Looks perfect!", "Show more options", "Start over"],
      state: "REFINING",
    };
  }

  return {
    message: `I've noted your feedback: "${userMessages[userMessages.length - 1].content.substring(0, 50)}..."\n\nI'll keep this in mind for your itinerary. Is there anything specific you'd like me to change? I can adjust:\n• Activities and experiences\n• Hotel type\n• Budget level\n• Daily schedule`,
    itinerary: context?.previousItinerary || null,
    quickReplies: ["Looks perfect!", "Make it more luxury", "Add activities", "Start over"],
    state: "REFINING",
  };
}
