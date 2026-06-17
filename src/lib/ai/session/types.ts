export interface SavedSession {
  id: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }>;
  itinerary: unknown | null;
  quickReplies: string[];
  state: string;
  createdAt: string;
  updatedAt: string;
  destination?: string;
}

export interface SessionMetadata {
  id: string;
  destination: string;
  days?: number;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}
