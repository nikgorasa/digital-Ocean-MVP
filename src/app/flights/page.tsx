"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/hooks/useAuth";
import { useSearchTimer } from "@/hooks/useSearchTimer";

import { motion, AnimatePresence } from "motion/react";
import { formatCurrency } from "@/lib";
import { parseFareType, parseFareInclusions, getFareTypeColor, formatFareType, type FareType } from "@/lib/fare-utils";
import { Plane, Search, Calendar, Users, ArrowRight, Star, Clock, Luggage, X, Loader2, ChevronDown, ChevronUp, Minus, Plus, User, AlertCircle, RefreshCw, SlidersHorizontal, Utensils, Armchair } from "lucide-react";
import FlightBookingModal from "@/components/FlightBookingModal";
import CitySearchDropdown from "@/components/CitySearchDropdown";
import DateRangePicker from "@/components/DateRangePicker";
import type { City } from "@/components/CitySearchDropdown";
import { getAirlineLogo } from "@/lib/airline-logos";
import SortBar from "@/components/SortBar";
import FilterChips from "@/components/FilterChips";
import FilterPanel from "@/components/FilterPanel";
import Breadcrumb, { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import { useFlightFilters } from "@/hooks/useFilters";
import { applyFlightFilters, sortFlights, type FlightSortKey, type FlightResult } from "@/lib/ai/filters/applyFilters";
import Link from "next/link";
import { SearchResultsSkeleton } from "@/components/ui/Skeleton";

function FlightJsonLd({ flights }: { flights: Flight[] }) {
  if (flights.length === 0) return null;
  const schemas = flights.slice(0, 10).map((flight) => ({
    "@context": "https://schema.org",
    "@type": "Flight",
    name: `${flight.airline} ${flight.flightNumber}`,
    airline: {
      "@type": "Airline",
      name: flight.airline,
      iataCode: flight.airlineCode,
    },
    departureAirport: {
      "@type": "Airport",
      iataCode: flight.origin,
    },
    arrivalAirport: {
      "@type": "Airport",
      iataCode: flight.destination,
    },
    departureTime: flight.departureTime,
    arrivalTime: flight.arrivalTime,
    offers: {
      "@type": "Offer",
      price: flight.price,
      priceCurrency: flight.currency || "INR",
      availability: "https://schema.org/InStock",
    },
  }));
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.length === 1 ? schemas[0] : schemas) }}
    />
  );
}

interface Flight {
  id: string;
  leg: "outbound" | "inbound" | "oneway";
  airline: string;
  airlineCode: string;
  flightNumber: string;
  operatingCarrier: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  currency?: string;
  tier: string;
  baggage?: string;
  cabinBaggage?: string;
  isRefundable?: boolean;
  isLCC?: boolean;
  penalty?: string;
  baseFare?: number;
  tax?: number;
  yqTax?: number;
  lastTicketDate?: string;
  fareType?: FareType;
  fareInclusions?: string[];
  airlineRemark?: string;
  fareClass?: string;
  fareClassification?: { Type: string; Color: string };
  isExclusiveFare?: boolean;
  isFreeMealAvailable?: boolean;
  validatingAirline?: string;
  gstAllowed?: boolean;
  resultIndex?: string;
  baseRate?: number;
  markupAmount?: number;
}

const CABIN_OPTIONS = ["Economy", "Premium Economy", "Business", "First Class"] as const;

const AIRPORT_TIMEZONES: Record<string, string> = {
  BOM: "IST", DEL: "IST", BLR: "IST", MAA: "IST", CCU: "IST", HYD: "IST",
  GOI: "IST", JAI: "IST", PNQ: "IST", AMD: "IST", COK: "IST", TRV: "IST",
  DXB: "GST", AUH: "GST", SHJ: "GST", DOH: "AST", BAH: "AST", KWI: "AST",
  MCT: "GST", RUH: "AST", JED: "AST",
  LHR: "GMT", LGW: "GMT", CDG: "CET", FRA: "CET", MUC: "CET", AMS: "CET",
  JFK: "EST", LAX: "PST", ORD: "EST", SFO: "PST",
  SIN: "SGT", BKK: "ICT", KUL: "MYT", HKG: "HKT", NRT: "JST", HND: "JST",
  SYD: "AEST", MEL: "AEST",
  CMB: "IST", MLE: "MVT",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDuration(minutes: number): string {
  if (!minutes && minutes !== 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const CABIN_CLASS_MAP: Record<number, string> = {
  0: "All",
  1: "Economy",
  2: "Premium Economy",
  3: "Business",
  4: "Premium Business",
  5: "First",
};

export default function FlightsPage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [originCity, setOriginCity] = useState<City>({ code: "13484", name: "Mumbai", state: "Maharashtra", source: "fallback", iata_code: "BOM" });
  const [destinationCity, setDestinationCity] = useState<City>({ code: "13482", name: "Delhi", state: "Delhi", source: "fallback", iata_code: "DEL" });
  const [tripType, setTripType] = useState<"one-way" | "return" | "multi-city">("return");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [multiCityLegs, setMultiCityLegs] = useState<{ origin: City; destination: City; date: string }[]>(() => [
    { origin: originCity, destination: destinationCity, date: "" },
    { origin: destinationCity, destination: originCity, date: "" },
  ]);
  const [cabinClass, setCabinClass] = useState<string>("Economy");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [childAges, setChildAges] = useState<number[]>([]);
  const [showPassengerPopover, setShowPassengerPopover] = useState(false);
  const passengerRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<Flight[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchTraceId, setSearchTraceId] = useState<string>("");
  const [searchError, setSearchError] = useState("");
  const { statusMessage } = useSearchTimer(searching);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [bookingFlight, setBookingFlight] = useState<Flight | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [flightSelections, setFlightSelections] = useState<Map<string, Flight>>(new Map());

  const totalPassengers = adults + children + infants;
  const showConcierge = totalPassengers > 10;
  const isReturnTrip = tripType === "return" || tripType === "multi-city";

  const allLegsSelected = useMemo(() => {
    if (!searched || results.length === 0) return false;
    if (isReturnTrip) return flightSelections.has("outbound") && flightSelections.has("inbound");
    return false;
  }, [searched, results, isReturnTrip, flightSelections]);

  const bookingFlights = useMemo(() => {
    if (isReturnTrip) return Array.from(flightSelections.values());
    if (bookingFlight) return [bookingFlight];
    return [];
  }, [isReturnTrip, flightSelections, bookingFlight]);

  const toggleSelection = useCallback((flight: Flight) => {
    const key = flight.leg === "inbound" ? "inbound" : "outbound";
    setFlightSelections(prev => {
      const next = new Map(prev);
      const existing = next.get(key);
      if (existing?.id === flight.id) {
        next.delete(key);
      } else {
        next.set(key, flight);
      }
      return next;
    });
  }, []);

  const [sortBy, setSortBy] = useState<FlightSortKey>("best");
  const { filters, updateFilter, resetFilters, hasActiveFilters, activeFilterCount } = useFlightFilters();

  const filteredResults = useMemo(() => {
    const filtered = applyFlightFilters(results as FlightResult[], filters);
    return sortFlights(filtered, sortBy) as Flight[];
  }, [results, filters, sortBy]);

  // Group flights by identity (airline + flight number + departure time + route)
  // TBO returns multiple fare options per physical flight — group them together
  const groupedResults = useMemo(() => {
    const groups = new Map<string, { key: string; representative: Flight; fares: Flight[] }>();
    for (const flight of filteredResults) {
      const groupKey = `${flight.airlineCode}-${flight.flightNumber}-${flight.departureTime}-${flight.origin}-${flight.destination}`;
      const existing = groups.get(groupKey);
      if (existing) {
        existing.fares.push(flight);
        // Keep cheapest fare as representative
        if (flight.price < existing.representative.price) {
          existing.representative = flight;
        }
      } else {
        groups.set(groupKey, { key: groupKey, representative: flight, fares: [flight] });
      }
    }
    return Array.from(groups.values());
  }, [filteredResults]);

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const outboundGroups = useMemo(
    () => groupedResults.filter(g => g.representative.leg === "outbound" || g.representative.leg === "oneway"),
    [groupedResults]
  );
  const inboundGroups = useMemo(
    () => groupedResults.filter(g => g.representative.leg === "inbound"),
    [groupedResults]
  );

  const outboundFlights = outboundGroups.map(g => g.representative);
  const inboundFlights = inboundGroups.map(g => g.representative);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (passengerRef.current && !passengerRef.current.contains(e.target as Node)) {
        setShowPassengerPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const newCount = children;
    setChildAges((prev) => {
      if (newCount > prev.length) return [...prev, ...Array(newCount - prev.length).fill(5)];
      return prev.slice(0, newCount);
    });
  }, [children]);

  const handleSearch = async () => {
    if (!originCity.name || !destinationCity.name) return;
    if (tripType !== "multi-city" && !departDate) return;
    if (tripType === "return" && !returnDate) return;
    if (tripType === "multi-city" && multiCityLegs.some(l => !l.origin.name || !l.destination.name || !l.date)) {
      setSearchError("Please fill in origin, destination, and date for all multi-city legs.");
      setSearched(true);
      return;
    }
    setSearching(true);
    try {
      const originCode = originCity.iata_code || originCity.name;
      const destCode = destinationCity.iata_code || destinationCity.name;
      const departureDate = tripType === "multi-city" ? multiCityLegs[0].date : departDate;
      const res = await fetch(`/api/tbo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "search",
          params: {
            origin: originCode,
            destination: destCode,
            departureDate,
            returnDate: tripType === "return" ? returnDate : undefined,
            adults,
            children,
            infants,
            cabinClass,
            tripType: tripType === "return" ? "Return" : tripType === "multi-city" ? "Circle" : "OneWay",
            multiCityLegs: tripType === "multi-city" ? multiCityLegs.map(l => ({
              origin: l.origin.iata_code || l.origin.name,
              destination: l.destination.iata_code || l.destination.name,
              date: l.date,
            })) : undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setSearchError(data.error || "Failed to search flights. Please try again.");
        setResults([]);
        setSearched(true);
        return;
      }
      const flights = (data.flights || []).map((f: any) => ({
        id: f.resultIndex || `${f.airline}-${f.flightNumber}`,
        leg: f.leg || "oneway",
        resultIndex: f.resultIndex || "",
        airline: f.airline,
        airlineCode: f.airlineCode || "",
        flightNumber: f.flightNumber,
        operatingCarrier: f.operatingCarrier || "",
        origin: f.origin,
        destination: f.destination,
        departureTime: f.departureTime,
        arrivalTime: f.arrivalTime,
        duration: typeof f.duration === "number" ? formatDuration(f.duration) : f.duration,
        stops: f.segments?.[0] ? f.segments[0].length - 1 : 0,
        price: f.publishedFare || f.baseFare || 0,
        currency: f.currency || "INR",
        tier: cabinClass || "Economy",
        baggage: f.baggage || "",
        cabinBaggage: f.cabinBaggage || "7 KG",
        isRefundable: f.isRefundable ?? false,
        isLCC: f.isLCC ?? false,
        penalty: f.penalty || "",
        baseFare: f.baseFare || 0,
        tax: f.tax || 0,
        yqTax: f.yqTax || 0,
        lastTicketDate: f.lastTicketDate || "",
        fareType: parseFareType(f.airlineRemark),
        fareInclusions: f.fareInclusions || [],
        airlineRemark: f.airlineRemark || "",
        fareClass: f.segments?.[0]?.[0]?.Airline?.FareClass || "",
        fareClassification: f.fareClassification,
        isExclusiveFare: f.isExclusiveFare ?? false,
        isFreeMealAvailable: f.isFreeMealAvailable ?? false,
        validatingAirline: f.validatingAirline || "",
        gstAllowed: f.gstAllowed ?? false,
        isDomestic: f.isDomestic ?? true,
        isPassportRequiredAtBook: f.isPassportRequiredAtBook ?? false,
        baseRate: f.baseRate,
        markupAmount: f.markupAmount,
      }));
      setResults(flights);
      setSearchTraceId(data.traceId || "");
      setSearchError("");
      setSearched(true);
    } catch {
      setSearchError("Something went wrong. Please check your connection and try again.");
      setResults([]);
      setSearched(true);
    } finally {
      setSearching(false);
    }
  };

  const formatFlightTime = (iso: string, airportCode?: string) => {
    const parts = iso.split("T");
    if (parts.length < 2) return iso;
    const time = parts[1].slice(0, 5);
    if (airportCode) {
      const tz = AIRPORT_TIMEZONES[airportCode.toUpperCase()];
      if (tz) return `${time} ${tz}`;
    }
    return time;
  };

  const formatFlightDate = (iso: string) => {
    const parts = iso.split("T");
    if (parts.length < 2) return "";
    const d = new Date(parts[0] + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Business":
      case "First Class": return "bg-purple-100 text-purple-700";
      case "Flexi Plus": return "bg-blue-100 text-blue-700";
      case "Standard": return "bg-green-100 text-green-700";
      default: return "bg-brand-ivory text-brand-charcoal/80";
    }
  };

  const renderFlightCard = (flight: Flight, i: number, fareCount?: number, groupKey?: string) => {
    const legKey = flight.leg === "inbound" ? "inbound" : "outbound";
    const isSelected = flightSelections.get(legKey)?.id === flight.id;
    const isExpanded = groupKey ? expandedGroup === groupKey : false;
    const hasMultipleFares = fareCount && fareCount > 1;
    const group = groupKey ? groupedResults.find(g => g.key === groupKey) : null;

    return (
    <motion.div
      key={flight.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      className={`bg-white rounded-2xl border-2 transition-all ${
        isSelected
          ? "border-brand-antique-gold shadow-lg ring-2 ring-brand-antique-gold/20"
          : "border-slate-200 hover:shadow-lg"
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer" onClick={() => setSelectedFlight(flight)}>
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-ivory flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={getAirlineLogo(flight.airlineCode)}
                alt={flight.airline}
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-10 h-10 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg></div>';
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-brand-charcoal truncate">{flight.airline}</p>
              <p className="text-xs text-slate-600">{flight.flightNumber}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {flight.baggage && (
                  <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
                    <Luggage size={10} /> {flight.baggage}
                  </span>
                )}
                {flight.isRefundable ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-50 text-green-600">Refundable</span>
                ) : (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">Non-Refundable</span>
                )}
                {flight.fareType && flight.fareType !== "Unknown" && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getFareTypeColor(flight.fareType)}`}>
                    {formatFareType(flight.fareType)}
                  </span>
                )}
                {flight.isLCC && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-600">LCC</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {flight.fareInclusions && flight.fareInclusions.length > 0 && (
                  <>
                    {flight.fareInclusions.some(inc => inc.toLowerCase().includes("meal")) && (
                      <span className="text-[10px] text-emerald-600 flex items-center gap-0.5" title="Meal included">
                        <Utensils size={10} /> Meal
                      </span>
                    )}
                    {flight.fareInclusions.some(inc => inc.toLowerCase().includes("lounge")) && (
                      <span className="text-[10px] text-purple-600 flex items-center gap-0.5" title="Lounge access">
                        <Armchair size={10} /> Lounge
                      </span>
                    )}
                    {flight.fareInclusions.some(inc => inc.toLowerCase().includes("reissue fees free")) && (
                      <span className="text-[10px] text-teal-600 flex items-center gap-0.5" title="Free reissue">
                        <RefreshCw size={10} /> Free Reissue
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-10 justify-between sm:justify-end ml-13 sm:ml-0">
            <div className="text-center min-w-[64px]">
              <p className="text-base sm:text-lg font-bold text-brand-charcoal">{formatFlightTime(flight.departureTime, flight.origin)}</p>
              <p className="text-[10px] text-slate-600 font-medium">{formatFlightDate(flight.departureTime)}</p>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">{flight.origin}</p>
            </div>
            <div className="hidden sm:flex flex-col items-center">
              <p className="text-xs font-medium text-slate-600">{flight.duration}</p>
              <div className="w-24 h-0.5 bg-slate-200 my-1.5 rounded-full" />
              <p className="text-xs font-medium text-slate-600">{flight.stops === 0 ? "Non-stop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}</p>
            </div>
            <div className="text-center min-w-[64px]">
              <p className="text-base sm:text-lg font-bold text-brand-charcoal">{formatFlightTime(flight.arrivalTime, flight.destination)}</p>
              <p className="text-[10px] text-slate-600 font-medium">{formatFlightDate(flight.arrivalTime)}</p>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">{flight.destination}</p>
            </div>
          </div>

          <div className="text-right shrink-0 ml-auto">
            {isReturnTrip && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleSelection(flight); }}
                className={`mb-2 px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-colors cursor-pointer min-h-[32px] ${
                  isSelected
                    ? "bg-brand-emerald text-white border-brand-emerald"
                    : "bg-transparent text-slate-600 border-slate-200 hover:border-brand-antique-gold hover:text-brand-antique-gold"
                }`}
              >
                {isSelected ? "✓ Selected" : "Select"}
              </button>
            )}
            <div className="flex items-center justify-end gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getTierColor(flight.tier)}`}>
                {flight.tier}
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono text-brand-charcoal mt-1">{formatCurrency(flight.price)}</p>
            <p className="text-[10px] text-slate-600">total for {totalPassengers} pax</p>
          </div>
        </div>

        {/* Expandable fare options */}
        {hasMultipleFares && group && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedGroup(isExpanded ? null : groupKey!);
              }}
              className="flex items-center gap-2 text-xs font-semibold text-brand-antique-gold hover:text-brand-emerald transition-colors cursor-pointer min-h-[36px]"
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {isExpanded ? "Hide fare options" : `View ${fareCount} fare options`}
              <span className="text-slate-600 font-normal">
                (from {formatCurrency(Math.min(...group.fares.map(f => f.price)))})
              </span>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2">
                    {group.fares
                      .sort((a, b) => a.price - b.price)
                      .map((fare) => (
                        <div
                          key={fare.id}
                          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-xl border transition-colors cursor-pointer gap-2 sm:gap-3 ${
                            flightSelections.get(legKey)?.id === fare.id
                              ? "border-brand-antique-gold bg-brand-antique-gold/5"
                              : "border-slate-100 hover:border-brand-antique-gold/50 hover:bg-brand-ivory/50"
                          }`}
                          onClick={() => {
                            setSelectedFlight(fare);
                          }}
                        >
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${getTierColor(fare.tier)}`}>
                              {fare.tier}
                            </span>
                            {fare.fareType && fare.fareType !== "Unknown" && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${getFareTypeColor(fare.fareType)}`}>
                                {formatFareType(fare.fareType)}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-600 shrink-0">
                              {fare.fareClass && `Class ${fare.fareClass}`}
                            </span>
                            {fare.baggage && (
                              <span className="text-[10px] text-slate-600 flex items-center gap-0.5 shrink-0">
                                <Luggage size={10} /> {fare.baggage}
                              </span>
                            )}
                            {fare.isRefundable ? (
                              <span className="text-[10px] font-bold text-green-600 shrink-0">Refundable</span>
                            ) : (
                              <span className="text-[10px] font-bold text-red-500 shrink-0">Non-Refundable</span>
                            )}
                            <span className="hidden sm:flex items-center gap-1.5 shrink-0">
                              {fare.fareInclusions?.some(inc => inc.toLowerCase().includes("meal")) && (
                                <span className="text-[10px] text-emerald-600" title="Meal included"><Utensils size={10} /></span>
                              )}
                              {fare.fareInclusions?.some(inc => inc.toLowerCase().includes("lounge")) && (
                                <span className="text-[10px] text-purple-600" title="Lounge access"><Armchair size={10} /></span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
                            <p className="text-lg font-black font-mono text-brand-charcoal">{formatCurrency(fare.price)}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelection(fare);
                              }}
                              className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-brand-antique-gold text-white hover:bg-brand-emerald transition-colors cursor-pointer min-h-[36px]"
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
  };

  return (
    <>
      <Navbar onLoginClick={() => setShowLogin(true)} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />

      <main className="min-h-screen pt-16 bg-brand-ivory">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Breadcrumb items={[
            { name: "Home", href: "/" },
            { name: "Flights", href: "/flights" },
          ]} />
        </div>
        <BreadcrumbJsonLd items={[
          { name: "Home", href: "/" },
          { name: "Flights", href: "/flights" },
        ]} />
        <FlightJsonLd flights={filteredResults} />
        {/* Hero */}
        <section className="py-12 bg-brand-emerald">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/20 flex items-center justify-center">
                <Plane size={28} className="text-white" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-white mb-1">Search Flights</h1>
              <p className="text-white/70 text-sm">Find the best airfares worldwide</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-xl"
            >
              {/* Trip Type Tabs */}
              <div className="flex gap-1 mb-4 bg-brand-ivory rounded-xl p-1 w-full flex-wrap">
                {(["one-way", "return", "multi-city"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTripType(t)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                      tripType === t
                        ? "bg-brand-antique-gold text-white shadow-sm"
                        : "text-slate-600 hover:text-brand-charcoal"
                    }`}
                  >
                    {t === "one-way" ? "One Way" : t === "return" ? "Return" : "Multi-city"}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <CitySearchDropdown
                  value={originCity.name}
                  onChange={setOriginCity}
                  placeholder="Search airport..."
                  label="From"
                  mode="flight"
                />
                <CitySearchDropdown
                  value={destinationCity.name}
                  onChange={setDestinationCity}
                  placeholder="Search airport..."
                  label="To"
                  mode="flight"
                />
                {tripType === "one-way" ? (
                  <DateRangePicker
                    mode="single"
                    startDate={departDate}
                    onStartDateChange={setDepartDate}
                    minDate={new Date()}
                    label="Departure"
                  />
                ) : tripType === "return" ? (
                  <div className="md:col-span-2">
                    <DateRangePicker
                      mode="range"
                      startDate={departDate}
                      endDate={returnDate}
                      onStartDateChange={setDepartDate}
                      onEndDateChange={setReturnDate}
                      minDate={new Date()}
                      label="Departure / Return"
                      showNightsCount={false}
                    />
                  </div>
                ) : (
                  <div className="md:col-span-3 space-y-3">
                    {multiCityLegs.map((leg, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1 block">
                              From
                            </label>
                            <CitySearchDropdown
                              value={leg.origin.name}
                              onChange={(city) => {
                                const next = [...multiCityLegs];
                                next[i] = { ...next[i], origin: city };
                                setMultiCityLegs(next);
                              }}
                              placeholder="Origin airport"
                              className="w-full"
                              mode="flight"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1 block">
                              To
                            </label>
                            <CitySearchDropdown
                              value={leg.destination.name}
                              onChange={(city) => {
                                const next = [...multiCityLegs];
                                next[i] = { ...next[i], destination: city };
                                setMultiCityLegs(next);
                              }}
                              placeholder="Destination airport"
                              className="w-full"
                              mode="flight"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1 block">
                              Date
                            </label>
                            <input
                              type="date"
                              value={leg.date}
                              min={i > 0 && multiCityLegs[i - 1]?.date ? multiCityLegs[i - 1].date : todayStr()}
                              onChange={(e) => {
                                const next = [...multiCityLegs];
                                next[i] = { ...next[i], date: e.target.value };
                                setMultiCityLegs(next);
                              }}
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-5">
                          {multiCityLegs.length > 2 && (
                            <button
                              onClick={() => setMultiCityLegs(multiCityLegs.filter((_, idx) => idx !== i))}
                              className="p-2 rounded-lg border border-dashed border-slate-200 text-slate-600 hover:text-red-500 hover:border-red-300 transition-colors cursor-pointer"
                              title="Remove leg"
                            >
                              <Minus size={16} />
                            </button>
                          )}
                          {i === multiCityLegs.length - 1 && (
                            <button
                              onClick={() => setMultiCityLegs([...multiCityLegs, { origin: leg.destination, destination: leg.origin, date: "" }])}
                              className="p-2 rounded-lg border border-dashed border-slate-200 text-slate-600 hover:text-brand-antique-gold hover:border-brand-antique-gold transition-colors cursor-pointer"
                              title="Add leg"
                            >
                              <Plus size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Passenger + Cabin Popover */}
                <div ref={passengerRef} className="relative">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-600 mb-1.5 block">
                    Passengers & Cabin
                  </label>
                  <button
                    onClick={() => setShowPassengerPopover(!showPassengerPopover)}
                    className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm flex items-center justify-between gap-2 cursor-pointer hover:border-brand-antique-gold/30 transition-colors focus:ring-2 focus:ring-brand-antique-gold focus:ring-offset-2 outline-none"
                  >
                    <span className="flex items-center gap-2">
                      <Users size={14} className="text-slate-600" />
                      <span className="text-brand-charcoal font-medium">{totalPassengers}</span>
                      <span className="text-slate-600">{totalPassengers === 1 ? "Passenger" : "Passengers"}</span>
                      <span className="text-slate-600/50 mx-1">·</span>
                      <span className="text-slate-600">{cabinClass}</span>
                    </span>
                    <ChevronDown size={14} className={`text-slate-600 transition-transform ${showPassengerPopover ? "rotate-180" : ""}`} />
                  </button>

                  {showPassengerPopover && (
                    <div className="absolute left-0 right-0 sm:left-auto sm:right-0 top-full mt-1 z-50 w-full sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4">
                      {showConcierge ? (
                        <div className="text-center py-6">
                          <User size={32} className="mx-auto text-brand-antique-gold mb-3" />
                          <p className="font-bold text-brand-charcoal mb-1">Large Group Booking</p>
                          <p className="text-xs text-slate-600 mb-3">
                            For groups larger than 10 passengers, please contact our concierge.
                          </p>
                          <Link
                            href="/support"
                            className="inline-block px-6 py-2.5 bg-brand-antique-gold text-white rounded-xl font-bold text-sm hover:bg-brand-emerald transition-colors"
                          >
                            Submit to Concierge
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Cabin Class */}
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Cabin Class</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {CABIN_OPTIONS.map((c) => (
                                <button
                                  key={c}
                                  onClick={() => setCabinClass(c)}
                                  className={`px-3 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                                    cabinClass === c
                                      ? "bg-brand-antique-gold text-white border-brand-antique-gold"
                                      : "bg-transparent text-slate-600 border-slate-200"
                                  }`}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Adults */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-brand-charcoal">Adults</p>
                              <p className="text-[10px] text-slate-600">12+ years</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setAdults(Math.max(1, adults - 1))}
                                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-brand-ivory cursor-pointer disabled:opacity-30"
                                disabled={adults <= 1}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-6 text-center font-bold text-brand-charcoal">{adults}</span>
                              <button
                                onClick={() => setAdults(Math.min(9, adults + 1))}
                                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-brand-ivory cursor-pointer disabled:opacity-30"
                                disabled={adults >= 9}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Children */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-brand-charcoal">Children</p>
                              <p className="text-[10px] text-slate-600">2-17 years</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setChildren(Math.max(0, children - 1))}
                                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-brand-ivory cursor-pointer disabled:opacity-30"
                                disabled={children <= 0}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-6 text-center font-bold text-brand-charcoal">{children}</span>
                              <button
                                onClick={() => setChildren(Math.min(9, children + 1))}
                                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-brand-ivory cursor-pointer disabled:opacity-30"
                                disabled={children >= 9}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Child Ages */}
                          {childAges.map((age, i) => (
                            <div key={i} className="flex items-center gap-2 pl-4">
                              <span className="text-[10px] text-slate-600 w-16">Child {i + 1} age</span>
                              <select
                                value={age}
                                onChange={(e) => {
                                  const next = [...childAges];
                                  next[i] = parseInt(e.target.value);
                                  setChildAges(next);
                                }}
                                className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                              >
                                {Array.from({ length: 16 }, (_, i) => i + 2).map((a) => (
                                  <option key={a} value={a}>{a} years</option>
                                ))}
                              </select>
                            </div>
                          ))}

                          {/* Infants */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-brand-charcoal">Infants (lap)</p>
                              <p className="text-[10px] text-slate-600">0-2 years</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setInfants(Math.max(0, infants - 1))}
                                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-brand-ivory cursor-pointer disabled:opacity-30"
                                disabled={infants <= 0}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-6 text-center font-bold text-brand-charcoal">{infants}</span>
                              <button
                                onClick={() => setInfants(Math.min(9, infants + 1))}
                                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-brand-ivory cursor-pointer disabled:opacity-30"
                                disabled={infants >= 9}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {!showConcierge && (
                          <button
                            onClick={() => setShowPassengerPopover(false)}
                            className="w-full mt-4 py-2 bg-brand-antique-gold text-white rounded-xl font-bold text-sm hover:bg-brand-emerald transition-colors cursor-pointer"
                          >
                          Done
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={searching || !originCity.name || !destinationCity.name || (tripType !== "multi-city" && !departDate) || (tripType === "multi-city" && multiCityLegs.some(l => !l.origin.name || !l.destination.name || !l.date))}
                className="mt-4 w-full md:w-auto px-8 py-3 bg-brand-antique-gold text-white rounded-xl font-bold hover:bg-brand-emerald transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {searching ? (
                  <><Loader2 size={18} className="animate-spin" /> Searching...</>
                ) : (
                  <><Search size={18} /> Search Flights</>
                )}
              </button>
            </motion.div>
          </div>
        </section>

        {/* Results */}
        <section className="py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {searching ? (
              <div className="py-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-brand-charcoal mb-2">{statusMessage}</h2>
                  <p className="text-slate-600 text-sm">Checking available routes between {originCity.name} and {destinationCity.name}.</p>
                </div>
                <SearchResultsSkeleton count={4} type="flight" />
              </div>
            ) : !searched ? (
              <div className="text-center py-16">
                <Plane size={48} className="mx-auto text-slate-600/50 mb-4" />
                <h2 className="text-xl font-bold text-brand-charcoal mb-2">Search for flights</h2>
                <p className="text-slate-600">Enter your travel details above to find the best flight deals.</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16">
                {searchError ? (
                  <>
                    <AlertCircle size={48} className="mx-auto text-red-300 mb-4" />
                    <h2 className="text-xl font-bold text-brand-charcoal mb-2">Search Failed</h2>
                    <p className="text-slate-600 mb-4">{searchError}</p>
                    <button
                      onClick={handleSearch}
                      className="px-6 py-2.5 bg-brand-antique-gold text-white rounded-xl font-semibold text-sm hover:bg-brand-emerald transition-colors cursor-pointer inline-flex items-center gap-2"
                    >
                      <RefreshCw size={16} /> Try Again
                    </button>
                  </>
                ) : (
                  <>
                    <Plane size={48} className="mx-auto text-slate-600/50 mb-4" />
                    <h2 className="text-xl font-bold text-brand-charcoal mb-2">No flights found</h2>
                    <p className="text-slate-600">Try different dates or routes.</p>
                  </>
                )}
              </div>
            ) : (
              <div>
                {/* Sort + Filter Bar */}
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <SortBar
                    options={[
                      { value: "best", label: "Best" },
                      { value: "cheapest", label: "Cheapest" },
                      { value: "fastest", label: "Fastest" },
                      { value: "departure", label: "Departure" },
                      { value: "arrival", label: "Arrival" },
                    ]}
                    activeSort={sortBy}
                    onSortChange={(s) => setSortBy(s as FlightSortKey)}
                  />
                  <div className="flex items-center gap-2">
                    <FilterPanel
                      type="flight"
                      filters={filters}
                      onChange={(f) => {
                        Object.keys(f).forEach((key) => {
                          updateFilter(key as keyof typeof filters, f[key as keyof typeof f]);
                        });
                      }}
                      onReset={resetFilters}
                      resultCount={filteredResults.length}
                    />
                  </div>
                </div>

                {/* Active Filter Chips */}
                {hasActiveFilters && (
                  <FilterChips
                    chips={[
                      ...filters.stops.map((s) => ({
                        key: `stops-${s}`,
                        label: s === 0 ? "Non-stop" : s === 1 ? "1 Stop" : "2+ Stops",
                        onRemove: () => updateFilter("stops", filters.stops.filter((v) => v !== s)),
                      })),
                      ...filters.airlines.map((a) => ({
                        key: `airline-${a}`,
                        label: a,
                        onRemove: () => updateFilter("airlines", filters.airlines.filter((v) => v !== a)),
                      })),
                      ...filters.departureTime.map((t) => ({
                        key: `time-${t}`,
                        label: t.replace("_", " "),
                        onRemove: () => updateFilter("departureTime", filters.departureTime.filter((v) => v !== t)),
                      })),
                    ]}
                    onClearAll={resetFilters}
                    resultCount={filteredResults.length}
                    totalCount={results.length}
                    className="mb-4"
                  />
                )}

                {isReturnTrip && outboundFlights.length > 0 && inboundFlights.length > 0 ? (
                  <>
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-5 bg-brand-antique-gold rounded-full" />
                        <h3 className="text-lg font-serif font-bold text-brand-charcoal">Outbound</h3>
                        <p className="text-xs text-slate-600 ml-auto">{outboundGroups.length} flights</p>
                      </div>
                      <div className="space-y-3">
                        {outboundGroups.map((group, i) => renderFlightCard(group.representative, i, group.fares.length, group.key))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-5 bg-brand-gold rounded-full" />
                        <h3 className="text-lg font-serif font-bold text-brand-charcoal">Inbound</h3>
                        <p className="text-xs text-slate-600 ml-auto">{inboundGroups.length} flights</p>
                      </div>
                      <div className="space-y-3">
                        {inboundGroups.map((group, i) => renderFlightCard(group.representative, i, group.fares.length, group.key))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 mb-4">{groupedResults.length} flights found</p>
                    {groupedResults.length === 0 && results.length > 0 && (
                      <div className="text-center py-12">
                        <Plane size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium mb-1">No flights match your filters</p>
                        <button onClick={resetFilters} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer">Clear all filters</button>
                      </div>
                    )}
                    <div className="space-y-3">
                      {groupedResults.map((group, i) => renderFlightCard(group.representative, i, group.fares.length, group.key))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Multi-leg booking bar */}
        {isReturnTrip && allLegsSelected && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-2xl px-6 py-4"
          >
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                {Array.from(flightSelections.entries()).map(([leg, f]) => (
                  <div key={leg} className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="text-[10px] font-bold uppercase text-slate-600">{leg}</span>
                    <span className="font-semibold text-brand-charcoal">{f.airline} {f.flightNumber}</span>
                    <span className="text-slate-600">{f.origin}→{f.destination}</span>
                    <span className="font-mono font-bold text-brand-charcoal text-xs sm:text-sm">{formatCurrency(f.price)}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  if (!user) {
                    setShowLogin(true);
                  } else {
                    setShowBookingModal(true);
                  }
                }}
                className="px-4 sm:px-8 py-3 bg-brand-antique-gold text-white rounded-xl font-bold hover:bg-brand-emerald transition-colors cursor-pointer"
              >
                {user ? `Book ${flightSelections.size} Flights` : "Sign in to Book"}
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Flight Detail Modal */}
        {selectedFlight && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center sm:p-4">
            <div className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-md" onClick={() => setSelectedFlight(null)} />
            <div
              className="relative z-10 bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden p-5 sm:p-8 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-200"
            >
              <button onClick={() => setSelectedFlight(null)} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 hover:text-brand-charcoal cursor-pointer rounded-xl hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-ivory flex items-center justify-center">
                  <Plane size={32} className="text-brand-antique-gold" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-brand-charcoal">{selectedFlight.airline}</h2>
                <p className="text-slate-600">{selectedFlight.flightNumber}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-brand-ivory rounded-xl">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-brand-charcoal">{formatFlightTime(selectedFlight.departureTime, selectedFlight.origin)}</p>
                    <p className="text-xs text-slate-600">{formatFlightDate(selectedFlight.departureTime)}</p>
                    <p className="text-sm text-slate-600 font-semibold mt-0.5">{selectedFlight.origin}</p>
                  </div>
            <div className="hidden sm:flex flex-col items-center">
                    <Clock size={16} className="text-slate-600 mb-1" />
                    <p className="text-sm font-medium text-brand-charcoal">{selectedFlight.duration}</p>
                    <p className="text-xs font-medium text-slate-600">{selectedFlight.stops === 0 ? "Non-stop" : `${selectedFlight.stops} stop${selectedFlight.stops > 1 ? "s" : ""}`}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-brand-charcoal">{formatFlightTime(selectedFlight.arrivalTime, selectedFlight.destination)}</p>
                    <p className="text-xs text-slate-600">{formatFlightDate(selectedFlight.arrivalTime)}</p>
                    <p className="text-sm text-slate-600 font-semibold mt-0.5">{selectedFlight.destination}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-brand-ivory rounded-xl">
                    <p className="text-[10px] text-slate-600 uppercase">Tier</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getTierColor(selectedFlight.tier)}`}>
                      {selectedFlight.tier}
                    </span>
                  </div>
                  <div className="p-3 bg-brand-ivory rounded-xl">
                    <p className="text-[10px] text-slate-600 uppercase">Fare Type</p>
                    {selectedFlight.fareType && selectedFlight.fareType !== "Unknown" ? (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getFareTypeColor(selectedFlight.fareType)}`}>
                        {formatFareType(selectedFlight.fareType)}
                      </span>
                    ) : (
                      <p className="text-sm font-medium text-brand-charcoal">Standard</p>
                    )}
                  </div>
                </div>

                {selectedFlight.fareInclusions && selectedFlight.fareInclusions.length > 0 && (
                  <div className="p-4 bg-brand-ivory rounded-xl">
                    <p className="text-[10px] text-slate-600 uppercase mb-2">What's Included</p>
                    <div className="space-y-1.5">
                      {selectedFlight.fareInclusions.map((inc, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-brand-charcoal/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald flex-shrink-0" />
                          {inc}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedFlight.isRefundable !== undefined && (
                  <div className="p-3 bg-brand-ivory rounded-xl">
                    <p className="text-[10px] text-slate-600 uppercase mb-1">Cancellation Policy</p>
                    <p className="text-xs text-brand-charcoal/80">
                      {selectedFlight.isRefundable
                        ? "This fare is refundable. Cancellation charges may apply as per airline policy."
                        : "This fare is non-refundable. Changes may be subject to fees."}
                    </p>
                    {selectedFlight.penalty && (
                      <p className="text-xs text-slate-600 mt-1">{selectedFlight.penalty}</p>
                    )}
                  </div>
                )}

                {selectedFlight.lastTicketDate && (
                  <div className="p-3 bg-brand-champagne/20 rounded-xl">
                    <p className="text-[10px] text-brand-antique-gold uppercase mb-1">Last Ticket Date</p>
                    <p className="text-xs font-medium text-brand-charcoal">{selectedFlight.lastTicketDate}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-3xl font-black font-mono text-brand-charcoal">{formatCurrency(selectedFlight.price)}</p>
                      <p className="text-xs text-slate-600">total for {totalPassengers} pax</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!user) {
                        setShowLogin(true);
                      } else {
                        setBookingFlight(selectedFlight);
                        setShowBookingModal(true);
                      }
                    }}
                    className="w-full py-3 bg-brand-antique-gold text-white rounded-xl font-bold hover:bg-brand-emerald transition-colors cursor-pointer"
                  >
                    {user ? "Book Now" : "Sign in to Book"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Flight Booking Modal */}
      {showBookingModal && bookingFlights.length > 0 && (
        <FlightBookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setBookingFlight(null);
            setSelectedFlight(null);
          }}
          flights={bookingFlights}
          user={user}
          date={departDate}
          passengerCount={totalPassengers}
          adults={adults}
          children={children}
          infants={infants}
          traceId={searchTraceId}
          childAges={childAges}
        />
      )}

      <Footer />
    </>
  );
}


