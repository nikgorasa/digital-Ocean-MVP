"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { formatDate, formatTravelDates } from "@/lib";
import { X, Download, Printer, Plane, User, Calendar, MapPin, QrCode } from "lucide-react";

interface Booking {
  id: string;
  type: string;
  itemName: string;
  providerOrAirline?: string;
  price: number;
  status: string;
  pnr?: string;
  seatOrRoom?: string;
  paxCount: number;
  travelDates?: string;
  bookedAt: string;
}

interface BoardingPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  userName: string;
}

export default function BoardingPassModal({ isOpen, onClose, booking, userName }: BoardingPassModalProps) {
  if (!isOpen) return null;

  const isFlight = booking.type === "FLIGHT";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-md"
        >
          {/* Ticket */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-saffron to-brand-burnt px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white/80 text-[10px] uppercase tracking-widest font-bold">
                  {isFlight ? "Boarding Pass" : "Hotel Voucher"}
                </p>
                <p className="text-white font-display font-bold text-lg">GoRASA</p>
              </div>
              <button onClick={onClose} className="text-white/60 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {/* Route / Hotel Name */}
              <div className="text-center mb-5">
                <h3 className="text-white text-xl font-serif font-bold">{booking.itemName}</h3>
                {booking.providerOrAirline && (
                  <p className="text-slate-400 text-sm mt-1">{booking.providerOrAirline}</p>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider">Passenger</p>
                  <p className="text-white font-medium text-sm flex items-center gap-1">
                    <User size={14} className="text-brand-saffron" />
                    {userName}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider">{isFlight ? "Seat" : "Room"}</p>
                  <p className="text-white font-medium text-sm">{booking.seatOrRoom || "12A"}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider">Travel Dates</p>
                  <p className="text-white font-medium text-sm flex items-center gap-1">
                    <Calendar size={14} className="text-brand-saffron" />
                    {formatTravelDates(booking.travelDates)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider">Passengers</p>
                  <p className="text-white font-medium text-sm">{booking.paxCount} Pax</p>
                </div>
              </div>

              {/* Dashed Divider */}
              <div className="border-t border-dashed border-slate-600 my-4 relative">
                <div className="absolute -left-6 -top-3 w-6 h-6 bg-slate-900 rounded-full" />
                <div className="absolute -right-6 -top-3 w-6 h-6 bg-slate-900 rounded-full" />
              </div>

              {/* PNR & QR */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider">PNR</p>
                  <p className="text-brand-saffron font-mono font-bold text-2xl">{booking.pnr || "GR123456"}</p>
                </div>
                <div className="bg-white rounded-xl p-3">
                  {/* Simple QR pattern */}
                  <div className="w-20 h-20 grid grid-cols-8 grid-rows-8 gap-px">
                    {Array.from({ length: 64 }, (_, i) => (
                      <div
                        key={i}
                        className={`${
                          Math.random() > 0.4 ? "bg-slate-900" : "bg-white"
                        } rounded-sm`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  booking.status === "CONFIRMED" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                }`}>
                  {booking.status}
                </span>
                <p className="text-slate-500 text-xs">
                  Booked: {formatDate(booking.bookedAt)}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={16} />
                Print
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-brand-saffron text-white rounded-xl text-sm font-bold hover:bg-brand-burnt cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
