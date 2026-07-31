"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LegTabsProps {
  activeLeg: "outbound" | "return";
  onChange: (leg: "outbound" | "return") => void;
  disabledLegs?: ("outbound" | "return")[];
  hasOutboundSelection: boolean;
  outboundPrice?: number | null;
  returnPrice?: number | null;
  onClearLeg?: (leg: "outbound" | "return") => void;
}

export function LegTabs({
  activeLeg,
  onChange,
  disabledLegs = [],
  hasOutboundSelection,
  outboundPrice,
  returnPrice,
  onClearLeg,
}: LegTabsProps) {
  const legs = [
    { key: "outbound" as const, label: "Outbound", price: outboundPrice },
    { key: "return" as const, label: "Return", price: returnPrice },
  ] as const;

  return (
    <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10" role="tablist">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeLeg}
          initial={{ x: activeLeg === "outbound" ? 20 : -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: activeLeg === "outbound" ? -20 : 20, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full"
        >
          <div className="flex" role="tablist">
            {legs.map((leg, i) => (
              <motion.button
                key={leg.key}
                role="tab"
                aria-selected={activeLeg === leg.key}
                aria-disabled={disabledLegs?.includes(leg.key)}
                disabled={disabledLegs?.includes(leg.key)}
                onClick={() => !disabledLegs?.includes(leg.key) && onChange(leg.key)}
                layout
                className={cn(
                  "relative flex-1 flex flex-col items-center gap-1 py-3 px-2 text-sm font-medium transition-all duration-200",
                  activeLeg === leg.key
                    ? "text-brand-antique-gold"
                    : "text-slate-600 hover:text-brand-charcoal",
                  disabledLegs?.includes(leg.key) && "opacity-40 cursor-not-allowed",
                  leg.key === "return" && !hasOutboundSelection && "cursor-help"
                )}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
              >
                <span className="flex items-center gap-1">
                  {leg.label}
                  {leg.price !== null && leg.price !== undefined && (
                    <motion.span
                      layout
                      className="text-xs font-semibold text-brand-antique-gold whitespace-nowrap"
                    >
                      ₹{leg.price.toLocaleString()}
                    </motion.span>
                  )}
                </span>

                {leg.key === "return" && !hasOutboundSelection && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 px-2 py-0.5 text-[10px] font-medium text-slate-600 bg-slate-100 rounded-full whitespace-nowrap"
                  >
                    Select outbound first
                  </motion.span>
                )}

                {i < legs.length - 1 && (
                  <motion.div
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center"
                    initial={false}
                  >
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </motion.div>
                )}

                {activeLeg === leg.key && (
                  <motion.div
                    layout
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-antique-gold"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                )}

                {onClearLeg && leg.price !== null && leg.price !== undefined && (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearLeg?.(leg.key);
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full hover:bg-slate-100 transition-colors"
                    aria-label={`Clear ${leg.label} selection`}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                  </motion.button>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}