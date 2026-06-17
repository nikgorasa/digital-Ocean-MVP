"use client";

import React from "react";
import { Globe } from "lucide-react";

interface FormPassportProps {
  id?: string;
  passportNo: string;
  passportExpiry: string;
  onPassportNoChange: (value: string) => void;
  onPassportExpiryChange: (value: string) => void;
  required?: boolean;
}

export default function FormPassport({
  id = "passport",
  passportNo,
  passportExpiry,
  onPassportNoChange,
  onPassportExpiryChange,
  required,
}: FormPassportProps) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block flex items-center gap-1">
        <Globe size={12} aria-hidden="true" />
        Passport Details {required ? "(Required)" : "(International)"}
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${id}-number`} className="sr-only">Passport Number</label>
          <input
            id={`${id}-number`}
            value={passportNo}
            onChange={(e) => onPassportNoChange(e.target.value.toUpperCase())}
            placeholder="Passport No"
            maxLength={9}
            autoComplete="off"
            className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm uppercase focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all"
          />
        </div>
        <div>
          <label htmlFor={`${id}-expiry`} className="sr-only">Passport Expiry</label>
          <input
            id={`${id}-expiry`}
            type="date"
            value={passportExpiry}
            onChange={(e) => onPassportExpiryChange(e.target.value)}
            autoComplete="off"
            className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all"
          />
        </div>
      </div>
    </div>
  );
}
