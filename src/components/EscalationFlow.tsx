"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, MessageCircle, Phone, Mail, Ticket, CheckCircle } from "lucide-react";
import { UnifiedIntentResult } from "@/lib/ai/unified/intentClassifier";
import CreateTicketModal from "./CreateTicketModal";

interface EscalationFlowProps {
  isOpen: boolean;
  onClose: () => void;
  context: {
    message: string;
    intent: UnifiedIntentResult;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  onTicketCreated?: (ticketId: string) => void;
}

export default function EscalationFlow({
  isOpen,
  onClose,
  context,
  user,
  onTicketCreated,
}: EscalationFlowProps) {
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);

    if (option === "ticket") {
      setShowTicketModal(true);
    } else if (option === "whatsapp") {
      window.open("https://wa.me/919528500383", "_blank");
    } else if (option === "call") {
      window.open("tel:+919528500383", "_blank");
    } else if (option === "email") {
      window.open("mailto:rasatravelindia@gmail.com", "_blank");
    }
  };

  const handleTicketSuccess = (ticketId: string) => {
    setShowTicketModal(false);
    onTicketCreated?.(ticketId);
  };

  if (!isOpen) return null;

  return (
    <>
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

            <div className="mb-6">
              <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">
                Need More Help?
              </h2>
              <p className="text-slate-500 text-sm">
                Choose how you'd like to connect with our support team.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleOptionSelect("ticket")}
                className="w-full p-4 bg-orange-50 border border-orange-200 rounded-xl text-left hover:bg-orange-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Create Support Ticket</h3>
                    <p className="text-xs text-slate-500">Get a response within 24 hours</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOptionSelect("whatsapp")}
                className="w-full p-4 bg-green-50 border border-green-200 rounded-xl text-left hover:bg-green-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">WhatsApp Support</h3>
                    <p className="text-xs text-slate-500">Instant response during business hours</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOptionSelect("call")}
                className="w-full p-4 bg-blue-50 border border-blue-200 rounded-xl text-left hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Call Us</h3>
                    <p className="text-xs text-slate-500">+91 95285 00383 • Mon-Sat 9AM-9PM</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOptionSelect("email")}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-left hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-500 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Email Support</h3>
                    <p className="text-xs text-slate-500">rasatravelindia@gmail.com</p>
                  </div>
                </div>
              </button>
            </div>

            <p className="text-xs text-slate-400 text-center mt-4">
              Your conversation history will be shared with the agent.
            </p>
          </motion.div>
        </div>
      </AnimatePresence>

      {showTicketModal && user && (
        <CreateTicketModal
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          onSuccess={handleTicketSuccess}
          userId={user.id}
          userName={user.name}
          userEmail={user.email}
          userPhone={user.phone}
          prefill={{
            subject: `Support request: ${context.intent.label}`,
            description: `User message: "${context.message}"\n\nIntent: ${context.intent.intent}\nConfidence: ${(context.intent.confidence * 100).toFixed(0)}%`,
            category: context.intent.intent.startsWith("flight") ? "flight" :
                      context.intent.intent.startsWith("hotel") ? "hotel" :
                      context.intent.intent.includes("holiday") ? "holiday" :
                      context.intent.intent.includes("payment") ? "payment" :
                      context.intent.intent.includes("loyalty") ? "loyalty" : "general",
          }}
        />
      )}
    </>
  );
}
