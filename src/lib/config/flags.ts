export const featureFlags = {
  AI_PLANNER_ENABLED: process.env.NEXT_PUBLIC_AI_PLANNER_ENABLED === "true",
  SUPPORT_CHAT_ENABLED: process.env.NEXT_PUBLIC_SUPPORT_CHAT_ENABLED === "true",
  TICKETS_ENABLED: process.env.NEXT_PUBLIC_TICKETS_ENABLED === "true",
  UNIFIED_CHAT_ENABLED: process.env.NEXT_PUBLIC_UNIFIED_CHAT_ENABLED === "true",
  FILTER_PANEL_ENABLED: process.env.NEXT_PUBLIC_FILTER_PANEL_ENABLED === "true",
  INTENT_CLASSIFICATION_ENABLED: process.env.NEXT_PUBLIC_INTENT_CLASSIFICATION_ENABLED === "true",
  MULTI_LANGUAGE_ENABLED: process.env.NEXT_PUBLIC_MULTI_LANGUAGE_ENABLED === "true",
  SESSION_PERSISTENCE_ENABLED: process.env.NEXT_PUBLIC_SESSION_PERSISTENCE_ENABLED === "true",
};

export function isFeatureEnabled(flag: keyof typeof featureFlags): boolean {
  return featureFlags[flag] === true;
}
