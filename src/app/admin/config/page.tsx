"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  Settings, Wifi, WifiOff, RotateCw, CheckCircle2, XCircle,
  Eye, EyeOff, Building2, Plane, Database, RefreshCw, History,
  ChevronDown, ChevronUp, Plus, Trash2, Pencil, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ConfigProvider {
  id: string;
  provider: string;
  label: string;
  baseUrl: string | null;
  bookingUrl: string | null;
  staticUrl: string | null;
  clientId: string | null;
  hasUsername: boolean;
  hasPassword: boolean;
  hasStaticUsername: boolean;
  hasStaticPassword: boolean;
  forceMock: boolean;
  isActive: boolean;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  id: string;
  provider: string;
  action: string;
  field: string | null;
  performedBy: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const PROVIDER_META: Record<string, { label: string; icon: React.ReactNode; color: string; defaultBaseUrl: string; defaultBookingUrl: string; defaultStaticUrl: string; defaultClientId: string; defaultUsername: string; defaultPassword: string }> = {
  tbo_hotel: {
    label: "TBO Hotel (Search/Book)",
    icon: <Building2 size={20} />,
    color: "blue",
    defaultBaseUrl: "https://affiliate.tektravels.com/HotelAPI",
    defaultBookingUrl: "https://affiliate.tektravels.com/HotelAPI",
    defaultStaticUrl: "",
    defaultClientId: "ApiIntegrationNew",
    defaultUsername: "",
    defaultPassword: "",
  },
  tbo_hotel_static: {
    label: "TBO Hotel (Static Data)",
    icon: <Database size={20} />,
    color: "purple",
    defaultBaseUrl: "",
    defaultBookingUrl: "",
    defaultStaticUrl: "http://api.tbotechnology.in/TBOHolidays_HotelAPI",
    defaultClientId: "",
    defaultUsername: "TBOStaticAPITest",
    defaultPassword: "",
  },
  tbo_flight: {
    label: "TBO Flight",
    icon: <Plane size={20} />,
    color: "emerald",
    defaultBaseUrl: "https://affiliate.tektravels.com/FlightAPI",
    defaultBookingUrl: "",
    defaultStaticUrl: "",
    defaultClientId: "ApiIntegrationNew",
    defaultUsername: "",
    defaultPassword: "",
  },
};

const ENDPOINTS: Record<string, string[]> = {
  tbo_hotel: [
    "https://affiliate.tektravels.com/HotelAPI/Search",
    "https://affiliate.tektravels.com/HotelAPI/PreBook",
    "https://affiliate.tektravels.com/HotelAPI/Book",
    "https://affiliate.tektravels.com/HotelAPI/GetBookingDetail",
    "https://affiliate.tektravels.com/HotelAPI/GenerateVoucher",
    "https://affiliate.tektravels.com/HotelAPI/SendChangeRequest",
    "https://affiliate.tektravels.com/HotelAPI/GetChangeRequestStatus",
  ],
  tbo_hotel_static: [
    "http://api.tbotechnology.in/TBOHolidays_HotelAPI/CountryList",
    "http://api.tbotechnology.in/TBOHolidays_HotelAPI/CityList",
    "http://api.tbotechnology.in/TBOHolidays_HotelAPI/TBOHotelCodeList",
    "http://api.tbotechnology.in/TBOHolidays_HotelAPI/HotelDetails",
  ],
  tbo_flight: [
    "http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest/Search",
    "http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest/FareRule",
    "http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest/FareQuote",
    "http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest/SSR",
    "http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest/Book",
    "http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest/Ticket",
    "http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest/GetBookingDetail",
  ],
};

const EMPTY_FORM = {
  provider: "",
  label: "",
  baseUrl: "",
  bookingUrl: "",
  staticUrl: "",
  clientId: "",
  username: "",
  password: "",
  staticUsername: "",
  staticPassword: "",
  forceMock: false,
  isActive: true,
};

export default function ConfigPage() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<ConfigProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/config");
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (err) {
      console.error("Failed to fetch config providers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await fetch("/api/admin/config/audit-logs?limit=50");
      const data = await res.json();
      setAuditLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const openCreate = (providerKey: string) => {
    const meta = PROVIDER_META[providerKey];
    setModalMode("create");
    setForm({
      provider: providerKey,
      label: meta.label,
      baseUrl: meta.defaultBaseUrl,
      bookingUrl: meta.defaultBookingUrl,
      staticUrl: meta.defaultStaticUrl,
      clientId: meta.defaultClientId,
      username: meta.defaultUsername,
      password: meta.defaultPassword,
      staticUsername: providerKey === "tbo_hotel_static" ? meta.defaultUsername : "",
      staticPassword: "",
      forceMock: false,
      isActive: true,
    });
    setShowModal(true);
  };

  const openEdit = (p: ConfigProvider) => {
    setModalMode("edit");
    setForm({
      provider: p.provider,
      label: p.label,
      baseUrl: p.baseUrl || "",
      bookingUrl: p.bookingUrl || "",
      staticUrl: p.staticUrl || "",
      clientId: p.clientId || "",
      username: "",
      password: "",
      staticUsername: "",
      staticPassword: "",
      forceMock: p.forceMock,
      isActive: p.isActive,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload: Record<string, any> = {
        provider: form.provider,
        label: form.label,
        baseUrl: form.baseUrl || null,
        bookingUrl: form.bookingUrl || null,
        staticUrl: form.staticUrl || null,
        clientId: form.clientId || null,
        forceMock: form.forceMock,
        isActive: form.isActive,
        updatedBy: user?.name || user?.email || "admin",
      };
      if (form.username) payload.username = form.username;
      if (form.password) payload.password = form.password;
      if (form.staticUsername) payload.staticUsername = form.staticUsername;
      if (form.staticPassword) payload.staticPassword = form.staticPassword;

      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: `Configuration ${modalMode === "create" ? "created" : "updated"} successfully` });
        closeModal();
        fetchProviders();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save configuration" });
    } finally {
      setSaving(false);
    }
  };

  const deleteConfig = async (provider: string) => {
    try {
      const res = await fetch(`/api/admin/config?provider=${provider}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Configuration deleted" });
        setDeleteConfirm(null);
        fetchProviders();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to delete" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to delete configuration" });
    }
  };

  const testConnection = async (provider: string) => {
    setTesting(provider);
    setTestResults(prev => ({ ...prev, [provider]: { success: false, message: "Testing..." } }));
    try {
      const res = await fetch(`/api/admin/config/${provider}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setTestResults(prev => ({ ...prev, [provider]: data }));
    } catch (err) {
      setTestResults(prev => ({ ...prev, [provider]: { success: false, message: "Connection test failed" } }));
    } finally {
      setTesting(null);
    }
  };

  const missingProviders = Object.keys(PROVIDER_META).filter(
    key => !providers.find(p => p.provider === key)
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
        <h1 className="text-2xl font-serif font-bold text-slate-900">API Configuration</h1>
        <div className="flex gap-2">
          {missingProviders.length > 0 && (
            <div className="flex gap-1">
              {missingProviders.map(key => {
                const meta = PROVIDER_META[key];
                return (
                  <button
                    key={key}
                    onClick={() => openCreate(key)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 cursor-pointer"
                  >
                    <Plus size={14} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          )}
          <button
            onClick={fetchProviders}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 cursor-pointer"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="cursor-pointer"><X size={14} /></button>
        </motion.div>
      )}

      {providers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 mb-6">
          <Settings size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Config Providers Yet</h3>
          <p className="text-sm text-slate-500 mb-4">Click a button above to create a configuration provider.</p>
        </div>
      )}

      <div className="space-y-4">
        {providers.map((p, i) => {
          const meta = PROVIDER_META[p.provider] || { label: p.label, icon: <Settings size={20} />, color: "slate" };
          const endpoints = ENDPOINTS[p.provider] || [];
          const testResult = testResults[p.provider];
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-5 border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100">
                    {meta.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{meta.label}</h3>
                    <p className="text-xs text-slate-400 font-mono">{p.provider} v{p.version}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.isActive ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <Wifi size={12} /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <WifiOff size={12} /> Inactive
                    </span>
                  )}
                  {p.forceMock && (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">Mock</span>
                  )}
                  <button
                    onClick={() => testConnection(p.provider)}
                    disabled={testing === p.provider}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
                  >
                    {testing === p.provider ? <RotateCw size={12} className="animate-spin" /> : <RotateCw size={12} />}
                    Test
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(p.provider)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>

              {testResult && (
                <div className={`mb-3 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  testResult.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}>
                  {testResult.success ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  {testResult.message}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Endpoints</h4>
                  <div className="space-y-1">
                    {endpoints.map((ep, j) => (
                      <p key={j} className="font-mono text-slate-600 truncate text-[11px]">{ep}</p>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Configuration</h4>
                  <div className="space-y-1">
                    {p.baseUrl && <p><span className="text-slate-400">Base:</span> <span className="font-mono text-slate-600">{p.baseUrl}</span></p>}
                    {p.bookingUrl && <p><span className="text-slate-400">Booking:</span> <span className="font-mono text-slate-600">{p.bookingUrl}</span></p>}
                    {p.staticUrl && <p><span className="text-slate-400">Static:</span> <span className="font-mono text-slate-600">{p.staticUrl}</span></p>}
                    {p.clientId && <p><span className="text-slate-400">Client ID:</span> <span className="font-mono text-slate-600">{p.clientId}</span></p>}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Credentials</h4>
                  <div className="space-y-1">
                    <p>
                      <span className="text-slate-400">Username:</span>{" "}
                      {p.hasUsername ? <span className="text-emerald-600 font-bold">Set</span> : <span className="text-slate-400">Not set</span>}
                    </p>
                    <p>
                      <span className="text-slate-400">Password:</span>{" "}
                      {p.hasPassword ? <span className="text-emerald-600 font-bold">Set</span> : <span className="text-slate-400">Not set</span>}
                    </p>
                    {p.hasStaticUsername && <p><span className="text-slate-400">Static User:</span> <span className="text-emerald-600 font-bold">Set</span></p>}
                    {p.hasStaticPassword && <p><span className="text-slate-400">Static Pass:</span> <span className="text-emerald-600 font-bold">Set</span></p>}
                  </div>
                  <p className="mt-2 text-slate-400">Updated: {new Date(p.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => { if (!saving) closeModal() }} />
          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900">{modalMode === "create" ? "Create" : "Edit"} Configuration</h3>
                <p className="text-xs text-slate-400 font-mono">{form.provider}</p>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Label</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Base URL</label>
                  <input
                    value={form.baseUrl}
                    onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                    placeholder="https://affiliate.tektravels.com/HotelAPI"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Booking URL</label>
                  <input
                    value={form.bookingUrl}
                    onChange={(e) => setForm({ ...form, bookingUrl: e.target.value })}
                    placeholder="https://affiliate.tektravels.com/HotelAPI"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Static Data URL</label>
                <input
                  value={form.staticUrl}
                  onChange={(e) => setForm({ ...form, staticUrl: e.target.value })}
                  placeholder="http://api.tbotechnology.in/TBOHolidays_HotelAPI"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Client ID</label>
                <input
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  placeholder="ApiIntegrationNew"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-700 mb-3">
                  Credentials {modalMode === "edit" ? "(leave blank to keep existing)" : ""}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {form.provider !== "tbo_hotel_static" && (
                    <>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Username (RasaT)</label>
                        <input
                          value={form.username}
                          onChange={(e) => setForm({ ...form, username: e.target.value })}
                          placeholder="RasaT"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Password</label>
                        <input
                          type="password"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder="Enter password"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                        />
                      </div>
                    </>
                  )}
                  {(form.provider === "tbo_hotel_static" || form.provider === "tbo_hotel") && (
                    <>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Static Username (TBOStaticAPITest)</label>
                        <input
                          value={form.staticUsername}
                          onChange={(e) => setForm({ ...form, staticUsername: e.target.value })}
                          placeholder="TBOStaticAPITest"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Static Password</label>
                        <input
                          type="password"
                          value={form.staticPassword}
                          onChange={(e) => setForm({ ...form, staticPassword: e.target.value })}
                          placeholder="Enter static password"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.forceMock} onChange={(e) => setForm({ ...form, forceMock: e.target.checked })} className="rounded" />
                  <span className="text-sm text-slate-700">Force Mock Mode</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                  <span className="text-sm text-slate-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={saveConfig}
                disabled={saving}
                className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving..." : modalMode === "create" ? "Create Configuration" : "Save Changes"}
              </button>
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center">
            <Trash2 size={32} className="mx-auto text-red-400 mb-3" />
            <h3 className="font-bold text-slate-900 mb-2">Delete Configuration?</h3>
            <p className="text-sm text-slate-500 mb-6">
              This will permanently remove the <span className="font-mono font-bold">{deleteConfirm}</span> configuration. The application will fall back to environment variables.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => deleteConfig(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 cursor-pointer"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Section */}
      <div className="mt-8">
        <button
          onClick={() => { const next = !showAudit; setShowAudit(next); if (next && auditLogs.length === 0) fetchAuditLogs(); }}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <History size={16} />
          Configuration Audit Log
          {showAudit ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAudit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-white rounded-2xl border border-slate-200 overflow-hidden"
          >
            {auditLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-saffron" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400">No audit log entries yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Provider</th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Action</th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Field</th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">By</th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3"><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{log.provider}</span></td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            log.action === "DELETE" ? "bg-red-100 text-red-700" :
                            log.action === "UPSERT" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                          }`}>{log.action}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{log.field || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{log.performedBy || "-"}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{log.ipAddress || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
