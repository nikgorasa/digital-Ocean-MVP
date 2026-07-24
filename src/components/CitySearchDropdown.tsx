"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

export interface City {
  code: string;
  name: string;
  state: string;
  source: "tbo" | "fallback" | "db";
  iata_code?: string;
  airport_name?: string;
  country_code?: string;
  flag?: string;
  group?: string;
}

interface CitySearchDropdownProps {
  value: string;
  onChange: (city: City) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  countryCode?: string;
  mode?: "hotel" | "flight";
}

const ALL_AIRPORTS: City[] = [
  { code: "13484", name: "Mumbai", state: "Maharashtra", source: "fallback", iata_code: "BOM", airport_name: "Chhatrapati Shivaji Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "13482", name: "Delhi", state: "Delhi", source: "fallback", iata_code: "DEL", airport_name: "Indira Gandhi Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "14565", name: "Bangalore", state: "Karnataka", source: "fallback", iata_code: "BLR", airport_name: "Kempegowda Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "15664", name: "Hyderabad", state: "Telangana", source: "fallback", iata_code: "HYD", airport_name: "Rajiv Gandhi Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "14564", name: "Chennai", state: "Tamil Nadu", source: "fallback", iata_code: "MAA", airport_name: "Chennai Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "15648", name: "Goa", state: "Goa", source: "fallback", iata_code: "GOI", airport_name: "Dabolim Airport", country_code: "IN", flag: "🇮🇳" },
  { code: "15197", name: "Jaipur", state: "Rajasthan", source: "fallback", iata_code: "JAI", airport_name: "Jaipur Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "13543", name: "Kolkata", state: "West Bengal", source: "fallback", iata_code: "CCU", airport_name: "Netaji Subhas Chandra Bose Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "14612", name: "Pune", state: "Maharashtra", source: "fallback", iata_code: "PNQ", airport_name: "Pune Airport", country_code: "IN", flag: "🇮🇳" },
  { code: "13084", name: "Ahmedabad", state: "Gujarat", source: "fallback", iata_code: "AMD", airport_name: "Sardar Vallabhbhai Patel Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "13085", name: "Kochi", state: "Kerala", source: "fallback", iata_code: "COK", airport_name: "Cochin Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "13086", name: "Thiruvananthapuram", state: "Kerala", source: "fallback", iata_code: "TRV", airport_name: "Trivandrum Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "13087", name: "Lucknow", state: "Uttar Pradesh", source: "fallback", iata_code: "LKO", airport_name: "Chaudhary Charan Singh Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "13088", name: "Guwahati", state: "Assam", source: "fallback", iata_code: "GAU", airport_name: "Lokpriya Gopinath Bordoloi Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "13089", name: "Varanasi", state: "Uttar Pradesh", source: "fallback", iata_code: "VNS", airport_name: "Lal Bahadur Shastri Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "27604", name: "Ayodhya", state: "Uttar Pradesh", source: "fallback", iata_code: "AYJ", airport_name: "Maharshi Valmiki Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "13544", name: "Prayagraj", state: "Uttar Pradesh", source: "fallback", iata_code: "IXD", airport_name: "Prayagraj Airport", country_code: "IN", flag: "🇮🇳" },
  { code: "13096a", name: "Kozhikode", state: "Kerala", source: "fallback", iata_code: "CCJ", airport_name: "Calicut Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "13096b", name: "Belagavi", state: "Karnataka", source: "fallback", iata_code: "IXG", airport_name: "Belagavi Airport", country_code: "IN", flag: "🇮🇳" },
  { code: "13090", name: "Indore", state: "Madhya Pradesh", source: "fallback", iata_code: "IDR", airport_name: "Devi Ahilyabai Holkar Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "13091", name: "Nagpur", state: "Maharashtra", source: "fallback", iata_code: "NAG", airport_name: "Dr. Babasaheb Ambedkar Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "13092", name: "Visakhapatnam", state: "Andhra Pradesh", source: "fallback", iata_code: "VTZ", airport_name: "Visakhapatnam Airport", country_code: "IN", flag: "🇮🇳" },
  { code: "13093", name: "Coimbatore", state: "Tamil Nadu", source: "fallback", iata_code: "CJB", airport_name: "Coimbatore Airport", country_code: "IN", flag: "🇮🇳" },
  { code: "13094", name: "Madurai", state: "Tamil Nadu", source: "fallback", iata_code: "IXM", airport_name: "Madurai Airport", country_code: "IN", flag: "🇮🇳" },
  { code: "13095", name: "Dubai", state: "Dubai", source: "fallback", iata_code: "DXB", airport_name: "Dubai Intl", country_code: "AE", flag: "🇦🇪" },
  { code: "13096", name: "Abu Dhabi", state: "Abu Dhabi", source: "fallback", iata_code: "AUH", airport_name: "Zayed Intl", country_code: "AE", flag: "🇦🇪" },
  { code: "13097", name: "Sharjah", state: "Sharjah", source: "fallback", iata_code: "SHJ", airport_name: "Sharjah Intl", country_code: "AE", flag: "🇦🇪" },
  { code: "13098", name: "Bangkok", state: "Bangkok", source: "fallback", iata_code: "BKK", airport_name: "Suvarnabhumi Intl", country_code: "TH", flag: "🇹🇭" },
  { code: "13099", name: "Phuket", state: "Phuket", source: "fallback", iata_code: "HKT", airport_name: "Phuket Intl", country_code: "TH", flag: "🇹🇭" },
  { code: "13100", name: "Chiang Mai", state: "Chiang Mai", source: "fallback", iata_code: "CNX", airport_name: "Chiang Mai Intl", country_code: "TH", flag: "🇹🇭" },
  { code: "13103", name: "Singapore", state: "Singapore", source: "fallback", iata_code: "SIN", airport_name: "Changi Airport", country_code: "SG", flag: "🇸🇬" },
  { code: "13104", name: "Kuala Lumpur", state: "Federal Territory", source: "fallback", iata_code: "KUL", airport_name: "Kuala Lumpur Intl", country_code: "MY", flag: "🇲🇾" },
  { code: "13107", name: "Colombo", state: "Western", source: "fallback", iata_code: "CMB", airport_name: "Bandaranaike Intl", country_code: "LK", flag: "🇱🇰" },
  { code: "13108", name: "Male", state: "Male", source: "fallback", iata_code: "MLE", airport_name: "Velana Intl", country_code: "MV", flag: "🇲🇻" },
  { code: "13110", name: "Bali", state: "Bali", source: "fallback", iata_code: "DPS", airport_name: "Ngurah Rai Intl", country_code: "ID", flag: "🇮🇩" },
  { code: "13112", name: "Istanbul", state: "Istanbul", source: "fallback", iata_code: "IST", airport_name: "Istanbul Airport", country_code: "TR", flag: "🇹🇷" },
  { code: "13113", name: "London", state: "England", source: "fallback", iata_code: "LHR", airport_name: "Heathrow Airport", country_code: "GB", flag: "🇬🇧" },
  { code: "13116", name: "New York", state: "New York", source: "fallback", iata_code: "JFK", airport_name: "John F Kennedy Intl", country_code: "US", flag: "🇺🇸" },
  { code: "13117", name: "Los Angeles", state: "California", source: "fallback", iata_code: "LAX", airport_name: "Los Angeles Intl", country_code: "US", flag: "🇺🇸" },
  { code: "13118", name: "San Francisco", state: "California", source: "fallback", iata_code: "SFO", airport_name: "San Francisco Intl", country_code: "US", flag: "🇺🇸" },
  { code: "13121", name: "Paris", state: "Ile-de-France", source: "fallback", iata_code: "CDG", airport_name: "Charles de Gaulle", country_code: "FR", flag: "🇫🇷" },
  { code: "13123", name: "Berlin", state: "Berlin", source: "fallback", iata_code: "BER", airport_name: "Berlin Brandenburg", country_code: "DE", flag: "🇩🇪" },
  { code: "13126", name: "Sydney", state: "New South Wales", source: "fallback", iata_code: "SYD", airport_name: "Kingsford Smith Airport", country_code: "AU", flag: "🇦🇺" },
  { code: "13128", name: "Tokyo", state: "Tokyo", source: "fallback", iata_code: "NRT", airport_name: "Narita Intl", country_code: "JP", flag: "🇯🇵" },
  { code: "13130", name: "Hong Kong", state: "Hong Kong", source: "fallback", iata_code: "HKG", airport_name: "Hong Kong Intl", country_code: "HK", flag: "🇭🇰" },
  { code: "13132", name: "Seoul", state: "Seoul", source: "fallback", iata_code: "ICN", airport_name: "Incheon Intl", country_code: "KR", flag: "🇰🇷" },
  { code: "13135", name: "Riyadh", state: "Riyadh", source: "fallback", iata_code: "RUH", airport_name: "King Khalid Intl", country_code: "SA", flag: "🇸🇦" },
  { code: "13137", name: "Doha", state: "Ad Dawhah", source: "fallback", iata_code: "DOH", airport_name: "Hamad Intl", country_code: "QA", flag: "🇶🇦" },
];

const POPULAR_IATA = ["BOM", "DEL", "DXB", "BKK", "SIN", "LHR"];
const POPULAR_HOTEL_CITIES = ["Goa", "Mumbai", "Dubai", "Bangkok", "Singapore", "Delhi"];
const RECENT_KEY = "gorasa_recent_airports";
const MAX_RECENT = 5;

function getRecentSearches(airports: City[]): City[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const codes: string[] = JSON.parse(raw);
    return codes.map(code => airports.find(a => a.iata_code === code)).filter(Boolean) as City[];
  } catch { return []; }
}

function saveRecentSearch(iataCode: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const codes: string[] = raw ? JSON.parse(raw) : [];
    const updated = [iataCode, ...codes.filter(c => c !== iataCode)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {}
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function CitySearchDropdown({
  value, onChange, placeholder = "Search cities...", label = "Location", className = "", mode = "hotel",
}: CitySearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [recentSearches, setRecentSearches] = useState<City[]>([]);
  const [hotelCities, setHotelCities] = useState<City[]>([]);
  const [dbAirports, setDbAirports] = useState<City[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debouncedSearch = useDebounce(search, 250);

  useEffect(() => {
    if (mode !== "flight") return;
    const controller = new AbortController();
    async function fetchAirports(q: string) {
      setDbLoading(true);
      try {
        const url = q ? `/api/cities/airports?q=${encodeURIComponent(q)}&limit=60` : `/api/cities/airports?limit=60`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const mapped: City[] = (data.airports || []).map((a: any) => ({
          code: a.code || a.iata_code, name: a.name, state: a.airport_name || "",
          source: "db" as const, iata_code: a.iata_code, airport_name: a.airport_name,
          country_code: a.country_code, flag: a.flag, group: a.group,
        }));
        setDbAirports(mapped);
      } catch (err: any) {
        if (err.name !== "AbortError") setDbAirports(ALL_AIRPORTS);
      } finally { setDbLoading(false); }
    }
    fetchAirports(debouncedSearch);
    return () => controller.abort();
  }, [mode, debouncedSearch]);

  useEffect(() => {
    if (mode !== "hotel") return;
    fetch("/api/cities/tbo")
      .then(r => r.json())
      .then(data => setHotelCities(data.cities || []))
      .catch(() => setHotelCities([]));
  }, [mode]);

  useEffect(() => {
    const airports = mode === "flight" ? (dbAirports.length ? dbAirports : ALL_AIRPORTS) : hotelCities;
    setRecentSearches(getRecentSearches(airports));
  }, [mode, dbAirports, hotelCities]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback((city: City) => {
    onChange(city);
    setOpen(false);
    setSearch("");
    setSelectedIndex(-1);
    if (city.iata_code) {
      saveRecentSearch(city.iata_code);
      const airports = mode === "flight" ? (dbAirports.length ? dbAirports : ALL_AIRPORTS) : hotelCities;
      setRecentSearches(getRecentSearches(airports));
    }
  }, [onChange, mode, dbAirports, hotelCities]);

  const query = search.toLowerCase().trim();
  const dataSource = mode === "hotel" ? hotelCities : (dbAirports.length ? dbAirports : ALL_AIRPORTS);

  const filteredAirports = query
    ? dataSource.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.iata_code?.toLowerCase().includes(query) ||
        c.airport_name?.toLowerCase().includes(query) ||
        c.state?.toLowerCase().includes(query) ||
        c.country_code?.toLowerCase().includes(query)
      ).slice(0, 20)
    : [];

  const popular = query ? [] : dataSource.filter(c =>
      mode === "hotel" ? POPULAR_HOTEL_CITIES.includes(c.name) : POPULAR_IATA.includes(c.iata_code || "")
    );

  const recent = query ? [] : recentSearches.filter(c =>
      mode === "hotel" ? !POPULAR_HOTEL_CITIES.includes(c.name) : !POPULAR_IATA.includes(c.iata_code || "")
    );

  const allItems = query ? filteredAirports : [...recent, ...popular];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) { if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, allItems.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && selectedIndex >= 0 && allItems[selectedIndex]) { e.preventDefault(); handleSelect(allItems[selectedIndex]); }
    else if (e.key === "Escape") { setOpen(false); setSelectedIndex(-1); }
  };

  const renderItem = (city: City, idx: number) => (
    <div
      key={`${city.code}-${city.iata_code || city.name}`}
      onClick={() => handleSelect(city)}
      className={`px-3 py-2 text-sm cursor-pointer transition-colors rounded-lg ${selectedIndex === idx ? "bg-emerald-50" : "hover:bg-emerald-50"}`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 min-w-0">
          {city.flag && <span className="text-sm leading-none">{city.flag}</span>}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-800">{city.name}</span>
            {mode === "flight" && city.iata_code && (
              <span className="text-[10px] font-mono font-bold text-brand-antique-gold bg-brand-antique-gold/10 px-1.5 py-0.5 rounded">{city.iata_code}</span>
            )}
            {mode === "hotel" && city.state && <span className="text-[11px] text-slate-400">{city.state}</span>}
          </div>
        </div>
        {mode === "flight" && <span className="text-[10px] text-slate-400 truncate ml-2 hidden sm:inline">{city.airport_name}</span>}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">{label}</label>}
      <div
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm cursor-pointer flex items-center justify-between hover:border-brand-saffron/30 transition-colors focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none"
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>{value || placeholder}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-[320px] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 z-10">
              <input
                ref={inputRef}
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedIndex(-1); }}
                onKeyDown={handleKeyDown}
                placeholder={mode === "flight" ? "Search by city, airport, or code..." : "Search city..."}
                className="w-full text-sm outline-none placeholder:text-slate-400"
              />
              {mode === "flight" && dbLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="py-1 overflow-y-auto flex-1 overscroll-contain">
              {filteredAirports.length === 0 && query && !dbLoading && (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs text-slate-400">{mode === "hotel" ? "No cities found" : "No airports found"} for &ldquo;{search}&rdquo;</p>
                </div>
              )}
              {query && filteredAirports.map((city, i) => renderItem(city, i))}
              {!query && (
                <>
                  {mode === "hotel" && hotelCities.length === 0 && <div className="px-3 py-4 text-center"><p className="text-xs text-slate-400">Type to search cities</p></div>}
                  {recent.length > 0 && (
                    <div className="px-1">
                      <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Recently Searched</p>
                      {recent.map((city, i) => renderItem(city, i))}
                    </div>
                  )}
                  {popular.length > 0 && (
                    <div className="px-1">
                      <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{mode === "hotel" ? "Popular Destinations" : "Popular Airports"}</p>
                      {popular.map((city, i) => renderItem(city, recent.length + i))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
