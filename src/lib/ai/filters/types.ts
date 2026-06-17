export interface HotelFilters {
  priceRange: [number, number];
  starRating: number[];
  amenities: string[];
  propertyType: string[];
  freeCancellation: boolean;
  mealPlan: string[];
}

export interface FlightFilters {
  priceRange: [number, number];
  stops: number[];
  airlines: string[];
  departureTime: string[];
  maxDuration: number;
}

export interface FilterOption {
  label: string;
  value: string | number;
  count?: number;
}

export const DEFAULT_HOTEL_FILTERS: HotelFilters = {
  priceRange: [0, 100000],
  starRating: [],
  amenities: [],
  propertyType: [],
  freeCancellation: false,
  mealPlan: [],
};

export const DEFAULT_FLIGHT_FILTERS: FlightFilters = {
  priceRange: [0, 100000],
  stops: [],
  airlines: [],
  departureTime: [],
  maxDuration: 24,
};

export const HOTEL_AMENITIES: FilterOption[] = [
  { label: "WiFi", value: "wifi" },
  { label: "Pool", value: "pool" },
  { label: "Spa", value: "spa" },
  { label: "Restaurant", value: "restaurant" },
  { label: "Gym", value: "gym" },
  { label: "Parking", value: "parking" },
  { label: "AC", value: "ac" },
  { label: "Room Service", value: "room_service" },
];

export const PROPERTY_TYPES: FilterOption[] = [
  { label: "Hotel", value: "hotel" },
  { label: "Resort", value: "resort" },
  { label: "Villa", value: "villa" },
  { label: "Homestay", value: "homestay" },
  { label: "Apartment", value: "apartment" },
];

export const MEAL_PLANS: FilterOption[] = [
  { label: "Room Only", value: "room_only" },
  { label: "Breakfast", value: "breakfast" },
  { label: "Half Board", value: "half_board" },
  { label: "Full Board", value: "full_board" },
  { label: "All Inclusive", value: "all_inclusive" },
];

export const AIRLINES: FilterOption[] = [
  { label: "IndiGo", value: "6E" },
  { label: "Air India", value: "AI" },
  { label: "SpiceJet", value: "SG" },
  { label: "Vistara", value: "UK" },
  { label: "GoFirst", value: "G8" },
  { label: "AirAsia", value: "I5" },
];

export const DEPARTURE_TIMES: FilterOption[] = [
  { label: "Early Morning (00:00-06:00)", value: "early_morning" },
  { label: "Morning (06:00-12:00)", value: "morning" },
  { label: "Afternoon (12:00-18:00)", value: "afternoon" },
  { label: "Evening (18:00-24:00)", value: "evening" },
];
