"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/hooks/useAuth";
import { useDemoMode } from "@/hooks/useDemoMode";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency } from "@/lib";
import { parseFareType, parseFareInclusions, getFareTypeColor, formatFareType, type FareType } from "@/lib/fare-utils";
import { Plane, Search, Calendar, Users, ArrowRight, Star, Clock, Luggage, X, Loader2, ChevronDown, Minus, Plus, User, AlertCircle, RefreshCw, SlidersHorizontal, Utensils, Armchair } from "lucide-react";
import FlightBookingModal from "@/components/FlightBookingModal";
import CitySearchDropdown from "@/components/CitySearchDropdown";
import DateRangePicker from "@/components/DateRangePicker";
import type { City } from "@/components/CitySearchDropdown";
import { getAirlineLogo } from "@/lib/airline-logos";
import SortBar from "@/components/SortBar";
import FilterChips from "@/components/FilterChips";
import FilterPanel from "@/components/FilterPanel";
import { useFlightFilters } from "@/hooks/useFilters";
import { applyFlightFilters, sortFlights, type FlightSortKey, type FlightResult } from "@/lib/ai/filters/applyFilters";
import Link from "next/link";

interface Flight {
  id: string;
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
}

const CABIN_OPTIONS = ["Economy", "Premium Economy", "Business", "First"] as const;

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
  const { demoMode } = useDemoMode();
  const [showLogin, setShowLogin] = useState(false);
  const [originCity, setOriginCity] = useState<City>({ code: "13484", name: "Mumbai", state: "Maharashtra", source: "fallback", iata_code: "BOM" });
  const [destinationCity, setDestinationCity] = useState<City>({ code: "13482", name: "Delhi", state: "Delhi", source: "fallback", iata_code: "DEL" });
  const [tripType, setTripType] = useState<"one-way" | "return" | "multi-city">("return");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [multiCityDates, setMultiCityDates] = useState<string[]>(["", ""]);
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
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [sortBy, setSortBy] = useState<FlightSortKey>("best");
  const { filters, updateFilter, resetFilters, hasActiveFilters, activeFilterCount } = useFlightFilters();

  const filteredResults = useMemo(() => {
    const filtered = applyFlightFilters(results as FlightResult[], filters);
    return sortFlights(filtered, sortBy) as Flight[];
  }, [results, filters, sortBy]);

  const totalPassengers = adults + children + infants;
  const showConcierge = totalPassengers > 10;

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
    if (tripType === "multi-city" && multiCityDates.some(d => !d)) {
      setSearchError("Please fill in all multi-city leg dates.");
      setSearched(true);
      return;
    }
    setSearching(true);
    try {
      const originCode = originCity.iata_code || originCity.name;
      const destCode = destinationCity.iata_code || destinationCity.name;
      const departureDate = tripType === "multi-city" ? multiCityDates[0] : departDate;
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
            multiCityDates: tripType === "multi-city" ? multiCityDates : undefined,
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
        tier: CABIN_CLASS_MAP[f.cabinClass as number] || f.cabinClass || "Economy",
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

  const formatFlightTime = (iso: string) => {
    const parts = iso.split("T");
    if (parts.length < 2) return iso;
    const time = parts[1].slice(0, 5);
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
      case "Business": return "bg-purple-100 text-purple-700";
      case "Flexi Plus": return "bg-blue-100 text-blue-700";
      case "Standard": return "bg-green-100 text-green-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <>
      <Navbar onLoginClick={() => setShowLogin(true)} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />

      <main className="min-h-screen pt-16" style={{ backgroundColor: "#F5EFE0" }}>
        {/* Hero */}
        <section className="py-12" style={{ backgroundColor: "#D97706" }}>
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
              <p className="text-white/70 text-sm">Find the best airfares across India</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-xl"
            >
              {/* Trip Type Tabs */}
              <div className="flex gap-1 mb-4 bg-slate-100 rounded-xl p-1 w-fit">
                {(["one-way", "return", "multi-city"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTripType(t)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                      tripType === t
                        ? "bg-brand-saffron text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
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
                  placeholder="Search cities..."
                  label="From"
                />
                <CitySearchDropdown
                  value={destinationCity.name}
                  onChange={setDestinationCity}
                  placeholder="Search cities..."
                  label="To"
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
                      showNightsCount={true}
                    />
                  </div>
                ) : (
                  <div className="md:col-span-2 space-y-2">
                    {multiCityDates.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                            Leg {i + 1}
                          </label>
                          <input
                            type="date"
                            value={d}
                            min={i > 0 && multiCityDates[i - 1] ? multiCityDates[i - 1] : todayStr()}
                            onChange={(e) => {
                              const next = [...multiCityDates];
                              next[i] = e.target.value;
                              setMultiCityDates(next);
                            }}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-1 mt-5">
                          {multiCityDates.length > 2 && (
                            <button
                              onClick={() => setMultiCityDates(multiCityDates.filter((_, idx) => idx !== i))}
                              className="p-2 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:text-red-500 hover:border-red-300 transition-colors cursor-pointer"
                              title="Remove leg"
                            >
                              <Minus size={16} />
                            </button>
                          )}
                          {i === multiCityDates.length - 1 && (
                            <button
                              onClick={() => setMultiCityDates([...multiCityDates, ""])}
                              className="p-2 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:text-[#D97706] hover:border-[#D97706] transition-colors cursor-pointer"
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
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                    Passengers & Cabin
                  </label>
                  <button
                    onClick={() => setShowPassengerPopover(!showPassengerPopover)}
                    className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm flex items-center justify-between gap-2 cursor-pointer hover:border-brand-saffron/30 transition-colors focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none"
                  >
                    <span className="flex items-center gap-2">
                      <Users size={14} className="text-slate-400" />
                      <span className="text-slate-900 font-medium">{totalPassengers}</span>
                      <span className="text-slate-500">{totalPassengers === 1 ? "Passenger" : "Passengers"}</span>
                      <span className="text-slate-300 mx-1">·</span>
                      <span className="text-slate-500">{cabinClass}</span>
                    </span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${showPassengerPopover ? "rotate-180" : ""}`} />
                  </button>

                  {showPassengerPopover && (
                    <div className="absolute left-0 right-0 sm:left-auto sm:right-0 top-full mt-1 z-50 w-full sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4">
                      {showConcierge ? (
                        <div className="text-center py-6">
                          <User size={32} className="mx-auto text-[#D97706] mb-3" />
                          <p className="font-bold text-slate-900 mb-1">Large Group Booking</p>
                          <p className="text-xs text-slate-500 mb-3">
                            For groups larger than 10 passengers, please contact our concierge.
                          </p>
                          <Link
                            href="/support"
                            style={{ backgroundColor: "#D97706" }}
                            className="inline-block px-6 py-2.5 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                          >
                            Submit to Concierge
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Cabin Class */}
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Cabin Class</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {CABIN_OPTIONS.map((c) => (
                                <button
                                  key={c}
                                  onClick={() => setCabinClass(c)}
                                  style={{
                                    backgroundColor: cabinClass === c ? "#D97706" : "transparent",
                                    color: cabinClass === c ? "#fff" : "#64748b",
                                    borderColor: cabinClass === c ? "#D97706" : "#e2e8f0",
                                  }}
                                  className="px-3 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all"
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Adults */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">Adults</p>
                              <p className="text-[10px] text-slate-400">12+ years</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setAdults(Math.max(1, adults - 1))}
                                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-30"
                                disabled={adults <= 1}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-6 text-center font-bold text-slate-900">{adults}</span>
                              <button
                                onClick={() => setAdults(Math.min(9, adults + 1))}
                                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-30"
                                disabled={adults >= 9}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Children */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">Children</p>
                              <p className="text-[10px] text-slate-400">2-17 years</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setChildren(Math.max(0, children - 1))}
                                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-30"
                                disabled={children <= 0}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-6 text-center font-bold text-slate-900">{children}</span>
                              <button
                                onClick={() => setChildren(Math.min(9, children + 1))}
                                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-30"
                                disabled={children >= 9}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Child Ages */}
                          {childAges.map((age, i) => (
                            <div key={i} className="flex items-center gap-2 pl-4">
                              <span className="text-[10px] text-slate-400 w-16">Child {i + 1} age</span>
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
                              <p className="text-sm font-semibold text-slate-900">Infants (lap)</p>
                              <p className="text-[10px] text-slate-400">0-2 years</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setInfants(Math.max(0, infants - 1))}
                                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-30"
                                disabled={infants <= 0}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-6 text-center font-bold text-slate-900">{infants}</span>
                              <button
                                onClick={() => setInfants(Math.min(9, infants + 1))}
                                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-30"
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
                          style={{ backgroundColor: "#D97706" }}
                          className="w-full mt-4 py-2 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer"
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
                disabled={searching || !originCity.name || !destinationCity.name || (tripType !== "multi-city" && !departDate) || (tripType === "multi-city" && multiCityDates.some(d => !d))}
                className="mt-4 w-full md:w-auto px-8 py-3 bg-brand-saffron text-white rounded-xl font-bold hover:bg-brand-burnt transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
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
              <div className="text-center py-16">
                <Loader2 size={32} className="mx-auto animate-spin text-blue-600 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Searching flights...</h2>
                <p className="text-slate-500">Checking available routes between {originCity.name} and {destinationCity.name}.</p>
              </div>
            ) : !searched ? (
              <div className="text-center py-16">
                <Plane size={48} className="mx-auto text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Search for flights</h2>
                <p className="text-slate-500">Enter your travel details above to find the best flight deals.</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16">
                {searchError ? (
                  <>
                    <AlertCircle size={48} className="mx-auto text-red-300 mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Search Failed</h2>
                    <p className="text-slate-500 mb-4">{searchError}</p>
                    <button
                      onClick={handleSearch}
                      className="px-6 py-2.5 bg-brand-saffron text-white rounded-xl font-semibold text-sm hover:bg-brand-burnt transition-colors cursor-pointer inline-flex items-center gap-2"
                    >
                      <RefreshCw size={16} /> Try Again
                    </button>
                  </>
                ) : (
                  <>
                    <Plane size={48} className="mx-auto text-slate-300 mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">No flights found</h2>
                    <p className="text-slate-500">Try different dates or routes.</p>
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

                <p className="text-sm text-slate-500 mb-4">{filteredResults.length} flights found</p>
                <div className="space-y-3">
                  {filteredResults.map((flight, i) => (
                    <motion.div
                      key={flight.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedFlight(flight)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden">
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
                          <div>
                            <p className="font-bold text-slate-900">{flight.airline}</p>
                            <p className="text-xs text-slate-500">{flight.flightNumber}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {flight.baggage && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
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

                        <div className="flex items-center gap-10">
                          <div className="text-center min-w-[72px]">
                            <p className="text-lg font-bold text-slate-900">{formatFlightTime(flight.departureTime)}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{formatFlightDate(flight.departureTime)}</p>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">{flight.origin}</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <p className="text-xs font-medium text-slate-500">{flight.duration}</p>
                            <div className="w-24 h-0.5 bg-slate-300 my-1.5 rounded-full" />
                            <p className="text-xs font-medium text-slate-500">{flight.stops === 0 ? "Non-stop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}</p>
                          </div>
                          <div className="text-center min-w-[72px]">
                            <p className="text-lg font-bold text-slate-900">{formatFlightTime(flight.arrivalTime)}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{formatFlightDate(flight.arrivalTime)}</p>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">{flight.destination}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getTierColor(flight.tier)}`}>
                            {flight.tier}
                          </span>
                          <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(flight.price)}</p>
                          <p className="text-[10px] text-slate-400">total for {totalPassengers} pax</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Flight Detail Modal */}
      <AnimatePresence>
        {selectedFlight && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedFlight(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8"
            >
              <button onClick={() => setSelectedFlight(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Plane size={32} className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-slate-900">{selectedFlight.airline}</h2>
                <p className="text-slate-500">{selectedFlight.flightNumber}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{formatFlightTime(selectedFlight.departureTime)}</p>
                    <p className="text-xs text-slate-400">{formatFlightDate(selectedFlight.departureTime)}</p>
                    <p className="text-sm text-slate-500 font-semibold mt-0.5">{selectedFlight.origin}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Clock size={16} className="text-slate-400 mb-1" />
                    <p className="text-sm font-medium text-slate-700">{selectedFlight.duration}</p>
                    <p className="text-xs font-medium text-slate-400">{selectedFlight.stops === 0 ? "Non-stop" : `${selectedFlight.stops} stop${selectedFlight.stops > 1 ? "s" : ""}`}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{formatFlightTime(selectedFlight.arrivalTime)}</p>
                    <p className="text-xs text-slate-400">{formatFlightDate(selectedFlight.arrivalTime)}</p>
                    <p className="text-sm text-slate-500 font-semibold mt-0.5">{selectedFlight.destination}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase">Tier</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getTierColor(selectedFlight.tier)}`}>
                      {selectedFlight.tier}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase">Fare Type</p>
                    {selectedFlight.fareType && selectedFlight.fareType !== "Unknown" ? (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getFareTypeColor(selectedFlight.fareType)}`}>
                        {formatFareType(selectedFlight.fareType)}
                      </span>
                    ) : (
                      <p className="text-sm font-medium text-slate-900">Standard</p>
                    )}
                  </div>
                </div>

                {selectedFlight.fareInclusions && selectedFlight.fareInclusions.length > 0 && (
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase mb-2">What's Included</p>
                    <div className="space-y-1.5">
                      {selectedFlight.fareInclusions.map((inc, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          {inc}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedFlight.isRefundable !== undefined && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase mb-1">Cancellation Policy</p>
                    <p className="text-xs text-slate-600">
                      {selectedFlight.isRefundable
                        ? "This fare is refundable. Cancellation charges may apply as per airline policy."
                        : "This fare is non-refundable. Changes may be subject to fees."}
                    </p>
                    {selectedFlight.penalty && (
                      <p className="text-xs text-slate-500 mt-1">{selectedFlight.penalty}</p>
                    )}
                  </div>
                )}

                {selectedFlight.lastTicketDate && (
                  <div className="p-3 bg-amber-50 rounded-xl">
                    <p className="text-[10px] text-amber-600 uppercase mb-1">Last Ticket Date</p>
                    <p className="text-xs font-medium text-amber-700">{selectedFlight.lastTicketDate}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-3xl font-black font-mono text-slate-900">{formatCurrency(selectedFlight.price)}</p>
                      <p className="text-xs text-slate-400">total for {totalPassengers} pax</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!user) {
                        setShowLogin(true);
                      } else {
                        setShowBookingModal(true);
                      }
                    }}
                    className="w-full py-3 bg-brand-saffron text-white rounded-xl font-bold hover:bg-brand-burnt transition-colors cursor-pointer active:scale-[0.98]"
                  >
                    {user ? "Book Now" : "Sign in to Book"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Flight Booking Modal */}
      {selectedFlight && (
        <FlightBookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          flight={selectedFlight}
          user={user}
          date={departDate}
          passengerCount={totalPassengers}
          traceId={searchTraceId}
        />
      )}

      <Footer />
    </>
  );
}
