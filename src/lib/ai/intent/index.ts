export type { IntentCategory, ExtractedEntities, IntentResult, ConversationContext } from "./types";
export { classifyIntentLocal, extractEntitiesLocal, getIntentResult } from "./classifier";
export { classifyIntentAI, classifyIntentSync } from "./aiClassifier";
export { routeUserMessage, routeUserMessageSync, shouldRedirectToFeature, requiresHumanAgent } from "./router";
