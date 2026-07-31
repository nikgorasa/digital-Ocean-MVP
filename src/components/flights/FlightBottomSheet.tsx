"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface FlightBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  showDragIndicator?: boolean;
  snapPoints?: string[];
  defaultSnap?: number;
}

export function FlightBottomSheet({
  isOpen,
  onClose,
  children,
  title = "Select Flight",
  subtitle,
  className,
  showDragIndicator = true,
  snapPoints = ["50%", "90%"],
  defaultSnap = 0,
}: FlightBottomSheetProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col",
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bottom-sheet-title"
          >
            {/* Drag Handle */}
            {showDragIndicator && (
              <div className="flex items-center justify-center pt-3 pb-2">
                <motion.div
                  className="w-10 h-1 bg-slate-300 rounded-full"
                  initial={false}
                  whileHover={{ scaleX: 1.5 }}
                />
              </div>
            )}

            {/* Header */}
            {(title || subtitle) && (
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 id="bottom-sheet-title" className="text-lg font-semibold text-brand-charcoal">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}