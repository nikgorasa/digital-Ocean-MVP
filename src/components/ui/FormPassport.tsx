"use client";

import React, { useMemo } from "react";
import { Globe, AlertTriangle } from "lucide-react";

interface FormPassportProps {
  id?: string;
  passportNo: string;
  passportExpiry: string;
  onPassportNoChange: (value: string) => void;
  onPassportExpiryChange: (value: string) => void;
  required?: boolean;
  travelDate?: string;
  returnDate?: string;
  label?: string;
}

export default function FormPassport({
  id = "passport",
  passportNo,
  passportExpiry,
  onPassportNoChange,
  onPassportExpiryChange,
  required,
  travelDate,
  returnDate,
  label,
}: FormPassportProps) {
  const validityWarning = useMemo(() => {
    if (!passportExpiry) return null;
    const expiry = new Date(passportExpiry);
    if (isNaN(expiry.getTime())) return null;

    const today = new Date();
    if (expiry <= today) return "Your passport has expired. Please renew before booking.";

    if (travelDate) {
      const travel = new Date(travelDate);
      if (!isNaN(travel.getTime()) && expiry <= travel) {
        return "Your passport expires before the travel date. Booking cannot proceed.";
      }
    }

    if (returnDate) {
      const returnD = new Date(returnDate);
      if (!isNaN(returnD.getTime()) && expiry <= returnD) {
        return "Your passport expires before the return date. Booking cannot proceed.";
      }
    }

    const sixMonthsFromNow = new Date(today);
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    if (expiry < sixMonthsFromNow) {
      return "Your passport expires within 6 months. Many countries require 6+ months validity. Please check requirements.";
    }

    if (travelDate) {
      const sixMonthsAfterTravel = new Date(travelDate);
      sixMonthsAfterTravel.setMonth(sixMonthsAfterTravel.getMonth() + 6);
      if (expiry < sixMonthsAfterTravel) {
        return "Your passport expires within 6 months of travel. Most countries require 6+ months validity from date of entry.";
      }
    }

    return null;
  }, [passportExpiry, travelDate, returnDate]);

  const isBlocking =
    validityWarning?.includes("expired") ||
    validityWarning?.includes("expires before");

  const displayLabel = label || (required ? "(Required)" : "(International)");

  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block flex items-center gap-1">
        <Globe size={12} aria-hidden="true" />
        Passport Details {displayLabel}
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${id}-number`} className="sr-only">Passport Number</label>
          <input
            id={`${id}-number`}
            value={passportNo}
            onChange={(e) => onPassportNoChange(e.target.value.toUpperCase())}
            placeholder="Passport No"
            maxLength={15}
            autoComplete="off"
            className={`w-full px-3 py-3 bg-white border ${
              isBlocking && !passportNo ? "border-red-300" : "border-slate-200"
            } rounded-xl text-sm uppercase focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all`}
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
            className={`w-full px-3 py-3 bg-white border ${
              isBlocking ? "border-red-300" : "border-slate-200"
            } rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all`}
          />
        </div>
      </div>
      {validityWarning && (
        <div
          className={`mt-2 flex items-start gap-2 p-2.5 rounded-lg text-xs ${
            isBlocking
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-amber-50 border border-amber-200 text-amber-700"
          }`}
          role="alert"
        >
          <AlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>{validityWarning}</span>
        </div>
      )}
      {!validityWarning && required && !passportNo && (
        <p className="text-[10px] text-slate-400 mt-1">Passport number required for international bookings</p>
      )}
    </div>
  );
}
