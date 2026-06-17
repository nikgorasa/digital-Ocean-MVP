export interface FARule {
  id: string;
  category: string;
  keywords: string[];
  synonyms?: string[];
  patterns?: RegExp[];
  response: string;
  relatedPages?: string[];
  quickActions?: string[];
}

export interface IntentResult {
  intent: string;
  confidence: number;
  route?: string;
  label?: string;
}

export interface QuickAction {
  label: string;
  page: string;
  icon: string;
  description?: string;
}

export interface SupportResponse {
  message: string;
  quickReplies: string[];
  quickActions: QuickAction[];
  route?: string;
  escalate?: boolean;
  ticketId?: string;
  faqMatched?: boolean;
  intentDetected?: string;
}

export interface SupportContext {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    loyaltyPoints?: number;
    loyaltyTier?: string;
    bookingCount?: number;
  };
  currentPage?: string;
  conversationLength: number;
}
