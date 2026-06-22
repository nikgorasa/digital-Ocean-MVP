"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  Settings, Wifi, WifiOff, RotateCw, CheckCircle2, XCircle,
  Eye, EyeOff, Building2, Plane, Database, RefreshCw, History,
  ChevronDown, ChevronUp,
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
  oldValue: string | null;
  newValue: string | null;
  performedBy: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const PROVIDER_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  tbo_hotel: { label: "TBO Hotel (Search/Book)", icon: <Building2 size={20} />, color: "blue" },
  tbo_hotel_static: { label: "TBO Hotel (Static Data)", icon: <Database size={20} />, color: "purple" },
  tbo_flight: { label: "TBO Flight", icon: <Plane size={20} />, color: "emerald" },
};

export default function ConfigPage() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<ConfigProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ConfigProvider | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [revealedCreds, setRevealedCreds] = useState<Record<string, { username: string; password: string }>>({});
  const [fetchingCreds, setFetchingCreds] = useState<Record<string, boolean>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const toggleAudit = () => {
    const next = !showAudit;
    setShowAudit(next);
    if (next && auditLogs.length === 0) fetchAuditLogs();
  };

  const startEdit = (p: ConfigProvider) => {
    setEditing(p);
    setEditForm({
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
  };

  const fetchCredentials = async (provider: string) => {
    setFetchingCreds(prev => ({ ...prev, [provider]: true }));
    try {
      const res = await fetch(`/api/admin/config`, { method: "GET" });
      const data = await res.json();
      const p = (data.providers || []).find((x: any) => x.provider === provider);
      if (p) {
        setRevealedCreds(prev => ({
          ...prev,
          [provider]: {
            username: p.hasUsername ? "••••••••" : "",
            password: p.hasPassword ? "••••••••" : "",
          },
        }));
      }
    } catch (err) {
      console.error("Failed to fetch creds:", err);
    } finally {
      setFetchingCreds(prev => ({ ...prev, [provider]: false }));
    }
  };

  const saveConfig = async () => {
    if (!editing) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const payload: Record<string, any> = {
        provider: editing.provider,
        label: editForm.label,
        baseUrl: editForm.baseUrl || null,
        bookingUrl: editForm.bookingUrl || null,
        staticUrl: editForm.staticUrl || null,
        clientId: editForm.clientId || null,
        forceMock: editForm.forceMock,
        isActive: editForm.isActive,
        updatedBy: user?.name || user?.email || "admin",
      };
      if (editForm.username) payload.username = editForm.username;
      if (editForm.password) payload.password = editForm.password;
      if (editForm.staticUsername) payload.staticUsername = editForm.staticUsername;
      if (editForm.staticPassword) payload.staticPassword = editForm.staticPassword;

      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage({ type: "success", text: "Configuration saved successfully" });
        setEditing(null);
        fetchProviders();
      } else {
        setSaveMessage({ type: "error", text: data.error || "Failed to save" });
      }
    } catch (err) {
      setSaveMessage({ type: "error", text: "Failed to save configuration" });
    } finally {
      setSaving(false);
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
        <button
          onClick={fetchProviders}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 cursor-pointer"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${
            saveMessage.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {saveMessage.text}
        </motion.div>
      )}

      {/* Provider Cards */}
      <div className="space-y-4">
        {providers.map((p, i) => {
          const meta = PROVIDER_META[p.provider] || { label: p.label, icon: <Settings size={20} />, color: "slate" };
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
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${meta.color}-100`}>
                    <span className={`text-${meta.color}-600`}>{meta.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{meta.label}</h3>
                    <p className="text-xs text-slate-400 font-mono">{p.provider} v{p.version}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.isActive ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <Wifi size={12} />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <WifiOff size={12} />
                      Inactive
                    </span>
                  )}
                  <button
                    onClick={() => testConnection(p.provider)}
                    disabled={testing === p.provider}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
                  >
                    {testing === p.provider ? (
                      <RotateCw size={12} className="animate-spin" />
                    ) : (
                      <RotateCw size={12} />
                    )}
                    Test
                  </button>
                  <button
                    onClick={() => startEdit(p)}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {testResult && (
                <div className={`mb-3 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  testResult.success
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}>
                  {testResult.success ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  {testResult.message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                {p.baseUrl && (
                  <div>
                    <span className="text-slate-400">Base URL</span>
                    <p className="font-mono text-slate-700 truncate">{p.baseUrl}</p>
                  </div>
                )}
                {p.bookingUrl && (
                  <div>
                    <span className="text-slate-400">Booking URL</span>
                    <p className="font-mono text-slate-700 truncate">{p.bookingUrl}</p>
                  </div>
                )}
                {p.staticUrl && (
                  <div>
                    <span className="text-slate-400">Static URL</span>
                    <p className="font-mono text-slate-700 truncate">{p.staticUrl}</p>
                  </div>
                )}
                {p.clientId && (
                  <div>
                    <span className="text-slate-400">Client ID</span>
                    <p className="font-mono text-slate-700">{p.clientId}</p>
                  </div>
                )}
                <div>
                  <span className="text-slate-400">Credentials</span>
                  <p className="text-slate-700">
                    {p.hasUsername ? "Username set" : "No username"} &middot; {p.hasPassword ? "Password set" : "No password"}
                    {p.hasStaticUsername && " · Static user set"}
                    {p.hasStaticPassword && " · Static pass set"}
                  </p>
                </div>
                <div className="flex gap-3">
                  <div>
                    <span className="text-slate-400">Force Mock</span>
                    <p className={p.forceMock ? "text-amber-600 font-bold" : "text-slate-700"}>{p.forceMock ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Updated</span>
                    <p className="text-slate-700">{new Date(p.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* No providers state */}
      {providers.length === 0 && (
        <div className="text-center py-12">
          <Settings size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Config Providers</h3>
          <p className="text-sm text-slate-500">Config providers will appear here once they&apos;re set up in the database.</p>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => { if (!saving) setEditing(null) }} />
          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 mb-1">Edit {editing.label}</h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">{editing.provider}</p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Label</label>
                <input
                  value={editForm.label}
                  onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Base URL</label>
                  <input
                    value={editForm.baseUrl}
                    onChange={(e) => setEditForm({ ...editForm, baseUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Booking URL</label>
                  <input
                    value={editForm.bookingUrl}
                    onChange={(e) => setEditForm({ ...editForm, bookingUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Static URL</label>
                <input
                  value={editForm.staticUrl}
                  onChange={(e) => setEditForm({ ...editForm, staticUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Client ID</label>
                <input
                  value={editForm.clientId}
                  onChange={(e) => setEditForm({ ...editForm, clientId: e.target.value })}
                  placeholder="ApiIntegrationNew"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-700 mb-3">Credentials (leave blank to keep existing)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Username</label>
                    <input
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      placeholder={editing.hasUsername ? "•••••••• (unchanged)" : "New username"}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Password</label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder={editing.hasPassword ? "•••••••• (unchanged)" : "New password"}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Static Username</label>
                    <input
                      value={editForm.staticUsername}
                      onChange={(e) => setEditForm({ ...editForm, staticUsername: e.target.value })}
                      placeholder={editing.hasStaticUsername ? "•••••••• (unchanged)" : "New static user"}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Static Password</label>
                    <input
                      type="password"
                      value={editForm.staticPassword}
                      onChange={(e) => setEditForm({ ...editForm, staticPassword: e.target.value })}
                      placeholder={editing.hasStaticPassword ? "•••••••• (unchanged)" : "New static pass"}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.forceMock}
                    onChange={(e) => setEditForm({ ...editForm, forceMock: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700">Force Mock Mode</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="rounded"
                  />
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
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setEditing(null)}
                disabled={saving}
                className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 disabled:opacity-50 cursor-pointer"
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
          onClick={toggleAudit}
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
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{log.provider}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
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
