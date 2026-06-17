"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Clock,
  User,
  Send,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import {
  Ticket as TicketType,
  TicketNote,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
} from "@/lib/ticket/types";

interface TicketDetailProps {
  ticket: TicketType;
  onBack: () => void;
  onUpdate: () => void;
  isAgent?: boolean;
}

export default function TicketDetail({
  ticket,
  onBack,
  onUpdate,
  isAgent = false,
}: TicketDetailProps) {
  const [notes, setNotes] = useState<TicketNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [ticket.id]);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/notes?includeInternal=true`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: "Current User",
          authorRole: isAgent ? "agent" : "user",
          content: newNote,
          isInternal: isAgent ? isInternal : false,
        }),
      });

      if (res.ok) {
        setNewNote("");
        setIsInternal(false);
        fetchNotes();
        onUpdate();
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        onUpdate();
      }
    } catch (err) {
      console.error("Failed to update ticket:", err);
    }
  };

  const getStatusColor = (status: string) => {
    const statusObj = TICKET_STATUSES.find((s) => s.value === status);
    return statusObj?.color || "bg-slate-100 text-slate-600";
  };

  const getPriorityColor = (priority: string) => {
    const priorityObj = TICKET_PRIORITIES.find((p) => p.value === priority);
    return priorityObj?.color || "bg-slate-100 text-slate-600";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-orange-500 transition-colors mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to tickets
        </button>

        <div className="flex items-start justify-between">
          <div>
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
            <h2 className="text-xl font-serif font-bold text-slate-900">{ticket.subject}</h2>
          </div>

          {isAgent && (
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            >
              {TICKET_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {ticket.userName}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(ticket.createdAt)}
          </span>
          {ticket.bookingRef && (
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
              {ticket.bookingRef}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <p className="text-sm text-slate-700 whitespace-pre-line">{ticket.description}</p>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-orange-500" />
          Notes & Updates
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No notes yet. Be the first to add one.
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`p-3 rounded-lg ${
                  note.isInternal
                    ? "bg-yellow-50 border border-yellow-200"
                    : note.authorRole === "agent"
                    ? "bg-orange-50 border border-orange-200"
                    : "bg-slate-50 border border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-700">{note.author}</span>
                  <span className="text-[10px] text-slate-400">
                    {formatDate(note.createdAt)}
                  </span>
                  {note.isInternal && (
                    <span className="text-[10px] bg-yellow-200 text-yellow-700 px-1.5 py-0.5 rounded font-bold">
                      Internal
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-line">{note.content}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddNote} className="mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
            <button
              type="submit"
              disabled={sending || !newNote.trim()}
              className="px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {isAgent && (
            <label className="flex items-center gap-2 mt-2 text-xs text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="w-3 h-3 text-orange-500 rounded"
              />
              <AlertCircle className="w-3 h-3" />
              Internal note (not visible to customer)
            </label>
          )}
        </form>
      </div>
    </div>
  );
}
