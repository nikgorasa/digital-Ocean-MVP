"use client";

import React, { useRef, useEffect } from "react";
import { Users, ChevronDown, Minus, Plus, User } from "lucide-react";

const CABIN_OPTIONS = ["Economy", "Premium Economy", "Business", "First Class"] as const;

export interface PassengerCabinSelectorProps {
  adults: number;
  children: number;
  infants: number;
  childAges: number[];
  cabinClass: string;
  showConcierge: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAdultsChange: (n: number) => void;
  onChildrenChange: (n: number) => void;
  onInfantsChange: (n: number) => void;
  onChildAgesChange: (ages: number[]) => void;
  onCabinChange: (c: string) => void;
  onConciergeClick?: () => void;
}

export default function PassengerCabinSelector({
  adults,
  children,
  infants,
  childAges,
  cabinClass,
  showConcierge,
  isOpen,
  onOpenChange,
  onAdultsChange,
  onChildrenChange,
  onInfantsChange,
  onChildAgesChange,
  onCabinChange,
  onConciergeClick,
}: PassengerCabinSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onOpenChange]);

  return (
    <div ref={containerRef} className="relative">
      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-600 mb-1.5 block">
        Passengers & Cabin
      </label>
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm flex items-center justify-between gap-2 cursor-pointer hover:border-brand-antique-gold/30 transition-colors focus:ring-2 focus:ring-brand-antique-gold focus:ring-offset-2 outline-none"
      >
        <span className="flex items-center gap-2">
          <Users size={14} className="text-slate-600" />
          <span className="text-brand-charcoal font-medium">{adults + children + infants}</span>
          <span className="text-slate-600">{adults + children + infants === 1 ? "Passenger" : "Passengers"}</span>
          <span className="text-slate-600/50 mx-1">&middot;</span>
          <span className="text-slate-600">{cabinClass}</span>
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-600 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 sm:left-auto sm:right-0 top-full mt-1 z-50 w-full sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 origin-top">
          {showConcierge ? (
            <div className="text-center py-6">
              <User size={32} className="mx-auto text-brand-antique-gold mb-3" />
              <p className="font-bold text-brand-charcoal mb-1">Large Group Booking</p>
              <p className="text-xs text-slate-600 mb-3">
                For groups larger than 10, please contact our concierge.
              </p>
              {onConciergeClick && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onConciergeClick();
                  }}
                  className="inline-block px-6 py-2.5 bg-brand-antique-gold text-white rounded-xl font-bold text-sm hover:bg-brand-emerald transition-colors cursor-pointer"
                >
                  Submit to Concierge
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Cabin Class</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {CABIN_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onCabinChange(c)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                        cabinClass === c
                          ? "bg-brand-antique-gold text-white border-brand-antique-gold"
                          : "bg-transparent text-slate-600 border-slate-200 hover:border-brand-antique-gold/40"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <CounterRow label="Adults" sub="12+ years" value={adults} onChange={onAdultsChange} min={1} max={9} />
              <CounterRow label="Children" sub="2-17 years" value={children} onChange={onChildrenChange} min={0} max={9} />
              {childAges.map((age, i) => (
                <div key={i} className="flex items-center gap-2 pl-4">
                  <span className="text-[10px] text-slate-600 w-16 shrink-0">Child {i + 1} age</span>
                  <select
                    value={age}
                    onChange={(e) => {
                      const next = [...childAges];
                      next[i] = parseInt(e.target.value, 10);
                      onChildAgesChange(next);
                    }}
                    className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-antique-gold"
                  >
                    {Array.from({ length: 16 }, (_, i) => i + 2).map((a) => (
                      <option key={a} value={a}>{a} years</option>
                    ))}
                  </select>
                </div>
              ))}
              <CounterRow label="Infants (lap)" sub="0-2 years" value={infants} onChange={onInfantsChange} min={0} max={9} />

              {!showConcierge && (
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="w-full mt-1 py-2.5 bg-brand-antique-gold text-white rounded-xl font-bold text-sm hover:bg-brand-emerald transition-colors cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CounterRow({
  label,
  sub,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  sub: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-brand-charcoal">{label}</p>
        <p className="text-[10px] text-slate-600">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-brand-ivory cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Minus size={14} />
        </button>
        <span className="w-6 text-center font-bold text-brand-charcoal tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-brand-ivory cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
