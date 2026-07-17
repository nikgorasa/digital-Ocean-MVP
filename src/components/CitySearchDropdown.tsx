"use client";

import { useState, useEffect, useRef } from "react";
import { Command } from "cmdk";

export interface City {
  code: string;
  name: string;
  state: string;
  source: "tbo" | "fallback";
  iata_code?: string;
  airport_name?: string;
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

const COUNTRY_OPTIONS = [
  { code: "IN", label: "India" },
  { code: "AE", label: "UAE" },
  { code: "GB", label: "UK" },
  { code: "US", label: "USA" },
  { code: "SG", label: "Singapore" },
  { code: "TH", label: "Thailand" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "AU", label: "Australia" },
  { code: "JP", label: "Japan" },
  { code: "LK", label: "Sri Lanka" },
  { code: "MV", label: "Maldives" },
  { code: "MY", label: "Malaysia" },
  { code: "HK", label: "Hong Kong" },
];

const FALLBACK_CITIES: Record<string, City[]> = {
  IN: [
    { code: "15648", name: "Goa", state: "Goa", source: "fallback", iata_code: "GOI", airport_name: "Dabolim Airport" },
    { code: "13484", name: "Mumbai", state: "Maharashtra", source: "fallback", iata_code: "BOM", airport_name: "Chhatrapati Shivaji Intl" },
    { code: "13482", name: "Delhi", state: "Delhi", source: "fallback", iata_code: "DEL", airport_name: "Indira Gandhi Intl" },
    { code: "14565", name: "Bangalore", state: "Karnataka", source: "fallback", iata_code: "BLR", airport_name: "Kempegowda Intl" },
    { code: "15664", name: "Hyderabad", state: "Telangana", source: "fallback", iata_code: "HYD", airport_name: "Rajiv Gandhi Intl" },
    { code: "14564", name: "Chennai", state: "Tamil Nadu", source: "fallback", iata_code: "MAA", airport_name: "Chennai Intl" },
    { code: "15197", name: "Jaipur", state: "Rajasthan", source: "fallback", iata_code: "JAI", airport_name: "Jaipur Intl" },
    { code: "13543", name: "Kolkata", state: "West Bengal", source: "fallback", iata_code: "CCU", airport_name: "Netaji Subhas Chandra Bose Intl" },
    { code: "14612", name: "Pune", state: "Maharashtra", source: "fallback", iata_code: "PNQ", airport_name: "Pune Airport" },
    { code: "13084", name: "Ahmedabad", state: "Gujarat", source: "fallback", iata_code: "AMD", airport_name: "Sardar Vallabhbhai Patel Intl" },
    { code: "13085", name: "Kochi", state: "Kerala", source: "fallback", iata_code: "COK", airport_name: "Cochin Intl" },
    { code: "13086", name: "Thiruvananthapuram", state: "Kerala", source: "fallback", iata_code: "TRV", airport_name: "Trivandrum Intl" },
    { code: "13087", name: "Lucknow", state: "Uttar Pradesh", source: "fallback", iata_code: "LKO", airport_name: "Chaudhary Charan Singh Intl" },
    { code: "13088", name: "Guwahati", state: "Assam", source: "fallback", iata_code: "GAU", airport_name: "Lokpriya Gopinath Bordoloi Intl" },
    { code: "13089", name: "Varanasi", state: "Uttar Pradesh", source: "fallback", iata_code: "VNS", airport_name: "Lal Bahadur Shastri Intl" },
  ],
  AE: [
    { code: "13084", name: "Dubai", state: "Dubai", source: "fallback", iata_code: "DXB", airport_name: "Dubai Intl" },
    { code: "13085", name: "Abu Dhabi", state: "Abu Dhabi", source: "fallback", iata_code: "AUH", airport_name: "Zayed Intl" },
    { code: "13086", name: "Sharjah", state: "Sharjah", source: "fallback", iata_code: "SHJ", airport_name: "Sharjah Intl" },
  ],
  TH: [
    { code: "13046", name: "Bangkok", state: "Bangkok", source: "fallback", iata_code: "BKK", airport_name: "Suvarnabhumi Intl" },
    { code: "13047", name: "Phuket", state: "Phuket", source: "fallback", iata_code: "HKT", airport_name: "Phuket Intl" },
    { code: "13048", name: "Chiang Mai", state: "Chiang Mai", source: "fallback", iata_code: "CNX", airport_name: "Chiang Mai Intl" },
  ],
  SG: [
    { code: "13050", name: "Singapore", state: "Singapore", source: "fallback", iata_code: "SIN", airport_name: "Changi Airport" },
  ],
  MY: [
    { code: "13051", name: "Kuala Lumpur", state: "Federal Territory", source: "fallback", iata_code: "KUL", airport_name: "Kuala Lumpur Intl" },
    { code: "13052", name: "Langkawi", state: "Kedah", source: "fallback", iata_code: "LGK", airport_name: "Langkawi Intl" },
    { code: "13053", name: "Penang", state: "Penang", source: "fallback", iata_code: "PEN", airport_name: "Penang Intl" },
  ],
  US: [
    { code: "13054", name: "New York", state: "New York", source: "fallback", iata_code: "JFK", airport_name: "John F Kennedy Intl" },
    { code: "13055", name: "Los Angeles", state: "California", source: "fallback", iata_code: "LAX", airport_name: "Los Angeles Intl" },
    { code: "13056", name: "San Francisco", state: "California", source: "fallback", iata_code: "SFO", airport_name: "San Francisco Intl" },
    { code: "13057", name: "Miami", state: "Florida", source: "fallback", iata_code: "MIA", airport_name: "Miami Intl" },
    { code: "13058", name: "Chicago", state: "Illinois", source: "fallback", iata_code: "ORD", airport_name: "O'Hare Intl" },
  ],
  GB: [
    { code: "13059", name: "London", state: "England", source: "fallback", iata_code: "LHR", airport_name: "Heathrow Airport" },
    { code: "13060", name: "Manchester", state: "England", source: "fallback", iata_code: "MAN", airport_name: "Manchester Airport" },
    { code: "13061", name: "Edinburgh", state: "Scotland", source: "fallback", iata_code: "EDI", airport_name: "Edinburgh Airport" },
  ],
  FR: [
    { code: "13062", name: "Paris", state: "Ile-de-France", source: "fallback", iata_code: "CDG", airport_name: "Charles de Gaulle" },
    { code: "13063", name: "Nice", state: "Provence-Alpes-Cote d'Azur", source: "fallback", iata_code: "NCE", airport_name: "Cote d'Azur Airport" },
  ],
  DE: [
    { code: "13064", name: "Berlin", state: "Berlin", source: "fallback", iata_code: "BER", airport_name: "Berlin Brandenburg" },
    { code: "13065", name: "Munich", state: "Bavaria", source: "fallback", iata_code: "MUC", airport_name: "Franz Josef Strauss Intl" },
    { code: "13066", name: "Frankfurt", state: "Hesse", source: "fallback", iata_code: "FRA", airport_name: "Frankfurt Airport" },
  ],
  AU: [
    { code: "13067", name: "Sydney", state: "New South Wales", source: "fallback", iata_code: "SYD", airport_name: "Kingsford Smith Airport" },
    { code: "13068", name: "Melbourne", state: "Victoria", source: "fallback", iata_code: "MEL", airport_name: "Tullamarine Airport" },
  ],
  JP: [
    { code: "13070", name: "Tokyo", state: "Tokyo", source: "fallback", iata_code: "NRT", airport_name: "Narita Intl" },
    { code: "13071", name: "Osaka", state: "Osaka", source: "fallback", iata_code: "KIX", airport_name: "Kansai Intl" },
  ],
  LK: [
    { code: "13072", name: "Colombo", state: "Western", source: "fallback", iata_code: "CMB", airport_name: "Bandaranaike Intl" },
  ],
  MV: [
    { code: "13074", name: "Male", state: "Male", source: "fallback", iata_code: "MLE", airport_name: "Velana Intl" },
  ],
};

export default function CitySearchDropdown({
  value,
  onChange,
  placeholder = "Search cities...",
  label = "Location",
  className = "",
  countryCode: initialCountryCode = "IN",
  mode = "hotel",
}: CitySearchDropdownProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Flight mode: use only fallback cities (which have IATA airport codes)
    // Hotel mode: fetch from TBO API (hotel city codes)
    if (mode === "flight") {
      setCities(FALLBACK_CITIES[countryCode] || FALLBACK_CITIES["IN"] || []);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/cities/tbo?countryCode=${countryCode}`)
      .then((r) => r.json())
      .then((data) => {
        setCities(data.cities || []);
      })
      .catch(() => {
        setCities(FALLBACK_CITIES[countryCode] || FALLBACK_CITIES["IN"] || []);
      })
      .finally(() => setLoading(false));
  }, [countryCode, mode]);

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

  const handleSelect = (city: City) => {
    onChange(city);
    setOpen(false);
    setSearch("");
  };

  // Filter cities by name OR IATA code OR airport name
  const filteredCities = cities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.iata_code?.toLowerCase().includes(search.toLowerCase()) ||
    c.airport_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Show popular cities first, then alphabetical
  const popularNames = ["Goa", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Jaipur", "Kolkata", "Pune"];
  const popular = filteredCities.filter(c => popularNames.includes(c.name));
  const rest = filteredCities.filter(c => !popularNames.includes(c.name));

  const renderCityItem = (city: City, isPopular: boolean) => (
    <Command.Item
      key={`${city.code}-${city.iata_code || city.name}`}
      value={`${city.name} ${city.iata_code || ""} ${city.airport_name || ""}`}
      onSelect={() => handleSelect(city)}
      className="px-3 py-2.5 text-sm cursor-pointer rounded-lg hover:bg-emerald-50 data-[selected=true]:bg-emerald-50"
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 min-w-0">
          <span className={isPopular ? "font-semibold text-slate-900" : "text-slate-700"}>
            {city.name}
          </span>
          {city.iata_code && (
            <span className="text-xs font-mono font-bold text-brand-antique-gold bg-brand-antique-gold/10 px-1.5 py-0.5 rounded">
              {city.iata_code}
            </span>
          )}
        </div>
        {city.airport_name && (
          <span className="text-[11px] text-slate-400 truncate ml-2">
            {city.airport_name}
          </span>
        )}
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
            // In flight mode, show IATA code alongside city name
            if (mode === "flight") {
              const matchedCity = cities.find(c => c.name === value);
              if (matchedCity?.iata_code) return `${value} (${matchedCity.iata_code})`;
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
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <Command shouldFilter={false} className="max-h-80 overflow-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 space-y-2">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {COUNTRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    onClick={() => {
                      setCountryCode(opt.code);
                      setSearch("");
                    }}
                    className={`px-2 py-1 text-[10px] font-bold rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                      countryCode === opt.code
                        ? "bg-brand-antique-gold text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <Command.Input
                autoFocus
                value={search}
                onValueChange={setSearch}
                placeholder={mode === "flight" ? "Search airport (e.g. Delhi, DEL, BOM)..." : "Search city..."}
                className="w-full text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <Command.List className="py-1">
              {loading && (
                <Command.Loading>
                  <div className="px-3 py-2 text-xs text-slate-400">Loading...</div>
                </Command.Loading>
              )}
              {filteredCities.length === 0 && !loading && (
                <div className="px-3 py-3 text-center">
                  <p className="text-xs text-slate-400">No results for "{search}"</p>
                  {mode === "flight" && (
                    <p className="text-[10px] text-slate-300 mt-1">Try a city name or IATA code (DEL, BOM, GOI)</p>
                  )}
                </div>
              )}

              {/* Popular cities group */}
              {popular.length > 0 && (
                <Command.Group heading={mode === "flight" ? "Popular Airports" : "Popular Cities"} className="px-1">
                  {popular.map((city) => renderCityItem(city, true))}
                </Command.Group>
              )}

              {/* All cities group */}
              {rest.length > 0 && (
                <Command.Group heading={mode === "flight" ? "All Airports" : "All Cities"} className="px-1">
                  {rest.map((city) => renderCityItem(city, false))}
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </div>
      )}
    </div>
  );
}
