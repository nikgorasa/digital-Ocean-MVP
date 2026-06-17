"use client";

import React, { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format, differenceInDays } from "date-fns";
import { Calendar, X } from "lucide-react";
import "react-day-picker/style.css";

interface DateRangePickerProps {
  mode: "range" | "single";
  startDate: string | null;
  endDate?: string | null;
  onStartDateChange: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  minDate?: Date;
  maxDate?: Date;
  label?: string;
  placeholder?: string;
  showNightsCount?: boolean;
  className?: string;
}

function toDate(str: string | null | undefined): Date | undefined {
  if (!str) return undefined;
  const d = new Date(str + "T00:00:00");
  return isNaN(d.getTime()) ? undefined : d;
}

function toDateString(d: Date | undefined): string {
  if (!d) return "";
  return format(d, "yyyy-MM-dd");
}

export default function DateRangePicker({
  mode,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate,
  maxDate,
  label,
  placeholder = "Select dates",
  showNightsCount = true,
  className = "",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<Date | undefined>();
  const containerRef = useRef<HTMLDivElement>(null);

  const start = toDate(startDate);
  const end = toDate(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate365 = new Date(today);
  maxDate365.setDate(maxDate365.getDate() + 365);

  const nights = start && end ? Math.max(0, differenceInDays(end, start)) : 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const [error, setError] = useState<string | null>(null);

  // Manual click handler — works for both single and range
  const handleDayClick = (day: Date) => {
    setError(null);

    if (mode === "single") {
      onStartDateChange(toDateString(day));
      setIsOpen(false);
      return;
    }

    // Range mode — manual two-click selection
    if (!start || (start && end)) {
      // First click, or restarting: set start, clear end
      onStartDateChange(toDateString(day));
      onEndDateChange?.("");
    } else if (day < start) {
      // Clicked before start — swap (industry standard: auto-correct)
      onStartDateChange(toDateString(day));
      onEndDateChange?.(toDateString(start));
      setIsOpen(false);
    } else if (day.getTime() === start.getTime()) {
      // Same-day: auto-set checkout to next day (minimum 1 night)
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      onEndDateChange?.(toDateString(nextDay));
      setIsOpen(false);
    } else {
      // Normal: set end date
      const nightsCount = Math.ceil((day.getTime() - start.getTime()) / 86400000);
      if (nightsCount > 30) {
        setError("Maximum stay is 30 nights. Please select a shorter range.");
        return;
      }
      onEndDateChange?.(toDateString(day));
      setIsOpen(false);
    }
  };

  const handleDayMouseEnter = (day: Date) => {
    if (mode === "range" && start && !end) {
      setHoveredDate(day);
    }
  };

  const handleDayMouseLeave = () => {
    setHoveredDate(undefined);
  };

  // Build modifiers for range highlighting (manual, not relying on mode="range")
  const modifiers: Record<string, any> = {};
  const modifiersStyles: Record<string, React.CSSProperties> = {};

  if (mode === "range" && start) {
    modifiers.range_start = start;
    modifiersStyles.range_start = {
      backgroundColor: "#F97316",
      color: "white",
      borderRadius: "6px",
    };

    if (end) {
      modifiers.range_end = end;
      modifiersStyles.range_end = {
        backgroundColor: "#F97316",
        color: "white",
        borderRadius: "6px",
      };

      modifiers.range_middle = (date: Date) => date > start && date < end;
      modifiersStyles.range_middle = {
        backgroundColor: "#FFF7ED",
        color: "#1E293B",
        borderRadius: 0,
      };
    } else if (hoveredDate && hoveredDate > start) {
      modifiers.range_middle = (date: Date) => date > start && date < hoveredDate;
      modifiersStyles.range_middle = {
        backgroundColor: "#FFF7ED",
        color: "#1E293B",
        borderRadius: 0,
      };
    }
  }

  if (mode === "single" && start) {
    modifiers.selected = start;
    modifiersStyles.selected = {
      backgroundColor: "#F97316",
      color: "white",
      borderRadius: "6px",
    };
  }

  const triggerLabel = () => {
    if (mode === "single" && startDate) {
      return format(new Date(startDate + "T00:00:00"), "MMM d, yyyy");
    }
    if (mode === "range" && startDate && endDate) {
      const s = format(new Date(startDate + "T00:00:00"), "MMM d");
      const e = format(new Date(endDate + "T00:00:00"), "MMM d, yyyy");
      return `${s} – ${e}${showNightsCount && nights > 0 ? ` · ${nights} night${nights > 1 ? "s" : ""}` : ""}`;
    }
    if (mode === "range" && startDate && !endDate) {
      return format(new Date(startDate + "T00:00:00"), "MMM d") + " → Select check-out";
    }
    return placeholder;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-3 bg-white border rounded-xl text-sm text-left focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all cursor-pointer flex items-center gap-2 ${
          isOpen ? "border-brand-saffron" : "border-slate-200"
        } ${!startDate ? "text-slate-400" : "text-slate-900"}`}
      >
        <Calendar size={16} className="text-slate-400 shrink-0" />
        <span className="flex-1 truncate">{triggerLabel()}</span>
        {startDate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartDateChange("");
              onEndDateChange?.("");
            }}
            className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
            aria-label="Clear dates"
          >
            <X size={14} className="text-slate-400" />
          </button>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
          style={{ width: mode === "range" ? 536 : 272 }}
        >
          <style>{`
            .rdp-root {
              --rdp-accent-color: #F97316;
              --rdp-accent-background-color: #FFF7ED;
              --rdp-day-height: 28px;
              --rdp-day-width: 36px;
              --rdp-day_button-height: 28px;
              --rdp-day_button-width: 36px;
              --rdp-day_button-border-radius: 6px;
              --rdp-disabled-opacity: 0.3;
              --rdp-outside-opacity: 0.35;
              --rdp-months-gap: 12px;
              --rdp-nav-height: 1.5rem;
              --rdp-nav_button-height: 1.5rem;
              --rdp-nav_button-width: 1.5rem;
              margin: 0;
              font-family: inherit;
              padding: 8px 10px;
              width: 100%;
              box-sizing: border-box;
            }
            .rdp-months {
              width: 100%;
              justify-content: space-between;
            }
            .rdp-month {
              flex: 1;
              min-width: 0;
            }
            .rdp-table {
              width: 100%;
              border-spacing: 0;
              table-layout: fixed;
            }
            .rdp-caption_label {
              font-size: 12px;
              font-weight: 700;
              color: #1E293B;
            }
            .rdp-button_next,
            .rdp-button_previous {
              border-radius: 4px !important;
              border: 1px solid #E2E8F0 !important;
              background: white !important;
            }
            .rdp-button_next:hover,
            .rdp-button_previous:hover {
              background: #F8FAFC !important;
            }
            .rdp-weekday {
              font-size: 10px !important;
              font-weight: 600 !important;
              color: #94A3B8 !important;
              text-transform: uppercase;
              letter-spacing: 0.03em;
              padding-bottom: 2px;
              text-align: center;
            }
            .rdp-day {
              border-radius: 6px !important;
              font-size: 12px !important;
              font-weight: 500;
              color: #1E293B;
              text-align: center;
            }
            .rdp-day_button {
              transition: background-color 0.1s;
            }
            .rdp-day_button:hover {
              background-color: #FFF7ED !important;
            }
            .rdp-selected .rdp-day_button {
              background-color: #F97316 !important;
              color: white !important;
              border-color: #F97316 !important;
              font-weight: 600;
            }
            .rdp-disabled:not(.rdp-selected) {
              opacity: 0.3 !important;
              cursor: not-allowed !important;
            }
            .rdp-disabled:not(.rdp-selected) .rdp-day_button {
              color: #CBD5E1 !important;
            }
            .rdp-today:not(.rdp-outside) .rdp-day_button {
              font-weight: 700 !important;
              box-shadow: inset 0 0 0 1.5px #F97316;
            }
            .rdp-outside {
              opacity: 0.35 !important;
            }
          `}</style>
          <DayPicker
            mode="single"
            selected={start}
            onDayClick={handleDayClick}
            onDayMouseEnter={handleDayMouseEnter}
            onDayMouseLeave={handleDayMouseLeave}
            disabled={{ before: minDate || today, after: maxDate || maxDate365 }}
            numberOfMonths={typeof window !== "undefined" && window.innerWidth < 640 ? 1 : mode === "range" ? 2 : 1}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            showOutsideDays
            fixedWeeks
          />
          {error && (
            <div className="px-3 py-2 bg-red-50 border-t border-red-100">
              <p className="text-[11px] text-red-600 font-medium">{error}</p>
            </div>
          )}
          <div className="px-3 py-1.5 border-t border-slate-100 flex items-center justify-between min-h-[28px]">
            {mode === "range" && start && !end && (
              <p className="text-[11px] text-slate-400">Select check-out date (max 30 nights)</p>
            )}
            {mode === "range" && start && end && (
              <>
                <p className="text-[11px] text-slate-500">
                  <span className="font-bold text-slate-900">{nights} night{nights > 1 ? "s" : ""}</span>
                  {" · "}
                  {format(start, "MMM d")} – {format(end, "MMM d")}
                </p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 bg-brand-saffron text-white rounded-lg text-[11px] font-bold hover:bg-brand-burnt cursor-pointer"
                >
                  Done
                </button>
              </>
            )}
            {mode === "single" && start && (
              <p className="text-[11px] text-slate-500">{format(start, "EEEE, MMMM d, yyyy")}</p>
            )}
            {!start && (
              <p className="text-[11px] text-slate-400">Select a date</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
