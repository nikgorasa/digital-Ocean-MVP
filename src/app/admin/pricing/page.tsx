"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { DollarSign, Plus, Trash2, ToggleLeft, ToggleRight, Percent, Building2, Plane, Hotel } from "lucide-react";
import { formatCurrency } from "@/lib";

interface PricingRule {
  id: string;
  name: string;
  type: string;
  category: string;
  destination: string | null;
  hotelName: string | null;
  airlineCode: string | null;
  roomType: string | null;
  markupType: string;
  markupValue: number;
  minPrice: number | null;
  maxPrice: number | null;
  priority: number;
  isActive: boolean;
  validFrom: string | null;
  validTo: string | null;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  HOTEL: <Hotel size={16} />,
  FLIGHT: <Plane size={16} />,
  PACKAGE: <Building2 size={16} />,
  ALL: <DollarSign size={16} />,
};

export default function PricingRulesPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [viewingRule, setViewingRule] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [newRule, setNewRule] = useState({
    name: "",
    type: "GLOBAL",
    category: "ALL",
    destination: "",
    hotelName: "",
    airlineCode: "",
    roomType: "",
    markupType: "PERCENT",
    markupValue: 15,
    minPrice: "",
    maxPrice: "",
    priority: 0,
    validFrom: "",
    validTo: "",
  });

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/pricing-rules");
      const data = await res.json();
      setRules(data || []);
    } catch (err) {
      console.error("Failed to fetch pricing rules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRules(); }, []);

  const toggleRule = async (id: string) => {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    try {
      const res = await fetch(`/api/pricing-rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      if (res.ok) fetchRules();
    } catch (err) {
      console.error("Failed to toggle rule:", err);
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/pricing-rules/${id}`, { method: "DELETE" });
      if (res.ok) fetchRules();
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

  const updateRule = async () => {
    if (!editingRule) return;
    try {
      const res = await fetch(`/api/pricing-rules/${editingRule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingRule.name,
          type: editingRule.type,
          category: editingRule.category,
          destination: editingRule.destination,
          hotelName: editingRule.hotelName,
          airlineCode: editingRule.airlineCode,
          markupType: editingRule.markupType,
          markupValue: editingRule.markupValue,
          markupPercent: editingRule.markupPercent,
          minPrice: editingRule.minPrice,
          maxPrice: editingRule.maxPrice,
          priority: editingRule.priority,
        }),
      });
      if (res.ok) {
        setEditingRule(null);
        fetchRules();
      }
    } catch (err) {
      console.error("Failed to update rule:", err);
    }
  };

  const createRule = async () => {
    if (!newRule.name || newRule.markupValue <= 0) return;
    try {
      const payload = {
        ...newRule,
        destination: newRule.destination || null,
        hotelName: newRule.hotelName || null,
        airlineCode: newRule.airlineCode || null,
        roomType: newRule.roomType || null,
        minPrice: newRule.minPrice ? Number(newRule.minPrice) : null,
        maxPrice: newRule.maxPrice ? Number(newRule.maxPrice) : null,
        validFrom: newRule.validFrom || null,
        validTo: newRule.validTo || null,
      };
      const res = await fetch("/api/pricing-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setNewRule({
          name: "", type: "GLOBAL", category: "ALL", destination: "", hotelName: "",
          airlineCode: "", roomType: "", markupType: "PERCENT", markupValue: 15,
          minPrice: "", maxPrice: "", priority: 0, validFrom: "", validTo: "",
        });
        setShowCreate(false);
        fetchRules();
      }
    } catch (err) {
      console.error("Failed to create rule:", err);
    }
  };

  const filteredRules = filter === "ALL" ? rules : rules.filter((r) => r.category === filter);

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
        <h1 className="text-2xl font-serif font-bold text-slate-900">Pricing Rules</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-saffron text-white rounded-xl text-sm font-medium hover:bg-brand-burnt cursor-pointer"
        >
          <Plus size={16} />
          Create Rule
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {["ALL", "HOTEL", "FLIGHT", "PACKAGE"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              filter === cat
                ? "bg-brand-saffron text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-slate-200 mb-6"
        >
          <h3 className="font-bold text-slate-900 mb-4">Create Pricing Rule</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Rule Name</label>
              <input
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="Goa Hotel Markup"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Type</label>
              <select
                value={newRule.type}
                onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="GLOBAL">Global</option>
                <option value="CATEGORY">Category</option>
                <option value="DESTINATION">Destination</option>
                <option value="HOTEL">Hotel</option>
                <option value="AIRLINE">Airline</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Category</label>
              <select
                value={newRule.category}
                onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="ALL">All</option>
                <option value="HOTEL">Hotel</option>
                <option value="FLIGHT">Flight</option>
                <option value="PACKAGE">Package</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Markup Type</label>
              <select
                value={newRule.markupType}
                onChange={(e) => setNewRule({ ...newRule, markupType: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="PERCENT">Percentage (%)</option>
                <option value="FLAT">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                Markup Value {newRule.markupType === "FLAT" ? "(₹)" : "(%)"}
              </label>
              <input
                type="number"
                value={newRule.markupValue || ""}
                onChange={(e) => setNewRule({ ...newRule, markupValue: Number(e.target.value) })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Priority (higher wins)</label>
              <input
                type="number"
                value={newRule.priority}
                onChange={(e) => setNewRule({ ...newRule, priority: Number(e.target.value) })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Destination</label>
              <input
                value={newRule.destination}
                onChange={(e) => setNewRule({ ...newRule, destination: e.target.value })}
                placeholder="Goa (blank = all)"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Hotel Name</label>
              <input
                value={newRule.hotelName}
                onChange={(e) => setNewRule({ ...newRule, hotelName: e.target.value })}
                placeholder="Taj Goa (blank = all)"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Airline Code</label>
              <input
                value={newRule.airlineCode}
                onChange={(e) => setNewRule({ ...newRule, airlineCode: e.target.value })}
                placeholder="6E (blank = all)"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Min Price (₹)</label>
              <input
                type="number"
                value={newRule.minPrice}
                onChange={(e) => setNewRule({ ...newRule, minPrice: e.target.value })}
                placeholder="Floor price"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Max Price (₹)</label>
              <input
                type="number"
                value={newRule.maxPrice}
                onChange={(e) => setNewRule({ ...newRule, maxPrice: e.target.value })}
                placeholder="Ceiling price"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Valid From</label>
              <input
                type="date"
                value={newRule.validFrom}
                onChange={(e) => setNewRule({ ...newRule, validFrom: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Valid To</label>
              <input
                type="date"
                value={newRule.validTo}
                onChange={(e) => setNewRule({ ...newRule, validTo: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createRule}
              className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 cursor-pointer"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        {filteredRules.map((rule, i) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-white rounded-2xl p-5 border transition-all ${
              rule.isActive ? "border-slate-200" : "border-slate-100 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  rule.isActive ? "bg-brand-saffron/10" : "bg-slate-100"
                }`}>
                  <span className={rule.isActive ? "text-brand-saffron" : "text-slate-400"}>
                    {CATEGORY_ICONS[rule.category] || <DollarSign size={16} />}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{rule.name}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {rule.type}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      rule.markupType === "FLAT" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {rule.markupType === "FLAT" ? `₹${rule.markupValue}` : `${rule.markupValue}%`}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {rule.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    {rule.destination && <span>📍 {rule.destination}</span>}
                    {rule.hotelName && <span>🏨 {rule.hotelName}</span>}
                    {rule.airlineCode && <span>✈️ {rule.airlineCode}</span>}
                    {rule.minPrice && <span>Min: ₹{rule.minPrice}</span>}
                    {rule.maxPrice && <span>Max: ₹{rule.maxPrice}</span>}
                    <span>Priority: {rule.priority}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleRule(rule.id)} className="cursor-pointer">
                  {rule.isActive ? (
                    <ToggleRight size={32} className="text-green-500" />
                  ) : (
                    <ToggleLeft size={32} className="text-slate-300" />
                  )}
                </button>
                <button onClick={() => setViewingRule(rule)} className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer">View</button>
                <button onClick={() => setEditingRule({ ...rule })} className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer">Edit</button>
                <button
                  onClick={() => setDeleteConfirm(rule.id)}
                  className="p-2 text-red-400 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-bold text-slate-900">{rules.length}</p>
          <p className="text-xs text-slate-500">Total Rules</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-bold text-green-600">{rules.filter((r) => r.isActive).length}</p>
          <p className="text-xs text-slate-500">Active</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-bold text-blue-600">{rules.filter((r) => r.category === "HOTEL").length}</p>
          <p className="text-xs text-slate-500">Hotel Rules</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-bold text-purple-600">{rules.filter((r) => r.category === "FLIGHT").length}</p>
          <p className="text-xs text-slate-500">Flight Rules</p>
        </div>
      </div>
      {/* Edit Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setEditingRule(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 mb-4">Edit Pricing Rule</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Name</label><input value={editingRule.name} onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
              <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Type</label><select value={editingRule.type} onChange={(e) => setEditingRule({ ...editingRule, type: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"><option value="GLOBAL">Global</option><option value="CATEGORY">Category</option><option value="DESTINATION">Destination</option><option value="HOTEL">Hotel</option><option value="AIRLINE">Airline</option></select></div>
              <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Category</label><select value={editingRule.category} onChange={(e) => setEditingRule({ ...editingRule, category: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"><option value="ALL">All</option><option value="HOTEL">Hotel</option><option value="FLIGHT">Flight</option><option value="PACKAGE">Package</option></select></div>
              <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Markup Type</label><select value={editingRule.markupType} onChange={(e) => setEditingRule({ ...editingRule, markupType: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"><option value="PERCENT">Percentage</option><option value="FLAT">Flat</option></select></div>
              <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Markup Value</label><input type="number" value={editingRule.markupValue} onChange={(e) => setEditingRule({ ...editingRule, markupValue: Number(e.target.value) })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
              <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Destination</label><input value={editingRule.destination || ""} onChange={(e) => setEditingRule({ ...editingRule, destination: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
              <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Priority</label><input type="number" value={editingRule.priority} onChange={(e) => setEditingRule({ ...editingRule, priority: Number(e.target.value) })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
            </div>
            <div className="flex gap-2">
              <button onClick={updateRule} className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 cursor-pointer">Save Changes</button>
              <button onClick={() => setEditingRule(null)} className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingRule && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setViewingRule(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-4">Pricing Rule Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-slate-500">Name</span><span className="font-bold">{viewingRule.name}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500">Type</span><span className="font-bold">{viewingRule.type}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500">Category</span><span className="font-bold">{viewingRule.category}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500">Markup</span><span className="font-bold">{viewingRule.markupType === "PERCENT" ? `${viewingRule.markupValue}%` : `₹${viewingRule.markupValue}`}</span></div>
              {viewingRule.destination && <div className="flex justify-between"><span className="text-sm text-slate-500">Destination</span><span className="font-bold">{viewingRule.destination}</span></div>}
              <div className="flex justify-between"><span className="text-sm text-slate-500">Priority</span><span className="font-bold">{viewingRule.priority}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500">Status</span><span className={`font-bold ${viewingRule.isActive ? "text-green-600" : "text-slate-400"}`}>{viewingRule.isActive ? "Active" : "Inactive"}</span></div>
            </div>
            <button onClick={() => setViewingRule(null)} className="mt-6 w-full py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer">Close</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center">
            <h3 className="font-bold text-slate-900 mb-2">Delete Pricing Rule?</h3>
            <p className="text-sm text-slate-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => { deleteRule(deleteConfirm); setDeleteConfirm(null); }} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 cursor-pointer">Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
