"use client";

import React from "react";
import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4" />
      </div>
      <div className="bg-white border border-slate-100 rounded-3xl rounded-tl-none p-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
          </div>
          <span className="text-xs text-slate-400 font-medium">Planning your trip...</span>
        </div>
      </div>
    </div>
  );
}
