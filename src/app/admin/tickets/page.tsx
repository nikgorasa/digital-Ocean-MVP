"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Ticket,
  ChevronRight,
  Filter,
  User,
  MessageSquare,
  Send,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Ticket as TicketType,
  TicketStatus,
  TicketPriority,
  TicketNote,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
} from "@/lib/ticket/types";

export default function AdminTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TicketPriority | "all">("all");
  const [stats, setStats] = useState<{
    total: number;
    open: number;
    inProgress: number;
    escalated: number;
    resolved: number;
  } | null>(null);
  const [notes, setNotes] = useState<TicketNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [sendingNote, setSendingNote] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTickets();
    fetchStats();
    fetch("/api/leads/assignable-users").then(r => r.json()).then(setAssignableUsers).catch(() => {});
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/tickets?stats=true");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchNotes = async (ticketId: string) => {
    setNotesLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchTickets();
        fetchStats();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: newStatus });
        }
      }
    } catch (err) {
      console.error("Failed to update ticket:", err);
    }
  };

  const handlePriorityChange = async (ticketId: string, newPriority: TicketPriority) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (res.ok) {
        fetchTickets();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, priority: newPriority });
        }
      }
    } catch (err) {
      console.error("Failed to update priority:", err);
    }
  };

  const handleAddNote = async () => {
    if (!selectedTicket || !newNote.trim() || !user) return;
    setSendingNote(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newNote.trim(),
          author: user.name || user.email,
          authorRole: "agent",
        }),
      });
      if (res.ok) {
        setNewNote("");
        fetchNotes(selectedTicket.id);
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setSendingNote(false);
    }
  };

  const handleAssign = async (ticketId: string, userId: string, userName: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: userId, assignedToName: userName }),
      });
      if (res.ok) {
        fetchTickets();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, assignedTo: userId, assignedToName: userName });
        }
      }
    } catch (err) {
      console.error("Failed to assign ticket:", err);
    }
  };

  const handleArchive = async (ticketId: string) => {
    if (!confirm("Archive this ticket?")) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      if (res.ok) {
        fetchTickets();
        fetchStats();
        if (selectedTicket?.id === ticketId) setSelectedTicket(null);
      }
    } catch (err) {
      console.error("Failed to archive ticket:", err);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus !== "all" && ticket.status !== filterStatus) return false;
    if (filterPriority !== "all" && ticket.priority !== filterPriority) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!ticket.subject?.toLowerCase().includes(q) && !ticket.userName?.toLowerCase().includes(q) && !ticket.userEmail?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const getStatusColor = (status: TicketStatus) => {
    const statusObj = TICKET_STATUSES.find((s) => s.value === status);
    return statusObj?.color || "bg-slate-100 text-slate-600";
  };

  const getPriorityColor = (priority: TicketPriority) => {
    const priorityObj = TICKET_PRIORITIES.find((p) => p.value === priority);
    return priorityObj?.color || "bg-slate-100 text-slate-600";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
          <Ticket className="w-6 h-6 text-orange-500" />
          Ticket Management
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage support tickets and customer inquiries
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-white border border-slate-100 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Total</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs text-blue-600 mb-1">Open</p>
            <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
            <p className="text-xs text-yellow-600 mb-1">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
          </div>
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
            <p className="text-xs text-orange-600 mb-1">Escalated</p>
            <p className="text-2xl font-bold text-orange-600">{stats.escalated}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tickets..."
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-orange-500 outline-none"
        />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TicketStatus | "all")}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="all">All Status</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as TicketPriority | "all")}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="all">All Priority</option>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <span className="text-sm text-slate-500">
          {filteredTickets.length} ticket{filteredTickets.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Ticket className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No tickets found</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <motion.button
                key={ticket.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setSelectedTicket(ticket); fetchNotes(ticket.id); }}
                className={`w-full p-4 bg-white border rounded-xl text-left transition-all cursor-pointer ${
                  selectedTicket?.id === ticket.id
                    ? "border-orange-500 shadow-md"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-400">{ticket.id.slice(0, 8)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">{ticket.subject}</h3>
                    <p className="text-xs text-slate-500 mt-1">{ticket.userName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority.toUpperCase()}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-white border border-slate-100 rounded-xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400">{selectedTicket.id.slice(0, 8)}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace("_", " ").toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-xl font-serif font-bold text-slate-900">{selectedTicket.subject}</h2>
                </div>
                <button
                  onClick={() => handleArchive(selectedTicket.id)}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer"
                >
                  Archive
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Customer</p>
                  <p className="font-semibold text-slate-900">{selectedTicket.userName}</p>
                  <p className="text-xs text-slate-500">{selectedTicket.userEmail}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Created</p>
                  <p className="font-semibold text-slate-900">{formatDate(selectedTicket.createdAt)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Status</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as TicketStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    {TICKET_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Priority</label>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => handlePriorityChange(selectedTicket.id, e.target.value as TicketPriority)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    {TICKET_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Assigned To</label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTicket.assignedTo || ""}
                    onChange={(e) => {
                      const u = assignableUsers.find((u: any) => u.id === e.target.value);
                      if (u) handleAssign(selectedTicket.id, u.id, u.name);
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="">Unassigned</option>
                    {assignableUsers.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                  {selectedTicket.assignedToName && (
                    <span className="text-xs text-slate-500">Currently: {selectedTicket.assignedToName}</span>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-700 mb-2">Description</h3>
                <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700 whitespace-pre-line">
                  {selectedTicket.description}
                </div>
              </div>

              {selectedTicket.bookingRef && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-2">Booking Reference</h3>
                  <span className="font-mono bg-slate-100 px-3 py-1 rounded text-sm">{selectedTicket.bookingRef}</span>
                </div>
              )}

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <MessageSquare size={16} /> Admin Notes
                </h3>
                {notesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-saffron" />
                  </div>
                ) : (
                  <>
                    {notes.length > 0 && (
                      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                        {notes.map((note) => (
                          <div key={note.id} className={`p-3 rounded-xl text-sm ${note.authorRole === "agent" ? "bg-orange-50 border border-orange-100" : "bg-slate-50 border border-slate-100"}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <User size={12} className="text-slate-400" />
                              <span className="font-medium text-slate-900">{note.author}</span>
                              <span className="text-[10px] text-slate-400">{note.createdAt ? formatDate(note.createdAt) : ""}</span>
                            </div>
                            <p className="text-slate-700">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddNote()}
                        placeholder="Add a note..."
                        className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || sendingNote}
                        className="px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-xl p-12 text-center">
              <Ticket className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Select a Ticket</h3>
              <p className="text-slate-500 text-sm">Click on a ticket from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
