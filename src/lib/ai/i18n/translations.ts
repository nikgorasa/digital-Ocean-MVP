export type Language = "en" | "hi";

export interface Translations {
  greeting: string;
  askDestination: string;
  askDuration: string;
  askTravelers: string;
  askBudget: string;
  itineraryReady: string;
  getQuote: string;
  chatPlaceholder: string;
  typing: string;
  emptyState: string;
  quickReplies: {
    destinations: string[];
    durations: string[];
    travelers: string[];
    budgets: string[];
    refinements: string[];
  };
}

const translations: Record<Language, Translations> = {
  en: {
    greeting: "Namaste! I'm your GoRASA travel planning assistant. Where would you love to go for your next holiday?",
    askDestination: "Where would you love to go?",
    askDuration: "Great choice! How many days are you planning for?",
    askTravelers: "Perfect! And how many travelers will there be?",
    askBudget: "Lovely! What's your budget range? This helps me suggest the right hotels and experiences.",
    itineraryReady: "Here's your personalized itinerary:",
    getQuote: "Get Full Quote",
    chatPlaceholder: "Type your message...",
    typing: "Planning your trip...",
    emptyState: "Start chatting to plan your dream holiday. Your itinerary will appear here.",
    quickReplies: {
      destinations: ["Goa", "Kerala", "Maldives", "Manali", "Rajasthan", "Surprise me"],
      durations: ["3 days", "5 days", "7 days", "10+ days"],
      travelers: ["Solo (1)", "Couple (2)", "Family (3-4)", "Group (5+)"],
      budgets: ["Budget-friendly", "Comfortable", "Luxury", "No limit"],
      refinements: ["Looks perfect!", "Make it more luxury", "Add more activities", "Start over"],
    },
  },
  hi: {
    greeting: "नमस्ते! मैं आपका GoRASA यात्रा योजना सहायक हूं। आप अपनी अगली छुट्टी कहां बिताना चाहेंगे?",
    askDestination: "आप कहां जाना चाहेंगे?",
    askDuration: "बहुत अच्छा! आप कितने दिनों की योजना बना रहे हैं?",
    askTravelers: "परफेक्ट! और कितने यात्री होंगे?",
    askBudget: "लोग अच्छा! आपकी बजट सीमा क्या है? इससे मुझे सही होटल और अनुभव सुझाने में मदद मिलती है।",
    itineraryReady: "यहां आपकी व्यक्तिगत यात्रा योजना है:",
    getQuote: "पूरी कीमत प्राप्त करें",
    chatPlaceholder: "अपना संदेश लिखें...",
    typing: "आपकी यात्रा की योजना बना रहे हैं...",
    emptyState: "अपनी सपनों की छुट्टी की योजना बनाने के लिए चैट शुरू करें। आपकी यात्रा योजना यहां दिखाई देगी।",
    quickReplies: {
      destinations: ["गोवा", "केरल", "मालदीव", "मनाली", "राजस्थान", "मुझे चौंका दो"],
      durations: ["3 दिन", "5 दिन", "7 दिन", "10+ दिन"],
      travelers: ["अकेले (1)", "जोड़ा (2)", "परिवार (3-4)", "समूह (5+)"],
      budgets: ["बजट-फ्रेंडली", "आरामदायक", "लक्जरी", "कोई सीमा नहीं"],
      refinements: ["बिल्कुल सही!", "और अधिक लक्जरी बनाओ", "और गतिविधियां जोड़ो", "फिर से शुरू करो"],
    },
  },
};

export function getTranslations(lang: Language): Translations {
  return translations[lang] || translations.en;
}

export function detectLanguage(text: string): Language {
  const hindiPattern = /[\u0900-\u097F]/;
  if (hindiPattern.test(text)) {
    return "hi";
  }
  return "en";
}

export function formatCurrency(amount: number, lang: Language): string {
  if (lang === "hi") {
    return `₹${amount.toLocaleString("hi-IN")}`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}
