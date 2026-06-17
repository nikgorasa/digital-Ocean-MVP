"use client";

import React from "react";
import { motion } from "motion/react";
import { ChevronDown, Hotel } from "lucide-react";
import { ItineraryDay } from "@/lib/ai/holidayPlanner";

interface DayCardProps {
  day: ItineraryDay;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function DayCard({ day, isExpanded, onToggle }: DayCardProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {day.day}
          </span>
          <span className="font-semibold text-slate-900 text-sm text-left">{day.title}</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="px-4 pb-4 border-t border-slate-100"
        >
          <div className="space-y-3 mt-3">
            {day.activities.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-xs text-slate-400 font-mono w-12 shrink-0 pt-0.5">
                  {activity.time}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-slate-700">{activity.activity}</p>
                  {activity.duration && (
                    <span className="text-[10px] text-slate-400">{activity.duration}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
            <Hotel className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">{day.hotel}</span>
          </div>

          <div className="mt-2">
            <span className="text-xs font-semibold text-orange-600">
              Est. ₹{day.estimatedCost.toLocaleString("en-IN")}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
