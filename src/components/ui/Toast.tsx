"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type?: "info" | "warning" | "success" | "error";
  onClose: () => void;
  className?: string;
}

export function Toast({ message, type = "info", onClose, className }: ToastProps) {
  const icons = {
    info: Info,
    warning: AlertCircle,
    success: CheckCircle,
    error: AlertCircle,
  };
  const Icon = icons[type];

  const colors = {
    info: "bg-blue-50 text-blue-800 border-blue-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    success: "bg-green-50 text-green-800 border-green-200",
    error: "bg-red-50 text-red-800 border-red-200",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg",
          colors[type],
          className
        )}
        role="alert"
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}