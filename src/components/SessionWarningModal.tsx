"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, AlertTriangle, RefreshCw, LogOut } from "lucide-react";

interface SessionWarningModalProps {
  isOpen: boolean;
  onExtend: () => Promise<void>;
  onLogout: () => Promise<void>;
  expiresIn: number; // seconds until expiry
}

export default function SessionWarningModal({
  isOpen,
  onExtend,
  onLogout,
  expiresIn,
}: SessionWarningModalProps) {
  const [remaining, setRemaining] = useState(expiresIn);
  const [extending, setExtending] = useState(false);

  useEffect(() => {
    setRemaining(expiresIn);
  }, [expiresIn]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onLogout]);

  const handleExtend = useCallback(async () => {
    setExtending(true);
    try {
      await onExtend();
    } finally {
      setExtending(false);
    }
  }, [onExtend]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const urgencyColor =
    remaining <= 60
      ? "text-red-600"
      : remaining <= 120
      ? "text-amber-600"
      : "text-emerald-600";

  const urgencyBg =
    remaining <= 60
      ? "bg-red-50 border-red-200"
      : remaining <= 120
      ? "bg-amber-50 border-amber-200"
      : "bg-emerald-50 border-emerald-200";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className={`p-5 ${urgencyBg} border-b`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
                  <AlertTriangle className={`w-5 h-5 ${urgencyColor}`} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Session Expiring Soon
                  </h3>
                  <p className="text-xs text-slate-500">
                    Your session will expire automatically
                  </p>
                </div>
              </div>
            </div>

            {/* Countdown */}
            <div className="p-6 text-center">
              <div className="mb-4">
                <Clock className={`w-8 h-8 mx-auto mb-2 ${urgencyColor}`} />
                <p className={`text-4xl font-mono font-black ${urgencyColor}`}>
                  {formatTime(remaining)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  remaining until logout
                </p>
              </div>

              <p className="text-sm text-slate-600 mb-6">
                You&apos;ll be logged out automatically when the timer reaches
                zero. Any unsaved work may be lost.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onLogout}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Logout Now
                </button>
                <button
                  onClick={handleExtend}
                  disabled={extending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${extending ? "animate-spin" : ""}`}
                  />
                  {extending ? "Extending..." : "Stay Logged In"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
