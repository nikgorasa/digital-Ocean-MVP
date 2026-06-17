"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, CheckCircle, Ticket } from "lucide-react";
import { TicketCategory, TICKET_CATEGORIES, TICKET_PRIORITIES } from "@/lib/ticket/types";

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ticketId: string) => void;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  prefill?: {
    subject?: string;
    description?: string;
    category?: TicketCategory;
    bookingRef?: string;
  };
}

export default function CreateTicketModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  userName,
  userEmail,
  userPhone,
  prefill,
}: CreateTicketModalProps) {
  const [subject, setSubject] = useState(prefill?.subject || "");
  const [description, setDescription] = useState(prefill?.description || "");
  const [category, setCategory] = useState<TicketCategory>(prefill?.category || "general");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [bookingRef, setBookingRef] = useState(prefill?.bookingRef || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) {
      setError("Please fill in subject and description");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          description,
          category,
          priority,
          userId,
          userName,
          userEmail,
          userPhone,
          bookingRef: bookingRef || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to create ticket");

      const ticket = await res.json();
      setTicketId(ticket.id);
      setSuccess(true);
      setTimeout(() => {
        onSuccess(ticket.id);
        onClose();
      }, 2000);
    } catch {
      setError("Failed to create ticket. Please try again.");
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
          className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8 max-h-[90vh] overflow-y-auto"
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
                Ticket Created!
              </h2>
              <p className="text-slate-500 text-sm mb-2">
                Your ticket has been created successfully.
              </p>
              <p className="text-xs text-slate-400 font-mono">
                Ticket ID: {ticketId}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Ticket className="w-5 h-5 text-orange-500" />
                  <span className="text-orange-600 font-bold uppercase tracking-widest text-[10px] bg-orange-50 px-3 py-1 rounded-full">
                    Create Ticket
                  </span>
                </div>
                <h2 className="text-2xl font-serif font-bold text-slate-900">
                  Submit a Support Ticket
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Our team will respond within 24 hours.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Brief description of your issue"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    {TICKET_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {TICKET_PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPriority(p.value)}
                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          priority === p.value
                            ? p.color
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                    Description
                  </label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                    placeholder="Describe your issue in detail..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                    Booking Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={bookingRef}
                    onChange={(e) => setBookingRef(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="e.g., TKT-ABC123"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    "Creating..."
                  ) : (
                    <>
                      <Send size={16} />
                      Create Ticket
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
