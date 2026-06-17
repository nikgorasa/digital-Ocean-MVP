"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Palmtree, FileText } from "lucide-react";
import { Itinerary } from "@/lib/ai/holidayPlanner";
import DayCard from "./DayCard";

interface ItineraryPreviewProps {
  itinerary: Itinerary | null;
  onGetQuote: () => void;
}

export default function ItineraryPreview({ itinerary, onGetQuote }: ItineraryPreviewProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));

  const toggleDay = (day: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  if (!itinerary) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm h-full flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
          <Palmtree size={32} className="text-orange-400" />
        </div>
        <h3 className="text-lg font-serif font-bold text-slate-900 mb-2">
          Your Itinerary
        </h3>
        <p className="text-slate-500 text-sm max-w-[200px]">
          Start chatting to plan your dream holiday. Your itinerary will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col sticky top-20 max-h-[calc(100vh-120px)]">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-serif font-bold text-slate-900">
            {itinerary.destination}
          </h3>
          <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded-full">
            {itinerary.days} Days
          </span>
        </div>
        <p className="text-xs text-slate-500">
          {itinerary.travelers} traveler{itinerary.travelers > 1 ? "s" : ""} • {itinerary.budget}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {itinerary.itinerary.map((day) => (
          <DayCard
            key={day.day}
            day={day}
            isExpanded={expandedDays.has(day.day)}
            onToggle={() => toggleDay(day.day)}
          />
        ))}
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-slate-600">Total Estimated</span>
          <span className="text-lg font-bold text-orange-600">
            ₹{itinerary.totalEstimatedCost.toLocaleString("en-IN")}
          </span>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGetQuote}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-100"
        >
          <FileText className="w-4 h-4" />
          Get Full Quote
        </motion.button>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          Expert will finalize pricing within 4 hours
        </p>
      </div>
    </div>
  );
}
