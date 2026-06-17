"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Bot, User as UserIcon } from "lucide-react";
import { Message } from "@/lib/ai/holidayPlanner";
import TypingIndicator from "./TypingIndicator";
import QuickReplies from "./QuickReplies";

interface ChatInterfaceProps {
  messages: Message[];
  quickReplies: string[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onQuickReply: (reply: string) => void;
}

export default function ChatInterface({
  messages,
  quickReplies,
  isLoading,
  onSendMessage,
  onQuickReply,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onSendMessage(inputValue.trim());
    setInputValue("");
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 flex flex-col h-[600px] shadow-sm overflow-hidden">
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white relative shadow-md">
            <Bot className="w-5 h-5" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-serif font-bold text-base">Holiday Planner</h4>
              <span className="text-[9px] bg-orange-500/20 text-orange-400 font-extrabold uppercase px-1.5 py-0.5 rounded">
                AI Agent
              </span>
            </div>
            <p className="text-slate-400 text-xs font-mono">Status: Connected • Instant Planning</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-green-400 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Live
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0, 1] }}
              className={`flex items-start gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm shrink-0 ${
                  msg.role === "user"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-900 text-white"
                }`}
              >
                {msg.role === "user" ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <motion.div
                layout
                className={`max-w-[75%] p-4 rounded-3xl text-sm leading-relaxed relative ${
                  msg.role === "user"
                    ? "bg-orange-500 text-white rounded-tr-none shadow-orange-100 shadow-md"
                    : "bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-sm"
                }`}
              >
                <p className="whitespace-pre-line">{msg.content}</p>
                <span
                  className={`block text-[9px] mt-1.5 ${
                    msg.role === "user" ? "text-white/60" : "text-slate-400"
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </span>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && <TypingIndicator />}

        {!isLoading && quickReplies.length > 0 && messages.length > 0 && (
          <div className="pl-11">
            <QuickReplies replies={quickReplies} onSelect={onQuickReply} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-slate-100 bg-white flex items-center gap-3"
      >
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-1 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 rounded-2xl px-5 py-3 text-sm font-medium transition-all"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
        />
        <motion.button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className="w-12 h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-100 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </form>
    </div>
  );
}
