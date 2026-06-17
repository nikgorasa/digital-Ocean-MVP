"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Send, Bot, User as UserIcon, ExternalLink } from "lucide-react";

const EXAMPLE_MESSAGES = [
  "Hello",
  "What is the baggage allowance?",
  "I want to cancel my booking",
  "How many loyalty points do I have?",
  "Search flights to Goa",
  "I want to talk to a human",
];

export default function SupportDemo() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{
    role: "user" | "assistant";
    content: string;
    quickReplies?: string[];
    quickActions?: Array<{ label: string; page: string; icon: string }>;
  }>>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: { conversationLength: messages.length },
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          quickReplies: data.quickReplies,
          quickActions: data.quickActions,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          quickReplies: ["Try again"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">Smart Support Demo</h3>
              <p className="text-xs text-slate-400">Test the FAQ + Intent routing system</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-slate-100">
          <p className="text-xs text-slate-500 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_MESSAGES.map((msg) => (
              <button
                key={msg}
                onClick={() => handleSend(msg)}
                className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-full transition-colors cursor-pointer"
              >
                {msg}
              </button>
            ))}
          </div>
        </div>

        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 py-12">
              <Bot className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Ask me anything about GoRASA</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.role === "user"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-900 text-white"
                }`}
              >
                {msg.role === "user" ? (
                  <UserIcon className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div
                className={`max-w-[80%] p-4 rounded-2xl text-sm whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-orange-500 text-white rounded-tr-none"
                    : "bg-slate-100 text-slate-800 rounded-tl-none"
                }`}
              >
                {msg.content}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.quickActions.map((action, i) => (
                      <a
                        key={i}
                        href={action.page || "#"}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors border border-slate-200"
                      >
                        {action.label}
                        {action.page && <ExternalLink className="w-3 h-3" />}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs pl-11">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150" />
              </div>
              <span>Thinking...</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
