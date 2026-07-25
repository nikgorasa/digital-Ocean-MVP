"use client";

import React from "react";
import { motion } from "motion/react";
import { formatCurrency } from "@/lib";
import { AlertTriangle, TrendingUp, TrendingDown, X } from "lucide-react";

interface PriceChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
  oldPrice: number;
  newPrice: number;
  itemName: string;
}

export default function PriceChangeModal({
  isOpen,
  onClose,
  onAccept,
  onDecline,
  oldPrice,
  newPrice,
  itemName,
}: PriceChangeModalProps) {
  if (!isOpen) return null;

  const priceIncreased = newPrice > oldPrice;
  const priceDecreased = newPrice < oldPrice;
  const difference = Math.abs(newPrice - oldPrice);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-change-title"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="text-center mb-6">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              priceIncreased ? "bg-orange-100" : priceDecreased ? "bg-green-100" : "bg-slate-100"
            }`}>
              {priceIncreased ? (
                <TrendingUp size={32} className="text-orange-600" />
              ) : priceDecreased ? (
                <TrendingDown size={32} className="text-green-600" />
              ) : (
                <AlertTriangle size={32} className="text-slate-600" />
              )}
            </div>

            <h2 id="price-change-title" className="text-xl font-bold text-slate-900 mb-2">
              {priceIncreased ? "Price Has Increased" : priceDecreased ? "Good News — Price Dropped!" : "Price Updated"}
            </h2>
            <p className="text-sm text-slate-500 mb-4">{itemName}</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-600">Original price</span>
              <span className="text-sm font-bold text-slate-900">{formatCurrency(oldPrice)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-600">Current price</span>
              <span className={`text-sm font-bold ${priceIncreased ? "text-orange-600" : priceDecreased ? "text-green-600" : "text-slate-900"}`}>
                {formatCurrency(newPrice)}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">Difference</span>
              <span className={`text-sm font-bold ${priceIncreased ? "text-orange-600" : priceDecreased ? "text-green-600" : "text-slate-900"}`}>
                {priceIncreased ? "+" : priceDecreased ? "-" : ""}{formatCurrency(difference)}
              </span>
            </div>
          </div>

          {priceIncreased && (
            <p className="text-xs text-slate-500 mb-4 text-center">
              Prices are set by the airline/hotel and may change based on availability.
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onDecline}
              className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 cursor-pointer transition-colors"
            >
              Cancel Booking
            </button>
            <button
              onClick={onAccept}
              className={`flex-1 py-3 rounded-xl font-bold cursor-pointer transition-colors ${
                priceIncreased
                  ? "bg-brand-saffron text-white hover:bg-brand-burnt"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {priceDecreased ? "Accept Lower Price" : "Accept New Price"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
