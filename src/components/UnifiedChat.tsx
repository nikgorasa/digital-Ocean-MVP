"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Bot, User as UserIcon, ArrowRight } from "lucide-react";
import { classifyIntent, UnifiedIntentResult } from "@/lib/ai/unified/intentClassifier";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  quickReplies?: string[];
  intentResult?: UnifiedIntentResult;
}

interface UnifiedChatProps {
  mode: "support" | "planner" | "general";
  onRoute?: (route: string) => void;
  onEscalate?: (context: { message: string; intent: UnifiedIntentResult }) => void;
  onHandoffToPlanner?: (entities: UnifiedIntentResult["entities"]) => void;
  initialGreeting?: string;
}

export default function UnifiedChat({
  mode,
  onRoute,
  onEscalate,
  onHandoffToPlanner,
  initialGreeting,
}: UnifiedChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      const greeting = initialGreeting || getGreeting(mode);
      setMessages([{
        id: "greeting",
        role: "assistant",
        content: greeting,
        timestamp: new Date().toISOString(),
        quickReplies: getInitialQuickReplies(mode),
      }]);
    }
  }, [mode, initialGreeting, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const processMessage = useCallback(async (text: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Classify intent
    const intentResult = classifyIntent(text);

    // Handle based on intent
    let responseContent = "";
    let quickReplies: string[] = [];

    if (intentResult.escalateToHuman) {
      responseContent = "I understand you need more help. Let me connect you with our support team.";
      quickReplies = ["Open WhatsApp", "Call Support", "Create Ticket"];
      onEscalate?.({ message: text, intent: intentResult });
    } else if (intentResult.handoffToPlanner) {
      responseContent = "I'll take you to our AI Holiday Planner to create your perfect trip!";
      quickReplies = ["Start Planning"];
      onHandoffToPlanner?.(intentResult.entities);
    } else if (intentResult.route && intentResult.route !== "") {
      responseContent = `I'll take you to ${intentResult.label}.`;
      quickReplies = [intentResult.label, "Stay here"];
      onRoute?.(intentResult.route);
    } else {
      // Generate response based on mode and intent
      const response = generateResponse(mode, intentResult, text);
      responseContent = response.content;
      quickReplies = response.quickReplies;
    }

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: responseContent,
      timestamp: new Date().toISOString(),
      quickReplies,
      intentResult,
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsLoading(false);
  }, [mode, onRoute, onEscalate, onHandoffToPlanner]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    processMessage(inputValue.trim());
    setInputValue("");
  };

  const handleQuickReply = (reply: string) => {
    processMessage(reply);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 flex flex-col h-[600px] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">
              {mode === "support" ? "GoRASA Support" : mode === "planner" ? "Holiday Planner" : "GoRASA Assistant"}
            </h4>
            <p className="text-xs text-slate-400">AI-Powered • Instant Response</p>
          </div>
        </div>
        <span className="text-xs text-green-400 font-bold flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Live
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                msg.role === "user" ? "bg-orange-500 text-white" : "bg-slate-900 text-white"
              }`}>
                {msg.role === "user" ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-orange-500 text-white rounded-tr-none"
                  : "bg-slate-100 text-slate-800 rounded-tl-none"
              }`}>
                {msg.content}
                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {msg.quickReplies.map((reply) => (
                      <button
                        key={reply}
                        type="button"
                        onClick={() => handleQuickReply(reply)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors cursor-pointer"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs pl-11">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75" />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150" />
            </div>
            <span>Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function getGreeting(mode: string): string {
  switch (mode) {
    case "support":
      return "Namaste! Welcome to GoRASA Support. I can help with flights, hotels, bookings, and more. How can I assist you?";
    case "planner":
      return "Namaste! I'm your AI Holiday Planner. Where would you love to go for your next holiday?";
    default:
      return "Namaste! Welcome to GoRASA. How can I help you today?";
  }
}

function getInitialQuickReplies(mode: string): string[] {
  switch (mode) {
    case "support":
      return ["Flight help", "Hotel help", "My bookings", "Contact support"];
    case "planner":
      return ["Goa", "Kerala", "Maldives", "Manali", "Surprise me"];
    default:
      return ["Search Flights", "Search Hotels", "Plan Holiday", "My Bookings"];
  }
}

function generateResponse(mode: string, intent: UnifiedIntentResult, message: string): { content: string; quickReplies: string[] } {
  const responses: Record<string, { content: string; quickReplies: string[] }> = {
    flight_search: {
      content: "I can help you search for flights. Let me take you to our flight search page.",
      quickReplies: ["Search Flights", "View deals", "My bookings"],
    },
    hotel_search: {
      content: "I can help you find hotels. Let me take you to our hotel search page.",
      quickReplies: ["Search Hotels", "View deals", "My bookings"],
    },
    holiday_planning: {
      content: "I'd love to help you plan your holiday! Let me take you to our AI Holiday Planner.",
      quickReplies: ["Start Planning", "View packages"],
    },
    booking_inquiry: {
      content: "I can help you check your bookings. Let me take you to My Trips.",
      quickReplies: ["View My Trips", "Check PNR", "Download invoice"],
    },
    loyalty_inquiry: {
      content: "I can help you with your loyalty points. Let me take you to your profile.",
      quickReplies: ["View Points", "Redeem rewards", "Check tier"],
    },
    support_general: {
      content: "I'm here to help! What can I assist you with today?",
      quickReplies: ["Flight issue", "Hotel issue", "Payment", "Talk to agent"],
    },
    greeting: {
      content: "Namaste! How can I help you today?",
      quickReplies: ["Search Flights", "Search Hotels", "Plan Holiday", "My Bookings"],
    },
    unknown: {
      content: "I can help with flights, hotels, holidays, bookings, and more. What would you like to do?",
      quickReplies: ["Search Flights", "Search Hotels", "Plan Holiday", "Contact support"],
    },
  };

  return responses[intent.intent] || responses.unknown;
}
