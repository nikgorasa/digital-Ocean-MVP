"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Wallet, Building2, Plus, ArrowUpRight, Check, Pencil, Trash2, X, Save } from "lucide-react";
import { formatCurrency } from "@/lib";

interface Company {
  id: string;
  name: string;
  domain: string | null;
  walletBalance: number;
  discountRate: number;
  employees: number;
  isActive: boolean;
}

export default function B2BPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCorp, setSelectedCorp] = useState<Company | null>(null);
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quickAmounts, setQuickAmounts] = useState<number[]>([10000, 25000, 50000, 100000]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", domain: "", discountRate: 0 });
  const [newCompany, setNewCompany] = useState({ name: "", domain: "", discountRate: 10, walletBalance: 0 });

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      setCompanies(data || []);
      if (data?.length > 0 && !selectedCorp) setSelectedCorp(data[0]);
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  useEffect(() => {
    fetch("/api/topup-amounts")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setQuickAmounts(data.map((a: { amount: number }) => a.amount)); })
      .catch(() => {});
  }, []);

  const handleTopUp = async () => {
    if (!selectedCorp || topUpAmount <= 0) return;
    try {
      const res = await fetch(`/api/companies/${selectedCorp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletBalance: selectedCorp.walletBalance + topUpAmount }),
      });
      if (res.ok) {
        setShowSuccess(true);
        const updated = { ...selectedCorp, walletBalance: selectedCorp.walletBalance + topUpAmount };
        setSelectedCorp(updated);
        setCompanies(companies.map((c) => (c.id === updated.id ? updated : c)));
        setTimeout(() => { setShowSuccess(false); setTopUpAmount(0); }, 2000);
      }
    } catch (err) {
      console.error("Top-up failed:", err);
    }
  };

  const createCompany = async () => {
    if (!newCompany.name) return;
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCompany),
      });
      if (res.ok) {
        setNewCompany({ name: "", domain: "", discountRate: 10, walletBalance: 0 });
        setShowCreate(false);
        fetchCompanies();
      }
    } catch (err) {
      console.error("Failed to create company:", err);
    }
  };

  const startEdit = (corp: Company) => {
    setEditingId(corp.id);
    setEditForm({ name: corp.name, domain: corp.domain || "", discountRate: corp.discountRate });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const res = await fetch(`/api/companies/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingId(null);
        fetchCompanies();
        if (selectedCorp?.id === editingId) {
          setSelectedCorp({ ...selectedCorp, ...editForm });
        }
      }
    } catch (err) {
      console.error("Failed to update company:", err);
    }
  };

  const deleteCompany = async (id: string) => {
    if (!confirm("Delete this company? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCompanies();
        if (selectedCorp?.id === id) setSelectedCorp(null);
      }
    } catch (err) {
      console.error("Failed to delete company:", err);
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
        <h1 className="text-2xl font-serif font-bold text-slate-900">B2B Registry</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-saffron text-white rounded-xl text-sm font-medium hover:bg-brand-burnt cursor-pointer"
        >
          <Plus size={16} />
          Add Company
        </button>
      </div>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-slate-200 mb-6"
        >
          <h3 className="font-bold text-slate-900 mb-4">Create New Company</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Company Name *</label>
              <input
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                placeholder="Acme Corp"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Domain</label>
              <input
                value={newCompany.domain}
                onChange={(e) => setNewCompany({ ...newCompany, domain: e.target.value })}
                placeholder="acme.com"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Discount Rate (%)</label>
              <input
                type="number"
                value={newCompany.discountRate}
                onChange={(e) => setNewCompany({ ...newCompany, discountRate: Number(e.target.value) })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Initial Wallet (₹)</label>
              <input
                type="number"
                value={newCompany.walletBalance}
                onChange={(e) => setNewCompany({ ...newCompany, walletBalance: Number(e.target.value) })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createCompany} className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 cursor-pointer">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer">Cancel</button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Corporate Accounts</h2>
          {companies.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No companies yet</p>
            </div>
          ) : (
            companies.map((corp) => (
              <div
                key={corp.id}
                onClick={() => { setSelectedCorp(corp); setTopUpAmount(0); }}
                className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all ${
                  selectedCorp?.id === corp.id ? "border-brand-saffron shadow-lg" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {editingId === corp.id ? (
                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Name</label>
                        <input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Domain</label>
                        <input
                          value={editForm.domain}
                          onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Discount %</label>
                        <input
                          type="number"
                          value={editForm.discountRate}
                          onChange={(e) => setEditForm({ ...editForm, discountRate: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 cursor-pointer">
                        <Save size={12} /> Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300 cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                          <Building2 size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{corp.name}</h3>
                          <p className="text-sm text-slate-500">{corp.domain}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          {corp.discountRate}% Discount
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); startEdit(corp); }} className="p-1.5 text-slate-400 hover:text-blue-600 cursor-pointer">
                          <Pencil size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteCompany(corp.id); }} className="p-1.5 text-red-400 hover:text-red-600 cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase">Wallet Balance</p>
                        <p className="text-lg font-bold text-slate-900">{formatCurrency(corp.walletBalance)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase">Employees</p>
                        <p className="text-lg font-bold text-slate-900">{corp.employees || 0}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {selectedCorp && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Wallet Top-up</h2>
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-brand-saffron to-brand-burnt flex items-center justify-center">
                  <Wallet size={28} className="text-white" />
                </div>
                <h3 className="font-bold text-slate-900">{selectedCorp.name}</h3>
                <p className="text-3xl font-black text-slate-900 mt-1">{formatCurrency(selectedCorp.walletBalance)}</p>
                <p className="text-xs text-slate-400">Current Balance</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTopUpAmount(amount)}
                    className={`py-3 rounded-xl text-sm font-bold cursor-pointer transition-colors ${
                      topUpAmount === amount ? "bg-brand-saffron text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Custom Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <input
                    type="number"
                    value={topUpAmount || ""}
                    onChange={(e) => setTopUpAmount(Number(e.target.value))}
                    placeholder="Enter amount"
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {showSuccess ? (
                <div className="w-full py-3 bg-green-100 text-green-700 rounded-xl font-bold flex items-center justify-center gap-2">
                  <Check size={18} /> Top-up Successful!
                </div>
              ) : (
                <button
                  onClick={handleTopUp}
                  disabled={topUpAmount <= 0}
                  className="w-full py-3 bg-brand-saffron text-white rounded-xl font-bold hover:bg-brand-burnt transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ArrowUpRight size={18} /> Top Up {formatCurrency(topUpAmount)}
                </button>
              )}

              <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500">
                  <strong>Corporate Policy:</strong> Wallet balance is non-refundable. Unused balance expires after 12 months.
                  Corporate discount applies automatically on all bookings.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
