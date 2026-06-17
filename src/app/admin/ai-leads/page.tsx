"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Bot,
  User,
  Calendar,
  MapPin,
  Clock,
  MessageSquare,
  Filter,
  ChevronRight,
  UserPlus,
} from "lucide-react";

interface AiLead {
  id: string;
  destination: string;
  travelerName: string;
  travelerEmail: string;
  travelerPhone: string;
  numberOfDays: number;
  notes: string;
  stage: string;
  assignedTo?: string;
  createdAt: string;
  source: string;
}

interface AssignableUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const STAGES = [
  { id: "NEW", label: "New", color: "bg-blue-100 text-blue-700" },
  { id: "QUALIFIED", label: "Qualified", color: "bg-green-100 text-green-700" },
  { id: "CONTACTED", label: "Contacted", color: "bg-yellow-100 text-yellow-700" },
  { id: "MEETING", label: "Meeting", color: "bg-purple-100 text-purple-700" },
  { id: "QUOTED", label: "Quoted", color: "bg-orange-100 text-orange-700" },
  { id: "WON", label: "Won", color: "bg-green-500 text-white" },
];

export default function AiLeadsPage() {
  const [leads, setLeads] = useState<AiLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<AiLead | null>(null);
  const [filterStage, setFilterStage] = useState<string>("all");
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);

  useEffect(() => {
    fetchLeads();
    fetchAssignableUsers();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads");
      if (res.ok) {
        const data = await res.json();
        const aiLeads = data.filter(
          (lead: AiLead) =>
            lead.source === "AI_PLANNER" ||
            lead.notes?.includes("AI Planner") ||
            lead.notes?.includes("AI Concierge")
        );
        setLeads(aiLeads);
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignableUsers = async () => {
    try {
      const res = await fetch("/api/leads/assignable-users");
      if (res.ok) {
        const data = await res.json();
        setAssignableUsers(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch assignable users:", err);
    }
  };

  const updateLeadStage = async (leadId: string, newStage: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) {
        setLeads(leads.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)));
        if (selectedLead?.id === leadId) {
          setSelectedLead({ ...selectedLead, stage: newStage });
        }
      }
    } catch (err) {
      console.error("Failed to update lead:", err);
    }
  };

  const assignLead = async (leadId: string, userId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: userId || null }),
      });
      if (res.ok) {
        const user = assignableUsers.find((u) => u.id === userId);
        setLeads(leads.map((l) => (l.id === leadId ? { ...l, assignedTo: userId } : l)));
        if (selectedLead?.id === leadId) {
          setSelectedLead({ ...selectedLead, assignedTo: userId });
        }
      }
    } catch (err) {
      console.error("Failed to assign lead:", err);
    }
  };

  const filteredLeads =
    filterStage === "all"
      ? leads
      : leads.filter((l) => l.stage === filterStage);

  const getStageColor = (stage: string) => {
    const found = STAGES.find((s) => s.id === stage);
    return found?.color || "bg-slate-100 text-slate-700";
  };

  const parseItineraryFromNotes = (notes: string) => {
    const itineraryMatch = notes?.match(/Itinerary:\n([\s\S]*?)(?=\n\n|$)/);
    if (itineraryMatch) return itineraryMatch[1].trim();
    return null;
  };

  const parseConversationFromNotes = (notes: string) => {
    const convMatch = notes?.match(/Conversation:\n([\s\S]*?)$/);
    if (convMatch) return convMatch[1].trim();
    return null;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="space-y-3 mt-6">
            {[1, 2, 3].map((i) => (
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
          <Bot className="w-6 h-6 text-orange-500" />
          AI Planner Leads
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Leads generated by the AI Holiday Planner
        </p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="all">All Stages</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <span className="text-sm text-slate-500">
          {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bot className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No AI planner leads yet</p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <motion.button
                key={lead.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedLead(lead)}
                className={`w-full p-4 bg-white border rounded-xl text-left transition-all cursor-pointer ${
                  selectedLead?.id === lead.id
                    ? "border-orange-500 shadow-md"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold text-slate-900">{lead.destination}</span>
                    </div>
                    <p className="text-sm text-slate-500">{lead.travelerName}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getStageColor(lead.stage)}`}>
                    {lead.stage}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {lead.numberOfDays} days
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(lead.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </motion.button>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedLead ? (
            <div className="bg-white border border-slate-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-900">{selectedLead.destination}</h2>
                  <p className="text-slate-500">{selectedLead.travelerName} • {selectedLead.travelerEmail}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStageColor(selectedLead.stage)}`}>
                  {selectedLead.stage}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Duration</p>
                  <p className="font-semibold text-slate-900">{selectedLead.numberOfDays} days</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Phone</p>
                  <p className="font-semibold text-slate-900">{selectedLead.travelerPhone || "Not provided"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Update Stage</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {STAGES.map((stage) => (
                      <button
                        key={stage.id}
                        onClick={() => updateLeadStage(selectedLead.id, stage.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          selectedLead.stage === stage.id
                            ? "bg-slate-900 text-white"
                            : `${stage.color} border hover:opacity-80`
                        }`}
                      >
                        {stage.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Assign To</label>
                  <div className="flex items-center gap-2">
                    <UserPlus size={14} className="text-slate-400" />
                    <select
                      value={selectedLead.assignedTo || ""}
                      onChange={(e) => assignLead(selectedLead.id, e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="">Unassigned</option>
                      {assignableUsers.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {selectedLead.notes && (
                <>
                  {parseItineraryFromNotes(selectedLead.notes) && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-500" /> Generated Itinerary
                      </h3>
                      <div className="p-4 bg-orange-50 rounded-xl text-sm text-slate-700 whitespace-pre-line">
                        {parseItineraryFromNotes(selectedLead.notes)}
                      </div>
                    </div>
                  )}
                  {parseConversationFromNotes(selectedLead.notes) && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-orange-500" /> Conversation History
                      </h3>
                      <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 max-h-64 overflow-y-auto whitespace-pre-line">
                        {parseConversationFromNotes(selectedLead.notes)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-xl p-12 text-center">
              <Bot className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Select a Lead</h3>
              <p className="text-slate-500 text-sm">Click on a lead from the list to view full details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
