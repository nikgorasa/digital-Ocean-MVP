"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, Gift, Star, Coffee, Plane } from "lucide-react";
import { formatCurrency } from "@/lib";

interface PromoCode {
  id: string;
  code: string;
  discountValue: number;
  type: "flat" | "percentage";
  description: string;
  minBookingValue: number;
  isActive: boolean;
  applicableTo: string;
  maxDiscount?: number;
  maxUses?: number;
  usedCount: number;
  validFrom?: string;
  validTo?: string;
  isFirstBooking: boolean;
}

export default function PromoCMSPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [viewingPromo, setViewingPromo] = useState<PromoCode | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newPromo, setNewPromo] = useState({
    code: "",
    discountValue: 0,
    type: "flat" as "flat" | "percentage",
    description: "",
    minBookingValue: 0,
    applicableTo: "ALL",
  });

  const fetchPromos = async () => {
    try {
      const res = await fetch("/api/promos");
      const data = await res.json();
      setPromos(data || []);
    } catch (err) {
      console.error("Failed to fetch promos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPromos(); }, []);

  const togglePromo = async (id: string) => {
    const promo = promos.find((p) => p.id === id);
    if (!promo) return;
    try {
      const res = await fetch(`/api/promos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      if (res.ok) fetchPromos();
    } catch (err) {
      console.error("Failed to toggle promo:", err);
    }
  };

  const deletePromo = async (id: string) => {
    try {
      const res = await fetch(`/api/promos/${id}`, { method: "DELETE" });
      if (res.ok) fetchPromos();
    } catch (err) {
      console.error("Failed to delete promo:", err);
    }
  };

  const updatePromo = async () => {
    if (!editingPromo) return;
    try {
      const res = await fetch(`/api/promos/${editingPromo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editingPromo.code,
          discountValue: editingPromo.discountValue,
          type: editingPromo.type,
          description: editingPromo.description,
          minBookingValue: editingPromo.minBookingValue,
          applicableTo: editingPromo.applicableTo,
        }),
      });
      if (res.ok) {
        setEditingPromo(null);
        fetchPromos();
      }
    } catch (err) {
      console.error("Failed to update promo:", err);
    }
  };

  const createPromo = async () => {
    if (newPromo.code && newPromo.discountValue > 0) {
      try {
        const res = await fetch("/api/promos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...newPromo, applicableTo: newPromo.applicableTo || "ALL" }),
        });
        if (res.ok) {
          setNewPromo({ code: "", discountValue: 0, type: "flat", description: "", minBookingValue: 0, applicableTo: "ALL" });
          setShowCreate(false);
          fetchPromos();
        }
      } catch (err) {
        console.error("Failed to create promo:", err);
      }
    }
  };

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
        <h1 className="text-2xl font-serif font-bold text-slate-900">Promo Desk</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-saffron text-white rounded-xl text-sm font-medium hover:bg-brand-burnt cursor-pointer"
        >
          <Plus size={16} />
          Create Promo
        </button>
      </div>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-slate-200 mb-6"
        >
          <h3 className="font-bold text-slate-900 mb-4">Create New Promo Code</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Code</label>
              <input
                value={newPromo.code}
                onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER2026"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Type</label>
              <select
                value={newPromo.type}
                onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value as "flat" | "percentage" })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="flat">Flat (₹)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                Discount Value {newPromo.type === "flat" ? "(₹)" : "(%)"}
              </label>
              <input
                type="number"
                value={newPromo.discountValue || ""}
                onChange={(e) => setNewPromo({ ...newPromo, discountValue: Number(e.target.value) })}
                placeholder={newPromo.type === "flat" ? "500" : "10"}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Min Booking Value (₹)</label>
              <input
                type="number"
                value={newPromo.minBookingValue || ""}
                onChange={(e) => setNewPromo({ ...newPromo, minBookingValue: Number(e.target.value) })}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Applies To</label>
              <select
                value={newPromo.applicableTo}
                onChange={(e) => setNewPromo({ ...newPromo, applicableTo: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="ALL">All Bookings</option>
                <option value="HOTEL">Hotels Only</option>
                <option value="FLIGHT">Flights Only</option>
                <option value="PACKAGE">Packages Only</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Description</label>
              <input
                value={newPromo.description}
                onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                placeholder="10% off on all bookings"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createPromo}
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

      <div className="space-y-3">
        {promos.map((promo, i) => (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-white rounded-2xl p-5 border transition-all ${
              promo.isActive ? "border-slate-200" : "border-slate-100 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  promo.isActive ? "bg-green-50" : "bg-slate-100"
                }`}>
                  <Tag size={20} className={promo.isActive ? "text-green-600" : "text-slate-400"} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-lg">{promo.code}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      promo.type === "flat" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {promo.type === "flat" ? `₹${promo.discountValue}` : `${promo.discountValue}%`}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{promo.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      {promo.applicableTo || "ALL"}
                    </span>
                    {promo.maxUses && (
                      <span className="text-[10px] text-slate-400">
                        Used: {promo.usedCount}/{promo.maxUses}
                      </span>
                    )}
                    {promo.validTo && (
                      <span className="text-[10px] text-slate-400">
                        Expires: {new Date(promo.validTo).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {promo.minBookingValue > 0 && (
                    <p className="text-xs text-slate-400 mt-1">Min booking: {formatCurrency(promo.minBookingValue)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingPromo(promo)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  View
                </button>
                <button
                  onClick={() => setEditingPromo({ ...promo })}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => togglePromo(promo.id)}
                  className="cursor-pointer"
                >
                  {promo.isActive ? (
                    <ToggleRight size={32} className="text-green-500" />
                  ) : (
                    <ToggleLeft size={32} className="text-slate-300" />
                  )}
                </button>
                <button
                  onClick={() => setDeleteConfirm(promo.id)}
                  className="p-2 text-red-400 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-bold text-slate-900">{promos.length}</p>
          <p className="text-xs text-slate-500">Total Promos</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-bold text-green-600">{promos.filter((p) => p.isActive).length}</p>
          <p className="text-xs text-slate-500">Active</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-bold text-slate-400">{promos.filter((p) => !p.isActive).length}</p>
          <p className="text-xs text-slate-500">Inactive</p>
        </div>
      </div>
      {/* Edit Modal */}
      {editingPromo && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setEditingPromo(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-4">Edit Promo Code</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Code</label>
                <input value={editingPromo.code} onChange={(e) => setEditingPromo({ ...editingPromo, code: e.target.value.toUpperCase() })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Type</label>
                <select value={editingPromo.type} onChange={(e) => setEditingPromo({ ...editingPromo, type: e.target.value as "flat" | "percentage" })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                  <option value="flat">Flat (₹)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Discount Value</label>
                <input type="number" value={editingPromo.discountValue} onChange={(e) => setEditingPromo({ ...editingPromo, discountValue: Number(e.target.value) })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Min Booking (₹)</label>
                <input type="number" value={editingPromo.minBookingValue} onChange={(e) => setEditingPromo({ ...editingPromo, minBookingValue: Number(e.target.value) })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Applies To</label>
                <select value={editingPromo.applicableTo} onChange={(e) => setEditingPromo({ ...editingPromo, applicableTo: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                  <option value="ALL">All Bookings</option>
                  <option value="HOTEL">Hotels Only</option>
                  <option value="FLIGHT">Flights Only</option>
                  <option value="PACKAGE">Packages Only</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Description</label>
                <input value={editingPromo.description} onChange={(e) => setEditingPromo({ ...editingPromo, description: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={updatePromo} className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 cursor-pointer">Save Changes</button>
              <button onClick={() => setEditingPromo(null)} className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingPromo && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setViewingPromo(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-4">Promo Code Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-slate-500">Code</span><span className="font-mono font-bold">{viewingPromo.code}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500">Type</span><span className="font-bold">{viewingPromo.type === "flat" ? "Flat" : "Percentage"}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500">Discount</span><span className="font-bold">{viewingPromo.type === "flat" ? `₹${viewingPromo.discountValue}` : `${viewingPromo.discountValue}%`}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500">Min Booking</span><span className="font-bold">₹{viewingPromo.minBookingValue}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500">Applies To</span><span className="font-bold">{viewingPromo.applicableTo || "ALL"}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500">Description</span><span className="font-bold">{viewingPromo.description || "—"}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500">Status</span><span className={`font-bold ${viewingPromo.isActive ? "text-green-600" : "text-slate-400"}`}>{viewingPromo.isActive ? "Active" : "Inactive"}</span></div>
              {viewingPromo.maxUses && <div className="flex justify-between"><span className="text-sm text-slate-500">Usage</span><span className="font-bold">{viewingPromo.usedCount}/{viewingPromo.maxUses}</span></div>}
              {viewingPromo.validTo && <div className="flex justify-between"><span className="text-sm text-slate-500">Expires</span><span className="font-bold">{new Date(viewingPromo.validTo).toLocaleDateString()}</span></div>}
            </div>
            <button onClick={() => setViewingPromo(null)} className="mt-6 w-full py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer">Close</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center">
            <h3 className="font-bold text-slate-900 mb-2">Delete Promo Code?</h3>
            <p className="text-sm text-slate-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => { deletePromo(deleteConfirm); setDeleteConfirm(null); }} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 cursor-pointer">Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
