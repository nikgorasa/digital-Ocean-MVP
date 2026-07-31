"use client";

import { motion } from "motion/react";
import { IndianRupee, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib";
import { cn } from "@/lib/utils";

interface LegPricePreviewProps {
  outboundPrice: number | null;
  returnPrice: number | null;
  totalPrice: number;
  isRoundTrip: boolean;
  className?: string;
}

export function LegPricePreview({
  outboundPrice,
  returnPrice,
  totalPrice,
  isRoundTrip,
  className,
}: LegPricePreviewProps) {
  return (
    <motion.div
      layout
      className={cn(
        "flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white shadow-lg shadow-slate-900/5",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500 flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5" />
            Outbound
          </span>
          <span className={cn(
            "font-medium tabular-nums whitespace-nowrap",
            outboundPrice !== null ? "text-brand-charcoal" : "text-slate-400"
          )}>
            {outboundPrice !== null ? formatCurrency(outboundPrice) : "—"}
          </span>
        </div>

        {isRoundTrip && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500 flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5" />
              Return
            </span>
            <span className={cn(
              "font-medium tabular-nums whitespace-nowrap",
              returnPrice !== null ? "text-brand-charcoal" : "text-slate-400"
            )}>
              {returnPrice !== null ? formatCurrency(returnPrice) : "—"}
            </span>
          </div>
        )}
      </div>

      <div className="text-right">
        <div className="flex items-center justify-end gap-1 text-slate-500 text-sm mb-0.5">
          <Calculator className="w-3.5 h-3.5" />
          Total
        </div>
        <motion.div
          key={totalPrice}
          className="text-xl font-black text-brand-antique-gold tabular-nums"
        >
          {formatCurrency(totalPrice)}
        </motion.div>
      </div>
    </motion.div>
  );
}