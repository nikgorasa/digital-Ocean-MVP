"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Info, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      icon: <AlertTriangle size={24} className="text-red-500" />,
      iconBg: "bg-red-100",
      confirmBtn: "bg-red-600 hover:bg-red-700 text-white",
    },
    warning: {
      icon: <AlertTriangle size={24} className="text-amber-500" />,
      iconBg: "bg-amber-100",
      confirmBtn: "bg-brand-antique-gold hover:bg-brand-emerald text-white",
    },
    info: {
      icon: <Info size={24} className="text-blue-500" />,
      iconBg: "bg-blue-100",
      confirmBtn: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  };

  const style = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" pointer-events-none>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute top-3 right-3 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="p-6">
              {/* Icon + Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center shrink-0`}>
                  {style.icon}
                </div>
                <div>
                  <h3 id="confirm-title" className="text-lg font-bold text-slate-900">
                    {title}
                  </h3>
                  <p id="confirm-message" className="text-sm text-slate-500 mt-1 leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="btn btn-ghost text-sm"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`btn text-sm ${style.confirmBtn}`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
