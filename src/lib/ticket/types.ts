export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "escalated" | "pending" | "resolved" | "closed";
export type TicketCategory = "flight" | "hotel" | "holiday" | "payment" | "loyalty" | "account" | "general";

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  bookingRef?: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface TicketNote {
  id: string;
  ticketId: string;
  author: string;
  authorRole: "user" | "agent" | "system";
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface TicketActivity {
  id: string;
  ticketId: string;
  action: string;
  performedBy: string;
  details?: string;
  createdAt: string;
}

export interface CreateTicketInput {
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  bookingRef?: string;
}

export interface UpdateTicketInput {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string;
  assignedToName?: string;
}

export interface AddNoteInput {
  ticketId: string;
  author: string;
  authorRole: "user" | "agent" | "system";
  content: string;
  isInternal?: boolean;
}

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedTo?: string;
  userId?: string;
  dateRange?: { from: string; to: string };
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  escalated: number;
  resolved: number;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
}

export const TICKET_PRIORITIES: { value: TicketPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "bg-slate-100 text-slate-600" },
  { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-600" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-600" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-600" },
];

export const TICKET_STATUSES: { value: TicketStatus; label: string; color: string }[] = [
  { value: "open", label: "Open", color: "bg-blue-100 text-blue-600" },
  { value: "in_progress", label: "In Progress", color: "bg-yellow-100 text-yellow-600" },
  { value: "escalated", label: "Escalated", color: "bg-orange-100 text-orange-600" },
  { value: "pending", label: "Pending", color: "bg-purple-100 text-purple-600" },
  { value: "resolved", label: "Resolved", color: "bg-green-100 text-green-600" },
  { value: "closed", label: "Closed", color: "bg-slate-100 text-slate-600" },
];

export const TICKET_CATEGORIES: { value: TicketCategory; label: string; icon: string }[] = [
  { value: "flight", label: "Flight Issue", icon: "Plane" },
  { value: "hotel", label: "Hotel Issue", icon: "Building" },
  { value: "holiday", label: "Holiday Package", icon: "Palmtree" },
  { value: "payment", label: "Payment Issue", icon: "CreditCard" },
  { value: "loyalty", label: "Loyalty & Rewards", icon: "Star" },
  { value: "account", label: "Account Issue", icon: "User" },
  { value: "general", label: "General Inquiry", icon: "HelpCircle" },
];
