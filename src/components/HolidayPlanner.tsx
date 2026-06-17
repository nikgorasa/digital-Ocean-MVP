"use client";

import React, { useState, useCallback } from "react";
import { motion } from "motion/react";
import { Palmtree, MessageSquare } from "lucide-react";
import { Message, Itinerary } from "@/lib/ai/holidayPlanner";
import ChatInterface from "./ChatInterface";
import ItineraryPreview from "./ItineraryPreview";
import HandoffModal from "./HandoffModal";

interface HolidayPlannerProps {
  userName?: string;
  userEmail?: string;
}

export default function HolidayPlanner({ userName, userEmail }: HolidayPlannerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const [mobileView, setMobileView] = useState<"chat" | "itinerary">("chat");
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeChat = useCallback(async () => {
    if (isInitialized) return;
    setIsInitialized(true);

    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/holiday-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      });
      const data = await res.json();

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
        timestamp: new Date().toISOString(),
      };

      setMessages([assistantMsg]);
      setQuickReplies(data.quickReplies || []);
    } catch (err) {
      console.error("Failed to initialize chat:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  React.useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setQuickReplies([]);
      setIsLoading(true);

      try {
        const allMessages = [...messages, userMsg];
        const res = await fetch("/api/ai/holiday-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: allMessages,
            context: { previousItinerary: itinerary },
          }),
        });
        const data = await res.json();

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setQuickReplies(data.quickReplies || []);

        if (data.itinerary) {
          setItinerary(data.itinerary);
        }

        if (data.quickReplies?.includes("Get Full Quote")) {
          setShowHandoff(true);
        }
      } catch (err) {
        console.error("Failed to send message:", err);
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, itinerary]
  );

  const handleQuickReply = useCallback(
    (reply: string) => {
      if (reply === "Get Full Quote") {
        setShowHandoff(true);
        return;
      }
      handleSendMessage(reply);
    },
    [handleSendMessage]
  );

  return (
    <>
      <section className="bg-gradient-to-br from-orange-500 to-orange-700 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 flex items-center justify-center">
              <Palmtree size={32} className="text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">
              Plan Your Dream Holiday
            </h1>
            <p className="text-orange-100">
              AI-powered itinerary planning — instant & free
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:hidden flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setMobileView("chat")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                mobileView === "chat"
                  ? "bg-orange-500 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Chat
            </button>
            <button
              type="button"
              onClick={() => setMobileView("itinerary")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                mobileView === "itinerary"
                  ? "bg-orange-500 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <Palmtree className="w-4 h-4 inline mr-1" />
              Itinerary {itinerary && `(${itinerary.days}D)`}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`lg:col-span-2 ${mobileView !== "chat" ? "hidden lg:block" : ""}`}>
              <ChatInterface
                messages={messages}
                quickReplies={quickReplies}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                onQuickReply={handleQuickReply}
              />
            </div>
            <div className={`lg:col-span-1 ${mobileView !== "itinerary" ? "hidden lg:block" : ""}`}>
              <ItineraryPreview
                itinerary={itinerary}
                onGetQuote={() => setShowHandoff(true)}
              />
            </div>
          </div>
        </div>
      </section>

      <HandoffModal
        isOpen={showHandoff}
        onClose={() => setShowHandoff(false)}
        itinerary={itinerary}
        messages={messages}
        userName={userName}
        userEmail={userEmail}
      />
    </>
  );
}
