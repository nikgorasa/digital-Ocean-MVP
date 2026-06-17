import { FARule } from "./types";

export const FAQ_RULES: FARule[] = [
  // BAGGAGE
  {
    id: "baggage",
    category: "flights",
    keywords: ["baggage", "luggage", "check-in", "carry-on", "bag", "weight"],
    synonyms: ["kilogram", "kg", "allowance", "hand luggage"],
    patterns: [
      /how much.*baggage/i,
      /baggage.*allowance/i,
      /carry.*on/i,
      /check.*in.*bag/i,
    ],
    response: `**Baggage Allowances by Airline:**

✈️ **IndiGo**
• Lite: 15kg check-in + 7kg cabin
• Standard/Flexi: 20kg check-in + 7kg cabin

✈️ **Air India**
• Economy: 25kg check-in + 7kg cabin
• Business: 35kg check-in + 10kg cabin

✈️ **SpiceJet**
• Regular: 20kg check-in + 7kg cabin

💡 **Tip:** Pre-book extra baggage at discounted rates through My Trips.`,
    relatedPages: ["/flights", "/trips"],
    quickActions: ["Check my booking", "View airline rules"],
  },

  // CANCELLATION
  {
    id: "cancellation",
    category: "bookings",
    keywords: ["cancel", "cancellation", "refund", "money back", "void"],
    synonyms: ["revoke", "terminate", "stop booking"],
    patterns: [
      /cancel.*booking/i,
      /how.*cancel/i,
      /cancellation.*policy/i,
      /get.*refund/i,
    ],
    response: `**Cancellation Policy:**

✈️ **Flights**
• Free cancellation within 24 hours of booking
• After 24 hours: Standard airline cancellation fees apply

🏨 **Hotels**
• Free cancellation up to 48 hours before check-in
• Late cancellation: First night charged

📦 **Packages**
• Terms vary by package — check your booking details

💡 **Tip:** Cancel through My Trips for instant processing.`,
    relatedPages: ["/trips"],
    quickActions: ["Cancel my booking", "View cancellation policy"],
  },

  // LOYALTY
  {
    id: "loyalty",
    category: "profile",
    keywords: ["loyalty", "points", "reward", "tier", "membership", "earn"],
    synonyms: ["miles", "credits", "balance", "redeem"],
    patterns: [
      /loyalty.*point/i,
      /how.*many.*point/i,
      /my.*point/i,
      /earn.*point/i,
      /redeem.*point/i,
    ],
    response: `**GoRASA Loyalty Program:**

🥉 **Silver Tier** (0-4,999 points)
• 1x points on all bookings
• Basic support

🥇 **Gold Tier** (5,000-14,999 points)
• 1.5x points multiplier
• Lounge access promotions
• Priority support

💎 **Platinum Tier** (15,000+ points)
• 2x points multiplier
• Complimentary premium meals
• Dedicated concierge

💡 **Redeem points** for seat upgrades, lounge passes, and hotel room upgrades.`,
    relatedPages: ["/profile"],
    quickActions: ["View my points", "Redeem rewards", "Check tier status"],
  },

  // PAYMENT
  {
    id: "payment",
    category: "billing",
    keywords: ["payment", "pay", "bill", "invoice", "receipt", "failed"],
    synonyms: ["upi", "card", "wallet", "emi", "transaction"],
    patterns: [
      /payment.*fail/i,
      /how.*pay/i,
      /payment.*method/i,
      /get.*invoice/i,
      /bill.*receipt/i,
    ],
    response: `**Payment Options:**

💳 **Accepted Methods**
• UPI (Google Pay, PhonePe, Paytm)
• Credit/Debit Cards (Visa, Mastercard, RuPay)
• Corporate Wallet
• EMI options available

📱 **Payment Issues?**
• Failed payment? Amount auto-reversed in 3-5 business days
• Need invoice? Download from My Trips → Select booking → Invoice

🏢 **Corporate Users**
• Pay via corporate wallet for instant checkout
• Top up wallet from Admin panel`,
    relatedPages: ["/trips", "/profile"],
    quickActions: ["View invoices", "Check payment status", "Top up wallet"],
  },

  // SEAT/UPGRADE
  {
    id: "seat_upgrade",
    category: "flights",
    keywords: ["seat", "upgrade", "meal", "extra", "select"],
    synonyms: ["window", "aisle", "legroom", "business class"],
    patterns: [
      /select.*seat/i,
      /upgrade.*seat/i,
      /meal.*preference/i,
      /business.*class/i,
    ],
    response: `**Seat Selection & Upgrades:**

💺 **Seat Selection**
• Window/Aisle seats: ₹200-500
• Extra legroom: ₹500-1000
• Select during booking or via My Trips

🍽️ **Meal Upgrades**
• Pre-book special meals (Veg, Jain, Child)
• Starting from ₹350

⬆️ **Class Upgrades**
• Economy → Business available on Air India
• Upgrade through My Trips → Select booking → Modify`,
    relatedPages: ["/trips"],
    quickActions: ["Modify my booking", "View seat map", "Pre-order meals"],
  },

  // BOOKING STATUS
  {
    id: "booking_status",
    category: "bookings",
    keywords: ["booking", "status", "pnr", "reference", "confirm", "where is my"],
    synonyms: ["reservation", "itinerary", "ticket"],
    patterns: [
      /where.*booking/i,
      /booking.*status/i,
      /my.*booking/i,
      /check.*pnr/i,
      /view.*booking/i,
    ],
    response: `**Check Your Booking Status:**

📋 **How to View:**
1. Go to My Trips
2. See all your bookings with status
3. Click any booking for full details

🎫 **Booking Status Meanings:**
• ✅ Confirmed - Booking is complete
• ⏳ Pending - Awaiting confirmation
• ❌ Cancelled - Booking cancelled
• 💳 Payment Due - Complete payment to confirm

💡 **Need help?** Click on any booking to view boarding pass, invoice, or modify.`,
    relatedPages: ["/trips"],
    quickActions: ["View My Trips", "Download boarding pass", "Get invoice"],
  },

  // FLIGHT SEARCH
  {
    id: "flight_search",
    category: "flights",
    keywords: ["fly", "flight", "plane", "airline", "airport", "airfare"],
    synonyms: ["air ticket", "airfare", "journey"],
    patterns: [
      /search.*flight/i,
      /find.*flight/i,
      /book.*flight/i,
      /flight.*to/i,
      /fly.*to/i,
    ],
    response: `**Search Flights:**

✈️ **How to Book:**
1. Go to Flights page
2. Enter origin & destination
3. Select dates & passengers
4. Compare options & book

🌐 **Supported Routes:**
• 1,000+ Indian cities
• International destinations
• All major airlines (IndiGo, Air India, SpiceJet, Vistara)

💡 **Pro Tips:**
• Book 2-3 weeks in advance for best prices
• Use flexible dates for cheaper fares
• Check "My Trips" after booking`,
    relatedPages: ["/flights"],
    quickActions: ["Search Flights", "View deals", "Flight status"],
  },

  // HOTEL SEARCH
  {
    id: "hotel_search",
    category: "hotels",
    keywords: ["hotel", "room", "resort", "stay", "accommodation", "lodge"],
    synonyms: ["villa", "homestay", "apartment", "place to stay"],
    patterns: [
      /search.*hotel/i,
      /find.*hotel/i,
      /book.*hotel/i,
      /hotel.*in/i,
      /place.*stay/i,
    ],
    response: `**Search Hotels:**

🏨 **How to Book:**
1. Go to Hotels page
2. Enter destination & dates
3. Select guests & rooms
4. Filter by price, stars, amenities
5. Book your perfect stay

🌟 **Hotel Options:**
• Budget to Luxury (3★ to 5★)
• 1000+ properties across India
• Real-time availability & pricing

💡 **Pro Tips:**
• Book with free cancellation for flexibility
• Check reviews before booking
• Use filters to narrow down options`,
    relatedPages: ["/hotels"],
    quickActions: ["Search Hotels", "View deals", "My bookings"],
  },

  // HOLIDAY PACKAGES
  {
    id: "holiday_packages",
    category: "holidays",
    keywords: ["holiday", "package", "vacation", "tour", "trip", "getaway"],
    synonyms: ["travel package", "travel deal", "tour package"],
    patterns: [
      /holiday.*package/i,
      /travel.*package/i,
      /vacation.*deal/i,
      /tour.*package/i,
    ],
    response: `**Holiday Packages:**

🌴 **GoRASA Curated Packages:**
• Weekend Getaways
• Beach Destinations
• Hill Stations
• International Packages
• All-Inclusive Deals

📋 **What's Included:**
• Accommodation
• Sightseeing
• Transfers
• Some meals

💡 **Want a custom trip?** Use our AI Holiday Planner to create your perfect itinerary!`,
    relatedPages: ["/holidays", "/planner"],
    quickActions: ["View packages", "Plan custom holiday", "Popular destinations"],
  },

  // HOLIDAY PLANNER
  {
    id: "holiday_planner",
    category: "holidays",
    keywords: ["planner", "plan my trip", "itinerary", "custom trip", "personalized"],
    synonyms: ["create itinerary", "design trip", "tailor made"],
    patterns: [
      /plan.*trip/i,
      /create.*itinerary/i,
      /custom.*holiday/i,
      /personalized.*trip/i,
    ],
    response: `**AI Holiday Planner:**

🤖 **How It Works:**
1. Tell us your dream destination
2. Answer a few questions
3. Get a personalized itinerary instantly
4. Refine with our AI until perfect
5. Get a quote from our experts

✨ **Features:**
• Day-by-day planning
• Budget-aware recommendations
• Interactive refinement
• Expert review & booking

💡 **Try it now!** Click below to start planning.`,
    relatedPages: ["/planner"],
    quickActions: ["Start planning", "View sample itineraries", "Popular destinations"],
  },

  // CONTACT
  {
    id: "contact",
    category: "support",
    keywords: ["contact", "support", "help", "agent", "human", "call", "phone"],
    synonyms: ["reach out", "talk to", "speak to", "connect"],
    patterns: [
      /contact.*support/i,
      /talk.*to.*agent/i,
      /speak.*to.*human/i,
      /call.*support/i,
      /help.*desk/i,
    ],
    response: `**Contact GoRASA Support:**

📞 **Phone:** +91 95285 00383
📧 **Email:** rasatravelindia@gmail.com
💬 **WhatsApp:** Click the button below

🕐 **Hours:**
• Monday - Saturday: 9 AM - 9 PM IST
• Sunday: 10 AM - 6 PM IST

💡 **For faster support:**
• Have your booking reference ready
• Use WhatsApp for instant response`,
    relatedPages: [],
    quickActions: ["Open WhatsApp", "Email us", "View FAQ"],
  },

  // WHATSAPP
  {
    id: "whatsapp",
    category: "support",
    keywords: ["whatsapp", "chat", "message", "text"],
    synonyms: ["whats app", "wa"],
    patterns: [
      /whatsapp.*support/i,
      /chat.*whatsapp/i,
      /message.*whatsapp/i,
    ],
    response: `**WhatsApp Support:**

💬 **Chat with us directly on WhatsApp for instant support.**

Our team responds within minutes during business hours.

📱 **What we can help with:**
• Booking inquiries
• Modifications
• Cancellations
• General questions

💡 **Click the button below to start chatting!**`,
    relatedPages: [],
    quickActions: ["Open WhatsApp", "Call instead", "Email us"],
  },

  // GREETING
  {
    id: "greeting",
    category: "general",
    keywords: ["hello", "hi", "hey", "namaste", "good morning", "good evening"],
    synonyms: ["greetings", "howdy", "sup"],
    patterns: [
      /^hi$/i,
      /^hello$/i,
      /^hey$/i,
      /^namaste$/i,
    ],
    response: `**Namaste! Welcome to GoRASA Support!** 🌴

I'm here to help you with:
• ✈️ Flight bookings & inquiries
• 🏨 Hotel searches & bookings
• 🌴 Holiday packages & planning
• 🎫 Booking management
• 💎 Loyalty points & rewards

**How can I assist you today?**`,
    relatedPages: [],
    quickActions: ["Search Flights", "Search Hotels", "View Packages", "My Bookings"],
  },
];

export function matchFAQ(message: string): FARule | null {
  const normalized = message.toLowerCase().trim();

  // 1. Exact keyword match (fastest)
  for (const rule of FAQ_RULES) {
    if (rule.keywords.some((kw) => normalized.includes(kw))) {
      return rule;
    }
  }

  // 2. Pattern match (regex)
  for (const rule of FAQ_RULES) {
    if (rule.patterns?.some((pat) => pat.test(normalized))) {
      return rule;
    }
  }

  // 3. Synonym match
  for (const rule of FAQ_RULES) {
    if (rule.synonyms?.some((syn) => normalized.includes(syn))) {
      return rule;
    }
  }

  return null;
}

export function getFAQByCategory(category: string): FARule[] {
  return FAQ_RULES.filter((rule) => rule.category === category);
}

export function getFAQById(id: string): FARule | undefined {
  return FAQ_RULES.find((rule) => rule.id === id);
}
