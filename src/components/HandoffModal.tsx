"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, CheckCircle } from "lucide-react";
import { Message, Itinerary } from "@/lib/ai/holidayPlanner";

interface HandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: Itinerary | null;
  messages: Message[];
  userName?: string;
  userEmail?: string;
}

export default function HandoffModal({
  isOpen,
  onClose,
  itinerary,
  messages,
  userName,
  userEmail,
}: HandoffModalProps) {
  const [name, setName] = useState(userName || "");
  const [email, setEmail] = useState(userEmail || "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError("Please fill in your name and email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const conversationSummary = messages
        .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
        .join("\n");

      const itinerarySummary = itinerary
        ? `${itinerary.days}-day ${itinerary.destination} trip for ${itinerary.travelers} travelers. Total: ₹${itinerary.totalEstimatedCost.toLocaleString("en-IN")}`
        : "Itinerary not yet generated";

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: itinerary?.destination || "Not specified",
          travelerName: name,
          travelerEmail: email,
          travelerPhone: phone,
          numberOfDays: itinerary?.days || 0,
          inclusions: JSON.stringify(itinerary?.inclusions || []),
          specificDemands: itinerary?.specialRequests || "",
          notes: `AI Planner Inquiry:\n\n${itinerarySummary}\n\nConversation:\n${conversationSummary}`,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
          className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={20} />
          </button>

          {success ? (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center"
              >
                <CheckCircle size={32} className="text-green-600" />
              </motion.div>
              <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">
                Expert Assigned!
              </h2>
              <p className="text-slate-500 text-sm">
                Our travel team will contact you within 4 hours with your personalized itinerary.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <span className="text-orange-600 font-bold uppercase tracking-widest text-[10px] bg-orange-50 px-3 py-1 rounded-full">
                  Get Your Quote
                </span>
                <h2 className="text-2xl font-serif font-bold text-slate-900 mt-3 mb-1">
                  Finalize Your Itinerary
                </h2>
                <p className="text-slate-500 text-sm">
                  Our travel expert will finalize your itinerary and provide exact pricing within 4 hours.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Inquiry
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-400 text-center">
                  * Our expert will contact you within 4 hours with a detailed proposal
                </p>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
