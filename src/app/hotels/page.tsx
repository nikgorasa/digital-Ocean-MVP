"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/hooks/useAuth";
import { useDemoMode } from "@/hooks/useDemoMode";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency, getCurrencyForCountry } from "@/lib";
import { formatMealPlan } from "@/lib/format-meal-plan";
import { getCancellationSummary } from "@/lib/format-cancel-policy";
import { Building2, Search, MapPin, X, Star, Wifi, Coffee, Car, Loader2, ChevronDown, Bed, Users, Minus, Plus, User, SlidersHorizontal } from "lucide-react";
import HotelBookingModal from "@/components/HotelBookingModal";
import CitySearchDropdown from "@/components/CitySearchDropdown";
import DateRangePicker from "@/components/DateRangePicker";
import SortBar from "@/components/SortBar";
import FilterChips from "@/components/FilterChips";
import FilterPanel from "@/components/FilterPanel";
import Breadcrumb, { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import { useHotelFilters } from "@/hooks/useFilters";
import { applyHotelFilters, sortHotels, type HotelSortKey, type HotelResult } from "@/lib/ai/filters/applyFilters";
import type { City } from "@/components/CitySearchDropdown";
import type { TBODisplayHotel, TBODisplayRoom } from "@/lib/tbo-hotel-types";
import Link from "next/link";
import Image from "next/image";
import { SearchResultsSkeleton } from "@/components/ui/Skeleton";

function HotelJsonLd({ hotels, cityName }: { hotels: TBODisplayHotel[]; cityName: string }) {
  if (hotels.length === 0) return null;
  const schemas = hotels.slice(0, 10).map((hotel) => ({
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotel.name,
    address: {
      "@type": "PostalAddress",
      addressLocality: hotel.address || cityName,
      addressCountry: "IN",
    },
    starRating: {
      "@type": "Rating",
      ratingValue: STAR_MAP[hotel.rating] || 3,
    },
    priceRange: hotel.price ? `₹${hotel.price}` : undefined,
    image: hotel.picture || undefined,
    description: hotel.description || undefined,
    aggregateRating: hotel.tripAdvisorRating > 0 ? {
      "@type": "AggregateRating",
      ratingValue: hotel.tripAdvisorRating,
      bestRating: 5,
    } : undefined,
  }));
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.length === 1 ? schemas[0] : schemas) }}
    />
  );
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const STAR_LABELS: Record<string, string> = {
  OneStar: "★",
  TwoStar: "★★",
  ThreeStar: "★★★",
  FourStar: "★★★★",
  FiveStar: "★★★★★",
};

const STAR_MAP: Record<string, number> = {
  OneStar: 1, TwoStar: 2, ThreeStar: 3, FourStar: 4, FiveStar: 5,
};

interface RoomConfig {
  adults: number;
  children: number;
  childAges: number[];
}

function makeRoom(adults = 2, children = 0): RoomConfig {
  return { adults, children, childAges: Array(children).fill(5) };
}

export default function HotelsPage() {
  const { user } = useAuth();
  const { demoMode } = useDemoMode();
  const [showLogin, setShowLogin] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City>({ code: "15648", name: "Goa", state: "Goa", source: "fallback" });
  const [hotelCountryCode, setHotelCountryCode] = useState("IN");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomCount, setRoomCount] = useState(1);
  const [roomConfigs, setRoomConfigs] = useState<RoomConfig[]>([makeRoom()]);
  const [showRoomPopover, setShowRoomPopover] = useState(false);
  const roomRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<TBODisplayHotel[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<TBODisplayHotel | null>(null);
  const [hotelRooms, setHotelRooms] = useState<TBODisplayRoom[]>([]);
  const [hotelRoomsLoading, setHotelRoomsLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<TBODisplayRoom | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [searchTraceId, setSearchTraceId] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [sortBy, setSortBy] = useState<HotelSortKey>("recommended");
  const { filters, updateFilter, resetFilters, hasActiveFilters, activeFilterCount } = useHotelFilters();
  const [error, setError] = useState("");
  const [hotelNameFilter, setHotelNameFilter] = useState("");

  const filteredResults = useMemo(() => {
    let filtered = results;
    if (hotelNameFilter.trim()) {
      const q = hotelNameFilter.toLowerCase();
      filtered = filtered.filter(h => h.name.toLowerCase().includes(q));
    }
    const applyFiltered = applyHotelFilters(filtered as HotelResult[], filters);
    return sortHotels(applyFiltered, sortBy) as TBODisplayHotel[];
  }, [results, filters, sortBy, hotelNameFilter]);

  const showConcierge = roomCount > 9;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (roomRef.current && !roomRef.current.contains(e.target as Node)) {
        setShowRoomPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setRoomConfigs((prev) => {
      if (roomCount > prev.length) {
        const added = Array.from({ length: roomCount - prev.length }, () => makeRoom());
        return [...prev, ...added];
      }
      return prev.slice(0, roomCount);
    });
  }, [roomCount]);

  const totalGuests = roomConfigs.reduce((s, r) => s + r.adults + r.children, 0);
  const nights = Math.max(1, Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
  ));

  const handleSearch = async () => {
    if (!selectedCity.name) return;
    if (!checkIn || !checkOut) {
      setError("Please select check-in and check-out dates.");
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError("Check-out must be after check-in.");
      return;
    }
    setLoading(true);
    setSearched(true);
    setError("");

    try {
      const RoomGuests = roomConfigs.map((r) => ({
        AdultCount: r.adults,
        ChildCount: r.children,
        ChildAge: r.childAges,
      }));

      const res = await fetch("/api/tbo-hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "search",
          params: {
            CheckInDate: checkIn,
            CheckOutDate: checkOut,
            CountryName: hotelCountryCode === "IN" ? "India" : hotelCountryCode,
            CityName: selectedCity.name,
            CityCode: selectedCity.code,
            IsNearBySearchAllowed: false,
            NoOfRooms: roomCount,
            GuestNationality: hotelCountryCode,
            RoomGuests,
            PreferredCurrency: getCurrencyForCountry(hotelCountryCode),
            ResultCount: 0,
            countryCode: hotelCountryCode,
            Filters: { StarRating: "All", OrderBy: "PriceAsc" },
          },
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setResults([]);
      } else {
        setResults(data.hotels || []);
        setSessionId(data.sessionId || "");
        setSearchTraceId(data.traceId || "");
      }
    } catch (e) {
      setError("Failed to search hotels. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHotelClick = async (hotel: TBODisplayHotel) => {
    setSelectedHotel(hotel);
    setSelectedRoom(null);
    setHotelRoomsLoading(true);

    try {
      if (hotel.rooms && hotel.rooms.length > 0) {
        setHotelRooms(hotel.rooms);
        if (hotel.rooms.length > 0) setSelectedRoom(hotel.rooms[0]);
      } else {
        setHotelRooms([]);
      }
    } catch {
      setHotelRooms([]);
    } finally {
      setHotelRoomsLoading(false);
    }
  };

  const getStarColor = (stars: number) => {
    if (stars >= 5) return "text-brand-antique-gold";
    if (stars >= 4) return "text-brand-antique-gold";
    return "text-brand-champagne";
  };

  return (
    <>
      <Navbar onLoginClick={() => setShowLogin(true)} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />

      <main className="min-h-screen pt-16 bg-brand-ivory">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Breadcrumb items={[
            { name: "Home", href: "/" },
            { name: "Hotels", href: "/hotels" },
          ]} />
        </div>
        <BreadcrumbJsonLd items={[
          { name: "Home", href: "/" },
          { name: "Hotels", href: "/hotels" },
        ]} />
        <HotelJsonLd hotels={filteredResults} cityName={selectedCity.name} />
        {/* Hero */}
        <section className="py-12 bg-brand-emerald">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/20 flex items-center justify-center">
                <Building2 size={28} className="text-white" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-white mb-1">Search Hotels</h1>
              <p className="text-white/70 text-sm">Global hotel inventory at best rates</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <CitySearchDropdown
                  value={selectedCity.name}
                  onChange={setSelectedCity}
                  placeholder="Search cities..."
                  label="Location"
                  countryCode={hotelCountryCode}
                />
                <div className="md:col-span-2">
                  <DateRangePicker
                    mode="range"
                    startDate={checkIn}
                    endDate={checkOut}
                    onStartDateChange={setCheckIn}
                    onEndDateChange={setCheckOut}
                    minDate={new Date()}
                    label="Check-in / Check-out"
                    showNightsCount={true}
                  />
                </div>

                {/* Rooms Configuration */}
                <div ref={roomRef} className="relative">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-brand-sand mb-1.5 block">
                    Rooms & Guests
                  </label>
                  <button
                    onClick={() => setShowRoomPopover(!showRoomPopover)}
                    className="w-full px-3 py-3 bg-white border border-brand-sand/30 rounded-xl text-sm flex items-center justify-between gap-2 cursor-pointer hover:border-brand-antique-gold/30 transition-colors focus:ring-2 focus:ring-brand-antique-gold focus:ring-offset-2 outline-none"
                  >
                      <span className="flex items-center gap-2">
                      <Users size={14} className="text-brand-sand" />
                      <span className="text-brand-charcoal font-medium">{roomCount}</span>
                      <span className="text-brand-sand">{roomCount === 1 ? "Room" : "Rooms"}</span>
                      <span className="text-brand-sand/50 mx-1">·</span>
                      <span className="text-brand-sand">{totalGuests} {totalGuests === 1 ? "Guest" : "Guests"}</span>
                    </span>
                    <ChevronDown size={14} className={`text-brand-sand transition-transform ${showRoomPopover ? "rotate-180" : ""}`} />
                  </button>

                  {showRoomPopover && (
                    <div className="absolute left-0 right-0 sm:left-auto sm:right-0 top-full mt-1 z-50 w-full sm:w-80 bg-white rounded-2xl shadow-xl border border-brand-sand/30 p-4">
                      {showConcierge ? (
                        <div className="text-center py-6">
                          <User size={32} className="mx-auto text-brand-antique-gold mb-3" />
                          <p className="font-bold text-brand-charcoal mb-1">Large Group Booking</p>
                          <p className="text-xs text-brand-sand mb-3">
                            For more than 9 rooms, please contact our concierge.
                          </p>
                          <Link
                            href="/support"
                            className="inline-block px-6 py-2.5 bg-brand-antique-gold text-white rounded-xl font-bold text-sm hover:bg-brand-emerald transition-colors"
                          >
                            Submit query to Concierge
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Room Count */}
                          <div className="flex items-center justify-between pb-3 border-b border-brand-sand/20">
                            <p className="text-sm font-semibold text-brand-charcoal">Rooms</p>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setRoomCount(Math.max(1, roomCount - 1))}
                                className="w-8 h-8 rounded-full border border-brand-sand/30 flex items-center justify-center text-brand-sand hover:bg-brand-ivory cursor-pointer disabled:opacity-30"
                                disabled={roomCount <= 1}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-6 text-center font-bold text-brand-charcoal">{roomCount}</span>
                              <button
                                onClick={() => setRoomCount(Math.min(10, roomCount + 1))}
                                className="w-8 h-8 rounded-full border border-brand-sand/30 flex items-center justify-center text-brand-sand hover:bg-brand-ivory cursor-pointer disabled:opacity-30"
                                disabled={roomCount >= 10}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Per Room Configuration */}
                          {roomConfigs.map((r, i) => (
                            <div key={i} className="pb-3 border-b border-brand-sand/20 last:border-0">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-sand mb-2">
                                Room {i + 1}
                              </p>

                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-brand-sand">Adults</span>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => {
                                      const next = [...roomConfigs];
                                      next[i] = { ...next[i], adults: Math.max(1, next[i].adults - 1) };
                                      setRoomConfigs(next);
                                    }}
                                    className="w-7 h-7 rounded-full border border-brand-sand/30 flex items-center justify-center text-brand-sand hover:bg-brand-ivory cursor-pointer disabled:opacity-30"
                                    disabled={r.adults <= 1}
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="w-5 text-center font-bold text-sm text-brand-charcoal">{r.adults}</span>
                                  <button
                                    onClick={() => {
                                      const next = [...roomConfigs];
                                      next[i] = { ...next[i], adults: Math.min(9, next[i].adults + 1) };
                                      setRoomConfigs(next);
                                    }}
                                    className="w-7 h-7 rounded-full border border-brand-sand/30 flex items-center justify-center text-brand-sand hover:bg-brand-ivory cursor-pointer disabled:opacity-30"
                                    disabled={r.adults >= 9}
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-xs text-brand-sand">Children (0-17)</span>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => {
                                      const next = [...roomConfigs];
                                      const newChildren = Math.max(0, next[i].children - 1);
                                      next[i] = {
                                        ...next[i],
                                        children: newChildren,
                                        childAges: next[i].childAges.slice(0, newChildren),
                                      };
                                      setRoomConfigs(next);
                                    }}
                                    className="w-7 h-7 rounded-full border border-brand-sand/30 flex items-center justify-center text-brand-sand hover:bg-brand-ivory cursor-pointer disabled:opacity-30"
                                    disabled={r.children <= 0}
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="w-5 text-center font-bold text-sm text-brand-charcoal">{r.children}</span>
                                  <button
                                    onClick={() => {
                                      const next = [...roomConfigs];
                                      next[i] = {
                                        ...next[i],
                                        children: Math.min(9, next[i].children + 1),
                                        childAges: [...next[i].childAges, 5],
                                      };
                                      setRoomConfigs(next);
                                    }}
                                    className="w-7 h-7 rounded-full border border-brand-sand/30 flex items-center justify-center text-brand-sand hover:bg-brand-ivory cursor-pointer disabled:opacity-30"
                                    disabled={r.children >= 9}
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </div>

                              {/* Child Age Selectors */}
                              {r.childAges.map((age, ci) => (
                                <div key={ci} className="flex items-center gap-2 mt-1.5 pl-4">
                                  <span className="text-[10px] text-brand-sand">Child {ci + 1} age</span>
                                  <select
                                    value={age}
                                    onChange={(e) => {
                                      const next = [...roomConfigs];
                                      const ages = [...next[i].childAges];
                                      ages[ci] = parseInt(e.target.value);
                                      next[i] = { ...next[i], childAges: ages };
                                      setRoomConfigs(next);
                                    }}
                                    className="flex-1 px-2 py-1 bg-white border border-brand-sand/30 rounded-lg text-xs outline-none"
                                  >
                                    {Array.from({ length: 18 }, (_, i) => i).map((a) => (
                                      <option key={a} value={a}>{a} {a === 0 || a === 1 ? "year" : "years"}</option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {!showConcierge && (
                          <button
                          onClick={() => setShowRoomPopover(false)}
                          className="w-full mt-4 py-2.5 bg-brand-antique-gold text-white rounded-xl font-bold text-sm hover:bg-brand-emerald transition-colors cursor-pointer"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={loading || !checkIn || !checkOut || !selectedCity.name}
                className="mt-4 w-full md:w-auto px-8 py-3 bg-brand-antique-gold text-white rounded-xl font-bold hover:bg-brand-emerald transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                {loading ? "Searching..." : "Search Hotels"}
              </button>
            </motion.div>
          </div>
        </section>

        {/* Results */}
        <section className="py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {!searched ? (
              <div className="text-center py-16">
                <Building2 size={48} className="mx-auto text-brand-sand/50 mb-4" />
                <h2 className="text-xl font-bold text-brand-charcoal mb-2">Search Hotels</h2>
                <p className="text-brand-sand">Enter your destination and dates to find hotels from our global inventory.</p>
              </div>
            ) : loading ? (
              <div className="py-6">
                <div className="text-center mb-6">
                  <p className="text-brand-sand text-sm">Searching hotels in {selectedCity.name}...</p>
                </div>
                <SearchResultsSkeleton count={3} type="hotel" />
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <Building2 size={48} className="mx-auto text-red-300 mb-4" />
                <h2 className="text-xl font-bold text-brand-charcoal mb-2">Search Error</h2>
                <p className="text-red-500">{error}</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16">
                <Building2 size={48} className="mx-auto text-brand-sand/50 mb-4" />
                <h2 className="text-xl font-bold text-brand-charcoal mb-2">No hotels found</h2>
                <p className="text-brand-sand">Try a different location or dates.</p>
              </div>
            ) : (
              <div>
                {/* Sort + Filter Bar */}
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <div className="relative flex-1 max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={hotelNameFilter}
                      onChange={(e) => setHotelNameFilter(e.target.value)}
                      placeholder="Search by hotel name..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-antique-gold/30 outline-none"
                    />
                  </div>
                  <SortBar
                    options={[
                      { value: "recommended", label: "Recommended" },
                      { value: "price_asc", label: "Price: Low" },
                      { value: "price_desc", label: "Price: High" },
                      { value: "star_rating", label: "Stars" },
                      { value: "guest_rating", label: "Rating" },
                    ]}
                    activeSort={sortBy}
                    onSortChange={(s) => setSortBy(s as HotelSortKey)}
                  />
                  <div className="flex items-center gap-2">
                    <FilterPanel
                      type="hotel"
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
                      ...filters.starRating.map((s) => ({
                        key: `star-${s}`,
                        label: `${s} Stars`,
                        onRemove: () => updateFilter("starRating", filters.starRating.filter((v) => v !== s)),
                      })),
                      ...filters.amenities.map((a) => ({
                        key: `amenity-${a}`,
                        label: a,
                        onRemove: () => updateFilter("amenities", filters.amenities.filter((v) => v !== a)),
                      })),
                      ...filters.mealPlan.map((m) => ({
                        key: `meal-${m}`,
                        label: m.replace("_", " "),
                        onRemove: () => updateFilter("mealPlan", filters.mealPlan.filter((v) => v !== m)),
                      })),
                      ...(filters.freeCancellation
                        ? [{ key: "cancel", label: "Free Cancellation", onRemove: () => updateFilter("freeCancellation", false) }]
                        : []),
                    ]}
                    onClearAll={resetFilters}
                    resultCount={filteredResults.length}
                    totalCount={results.length}
                    className="mb-4"
                  />
                )}

                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-brand-sand">{filteredResults.length} hotels found in {selectedCity.name}</p>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Live Inventory</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResults.map((hotel, i) => (
                    <motion.div
                      key={hotel.hotelCode}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl overflow-hidden border border-brand-sand/30 hover:shadow-lg transition-shadow cursor-pointer group"
                      onClick={() => handleHotelClick(hotel)}
                    >
                      <div className="h-48 relative overflow-hidden">
                        {hotel.picture ? (
                          <img
                            src={hotel.picture}
                            alt={hotel.name}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-brand-ivory flex items-center justify-center">
                            <Building2 size={48} className="text-brand-sand" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          {hotel.source === "fallback" && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500 text-white">
                              Fallback
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[11px] px-2 py-1 rounded-lg">
                          {STAR_LABELS[hotel.rating] || "★★★"}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-brand-charcoal line-clamp-1">
                          {hotel.name}
                        </h3>
                        <p className="text-xs text-brand-sand flex items-center gap-1 mt-1">
                          <MapPin size={12} />
                          {hotel.address || selectedCity.name}
                        </p>
                        {hotel.tripAdvisorRating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={10} className="fill-brand-antique-gold text-brand-antique-gold" />
                            <span className="text-[11px] text-brand-sand">{hotel.tripAdvisorRating}</span>
                          </div>
                        )}
                        <p className="text-xs text-brand-sand/70 mt-2 line-clamp-2">{hotel.description}</p>
                        <div className="mt-3 pt-3 border-t border-brand-sand/20 flex items-center justify-between">
                          <div>
                            <p className="text-xl font-black font-mono text-brand-charcoal">{formatCurrency(Math.round(hotel.price / nights))}</p>
                            <p className="text-[10px] text-brand-sand/70">per night</p>
                          </div>
                          <button className="px-4 py-2 bg-brand-antique-gold text-white rounded-xl text-xs font-bold hover:bg-brand-emerald transition-colors cursor-pointer">
                            View Rooms
                          </button>
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

      {/* Hotel Detail + Room Selection Modal */}
      <AnimatePresence>
        {selectedHotel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-md" onClick={() => { setSelectedHotel(null); setSelectedRoom(null); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="h-56 relative">
                {selectedHotel.picture ? (
                  <img
                    src={selectedHotel.picture}
                    alt={selectedHotel.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-brand-ivory flex items-center justify-center">
                    <Building2 size={64} className="text-brand-sand" />
                  </div>
                )}
                <button onClick={() => { setSelectedHotel(null); setSelectedRoom(null); }} className="absolute top-4 right-4 p-2 bg-white/90 rounded-full">
                  <X size={18} />
                </button>
                <div className="absolute bottom-4 left-4 flex gap-2">
                  {selectedHotel.source === "fallback" && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500 text-white">
                      Fallback
                    </span>
                  )}
                  <span className={`text-xs font-bold px-3 py-1 rounded-full bg-black/60 text-white ${getStarColor(STAR_MAP[selectedHotel.rating] || 3)}`}>
                    {STAR_LABELS[selectedHotel.rating] || "★★★"}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-2xl font-serif font-bold text-brand-charcoal mb-1">{selectedHotel.name}</h2>
                <p className="text-sm text-brand-sand flex items-center gap-1 mb-3">
                  <MapPin size={14} />
                  {selectedHotel.address || selectedCity.name}
                </p>

                <div className="flex items-center gap-3 mb-4">
                  {selectedHotel.tripAdvisorRating > 0 && (
                    <div className="flex items-center gap-1 bg-brand-champagne/20 px-2 py-1 rounded-lg">
                      <Star size={14} className="fill-brand-antique-gold text-brand-antique-gold" />
                      <span className="font-bold text-sm text-brand-charcoal">{selectedHotel.tripAdvisorRating}</span>
                      <span className="text-[10px] text-brand-sand">TripAdvisor</span>
                    </div>
                  )}
                  {hotelRooms.some(r => r.isRefundable) && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-green-100 text-green-700">
                      Free Cancellation Available
                    </span>
                  )}
                </div>

                {/* Room Amenities Summary */}
                {hotelRooms.length > 0 && hotelRooms.some(r => r.amenities && r.amenities.length > 0) && (
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {Array.from(new Set(hotelRooms.flatMap(r => r.amenities || []).slice(0, 6))).map((a) => (
                      <span key={a} className="text-xs bg-brand-ivory text-brand-sand px-2 py-1 rounded-lg flex items-center gap-1">
                        {a === "Free WiFi" && <Wifi size={12} />}
                        {a === "Parking" && <Car size={12} />}
                        {a === "Restaurant" && <Coffee size={12} />}
                        {a}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-brand-charcoal/80 text-sm mb-4">{selectedHotel.description}</p>

                {/* Check-in/out Info */}
                <div className="bg-brand-ivory rounded-xl p-3 mb-4 flex items-center gap-4 text-xs text-brand-sand">
                  <span>Check-in: <strong>{checkIn || "TBD"}</strong></span>
                  <span>Check-out: <strong>{checkOut || "TBD"}</strong></span>
                  <span className="text-brand-antique-gold font-bold">{nights} night{nights > 1 ? "s" : ""}</span>
                  <span className="text-[10px] text-brand-sand/70">Times per hotel policy</span>
                </div>

                {/* Rooms Section */}
                <div className="border-t border-brand-sand/30 pt-4">
                  <h3 className="font-bold text-brand-charcoal mb-3 flex items-center gap-2">
                    <Bed size={16} />
                    Available Rooms
                  </h3>

                  {hotelRoomsLoading ? (
                    <div className="flex items-center justify-center py-6">
                    <Loader2 size={20} className="animate-spin text-brand-antique-gold" />
                    <span className="ml-2 text-sm text-brand-sand">Loading rooms...</span>
                    </div>
                  ) : hotelRooms.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-brand-sand">No room data available for this hotel.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {hotelRooms.map((room) => (
                        <div
                          key={room.roomIndex}
                          onClick={() => setSelectedRoom(room)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedRoom?.roomIndex === room.roomIndex
                              ? "border-brand-antique-gold bg-brand-ivory"
                              : "border-brand-sand/30"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-brand-charcoal">{room.name}</p>
                                {room.isRefundable ? (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">Refundable</span>
                                ) : (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">Non-Refundable</span>
                                )}
                              </div>
                              {room.mealType && room.mealType !== "Room_Only" && (() => {
                                const meal = formatMealPlan(room.mealType);
                                return (
                                  <p className="text-[10px] text-emerald-600 font-medium mt-1">
                                    ✓ {meal.label}{meal.description ? ` — ${meal.description}` : ""} included
                                  </p>
                                );
                              })()}
                                {room.inclusion && (
                                <p className="text-[10px] text-brand-sand mt-1">{room.inclusion}</p>
                              )}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(room.amenities || []).slice(0, 4).map((a) => (
                                  <span key={a} className="text-[10px] bg-brand-ivory text-brand-sand px-1.5 py-0.5 rounded">{a}</span>
                                ))}
                                {(room.amenities || []).length > 4 && (
                                  <span className="text-[10px] text-brand-sand/70">+{room.amenities.length - 4}</span>
                                )}
                              </div>
                              {room.cancelPolicy && (
                                <p className="text-[10px] text-brand-sand/70 mt-1">
                                  {room.cancelPolicy === "Non Refundable" ? "Non-refundable" : `Cancellation: ${room.cancelPolicy}`}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black font-mono text-brand-charcoal">{formatCurrency(room.roomFare + room.roomTax)}</p>
                              <p className="text-[10px] text-brand-sand/70">per night</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Booking Section */}
                {selectedRoom && (
                  <div className="mt-4 pt-4 border-t border-brand-sand/30">
                    <div className="rounded-xl p-4 mb-4 bg-brand-ivory">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-brand-sand">Room Fare ({nights} night{nights > 1 ? "s" : ""})</span>
                        <span className="font-mono font-bold">{formatCurrency(selectedRoom.roomFare * nights)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-brand-sand">Taxes & Fees</span>
                        <span className="font-mono font-bold">{formatCurrency(selectedRoom.totalTax)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-brand-sand/30">
                        <span className="font-bold text-brand-charcoal">Total for {nights} night{nights > 1 ? "s" : ""}</span>
                        <span className="font-mono font-black text-xl text-brand-antique-gold">{formatCurrency(selectedRoom.totalFare + selectedRoom.totalTax)}</span>
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
                      className="w-full py-3 bg-brand-antique-gold text-white rounded-xl font-bold hover:bg-brand-emerald transition-colors cursor-pointer"
                    >
                      {user ? "Book Now" : "Sign in to Book"}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking Modal */}
      {selectedHotel && selectedRoom && (
        <HotelBookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          hotel={selectedHotel}
          room={selectedRoom}
          sessionId={sessionId}
          traceId={searchTraceId}
          user={user}
          location={selectedCity.name}
          checkIn={checkIn}
          checkOut={checkOut}
          guestCount={totalGuests}
        />
      )}

      <Footer />
    </>
  );
}
