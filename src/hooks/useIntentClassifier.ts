"use client";

import { useState, useCallback } from "react";
import { IntentCategory, ExtractedEntities, IntentResult, ConversationContext } from "@/lib/ai/intent/types";

interface UseIntentClassifierReturn {
  classify: (message: string, context?: ConversationContext) => Promise<IntentResult>;
  lastIntent: IntentResult | null;
  isClassifying: boolean;
  error: string | null;
}

export function useIntentClassifier(): UseIntentClassifierReturn {
  const [lastIntent, setLastIntent] = useState<IntentResult | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classify = useCallback(async (message: string, context?: ConversationContext): Promise<IntentResult> => {
    setIsClassifying(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/classify-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context }),
      });

      if (!res.ok) {
        throw new Error("Classification failed");
      }

      const data = await res.json();
      setLastIntent(data.intent);
      return data.intent;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);

      return {
        intent: "unknown",
        confidence: 0,
        entities: {},
        suggestedRoute: "",
        suggestedAction: "Try again",
        requiresAuth: false,
        handoffToAI: false,
      };
    } finally {
      setIsClassifying(false);
    }
  }, []);

  return { classify, lastIntent, isClassifying, error };
}
