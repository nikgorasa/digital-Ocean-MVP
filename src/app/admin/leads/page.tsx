"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BarChart3, User, Mail, Phone, Calendar, MapPin, ChevronRight, Clock } from "lucide-react";

interface Lead {
  id: string;
  destination: string;
  travelerName: string;
  travelerEmail: string;
  travelerPhone?: string;
  numberOfDays: number;
  stage: string;
  source: string;
  notes?: string;
  createdAt: string;
  assignedUser?: { id: string; name: string; email: string };
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeStage, setActiveStage] = useState<string>("all");
  const [stages, setStages] = useState<{ id: string; label: string; color: string }[]>([]);
  const [lostReason, setLostReason] = useState("");
  const [showLostModal, setShowLostModal] = useState(false);
  const [pendingLostLeadId, setPendingLostLeadId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newLead, setNewLead] = useState({ destination: "", travelerName: "", travelerEmail: "", travelerPhone: "", numberOfDays: 5, source: "manual" });

  useEffect(() => {
    fetch("/api/leads")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLeads(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/leads/stages")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setStages(data); })
      .catch(() => {});
  }, []);

  const createLead = async () => {
    if (!newLead.destination || !newLead.travelerName || !newLead.travelerEmail) return;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newLead, stage: "NEW" }),
      });
      if (res.ok) {
        const lead = await res.json();
        setLeads([lead, ...leads]);
        setNewLead({ destination: "", travelerName: "", travelerEmail: "", travelerPhone: "", numberOfDays: 5, source: "manual" });
        setShowCreate(false);
      }
    } catch (err) {
      console.error("Failed to create lead:", err);
    }
  };

  const updateLeadStage = async (leadId: string, newStage: string, reason?: string) => {
    try {
      const body: any = { stage: newStage };
      if (reason) body.notes = `LOST: ${reason}`;
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  const filteredLeads = leads.filter((l) => {
    if (activeStage !== "all" && l.stage !== activeStage) return false;
    if (sourceFilter !== "ALL" && l.source !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!l.travelerName?.toLowerCase().includes(q) && !l.travelerEmail?.toLowerCase().includes(q) && !l.destination?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const getStageCount = (stage: string) => leads.filter((l) => l.stage === stage).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-saffron" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-slate-900">Lead CRM</h1>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-brand-saffron text-white rounded-xl text-sm font-medium hover:bg-brand-burnt cursor-pointer">
          + New Lead
        </button>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads..." className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm w-64" />
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm">
          <option value="ALL">All Sources</option>
          <option value="ai_planner">AI Planner</option>
          <option value="package_interest">Package Interest</option>
          <option value="manual">Manual</option>
          <option value="website">Website</option>
        </select>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <button
          onClick={() => setActiveStage("all")}
          className={`p-4 rounded-xl border text-center cursor-pointer transition-colors ${
            activeStage === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <p className="text-2xl font-bold">{leads.length}</p>
          <p className="text-xs opacity-80">All Leads</p>
        </button>
        {stages.map((stage) => (
          <button
            key={stage.id}
            onClick={() => setActiveStage(stage.id)}
            className={`p-4 rounded-xl border text-center cursor-pointer transition-colors ${
              activeStage === stage.id ? "bg-slate-900 text-white border-slate-900" : `bg-white ${stage.color} border`
            }`}
          >
            <p className="text-2xl font-bold">{getStageCount(stage.id)}</p>
            <p className="text-xs opacity-80">{stage.label}</p>
          </button>
        ))}
      </div>

      {/* Pipeline Flow */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {stages.map((stage, i) => (
          <React.Fragment key={stage.id}>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${stage.color} border whitespace-nowrap`}>
              {stage.label} ({getStageCount(stage.id)})
            </div>
            {i < stages.length - 1 && <ChevronRight size={16} className="text-slate-300 shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">No leads found</h2>
          <p className="text-slate-500">
            {activeStage === "all" ? "No leads yet. They'll appear when users click 'Interested' on packages." : `No leads in ${activeStage} stage.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead, i) => {
            const stage = stages.find((s) => s.id === lead.stage);
            return (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedLead(lead)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                      <MapPin size={20} className="text-brand-saffron" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{lead.destination}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <User size={12} />
                          {lead.travelerName}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail size={12} />
                          {lead.travelerEmail}
                        </span>
                        {lead.travelerPhone && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Phone size={12} />
                            {lead.travelerPhone}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar size={12} />
                          {lead.numberOfDays} days
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(lead.createdAt).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${stage?.color || "bg-slate-100 text-slate-700"}`}>
                      {stage?.label || lead.stage}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedLead(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-8"
          >
            <div className="mb-6">
              <span className="text-brand-saffron font-bold uppercase tracking-widest text-[10px] bg-orange-50 px-3 py-1 rounded-full">
                Lead Details
              </span>
              <h2 className="text-2xl font-serif font-bold text-slate-900 mt-3">{selectedLead.destination}</h2>
              <p className="text-slate-500 text-sm">{selectedLead.numberOfDays} days trip</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Traveler</label>
                  <p className="text-slate-900 font-medium">{selectedLead.travelerName}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</label>
                  <p className="text-slate-900 font-medium">{selectedLead.travelerEmail}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone</label>
                  <p className="text-slate-900 font-medium">{selectedLead.travelerPhone || "N/A"}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Created</label>
                  <p className="text-slate-900 font-medium">{new Date(selectedLead.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
              </div>

              {selectedLead.notes && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notes</label>
                  <p className="text-slate-700 text-sm mt-1">{selectedLead.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Update Stage</label>
              <div className="flex gap-2 flex-wrap">
                {stages.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => {
                      if (stage.id === "LOST") {
                        setPendingLostLeadId(selectedLead.id);
                        setShowLostModal(true);
                      } else {
                        updateLeadStage(selectedLead.id, stage.id);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
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
          </motion.div>
        </div>
      )}
      {/* Lost Reason Modal */}
      {showLostModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => { setShowLostModal(false); setPendingLostLeadId(null); setLostReason(""); }} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-2">Mark Lead as Lost</h3>
            <p className="text-sm text-slate-500 mb-4">Please provide a reason for losing this lead.</p>
            <select
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-3"
            >
              <option value="">Select reason...</option>
              <option value="Budget too high">Budget too high</option>
              <option value="Chose competitor">Chose competitor</option>
              <option value="No response">No response</option>
              <option value="Changed plans">Changed plans</option>
              <option value="Duplicate lead">Duplicate lead</option>
              <option value="Invalid contact">Invalid contact</option>
              <option value="Other">Other</option>
            </select>
            {lostReason === "Other" && (
              <textarea
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="Specify reason..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-3"
                rows={3}
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (pendingLostLeadId && lostReason) {
                    updateLeadStage(pendingLostLeadId, "LOST", lostReason);
                    setShowLostModal(false);
                    setPendingLostLeadId(null);
                    setLostReason("");
                  }
                }}
                disabled={!lostReason}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 cursor-pointer disabled:opacity-50"
              >
                Mark as Lost
              </button>
              <button
                onClick={() => { setShowLostModal(false); setPendingLostLeadId(null); setLostReason(""); }}
                className="flex-1 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-4">Create New Lead</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Destination *</label><input value={newLead.destination} onChange={(e) => setNewLead({ ...newLead, destination: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Goa" /></div>
              <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Traveler Name *</label><input value={newLead.travelerName} onChange={(e) => setNewLead({ ...newLead, travelerName: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="John Doe" /></div>
              <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Email *</label><input type="email" value={newLead.travelerEmail} onChange={(e) => setNewLead({ ...newLead, travelerEmail: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="john@email.com" /></div>
              <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Phone</label><input value={newLead.travelerPhone} onChange={(e) => setNewLead({ ...newLead, travelerPhone: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="9876543210" /></div>
              <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Days</label><input type="number" value={newLead.numberOfDays} onChange={(e) => setNewLead({ ...newLead, numberOfDays: Number(e.target.value) })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
              <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Source</label><select value={newLead.source} onChange={(e) => setNewLead({ ...newLead, source: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"><option value="manual">Manual (Admin)</option><option value="website">Website</option><option value="referral">Referral</option><option value="phone_call">Phone Call</option><option value="walk_in">Walk-in</option></select></div>
            </div>
            <div className="flex gap-2">
              <button onClick={createLead} className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 cursor-pointer">Create Lead</button>
              <button onClick={() => setShowCreate(false)} className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Lost Reason Modal */}
      {showLostModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => { setShowLostModal(false); setPendingLostLeadId(null); setLostReason(""); }} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-2">Mark Lead as Lost</h3>
            <p className="text-sm text-slate-500 mb-4">Please provide a reason.</p>
            <select value={lostReason} onChange={(e) => setLostReason(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-3">
              <option value="">Select reason...</option>
              <option value="Budget too high">Budget too high</option>
              <option value="Chose competitor">Chose competitor</option>
              <option value="No response">No response</option>
              <option value="Changed plans">Changed plans</option>
              <option value="Other">Other</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => { if (pendingLostLeadId && lostReason) { updateLeadStage(pendingLostLeadId, "LOST", lostReason); setShowLostModal(false); setPendingLostLeadId(null); setLostReason(""); } }} disabled={!lostReason} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 cursor-pointer disabled:opacity-50">Mark as Lost</button>
              <button onClick={() => { setShowLostModal(false); setPendingLostLeadId(null); setLostReason(""); }} className="flex-1 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
