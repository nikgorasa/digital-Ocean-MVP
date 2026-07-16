"use client";

import React, { useState } from "react";
import { Phone } from "lucide-react";

const COUNTRY_CODES = [
  { code: "+91", country: "IN", label: "India", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "+1", country: "US", label: "US", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "+44", country: "GB", label: "UK", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "+971", country: "AE", label: "UAE", flag: "\u{1F1E6}\u{1F1EA}" },
  { code: "+65", country: "SG", label: "Singapore", flag: "\u{1F1F8}\u{1F1EC}" },
  { code: "+61", country: "AU", label: "Australia", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "+49", country: "DE", label: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "+33", country: "FR", label: "France", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "+81", country: "JP", label: "Japan", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "+1", country: "CA", label: "Canada", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "+86", country: "CN", label: "China", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "+82", country: "KR", label: "S. Korea", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "+66", country: "TH", label: "Thailand", flag: "\u{1F1F9}\u{1F1ED}" },
  { code: "+60", country: "MY", label: "Malaysia", flag: "\u{1F1F2}\u{1F1FE}" },
  { code: "+62", country: "ID", label: "Indonesia", flag: "\u{1F1EE}\u{1F1E9}" },
  { code: "+90", country: "TR", label: "Turkey", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "+94", country: "LK", label: "Sri Lanka", flag: "\u{1F1F1}\u{1F1F0}" },
  { code: "+977", country: "NP", label: "Nepal", flag: "\u{1F1F3}\u{1F1F5}" },
  { code: "+960", country: "MV", label: "Maldives", flag: "\u{1F1F2}\u{1F1FB}" },
  { code: "+7", country: "RU", label: "Russia", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "+55", country: "BR", label: "Brazil", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "+52", country: "MX", label: "Mexico", flag: "\u{1F1F2}\u{1F1FD}" },
  { code: "+27", country: "ZA", label: "S. Africa", flag: "\u{1F1FF}\u{1F1E6}" },
  { code: "+20", country: "EG", label: "Egypt", flag: "\u{1F1EA}\u{1F1EC}" },
  { code: "+254", country: "KE", label: "Kenya", flag: "\u{1F1F0}\u{1F1EA}" },
];

interface FormPhoneProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  id: string;
  label?: string;
  required?: boolean;
  error?: string;
  onCountryCodeChange?: (code: string) => void;
  defaultCountryCode?: string;
}

export default function FormPhone({
  id,
  label = "Phone Number",
  required,
  error,
  className = "",
  onCountryCodeChange,
  defaultCountryCode = "+91",
  ...props
}: FormPhoneProps) {
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const errorId = `${id}-error`;

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    onCountryCodeChange?.(newCode);
  };

  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={handleCountryChange}
          className="w-[110px] shrink-0 px-2 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all"
          aria-label="Country code"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={`${c.code}-${c.country}`} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
          <input
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            minLength={7}
            maxLength={15}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={!!error}
            aria-required={required}
            className={`w-full pl-9 pr-3 py-3 bg-white border ${
              error ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-brand-saffron"
            } rounded-xl text-sm focus:ring-2 focus:ring-offset-2 outline-none transition-all ${className}`}
            {...props}
          />
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-1">7-15 digits (international format)</p>
      {error && (
        <p id={errorId} className="text-xs text-red-500 mt-1" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
