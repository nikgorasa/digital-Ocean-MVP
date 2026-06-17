import { QuickAction } from "./types";

export const QUICK_ACTIONS: Record<string, QuickAction[]> = {
  flight_search: [
    { label: "Search Flights", page: "/flights", icon: "Plane", description: "Find and book flights" },
    { label: "My Bookings", page: "/trips", icon: "Ticket", description: "View your flight bookings" },
    { label: "Flight Deals", page: "/flights", icon: "Tag", description: "Check latest flight offers" },
  ],
  flight_status: [
    { label: "View My Trips", page: "/trips", icon: "Ticket", description: "See all your bookings" },
    { label: "Flight Search", page: "/flights", icon: "Plane", description: "Search new flights" },
  ],
  hotel_search: [
    { label: "Search Hotels", page: "/hotels", icon: "Building", description: "Find hotels" },
    { label: "My Bookings", page: "/trips", icon: "Ticket", description: "View hotel bookings" },
    { label: "Hotel Deals", page: "/hotels", icon: "Tag", description: "Check latest offers" },
  ],
  holiday_planning: [
    { label: "Plan Holiday", page: "/planner", icon: "Palmtree", description: "AI-powered trip planning" },
    { label: "View Packages", page: "/holidays", icon: "Package", description: "Browse curated packages" },
    { label: "Popular Destinations", page: "/holidays", icon: "MapPin", description: "Top travel spots" },
  ],
  holiday_packages: [
    { label: "View Packages", page: "/holidays", icon: "Package", description: "Browse all packages" },
    { label: "Plan Custom Trip", page: "/planner", icon: "Palmtree", description: "Create your own itinerary" },
  ],
  my_bookings: [
    { label: "View My Trips", page: "/trips", icon: "Ticket", description: "See all bookings" },
    { label: "Flight Bookings", page: "/trips", icon: "Plane", description: "View flights" },
    { label: "Hotel Bookings", page: "/trips", icon: "Building", description: "View hotels" },
  ],
  cancel_booking: [
    { label: "View My Trips", page: "/trips", icon: "Ticket", description: "Select booking to cancel" },
    { label: "Cancellation Policy", page: "/trips", icon: "FileText", description: "Read policy details" },
  ],
  modify_booking: [
    { label: "View My Trips", page: "/trips", icon: "Ticket", description: "Select booking to modify" },
    { label: "Change Dates", page: "/trips", icon: "Calendar", description: "Reschedule booking" },
  ],
  loyalty_points: [
    { label: "View Points", page: "/profile", icon: "Star", description: "Check your balance" },
    { label: "Redeem Rewards", page: "/profile", icon: "Gift", description: "Use your points" },
    { label: "Tier Benefits", page: "/profile", icon: "Award", description: "See tier perks" },
  ],
  my_profile: [
    { label: "Personal Info", page: "/profile", icon: "User", description: "Update details" },
    { label: "Saved Travelers", page: "/profile", icon: "Users", description: "Manage passengers" },
    { label: "Preferences", page: "/profile", icon: "Settings", description: "Set preferences" },
  ],
  contact: [
    { label: "Open WhatsApp", page: "", icon: "MessageCircle", description: "Chat on WhatsApp" },
    { label: "Call Us", page: "", icon: "Phone", description: "+91 95285 00383" },
    { label: "Email Us", page: "", icon: "Mail", description: "rasatravelindia@gmail.com" },
  ],
  whatsapp: [
    { label: "Open WhatsApp", page: "", icon: "MessageCircle", description: "Start chatting" },
  ],
  greeting: [
    { label: "Search Flights", page: "/flights", icon: "Plane", description: "Find flights" },
    { label: "Search Hotels", page: "/hotels", icon: "Building", description: "Find hotels" },
    { label: "View Packages", page: "/holidays", icon: "Package", description: "Browse packages" },
    { label: "My Bookings", page: "/trips", icon: "Ticket", description: "View trips" },
  ],
  unknown: [
    { label: "Search Flights", page: "/flights", icon: "Plane", description: "Find flights" },
    { label: "Search Hotels", page: "/hotels", icon: "Building", description: "Find hotels" },
    { label: "My Bookings", page: "/trips", icon: "Ticket", description: "View trips" },
    { label: "Contact Support", page: "", icon: "Headphones", description: "Get help" },
  ],
};

export function getQuickActions(intent: string): QuickAction[] {
  return QUICK_ACTIONS[intent] || QUICK_ACTIONS.unknown;
}
