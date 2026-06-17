"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { formatCurrency } from "@/lib";
import {
  Package, Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight,
  X, Save, Eye, DollarSign, Star, Clock
} from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

interface PackageItem {
  id: string;
  title: string;
  duration: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  provider: string;
  overview: string;
  itinerary: string;
  inclusions: string;
  exclusions: string;
  importantNotes: string;
  images: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

interface PackageForm {
  title: string;
  duration: string;
  price: string;
  originalPrice: string;
  rating: string;
  provider: string;
  overview: string;
  itinerary: string;
  inclusions: string;
  exclusions: string;
  importantNotes: string;
  images: string;
  status: string;
  category: string;
}

const EMPTY_FORM: PackageForm = {
  title: "",
  duration: "",
  price: "",
  originalPrice: "",
  rating: "4.5",
  provider: "GoRASA Direct",
  overview: "",
  itinerary: "",
  inclusions: "[]",
  exclusions: "[]",
  importantNotes: "",
  images: "[]",
  status: "DRAFT",
  category: "TOP_DEALS",
};

const tryParseJSON = (str: string): Record<string, unknown> => {
  try { return JSON.parse(str); }
  catch { return {}; }
};

const getHTML = (field: string): string => {
  const parsed = tryParseJSON(field);
  return (parsed?.html as string) || "";
};

const wrapHTML = (html: string): string => JSON.stringify({ html: html || "" });

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PackageForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState({ inclusions: "", exclusions: "", images: "" });

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch("/api/packages");
      const data = await res.json();
      const all = Array.isArray(data) ? data : data.packages || [];
      setPackages(all);
    } catch (err) {
      console.error("Failed to fetch packages:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setTagInput({ inclusions: "", exclusions: "", images: "" });
    setShowModal(true);
  };

  const openEdit = (pkg: PackageItem) => {
    setEditingId(pkg.id);
    setForm({
      title: pkg.title,
      duration: pkg.duration,
      price: String(pkg.price),
      originalPrice: pkg.originalPrice ? String(pkg.originalPrice) : "",
      rating: String(pkg.rating),
      provider: pkg.provider,
      overview: getHTML(pkg.overview),
      itinerary: getHTML(pkg.itinerary),
      inclusions: pkg.inclusions,
      exclusions: pkg.exclusions,
      importantNotes: getHTML(pkg.importantNotes),
      images: pkg.images,
      status: pkg.status,
      category: (pkg as any).category || "TOP_DEALS",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.duration || !form.price) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        duration: form.duration,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        rating: Number(form.rating),
        provider: form.provider,
        overview: wrapHTML(form.overview),
        itinerary: wrapHTML(form.itinerary),
        inclusions: form.inclusions,
        exclusions: form.exclusions,
        importantNotes: wrapHTML(form.importantNotes),
        images: form.images,
        status: form.status,
      };

      let res;
      if (editingId) {
        res = await fetch(`/api/packages/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setShowModal(false);
        fetchPackages();
      }
    } catch (err) {
      console.error("Failed to save package:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (pkg: PackageItem) => {
    try {
      const res = await fetch(`/api/packages/${pkg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !pkg.isActive }),
      });
      if (res.ok) fetchPackages();
    } catch (err) {
      console.error("Failed to toggle package:", err);
    }
  };

  const handleDelete = async (pkg: PackageItem) => {
    if (!confirm(`Delete "${pkg.title}"?`)) return;
    try {
      const res = await fetch(`/api/packages/${pkg.id}`, { method: "DELETE" });
      if (res.ok) fetchPackages();
    } catch (err) {
      console.error("Failed to delete package:", err);
    }
  };

  const parseTags = (str: string): string[] => {
    try { return JSON.parse(str); }
    catch { return []; }
  };

  const addTag = (field: "inclusions" | "exclusions" | "images") => {
    const val = tagInput[field].trim();
    if (!val) return;
    const current = parseTags(form[field]);
    if (!current.includes(val)) {
      setForm({ ...form, [field]: JSON.stringify([...current, val]) });
    }
    setTagInput({ ...tagInput, [field]: "" });
  };

  const removeTag = (field: "inclusions" | "exclusions" | "images", idx: number) => {
    const current = parseTags(form[field]);
    current.splice(idx, 1);
    setForm({ ...form, [field]: JSON.stringify(current) });
  };

  const filtered = packages.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.provider.toLowerCase().includes(search.toLowerCase())
  );

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
        <h1 className="text-2xl font-serif font-bold text-slate-900">Package CMS</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-brand-saffron text-white rounded-xl text-sm font-medium hover:bg-brand-burnt cursor-pointer"
        >
          <Plus size={16} />
          Create Package
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search packages..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-saffron/20"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Packages", value: packages.length, color: "text-slate-900" },
          { label: "Active", value: packages.filter((p) => p.isActive).length, color: "text-green-600" },
          { label: "Draft", value: packages.filter((p) => p.status === "DRAFT").length, color: "text-amber-600" },
          { label: "Published", value: packages.filter((p) => p.status === "PUBLISHED").length, color: "text-blue-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-slate-200 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Package List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Package size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">No packages found</h2>
          <p className="text-slate-500">
            {search ? "Try a different search term" : "Create your first holiday package"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`bg-white rounded-2xl p-5 border transition-all ${
                pkg.isActive ? "border-slate-200" : "border-slate-100 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    pkg.status === "PUBLISHED" ? "bg-emerald-50" : "bg-slate-100"
                  }`}>
                    <Package size={20} className={pkg.status === "PUBLISHED" ? "text-emerald-600" : "text-slate-400"} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{pkg.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        pkg.status === "PUBLISHED"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {pkg.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1"><Clock size={12} />{pkg.duration}</span>
                      <span className="flex items-center gap-1"><DollarSign size={12} />{formatCurrency(pkg.price)}</span>
                      <span className="flex items-center gap-1"><Star size={12} />{pkg.rating}</span>
                      <span>{pkg.provider}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(pkg)} className="cursor-pointer">
                    {pkg.isActive ? (
                      <ToggleRight size={32} className="text-green-500" />
                    ) : (
                      <ToggleLeft size={32} className="text-slate-300" />
                    )}
                  </button>
                  <button onClick={() => openEdit(pkg)} className="p-2 text-slate-400 hover:text-blue-600 cursor-pointer">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(pkg)} className="p-2 text-red-400 hover:text-red-600 cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-2xl w-full max-w-3xl mx-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? "Edit Package" : "Create Package"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Taj Exotica Resort & Spa Goa"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Duration *</label>
                  <input
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="3 Nights / 4 Days"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Price (₹) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="45500"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Original Price (₹)</label>
                  <input
                    type="number"
                    value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    placeholder="55000"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Provider</label>
                  <input
                    value={form.provider}
                    onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
              </div>

              {/* Inclusions */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Inclusions</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {parseTags(form.inclusions).map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                      {tag}
                      <button onClick={() => removeTag("inclusions", idx)} className="hover:text-green-900 cursor-pointer"><X size={12} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={tagInput.inclusions}
                    onChange={(e) => setTagInput({ ...tagInput, inclusions: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("inclusions"))}
                    placeholder="Luxury Villa Stay"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                  <button onClick={() => addTag("inclusions")} className="px-3 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium hover:bg-green-200 cursor-pointer">Add</button>
                </div>
              </div>

              {/* Exclusions */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Exclusions</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {parseTags(form.exclusions).map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full">
                      {tag}
                      <button onClick={() => removeTag("exclusions", idx)} className="hover:text-red-900 cursor-pointer"><X size={12} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={tagInput.exclusions}
                    onChange={(e) => setTagInput({ ...tagInput, exclusions: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("exclusions"))}
                    placeholder="Visa fees"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                  <button onClick={() => addTag("exclusions")} className="px-3 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-medium hover:bg-red-200 cursor-pointer">Add</button>
                </div>
              </div>

              {/* Overview */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Overview</label>
                <RichTextEditor
                  value={form.overview}
                  onChange={(html) => setForm({ ...form, overview: html })}
                  placeholder="Describe this package..."
                />
              </div>

              {/* Itinerary */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Itinerary</label>
                <RichTextEditor
                  value={form.itinerary}
                  onChange={(html) => setForm({ ...form, itinerary: html })}
                  placeholder="Day-by-day breakdown..."
                />
              </div>

              {/* Important Notes */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Important Notes</label>
                <RichTextEditor
                  value={form.importantNotes}
                  onChange={(html) => setForm({ ...form, importantNotes: html })}
                  placeholder="Cancellation policy, terms, etc."
                />
              </div>

              {/* Images */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Image URLs</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {parseTags(form.images).map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full max-w-full truncate">
                      {tag}
                      <button onClick={() => removeTag("images", idx)} className="hover:text-blue-900 cursor-pointer shrink-0"><X size={12} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={tagInput.images}
                    onChange={(e) => setTagInput({ ...tagInput, images: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("images"))}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-xs"
                  />
                  <button onClick={() => addTag("images")} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-200 cursor-pointer">Add</button>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2 rounded-b-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.duration || !form.price}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-saffron text-white rounded-xl text-sm font-medium hover:bg-brand-burnt disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Save size={16} />
                {saving ? "Saving..." : editingId ? "Update Package" : "Create Package"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
