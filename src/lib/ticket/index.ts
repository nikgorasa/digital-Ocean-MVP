export type {
  Ticket,
  TicketNote,
  TicketActivity,
  CreateTicketInput,
  UpdateTicketInput,
  AddNoteInput,
  TicketFilters,
  TicketStats,
  TicketPriority,
  TicketStatus,
  TicketCategory,
} from "./types";

export {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_CATEGORIES,
} from "./types";

// Client-side (localStorage)
export {
  createTicket as createTicketLocal,
  getTicket as getTicketLocal,
  getUserTickets as getUserTicketsLocal,
  getAllTickets as getAllTicketsLocal,
  updateTicket as updateTicketLocal,
  addTicketNote as addTicketNoteLocal,
  getTicketNotes as getTicketNotesLocal,
  getTicketActivities as getTicketActivitiesLocal,
  getTicketStats as getTicketStatsLocal,
  escalateTicket as escalateTicketLocal,
  resolveTicket as resolveTicketLocal,
} from "./ticketManager";

// Server-side (Supabase)
export {
  createTicket,
  getTicket,
  getUserTickets,
  getAllTickets,
  updateTicket,
  addTicketNote,
  getTicketNotes,
  getTicketActivities,
  getTicketStats,
  escalateTicket,
  resolveTicket,
} from "./serverManager";
