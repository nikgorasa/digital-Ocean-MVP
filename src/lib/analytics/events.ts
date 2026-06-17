export interface AnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
  timestamp: string;
  sessionId?: string;
  userId?: string;
}

const eventQueue: AnalyticsEvent[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

export function track(
  event: string,
  properties: Record<string, unknown> = {},
  options?: { sessionId?: string; userId?: string }
): void {
  const analyticsEvent: AnalyticsEvent = {
    event,
    properties,
    timestamp: new Date().toISOString(),
    sessionId: options?.sessionId,
    userId: options?.userId,
  };

  eventQueue.push(analyticsEvent);

  // Flush after 5 events or 30 seconds
  if (eventQueue.length >= 5) {
    flushEvents();
  } else if (!flushTimeout) {
    flushTimeout = setTimeout(flushEvents, 30000);
  }
}

function flushEvents(): void {
  if (eventQueue.length === 0) return;

  const eventsToSend = [...eventQueue];
  eventQueue.length = 0;

  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  // Send to analytics endpoint (or console for now)
  console.log("[Analytics]", eventsToSend);

  // Future: Send to actual analytics service
  // fetch("/api/analytics", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ events: eventsToSend }),
  // });
}

// Pre-defined event trackers
export const analytics = {
  // Chat events
  chatMessageSent: (mode: string, intent: string, sessionId?: string) =>
    track("chat_message_sent", { mode, intent }, { sessionId }),

  chatSessionStarted: (mode: string, sessionId?: string) =>
    track("chat_session_started", { mode }, { sessionId }),

  // Planner events
  plannerItineraryGenerated: (destination: string, days: number, travelers: number, sessionId?: string) =>
    track("planner_itinerary_generated", { destination, days, travelers }, { sessionId }),

  plannerHandoffRequested: (destination: string, totalCost: number, sessionId?: string) =>
    track("planner_handoff_requested", { destination, totalCost }, { sessionId }),

  // Ticket events
  ticketCreated: (category: string, priority: string, source: string, ticketId: string) =>
    track("ticket_created", { category, priority, source, ticketId }),

  ticketStatusChanged: (ticketId: string, oldStatus: string, newStatus: string) =>
    track("ticket_status_changed", { ticketId, oldStatus, newStatus }),

  ticketNoteAdded: (ticketId: string, authorRole: string) =>
    track("ticket_note_added", { ticketId, authorRole }),

  // Support events
  supportEscalated: (reason: string, conversationLength: number, intent: string) =>
    track("support_escalated", { reason, conversationLength, intent }),

  supportFaqMatched: (faqId: string, category: string) =>
    track("support_faq_matched", { faqId, category }),

  supportIntentDetected: (intent: string, confidence: number) =>
    track("support_intent_detected", { intent, confidence }),

  // Filter events
  filtersApplied: (page: string, filterCount: number, filters: Record<string, unknown>) =>
    track("filters_applied", { page, filterCount, filters }),

  // Navigation events
  pageNavigated: (from: string, to: string, trigger: string) =>
    track("page_navigated", { from, to, trigger }),
};

export function flush(): void {
  flushEvents();
}
