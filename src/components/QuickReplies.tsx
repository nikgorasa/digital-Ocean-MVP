"use client";

import React from "react";
import { motion } from "motion/react";

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
}

export default function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  if (!replies || replies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {replies.map((reply) => (
        <motion.button
          key={reply}
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(reply)}
          className="px-4 py-2 border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors cursor-pointer"
        >
          {reply}
        </motion.button>
      ))}
    </div>
  );
}
