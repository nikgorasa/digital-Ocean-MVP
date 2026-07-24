"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SlidersHorizontal, X, Star, Check, RotateCcw } from "lucide-react";
import {
  HotelFilters,
  FlightFilters,
  HOTEL_AMENITIES,
  PROPERTY_TYPES,
  MEAL_PLANS,
  AIRLINES,
  DEPARTURE_TIMES,
  FARE_TYPES,
} from "@/lib/ai/filters/types";

interface FilterPanelProps {
  type: "hotel" | "flight";
  filters: HotelFilters | FlightFilters;
  onChange: (filters: HotelFilters | FlightFilters) => void;
  onReset: () => void;
  resultCount: number;
}

export default function FilterPanel({
  type,
  filters,
  onChange,
  onReset,
  resultCount,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleArrayFilter = <T extends string | number>(
    current: T[],
    value: T
  ): T[] => {
    return current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
  };

  const renderMultiSelect = (
    label: string,
    options: { label: string; value: string | number }[],
    selected: (string | number)[],
    onToggle: (value: string | number) => void
  ) => (
    <div className="mb-4">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle(option.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              selected.includes(option.value)
                ? "bg-brand-saffron text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {selected.includes(option.value) && (
              <Check className="w-3 h-3 inline mr-1" />
            )}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStarRating = (selected: number[], onToggle: (v: number) => void) => (
    <div className="mb-4">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
        Star Rating
      </label>
      <div className="flex gap-2">
        {[3, 4, 5].map((stars) => (
          <button
            key={stars}
            type="button"
            onClick={() => onToggle(stars)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              selected.includes(stars)
                ? "bg-brand-saffron text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {stars}
            <Star className="w-3 h-3 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );

  const renderPriceRange = (
    range: [number, number],
    onRangeChange: (range: [number, number]) => void
  ) => (
    <div className="mb-4">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
        Price Range
      </label>
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={range[0]}
          onChange={(e) => onRangeChange([parseInt(e.target.value) || 0, range[1]])}
          className="w-24 px-3 py-1.5 bg-slate-100 rounded-lg text-sm border-0 focus:ring-2 focus:ring-orange-500"
          placeholder="Min"
        />
        <span className="text-slate-400">—</span>
        <input
          type="number"
          value={range[1]}
          onChange={(e) => onRangeChange([range[0], parseInt(e.target.value) || range[1]])}
          className="w-24 px-3 py-1.5 bg-slate-100 rounded-lg text-sm border-0 focus:ring-2 focus:ring-orange-500"
          placeholder="Max"
        />
      </div>
    </div>
  );

  const renderHotelFilters = () => {
    const f = filters as HotelFilters;
    return (
      <>
        {renderPriceRange(f.priceRange, (range) => onChange({ ...f, priceRange: range }))}
        {renderStarRating(f.starRating, (stars) =>
          onChange({ ...f, starRating: toggleArrayFilter(f.starRating, stars) })
        )}
        {renderMultiSelect("Amenities", HOTEL_AMENITIES, f.amenities, (amenity) =>
          onChange({ ...f, amenities: toggleArrayFilter(f.amenities, amenity as string) })
        )}
        {renderMultiSelect("Property Type", PROPERTY_TYPES, f.propertyType, (pt) =>
          onChange({ ...f, propertyType: toggleArrayFilter(f.propertyType, pt as string) })
        )}
        {renderMultiSelect("Meal Plan", MEAL_PLANS, f.mealPlan, (plan) =>
          onChange({ ...f, mealPlan: toggleArrayFilter(f.mealPlan, plan as string) })
        )}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={f.freeCancellation}
              onChange={(e) => onChange({ ...f, freeCancellation: e.target.checked })}
              className="w-4 h-4 text-brand-saffron rounded focus:ring-brand-saffron"
            />
            <span className="text-sm text-slate-600">Free Cancellation Only</span>
          </label>
        </div>
      </>
    );
  };

  const renderFlightFilters = () => {
    const f = filters as FlightFilters;
    return (
      <>
        {renderPriceRange(f.priceRange, (range) => onChange({ ...f, priceRange: range }))}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
            Stops
          </label>
          <div className="flex gap-2">
            {[
              { label: "Non-stop", value: 0 },
              { label: "1 Stop", value: 1 },
              { label: "2+ Stops", value: 2 },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange({ ...f, stops: toggleArrayFilter(f.stops, option.value) })
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  f.stops.includes(option.value)
                    ? "bg-orange-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {renderMultiSelect("Airlines", AIRLINES, f.airlines, (airline) =>
          onChange({ ...f, airlines: toggleArrayFilter(f.airlines, airline as string) })
        )}
        {renderMultiSelect("Departure Time", DEPARTURE_TIMES, f.departureTime, (time) =>
          onChange({ ...f, departureTime: toggleArrayFilter(f.departureTime, time as string) })
        )}
        {renderMultiSelect("Fare Type", FARE_TYPES, f.fareType, (fareType) =>
          onChange({ ...f, fareType: toggleArrayFilter(f.fareType, fareType as string) })
        )}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
            Included Features
          </label>
          <div className="space-y-2">
            {[
              { label: "Refundable Only", key: "refundableOnly" as const },
              { label: "Baggage Included", key: "baggageIncluded" as const },
              { label: "Meals Included", key: "mealsIncluded" as const },
              { label: "Lounge Access", key: "loungeIncluded" as const },
              { label: "Free Reissue", key: "freeReissue" as const },
            ].map((option) => (
              <label key={option.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={f[option.key]}
                  onChange={(e) => onChange({ ...f, [option.key]: e.target.checked })}
                  className="w-4 h-4 text-brand-saffron rounded focus:ring-brand-saffron"
                />
                <span className="text-sm text-slate-600">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filters
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-sm bg-white shadow-2xl overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Filters</h3>
                  <p className="text-xs text-slate-500">{resultCount} results</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-4">
                {type === "hotel" ? renderHotelFilters() : renderFlightFilters()}
              </div>

              <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex gap-3">
                <button
                  type="button"
                  onClick={onReset}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2 bg-brand-saffron text-white rounded-xl text-sm font-bold hover:bg-brand-burnt transition-colors cursor-pointer"
                >
                  Show Results
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
