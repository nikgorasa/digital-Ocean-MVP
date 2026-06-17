"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency, formatTravelDates } from "@/lib";
import { X, Phone, Send, CheckCircle, MessageSquare } from "lucide-react";

interface Booking {
  id: string;
  type: string;
  itemName: string;
  providerOrAirline?: string;
  price: number;
  pnr?: string;
  travelDates?: string;
  paxCount: number;
  status: string;
}

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  userName: string;
}

export default function WhatsAppModal({ isOpen, onClose, booking, userName }: WhatsAppModalProps) {
  const [phone, setPhone] = useState("+91 ");
  const [step, setStep] = useState<"input" | "sending" | "sent">("input");

  const handleSend = () => {
    setStep("sending");
    setTimeout(() => {
      setStep("sent");
    }, 2000);
  };

  const handleWhatsAppDirect = () => {
    const message = encodeURIComponent(
      `Hi GoRASA, I need help with my booking:\n\n` +
      `📋 Booking: ${booking.itemName}\n` +
      `🎫 PNR: ${booking.pnr || "N/A"}\n` +
      `📅 Dates: ${formatTravelDates(booking.travelDates)}\n` +
      `👥 Passengers: ${booking.paxCount}\n` +
      `💰 Amount: ${formatCurrency(booking.price)}\n` +
      `✅ Status: ${booking.status}`
    );
    window.open(`https://wa.me/919528500383?text=${message}`, "_blank");
  };

  if (!isOpen) return null;

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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* WhatsApp Header */}
          <div className="bg-[#075E54] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageSquare size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold">GoRASA Concierge</p>
                <p className="text-green-200 text-xs">Online</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Chat Area */}
          <div className="bg-[#ECE5DD] p-4 min-h-[200px]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23c8bfb6\" fill-opacity=\"0.15\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}>
            {/* System Message */}
            <div className="flex justify-center mb-3">
              <span className="bg-[#FFF3C4] text-[#5C4813] text-[10px] px-3 py-1 rounded-full shadow-sm">
                🔒 Messages are end-to-end encrypted
              </span>
            </div>

            {/* GoRASA Message */}
            <div className="flex justify-start mb-3">
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[85%]">
                <p className="text-sm text-slate-800">
                  🌴 <strong>Welcome to GoRASA Concierge!</strong>
                </p>
                <p className="text-sm text-slate-700 mt-1">
                  Your booking details:
                </p>
                <div className="mt-2 bg-slate-50 rounded-lg p-3 text-xs">
                  <p><strong>booking:</strong> {booking.itemName}</p>
                  <p><strong>PNR:</strong> {booking.pnr || "N/A"}</p>
                  <p><strong>Dates:</strong> {formatTravelDates(booking.travelDates)}</p>
                  <p><strong>Passengers:</strong> {booking.paxCount}</p>
                  <p><strong>Status:</strong> {booking.status}</p>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-right">10:30 AM ✓✓</p>
              </div>
            </div>

            {/* Quick Replies */}
            {step === "input" && (
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                {["Configure Seats", "Baggage Info", "Meal Preference", "Cancel Booking"].map((reply) => (
                  <button
                    key={reply}
                    className="bg-white text-[#075E54] text-xs px-3 py-1.5 rounded-full border border-[#075E54] hover:bg-[#075E54] hover:text-white transition-colors cursor-pointer"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Sending Animation */}
            {step === "sending" && (
              <div className="flex justify-end mt-3">
                <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Sent Confirmation */}
            {step === "sent" && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
                    <p className="text-sm text-slate-800">
                      📱 Booking confirmation sent to {phone}
                    </p>
                    <p className="text-[10px] text-slate-400 text-right">10:31 AM ✓✓</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <CheckCircle size={16} />
                    Delivered successfully!
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-white p-4 border-t border-slate-200">
            {step === "input" ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <Phone size={16} className="text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSend}
                    className="flex-1 py-2.5 bg-[#075E54] text-white rounded-xl text-sm font-medium hover:bg-[#064D44] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send size={16} />
                    Send via WhatsApp Business
                  </button>
                  <button
                    onClick={handleWhatsAppDirect}
                    className="px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 cursor-pointer"
                  >
                    Open Chat
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
