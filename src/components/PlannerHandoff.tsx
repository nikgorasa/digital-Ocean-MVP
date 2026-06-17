"use client";

import React from "react";
import { motion } from "motion/react";
import { Palmtree, ArrowRight, Sparkles } from "lucide-react";

interface PlannerHandoffProps {
  destination?: string;
  travelers?: number;
  days?: number;
  onConfirm: () => void;
  onDecline: () => void;
}

export default function PlannerHandoff({
  destination,
  travelers,
  days,
  onConfirm,
  onDecline,
}: PlannerHandoffProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
          <Palmtree className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-serif font-bold text-slate-900 mb-1">
            Plan Your Holiday
          </h3>
          <p className="text-sm text-slate-600 mb-3">
            {destination
              ? `I'll help you plan a trip to ${destination}${days ? ` for ${days} days` : ""}${travelers ? ` with ${travelers} traveler${travelers > 1 ? "s" : ""}` : ""}.`
              : "I'll help you create a personalized itinerary for your dream holiday."}
          </p>

          <div className="flex items-center gap-2 text-xs text-orange-600 mb-4">
            <Sparkles className="w-4 h-4" />
            <span>AI-powered • Instant • Free</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onConfirm}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors cursor-pointer"
            >
              Start Planning
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onDecline}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
