"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Command } from "cmdk";

export interface City {
  code: string;
  name: string;
  state: string;
  source: "tbo" | "fallback";
  iata_code?: string;
  airport_name?: string;
  country_code?: string;
  flag?: string;
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

// All airports in one flat list — no country tabs needed
const ALL_AIRPORTS: City[] = [
  // India
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
  { code: "13090", name: "Indore", state: "Madhya Pradesh", source: "fallback", iata_code: "IDR", airport_name: "Devi Ahilyabai Holkar Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "13091", name: "Nagpur", state: "Maharashtra", source: "fallback", iata_code: "NAG", airport_name: "Dr. Babasaheb Ambedkar Intl", country_code: "IN", flag: "🇮🇳" },
  { code: "13092", name: "Visakhapatnam", state: "Andhra Pradesh", source: "fallback", iata_code: "VTZ", airport_name: "Visakhapatnam Airport", country_code: "IN", flag: "🇮🇳" },
  { code: "13093", name: "Coimbatore", state: "Tamil Nadu", source: "fallback", iata_code: "CJB", airport_name: "Coimbatore Airport", country_code: "IN", flag: "🇮🇳" },
  { code: "13094", name: "Madurai", state: "Tamil Nadu", source: "fallback", iata_code: "IXM", airport_name: "Madurai Airport", country_code: "IN", flag: "🇮🇳" },

  // UAE
  { code: "13095", name: "Dubai", state: "Dubai", source: "fallback", iata_code: "DXB", airport_name: "Dubai Intl", country_code: "AE", flag: "🇦🇪" },
  { code: "13096", name: "Abu Dhabi", state: "Abu Dhabi", source: "fallback", iata_code: "AUH", airport_name: "Zayed Intl", country_code: "AE", flag: "🇦🇪" },
  { code: "13097", name: "Sharjah", state: "Sharjah", source: "fallback", iata_code: "SHJ", airport_name: "Sharjah Intl", country_code: "AE", flag: "🇦🇪" },

  // Thailand
  { code: "13098", name: "Bangkok", state: "Bangkok", source: "fallback", iata_code: "BKK", airport_name: "Suvarnabhumi Intl", country_code: "TH", flag: "🇹🇭" },
  { code: "13099", name: "Phuket", state: "Phuket", source: "fallback", iata_code: "HKT", airport_name: "Phuket Intl", country_code: "TH", flag: "🇹🇭" },
  { code: "13100", name: "Chiang Mai", state: "Chiang Mai", source: "fallback", iata_code: "CNX", airport_name: "Chiang Mai Intl", country_code: "TH", flag: "🇹🇭" },
  { code: "13101", name: "Krabi", state: "Krabi", source: "fallback", iata_code: "KBV", airport_name: "Krabi Intl", country_code: "TH", flag: "🇹🇭" },
  { code: "13102", name: "Koh Samui", state: "Surat Thani", source: "fallback", iata_code: "USM", airport_name: "Samui Airport", country_code: "TH", flag: "🇹🇭" },

  // Singapore
  { code: "13103", name: "Singapore", state: "Singapore", source: "fallback", iata_code: "SIN", airport_name: "Changi Airport", country_code: "SG", flag: "🇸🇬" },

  // Malaysia
  { code: "13104", name: "Kuala Lumpur", state: "Federal Territory", source: "fallback", iata_code: "KUL", airport_name: "Kuala Lumpur Intl", country_code: "MY", flag: "🇲🇾" },
  { code: "13105", name: "Langkawi", state: "Kedah", source: "fallback", iata_code: "LGK", airport_name: "Langkawi Intl", country_code: "MY", flag: "🇲🇾" },
  { code: "13106", name: "Penang", state: "Penang", source: "fallback", iata_code: "PEN", airport_name: "Penang Intl", country_code: "MY", flag: "🇲🇾" },

  // Sri Lanka
  { code: "13107", name: "Colombo", state: "Western", source: "fallback", iata_code: "CMB", airport_name: "Bandaranaike Intl", country_code: "LK", flag: "🇱🇰" },

  // Maldives
  { code: "13108", name: "Male", state: "Male", source: "fallback", iata_code: "MLE", airport_name: "Velana Intl", country_code: "MV", flag: "🇲🇻" },

  // Nepal
  { code: "13109", name: "Kathmandu", state: "Bagmati", source: "fallback", iata_code: "KTM", airport_name: "Tribhuvan Intl", country_code: "NP", flag: "🇳🇵" },

  // Indonesia
  { code: "13110", name: "Bali", state: "Bali", source: "fallback", iata_code: "DPS", airport_name: "Ngurah Rai Intl", country_code: "ID", flag: "🇮🇩" },
  { code: "13111", name: "Jakarta", state: "DKI Jakarta", source: "fallback", iata_code: "CGK", airport_name: "Soekarno-Hatta Intl", country_code: "ID", flag: "🇮🇩" },

  // Turkey
  { code: "13112", name: "Istanbul", state: "Istanbul", source: "fallback", iata_code: "IST", airport_name: "Istanbul Airport", country_code: "TR", flag: "🇹🇷" },

  // UK
  { code: "13113", name: "London", state: "England", source: "fallback", iata_code: "LHR", airport_name: "Heathrow Airport", country_code: "GB", flag: "🇬🇧" },
  { code: "13114", name: "Manchester", state: "England", source: "fallback", iata_code: "MAN", airport_name: "Manchester Airport", country_code: "GB", flag: "🇬🇧" },
  { code: "13115", name: "Edinburgh", state: "Scotland", source: "fallback", iata_code: "EDI", airport_name: "Edinburgh Airport", country_code: "GB", flag: "🇬🇧" },

  // USA
  { code: "13116", name: "New York", state: "New York", source: "fallback", iata_code: "JFK", airport_name: "John F Kennedy Intl", country_code: "US", flag: "🇺🇸" },
  { code: "13117", name: "Los Angeles", state: "California", source: "fallback", iata_code: "LAX", airport_name: "Los Angeles Intl", country_code: "US", flag: "🇺🇸" },
  { code: "13118", name: "San Francisco", state: "California", source: "fallback", iata_code: "SFO", airport_name: "San Francisco Intl", country_code: "US", flag: "🇺🇸" },
  { code: "13119", name: "Miami", state: "Florida", source: "fallback", iata_code: "MIA", airport_name: "Miami Intl", country_code: "US", flag: "🇺🇸" },
  { code: "13120", name: "Chicago", state: "Illinois", source: "fallback", iata_code: "ORD", airport_name: "O'Hare Intl", country_code: "US", flag: "🇺🇸" },

  // France
  { code: "13121", name: "Paris", state: "Ile-de-France", source: "fallback", iata_code: "CDG", airport_name: "Charles de Gaulle", country_code: "FR", flag: "🇫🇷" },
  { code: "13122", name: "Nice", state: "Provence", source: "fallback", iata_code: "NCE", airport_name: "Cote d'Azur Airport", country_code: "FR", flag: "🇫🇷" },

  // Germany
  { code: "13123", name: "Berlin", state: "Berlin", source: "fallback", iata_code: "BER", airport_name: "Berlin Brandenburg", country_code: "DE", flag: "🇩🇪" },
  { code: "13124", name: "Munich", state: "Bavaria", source: "fallback", iata_code: "MUC", airport_name: "Franz Josef Strauss Intl", country_code: "DE", flag: "🇩🇪" },
  { code: "13125", name: "Frankfurt", state: "Hesse", source: "fallback", iata_code: "FRA", airport_name: "Frankfurt Airport", country_code: "DE", flag: "🇩🇪" },

  // Australia
  { code: "13126", name: "Sydney", state: "New South Wales", source: "fallback", iata_code: "SYD", airport_name: "Kingsford Smith Airport", country_code: "AU", flag: "🇦🇺" },
  { code: "13127", name: "Melbourne", state: "Victoria", source: "fallback", iata_code: "MEL", airport_name: "Tullamarine Airport", country_code: "AU", flag: "🇦🇺" },

  // Japan
  { code: "13128", name: "Tokyo", state: "Tokyo", source: "fallback", iata_code: "NRT", airport_name: "Narita Intl", country_code: "JP", flag: "🇯🇵" },
  { code: "13129", name: "Osaka", state: "Osaka", source: "fallback", iata_code: "KIX", airport_name: "Kansai Intl", country_code: "JP", flag: "🇯🇵" },

  // Hong Kong
  { code: "13130", name: "Hong Kong", state: "Hong Kong", source: "fallback", iata_code: "HKG", airport_name: "Hong Kong Intl", country_code: "HK", flag: "🇭🇰" },

  // China
  { code: "13131", name: "Shanghai", state: "Shanghai", source: "fallback", iata_code: "PVG", airport_name: "Pudong Intl", country_code: "CN", flag: "🇨🇳" },

  // South Korea
  { code: "13132", name: "Seoul", state: "Seoul", source: "fallback", iata_code: "ICN", airport_name: "Incheon Intl", country_code: "KR", flag: "🇰🇷" },

  // Vietnam
  { code: "13133", name: "Ho Chi Minh City", state: "Ho Chi Minh", source: "fallback", iata_code: "SGN", airport_name: "Tan Son Nhat Intl", country_code: "VN", flag: "🇻🇳" },
  { code: "13134", name: "Hanoi", state: "Hanoi", source: "fallback", iata_code: "HAN", airport_name: "Noi Bai Intl", country_code: "VN", flag: "🇻🇳" },

  // Saudi Arabia
  { code: "13135", name: "Riyadh", state: "Riyadh", source: "fallback", iata_code: "RUH", airport_name: "King Khalid Intl", country_code: "SA", flag: "🇸🇦" },
  { code: "13136", name: "Jeddah", state: "Makkah", source: "fallback", iata_code: "JED", airport_name: "King Abdulaziz Intl", country_code: "SA", flag: "🇸🇦" },

  // Qatar
  { code: "13137", name: "Doha", state: "Ad Dawhah", source: "fallback", iata_code: "DOH", airport_name: "Hamad Intl", country_code: "QA", flag: "🇶🇦" },

  // Oman
  { code: "13138", name: "Muscat", state: "Muscat", source: "fallback", iata_code: "MCT", airport_name: "Muscat Intl", country_code: "OM", flag: "🇴🇲" },

  // Kuwait
  { code: "13139", name: "Kuwait City", state: "Al Asimah", source: "fallback", iata_code: "KWI", airport_name: "Kuwait Intl", country_code: "KW", flag: "🇰🇼" },

  // Egypt
  { code: "13140", name: "Cairo", state: "Cairo", source: "fallback", iata_code: "CAI", airport_name: "Cairo Intl", country_code: "EG", flag: "🇪🇬" },

  // South Africa
  { code: "13141", name: "Johannesburg", state: "Gauteng", source: "fallback", iata_code: "JNB", airport_name: "O.R. Tambo Intl", country_code: "ZA", flag: "🇿🇦" },
];

// Popular airports — shown when no search text (top destinations from India)
const POPULAR_IATA = ["BOM", "DEL", "DXB", "BKK", "SIN", "LHR"];

// Recent searches — stored in localStorage
const RECENT_KEY = "gorasa_recent_airports";
const MAX_RECENT = 5;

function getRecentSearches(): City[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const codes: string[] = JSON.parse(raw);
    return codes
      .map(code => ALL_AIRPORTS.find(a => a.iata_code === code))
      .filter(Boolean) as City[];
  } catch {
    return [];
  }
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

export default function CitySearchDropdown({
  value,
  onChange,
  placeholder = "Search cities...",
  label = "Location",
  className = "",
  mode = "hotel",
}: CitySearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [recentSearches, setRecentSearches] = useState<City[]>([]);
  const [hotelCities, setHotelCities] = useState<City[]>([]);

  // Hotel mode: fetch cities from TBO API
  useEffect(() => {
    if (mode !== "hotel") return;
    fetch("/api/cities/tbo?countryCode=IN")
      .then((r) => r.json())
      .then((data) => setHotelCities(data.cities || []))
      .catch(() => setHotelCities([]));
  }, [mode]);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback((city: City) => {
    onChange(city);
    setOpen(false);
    setSearch("");
    if (city.iata_code) {
      saveRecentSearch(city.iata_code);
      setRecentSearches(getRecentSearches());
    }
  }, [onChange]);

  // Filter airports by name, IATA code, airport name, or country
  const query = search.toLowerCase().trim();
  const dataSource = mode === "hotel" ? hotelCities : ALL_AIRPORTS;
  const filteredAirports = query
    ? dataSource.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.iata_code?.toLowerCase().includes(query) ||
        c.airport_name?.toLowerCase().includes(query) ||
        c.state?.toLowerCase().includes(query) ||
        c.country_code?.toLowerCase().includes(query)
      )
    : [];

  const popular = query
    ? []
    : (mode === "hotel" ? dataSource : ALL_AIRPORTS).filter(c => POPULAR_IATA.includes(c.iata_code || ""));

  const recent = query
    ? []
    : recentSearches.filter(c => !POPULAR_IATA.includes(c.iata_code || ""));

  const renderAirportItem = (city: City, section: "recent" | "popular" | "all") => (
    <Command.Item
      key={`${city.code}-${city.iata_code}`}
      value={`${city.name} ${city.iata_code || ""} ${city.airport_name || ""} ${city.state || ""}`}
      onSelect={() => handleSelect(city)}
      className="px-3 py-2.5 text-sm cursor-pointer rounded-lg hover:bg-emerald-50 data-[selected=true]:bg-emerald-50 transition-colors"
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          {city.flag && <span className="text-base leading-none">{city.flag}</span>}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-800">{city.name}</span>
            {city.iata_code && (
              <span className="text-[11px] font-mono font-bold text-brand-antique-gold bg-brand-antique-gold/10 px-1.5 py-0.5 rounded">
                {city.iata_code}
              </span>
            )}
          </div>
        </div>
        <span className="text-[11px] text-slate-400 truncate ml-2">
          {city.airport_name}
        </span>
      </div>
    </Command.Item>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
          {label}
        </label>
      )}
      <div
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm cursor-pointer flex items-center justify-between hover:border-brand-saffron/30 transition-colors focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none"
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {(() => {
            if (!value) return placeholder;
            if (mode === "flight") {
              const matchedCity = ALL_AIRPORTS.find(c => c.name === value);
              if (matchedCity?.iata_code) return `${matchedCity.flag || ""} ${value} (${matchedCity.iata_code})`;
            }
            return value;
          })()}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <Command shouldFilter={false} className="max-h-80 overflow-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2.5">
              <Command.Input
                autoFocus
                value={search}
                onValueChange={setSearch}
                placeholder={mode === "flight" ? "Search by city, airport, or code (e.g. Dubai, DEL, Heathrow)..." : "Search city..."}
                className="w-full text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <Command.List className="py-1">
              {filteredAirports.length === 0 && query && (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs text-slate-400">No airports found for &ldquo;{search}&rdquo;</p>
                  <p className="text-[10px] text-slate-300 mt-1">Try a city name, airport name, or IATA code</p>
                </div>
              )}

              {/* Recent searches — only when no query */}
              {!query && recent.length > 0 && (
                <Command.Group heading="Recently Searched" className="px-1">
                  {recent.map((city) => renderAirportItem(city, "recent"))}
                </Command.Group>
              )}

              {/* Popular airports — only when no query */}
              {!query && popular.length > 0 && (
                <Command.Group heading="Popular Airports" className="px-1">
                  {popular.map((city) => renderAirportItem(city, "popular"))}
                </Command.Group>
              )}

              {/* Search results or all airports */}
              {query && filteredAirports.length > 0 && (
                <Command.Group heading="Airports" className="px-1">
                  {filteredAirports.slice(0, 30).map((city) => renderAirportItem(city, "all"))}
                </Command.Group>
              )}

              {/* All airports when no query and no recent */}
              {!query && recent.length === 0 && (
                <Command.Group heading={mode === "hotel" ? "All Cities" : "All Airports"} className="px-1">
                  {dataSource.map((city) => renderAirportItem(city, "all"))}
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </div>
      )}
    </div>
  );
}
