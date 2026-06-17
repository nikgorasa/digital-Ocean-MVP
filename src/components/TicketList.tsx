"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Ticket,
  Clock,
  ChevronRight,
  Plus,
  Filter,
} from "lucide-react";
import {
  Ticket as TicketType,
  TicketStatus,
  TicketPriority,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
} from "@/lib/ticket/types";

interface TicketListProps {
  userId?: string;
  onSelectTicket: (ticket: TicketType) => void;
  onCreateTicket: () => void;
  isAdmin?: boolean;
}

export default function TicketList({
  userId,
  onSelectTicket,
  onCreateTicket,
  isAdmin = false,
}: TicketListProps) {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TicketPriority | "all">("all");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const url = userId ? `/api/tickets?userId=${userId}` : "/api/tickets";
      const res = await fetch(url);
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

  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus !== "all" && ticket.status !== filterStatus) return false;
    if (filterPriority !== "all" && ticket.priority !== filterPriority) return false;
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
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-serif font-bold text-slate-900 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-orange-500" />
          Support Tickets
          <span className="text-sm font-sans text-slate-400">({filteredTickets.length})</span>
        </h3>
        <button
          type="button"
          onClick={onCreateTicket}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as TicketStatus | "all")}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 outline-none"
        >
          <option value="all">All Status</option>
          {TICKET_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as TicketPriority | "all")}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 outline-none"
        >
          <option value="all">All Priority</option>
          {TICKET_PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Ticket className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>No tickets found</p>
          <button
            type="button"
            onClick={onCreateTicket}
            className="mt-4 text-orange-500 hover:text-orange-600 text-sm font-medium cursor-pointer"
          >
            Create your first ticket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <motion.button
              key={ticket.id}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectTicket(ticket)}
              className="w-full p-4 bg-white border border-slate-100 rounded-xl text-left hover:border-orange-200 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400">{ticket.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {ticket.status.replace("_", " ").toUpperCase()}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityColor(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm">{ticket.subject}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {ticket.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  {formatDate(ticket.createdAt)}
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
