export type { FARule, IntentResult, QuickAction, SupportResponse, SupportContext } from "./types";
export { FAQ_RULES, matchFAQ, getFAQByCategory, getFAQById } from "./faqEngine";
export { detectIntent, shouldEscalate } from "./intentRouter";
export { QUICK_ACTIONS, getQuickActions } from "./quickActions";
export { getSupportResponse, getFollowUpSuggestions } from "./smartRouter";
