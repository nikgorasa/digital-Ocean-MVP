import { HotelFilters, FlightFilters } from "./types";

// Sort types
export type FlightSortKey = "best" | "cheapest" | "fastest" | "departure" | "arrival";
export type HotelSortKey = "recommended" | "price_asc" | "price_desc" | "star_rating" | "guest_rating";

// Flight filter/sort — works with actual Flight interface from flights/page.tsx
export interface FlightResult {
  id?: string;
  price: number;
  stops: number;
  airline?: string;
  airlineCode?: string;
  flightNumber?: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  isRefundable?: boolean;
  tier?: string;
  fareType?: string;
  fareInclusions?: string[];
  isLCC?: boolean;
  isFreeMealAvailable?: boolean;
}

export function applyFlightFilters(
  flights: FlightResult[],
  filters: FlightFilters
): FlightResult[] {
  return flights.filter((flight) => {
    if (flight.price < filters.priceRange[0] || flight.price > filters.priceRange[1]) {
      return false;
    }

    if (filters.stops.length > 0 && !filters.stops.includes(flight.stops)) {
      return false;
    }

    if (filters.airlines.length > 0 && flight.airlineCode) {
      if (!filters.airlines.includes(flight.airlineCode)) return false;
    }

    if (filters.departureTime.length > 0 && flight.departureTime) {
      const hour = new Date(flight.departureTime).getHours();
      const timeSlotMatch = filters.departureTime.some((slot) => {
        switch (slot) {
          case "early_morning": return hour >= 0 && hour < 6;
          case "morning": return hour >= 6 && hour < 12;
          case "afternoon": return hour >= 12 && hour < 18;
          case "evening": return hour >= 18 && hour < 24;
          default: return true;
        }
      });
      if (!timeSlotMatch) return false;
    }

    // Fare type filter
    if (filters.fareType.length > 0 && flight.fareType) {
      if (!filters.fareType.includes(flight.fareType)) return false;
    }

    // Refundable only filter
    if (filters.refundableOnly && !flight.isRefundable) {
      return false;
    }

    // Baggage included filter
    if (filters.baggageIncluded && flight.fareInclusions) {
      const inclusions = flight.fareInclusions.join(" | ").toLowerCase();
      if (!inclusions.includes("baggage")) return false;
    }

    // Meals included filter
    if (filters.mealsIncluded) {
      if (flight.isFreeMealAvailable) {
        // Already flagged as free meal
      } else if (flight.fareInclusions) {
        const inclusions = flight.fareInclusions.join(" | ").toLowerCase();
        if (!inclusions.includes("meal:included") && !inclusions.includes("meal - included")) return false;
      } else {
        return false;
      }
    }

    // Lounge included filter
    if (filters.loungeIncluded && flight.fareInclusions) {
      const inclusions = flight.fareInclusions.join(" | ").toLowerCase();
      if (!inclusions.includes("lounge")) return false;
    }

    // Free reissue filter
    if (filters.freeReissue && flight.fareInclusions) {
      const inclusions = flight.fareInclusions.join(" | ").toLowerCase();
      if (!inclusions.includes("reissue fees free") && !inclusions.includes("reissue free")) return false;
    }

    return true;
  });
}

function parseDuration(duration: string): number {
  if (!duration) return 0;
  const match = duration.match(/(\d+)h\s*(\d+)?m?/);
  if (match) return parseInt(match[1]) * 60 + (parseInt(match[2]) || 0);
  const asNum = parseInt(duration);
  return isNaN(asNum) ? 0 : asNum;
}

export function sortFlights(flights: FlightResult[], sortBy: FlightSortKey): FlightResult[] {
  const sorted = [...flights];
  switch (sortBy) {
    case "cheapest":
      return sorted.sort((a, b) => a.price - b.price);
    case "fastest":
      return sorted.sort((a, b) => parseDuration(a.duration || "") - parseDuration(b.duration || ""));
    case "departure":
      return sorted.sort((a, b) => new Date(a.departureTime || 0).getTime() - new Date(b.departureTime || 0).getTime());
    case "arrival":
      return sorted.sort((a, b) => new Date(a.arrivalTime || 0).getTime() - new Date(b.arrivalTime || 0).getTime());
    case "best":
    default:
      return sorted.sort((a, b) => {
        const priceNorm = (a.price - b.price) / Math.max(a.price, b.price, 1);
        const stopsNorm = (a.stops - b.stops) / 2;
        const durationNorm = (parseDuration(a.duration || "") - parseDuration(b.duration || "")) / 1440;
        return (priceNorm * 0.5 + stopsNorm * 0.3 + durationNorm * 0.2);
      });
  }
}

// Hotel filter/sort — works with actual TBODisplayHotel interface from hotels/page.tsx
export interface HotelResult {
  price: number;
  starRating: number;
  tripAdvisorRating?: number;
  rooms?: {
    amenities?: string[];
    mealType?: string;
    isRefundable?: boolean;
  }[];
}

export function applyHotelFilters(
  hotels: HotelResult[],
  filters: HotelFilters
): HotelResult[] {
  return hotels.filter((hotel) => {
    if (hotel.price < filters.priceRange[0] || hotel.price > filters.priceRange[1]) {
      return false;
    }

    if (filters.starRating.length > 0 && !filters.starRating.includes(hotel.starRating)) {
      return false;
    }

    if (filters.amenities.length > 0) {
      const hotelAmenities = hotel.rooms?.flatMap(r => r.amenities || []).map(a => a.toLowerCase()) || [];
      const hasAllAmenities = filters.amenities.every(a => hotelAmenities.includes(a));
      if (!hasAllAmenities) return false;
    }

    if (filters.mealPlan.length > 0) {
      const hotelMealPlans = hotel.rooms?.map(r => r.mealType?.toLowerCase()) || [];
      const hasMealPlan = filters.mealPlan.some(p => hotelMealPlans.includes(p));
      if (!hasMealPlan) return false;
    }

    if (filters.freeCancellation) {
      const hasFreeCancellation = hotel.rooms?.some(r => r.isRefundable) ?? false;
      if (!hasFreeCancellation) return false;
    }

    return true;
  });
}

export function sortHotels(hotels: HotelResult[], sortBy: HotelSortKey): HotelResult[] {
  const sorted = [...hotels];
  switch (sortBy) {
    case "price_asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price_desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "star_rating":
      return sorted.sort((a, b) => b.starRating - a.starRating);
    case "guest_rating":
      return sorted.sort((a, b) => (b.tripAdvisorRating || 0) - (a.tripAdvisorRating || 0));
    case "recommended":
    default:
      return sorted;
  }
}
