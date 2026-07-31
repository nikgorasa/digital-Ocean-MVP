"use client";

import { motion } from "motion/react";
import { Check, Plane, Luggage, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [
    { label: "Search", icon: Plane, step: 1 },
    { label: "Select Flights", icon: Luggage, step: 2 },
    { label: "Review & Pay", icon: CreditCard, step: 3 },
  ];

  return (
    <nav
      aria-label="Booking progress"
      className="hidden md:flex items-center gap-4 px-4 py-3 border-b border-slate-200 bg-slate-50"
    >
      {steps.map((s, i) => (
        <motion.div
          key={s.step}
          layout
          className="flex flex-col items-center gap-1.5 flex-1"
        >
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
              currentStep >= s.step
                ? "bg-brand-antique-gold text-white shadow-lg shadow-brand-antique-gold/30"
                : "bg-slate-200 text-slate-500"
            )}
          >
            {currentStep > s.step ? (
              <Check className="w-5 h-5 mx-auto" />
            ) : (
              <s.icon className="w-5 h-5 mx-auto" />
            )}
          </div>
          <span
            className={cn(
              "text-xs font-medium text-center max-w-[70px]",
              currentStep >= s.step
                ? "text-brand-charcoal"
                : "text-slate-500"
            )}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <motion.div
              layout
              className={cn(
                "h-0.5 w-full -mt-5 mx-1",
                currentStep > s.step
                  ? "bg-brand-antique-gold"
                  : "bg-slate-200"
              )}
              initial={false}
            />
          )}
        </motion.div>
      ))}
    </nav>
  );
}