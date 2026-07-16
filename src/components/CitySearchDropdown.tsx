"use client";

import { useState, useEffect, useRef } from "react";
import { Command } from "cmdk";

export interface City {
  code: string;
  name: string;
  state: string;
  source: "tbo" | "fallback";
  iata_code?: string;
}

interface CitySearchDropdownProps {
  value: string;
  onChange: (city: City) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  countryCode?: string;
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

const FALLBACK_CITIES: City[] = [
  { code: "15648", name: "Goa", state: "Goa", source: "fallback", iata_code: "GOI" },
  { code: "13484", name: "Mumbai", state: "Maharashtra", source: "fallback", iata_code: "BOM" },
  { code: "13482", name: "Delhi", state: "Delhi", source: "fallback", iata_code: "DEL" },
  { code: "14565", name: "Bangalore", state: "Karnataka", source: "fallback", iata_code: "BLR" },
  { code: "15664", name: "Hyderabad", state: "Telangana", source: "fallback", iata_code: "HYD" },
  { code: "14564", name: "Chennai", state: "Tamil Nadu", source: "fallback", iata_code: "MAA" },
  { code: "15197", name: "Jaipur", state: "Rajasthan", source: "fallback", iata_code: "JAI" },
  { code: "13543", name: "Kolkata", state: "West Bengal", source: "fallback", iata_code: "CCU" },
  { code: "14612", name: "Pune", state: "Maharashtra", source: "fallback", iata_code: "PNQ" },
  { code: "123608", name: "Kodaikanal", state: "Tamil Nadu", source: "fallback" },
  { code: "13014", name: "Ooty", state: "Tamil Nadu", source: "fallback" },
  { code: "12597", name: "Manali", state: "Himachal Pradesh", source: "fallback" },
];

export default function CitySearchDropdown({
  value,
  onChange,
  placeholder = "Search cities...",
  label = "Location",
  className = "",
  countryCode: initialCountryCode = "IN",
}: CitySearchDropdownProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [countryCode, setCountryCode] = useState(initialCountryCode);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cities/tbo?countryCode=${countryCode}`)
      .then((r) => r.json())
      .then((data) => {
        setCities(data.cities || []);
      })
      .catch(() => {
        if (countryCode === "IN") {
          setCities(FALLBACK_CITIES);
        } else {
          setCities([]);
        }
      })
      .finally(() => setLoading(false));
  }, [countryCode]);

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
  };

  // Show popular cities first, then alphabetical
  const popularNames = ["Goa", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Jaipur", "Kolkata", "Pune"];
  const popular = cities.filter(c => popularNames.includes(c.name));
  const rest = cities.filter(c => !popularNames.includes(c.name));

  const renderCityItem = (city: City, isPopular: boolean) => (
    <Command.Item
      key={city.code}
      value={city.name}
      onSelect={() => handleSelect(city)}
      className="px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-emerald-50 data-[selected=true]:bg-emerald-50 flex items-center justify-between"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={isPopular ? "font-medium text-slate-900" : "text-slate-700"}>
          {city.name}
        </span>
        {city.state && (
          <span className="text-[11px] text-slate-400 truncate">· {city.state}</span>
        )}
      </div>
      {city.source === "fallback" && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 bg-amber-100 text-amber-700">
          Fallback
        </span>
      )}
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
          {value || placeholder}
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
          <Command shouldFilter={true} className="max-h-72 overflow-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 space-y-2">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {COUNTRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    onClick={() => {
                      setCountryCode(opt.code);
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
                placeholder={placeholder}
                className="w-full text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <Command.List className="py-1">
              {loading && (
                <Command.Loading>
                  <div className="px-3 py-2 text-xs text-slate-400">Loading cities...</div>
                </Command.Loading>
              )}
              <Command.Empty>
                <div className="px-3 py-2 text-xs text-slate-400">No cities found.</div>
              </Command.Empty>

              {/* Popular cities group */}
              {popular.length > 0 && (
                <Command.Group heading="Popular" className="px-1">
                  {popular.map((city) => renderCityItem(city, true))}
                </Command.Group>
              )}

              {/* All cities group */}
              {rest.length > 0 && (
                <Command.Group heading="All Cities" className="px-1">
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
