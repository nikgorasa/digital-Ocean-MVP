"use client";

import React from "react";
import { Check, Loader2 } from "lucide-react";

interface Step {
  label: string;
  status: "pending" | "active" | "complete";
}

interface StepProgressProps {
  steps: Step[];
  className?: string;
}

export default function StepProgress({ steps, className = "" }: StepProgressProps) {
  return (
    <div className={`flex items-center gap-1 px-4 py-3 ${className}`} role="progressbar" aria-label="Booking progress">
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                step.status === "complete"
                  ? "bg-green-500 text-white"
                  : step.status === "active"
                  ? "bg-brand-saffron text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {step.status === "complete" ? (
                <Check size={12} />
              ) : step.status === "active" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-[10px] font-medium whitespace-nowrap ${
                step.status === "complete"
                  ? "text-green-600"
                  : step.status === "active"
                  ? "text-brand-saffron font-bold"
                  : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${
                step.status === "complete" ? "bg-green-300" : "bg-slate-200"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
