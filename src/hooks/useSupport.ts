"use client";

import { useState, useCallback } from "react";
import { SupportResponse, SupportContext } from "@/lib/support";
import { useAuth } from "./useAuth";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  quickReplies?: string[];
  quickActions?: Array<{ label: string; page: string; icon: string; description?: string }>;
}

interface UseSupportReturn {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
  lastResponse: SupportResponse | null;
}

export function useSupport(): UseSupportReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<SupportResponse | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const context: SupportContext = {
          user: user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                loyaltyPoints: user.loyaltyPoints,
                loyaltyTier: user.loyaltyTier,
              }
            : undefined,
          currentPage: window.location.pathname,
          conversationLength: messages.length,
        };

        const res = await fetch("/api/support", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, context }),
        });

        if (!res.ok) throw new Error("Support request failed");

        const data: SupportResponse = await res.json();
        setLastResponse(data);

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message,
          timestamp: new Date().toISOString(),
          quickReplies: data.quickReplies,
          quickActions: data.quickActions,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (error) {
        console.error("Support error:", error);

        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again or contact support directly.",
          timestamp: new Date().toISOString(),
          quickReplies: ["Try again", "Contact support"],
        };

        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [user, messages.length]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastResponse(null);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    lastResponse,
  };
}
