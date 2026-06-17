"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Send, ArrowRight, Bot, User as UserIcon, CheckCircle } from "lucide-react";

interface ClassificationResult {
  intent: string;
  confidence: number;
  entities: Record<string, unknown>;
  suggestedRoute: string;
  suggestedAction: string;
}

const EXAMPLE_MESSAGES = [
  "I want to fly to Goa next week",
  "Book a hotel in Mumbai",
  "Plan my holiday to Kerala",
  "Where is my booking?",
  "Cancel my flight",
  "How many loyalty points do I have?",
  "Hello",
  "Help me with payment",
];

export default function IntentDemo() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ message: string; result: ClassificationResult }[]>([]);

  const handleClassify = async (message: string) => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ai/classify-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setResult(data.intent);
      setHistory((prev) => [{ message, result: data.intent }, ...prev].slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  const getIntentColor = (intent: string) => {
    const colors: Record<string, string> = {
      flight_search: "bg-blue-100 text-blue-700",
      hotel_search: "bg-purple-100 text-purple-700",
      holiday_planning: "bg-green-100 text-green-700",
      booking_inquiry: "bg-yellow-100 text-yellow-700",
      booking_modification: "bg-orange-100 text-orange-700",
      cancellation: "bg-red-100 text-red-700",
      payment_help: "bg-pink-100 text-pink-700",
      loyalty_inquiry: "bg-indigo-100 text-indigo-700",
      support_general: "bg-slate-100 text-slate-700",
      greeting: "bg-cyan-100 text-cyan-700",
      unknown: "bg-gray-100 text-gray-700",
    };
    return colors[intent] || "bg-gray-100 text-gray-700";
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
              <h3 className="font-bold">Intent Classifier Demo</h3>
              <p className="text-xs text-slate-400">Test the AI intent classification</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-slate-100">
          <p className="text-xs text-slate-500 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_MESSAGES.map((msg) => (
              <button
                key={msg}
                onClick={() => handleClassify(msg)}
                className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-full transition-colors cursor-pointer"
              >
                {msg}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleClassify(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message to classify..."
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

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border-t border-slate-100 bg-slate-50"
          >
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Classification Result
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Intent:</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${getIntentColor(result.intent)}`}>
                  {result.intent}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Confidence:</span>
                <span className="text-sm font-mono">{(result.confidence * 100).toFixed(0)}%</span>
              </div>
              {result.suggestedRoute && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Route:</span>
                  <span className="text-sm font-mono text-orange-600">{result.suggestedRoute}</span>
                </div>
              )}
              {Object.keys(result.entities).length > 0 && (
                <div>
                  <span className="text-sm text-slate-600">Entities:</span>
                  <pre className="text-xs bg-white p-2 rounded-lg mt-1 overflow-auto">
                    {JSON.stringify(result.entities, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {history.length > 0 && (
          <div className="p-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Recent Classifications
            </h4>
            <div className="space-y-2">
              {history.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <UserIcon className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-600 truncate flex-1">{item.message}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className={`px-2 py-0.5 rounded-full ${getIntentColor(item.result.intent)}`}>
                    {item.result.intent}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
