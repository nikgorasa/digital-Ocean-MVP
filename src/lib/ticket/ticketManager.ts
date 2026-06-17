import {
  Ticket,
  TicketNote,
  TicketActivity,
  CreateTicketInput,
  UpdateTicketInput,
  AddNoteInput,
  TicketFilters,
  TicketStatus,
} from "./types";

const TICKETS_KEY = "gorasa_tickets";
const NOTES_KEY = "gorasa_ticket_notes";
const ACTIVITIES_KEY = "gorasa_ticket_activities";

function generateId(): string {
  return `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function getTickets(): Ticket[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(TICKETS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveTickets(tickets: Ticket[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
}

function getNotes(): TicketNote[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(NOTES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: TicketNote[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function getActivities(): TicketActivity[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(ACTIVITIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveActivities(activities: TicketActivity[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
}

function addActivity(ticketId: string, action: string, performedBy: string, details?: string): void {
  const activities = getActivities();
  activities.push({
    id: crypto.randomUUID(),
    ticketId,
    action,
    performedBy,
    details,
    createdAt: new Date().toISOString(),
  });
  saveActivities(activities);
}

export function createTicket(input: CreateTicketInput): Ticket {
  const tickets = getTickets();
  const now = new Date().toISOString();

  const ticket: Ticket = {
    id: generateId(),
    subject: input.subject,
    description: input.description,
    category: input.category,
    priority: input.priority || "medium",
    status: "open",
    userId: input.userId,
    userName: input.userName,
    userEmail: input.userEmail,
    userPhone: input.userPhone,
    bookingRef: input.bookingRef,
    createdAt: now,
    updatedAt: now,
  };

  tickets.push(ticket);
  saveTickets(tickets);

  addActivity(ticket.id, "created", input.userName, `Ticket created: ${input.subject}`);

  return ticket;
}

export function getTicket(ticketId: string): Ticket | null {
  const tickets = getTickets();
  return tickets.find((t) => t.id === ticketId) || null;
}

export function getUserTickets(userId: string): Ticket[] {
  const tickets = getTickets();
  return tickets
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAllTickets(filters?: TicketFilters): Ticket[] {
  let tickets = getTickets();

  if (filters) {
    if (filters.status?.length) {
      tickets = tickets.filter((t) => filters.status!.includes(t.status));
    }
    if (filters.priority?.length) {
      tickets = tickets.filter((t) => filters.priority!.includes(t.priority));
    }
    if (filters.category?.length) {
      tickets = tickets.filter((t) => filters.category!.includes(t.category));
    }
    if (filters.assignedTo) {
      tickets = tickets.filter((t) => t.assignedTo === filters.assignedTo);
    }
    if (filters.userId) {
      tickets = tickets.filter((t) => t.userId === filters.userId);
    }
    if (filters.dateRange) {
      tickets = tickets.filter((t) => {
        const created = new Date(t.createdAt);
        const from = new Date(filters.dateRange!.from);
        const to = new Date(filters.dateRange!.to);
        return created >= from && created <= to;
      });
    }
  }

  return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function updateTicket(ticketId: string, input: UpdateTicketInput): Ticket | null {
  const tickets = getTickets();
  const index = tickets.findIndex((t) => t.id === ticketId);
  if (index === -1) return null;

  const ticket = tickets[index];
  const now = new Date().toISOString();

  if (input.status) {
    ticket.status = input.status;
    if (input.status === "resolved") ticket.resolvedAt = now;
    if (input.status === "closed") ticket.closedAt = now;
  }

  if (input.priority) ticket.priority = input.priority;
  if (input.assignedTo) {
    ticket.assignedTo = input.assignedTo;
    ticket.assignedToName = input.assignedToName;
  }

  ticket.updatedAt = now;
  tickets[index] = ticket;
  saveTickets(tickets);

  const changes = Object.entries(input)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  addActivity(ticketId, "updated", "System", changes);

  return ticket;
}

export function addTicketNote(input: AddNoteInput): TicketNote {
  const notes = getNotes();

  const note: TicketNote = {
    id: crypto.randomUUID(),
    ticketId: input.ticketId,
    author: input.author,
    authorRole: input.authorRole,
    content: input.content,
    isInternal: input.isInternal || false,
    createdAt: new Date().toISOString(),
  };

  notes.push(note);
  saveNotes(notes);

  addActivity(input.ticketId, "note_added", input.author, input.content.substring(0, 100));

  return note;
}

export function getTicketNotes(ticketId: string, includeInternal: boolean = false): TicketNote[] {
  const notes = getNotes();
  return notes
    .filter((n) => {
      if (n.ticketId !== ticketId) return false;
      if (!includeInternal && n.isInternal && n.authorRole !== "agent") return false;
      return true;
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getTicketActivities(ticketId: string): TicketActivity[] {
  const activities = getActivities();
  return activities
    .filter((a) => a.ticketId === ticketId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getTicketStats(): {
  total: number;
  open: number;
  inProgress: number;
  escalated: number;
  resolved: number;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
} {
  const tickets = getTickets();

  return {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    escalated: tickets.filter((t) => t.status === "escalated").length,
    resolved: tickets.filter((t) => t.status === "resolved" || t.status === "closed").length,
    byPriority: tickets.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byCategory: tickets.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

export function escalateTicket(ticketId: string, reason: string, agentName: string): Ticket | null {
  const ticket = updateTicket(ticketId, { status: "escalated" });
  if (!ticket) return null;

  addTicketNote({
    ticketId,
    author: agentName,
    authorRole: "agent",
    content: `Escalated: ${reason}`,
    isInternal: true,
  });

  return ticket;
}

export function resolveTicket(ticketId: string, resolution: string, agentName: string): Ticket | null {
  const ticket = updateTicket(ticketId, { status: "resolved" });
  if (!ticket) return null;

  addTicketNote({
    ticketId,
    author: agentName,
    authorRole: "agent",
    content: `Resolved: ${resolution}`,
  });

  return ticket;
}
