"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Download, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";

interface ApiLog {
  id: string;
  provider: string;
  endpoint: string;
  method: string;
  request_body: any;
  response_body: any;
  status_code: number;
  response_time_ms: number;
  error_message: string;
  environment: string;
  request_id: string;
  batch_index: number | null;
  batch_total: number | null;
  created_at: string;
}

interface GroupedLogs {
  requestId: string;
  logs: ApiLog[];
  totalDuration: number;
  hasErrors: boolean;
}

export default function ApiLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ provider: "", status: "", environment: "", requestId: "" });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Date range state
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [activePreset, setActivePreset] = useState<string>("today");

  useEffect(() => {
    applyPreset("today");
  }, []);

  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    const now = new Date();
    let from: Date;

    switch (preset) {
      case "last1h":
        from = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "today":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "last24h":
        from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "last7d":
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        return;
    }

    setDateRange({
      from: from.toISOString().slice(0, 16),
      to: now.toISOString().slice(0, 16),
    });
    fetchLogs(from.toISOString(), now.toISOString());
  };

  const fetchLogs = async (from?: string, to?: string) => {
    setLoading(true);
    try {
      let url = "/api/admin/api-logs?limit=500";
      if (from) url += `&from=${encodeURIComponent(from)}`;
      if (to) url += `&to=${encodeURIComponent(to)}`;
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateSearch = () => {
    if (dateRange.from && dateRange.to) {
      setActivePreset("custom");
      fetchLogs(new Date(dateRange.from).toISOString(), new Date(dateRange.to).toISOString());
    }
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filter.provider && log.provider !== filter.provider) return false;
      if (filter.status && log.status_code?.toString() !== filter.status) return false;
      if (filter.environment && log.environment !== filter.environment) return false;
      if (filter.requestId && log.request_id !== filter.requestId) return false;
      return true;
    });
  }, [logs, filter]);

  // Group by request_id
  const groupedLogs = useMemo(() => {
    const groups: Record<string, GroupedLogs> = {};
    for (const log of filteredLogs) {
      const key = log.request_id || `single_${log.id}`;
      if (!groups[key]) {
        groups[key] = { requestId: key, logs: [], totalDuration: 0, hasErrors: false };
      }
      groups[key].logs.push(log);
      groups[key].totalDuration += log.response_time_ms || 0;
      if (log.status_code >= 400) groups[key].hasErrors = true;
    }
    return Object.values(groups).sort((a, b) => {
      const aTime = a.logs[0]?.created_at || "";
      const bTime = b.logs[0]?.created_at || "";
      return bTime.localeCompare(aTime);
    });
  }, [filteredLogs]);

  // Unique request IDs for filter dropdown
  const uniqueRequestIds = useMemo(() => {
    const ids = new Set<string>();
    for (const log of logs) {
      if (log.request_id) ids.add(log.request_id);
    }
    return Array.from(ids).sort().reverse();
  }, [logs]);

  // Toggle group selection
  const toggleGroup = (requestId: string) => {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      if (next.has(requestId)) {
        next.delete(requestId);
      } else {
        next.add(requestId);
      }
      return next;
    });
  };

  // Select all groups
  const toggleAll = () => {
    if (selectedGroups.size === groupedLogs.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(groupedLogs.map(g => g.requestId)));
    }
  };

  // Export selected groups
  const exportSelected = () => {
    const selected = groupedLogs.filter(g => selectedGroups.has(g.requestId));
    const exportData = selected.map(group => ({
      requestId: group.requestId,
      totalDuration: group.totalDuration,
      hasErrors: group.hasErrors,
      calls: group.logs.map(log => ({
        id: log.id,
        endpoint: log.endpoint,
        method: log.method,
        status_code: log.status_code,
        response_time_ms: log.response_time_ms,
        batch_index: log.batch_index,
        batch_total: log.batch_total,
        request_body: log.request_body,
        response_body: log.response_body,
        error_message: log.error_message,
        created_at: log.created_at,
      })),
    }));
    downloadJson(exportData, `api-logs-selected-${new Date().toISOString().slice(0, 10)}.json`);
  };

  // Export single group
  const exportGroup = (group: GroupedLogs) => {
    const exportData = {
      requestId: group.requestId,
      totalDuration: group.totalDuration,
      hasErrors: group.hasErrors,
      exportedAt: new Date().toISOString(),
      calls: group.logs.map(log => ({
        id: log.id,
        endpoint: log.endpoint,
        method: log.method,
        status_code: log.status_code,
        response_time_ms: log.response_time_ms,
        batch_index: log.batch_index,
        batch_total: log.batch_total,
        request_body: log.request_body,
        response_body: log.response_body,
        error_message: log.error_message,
        created_at: log.created_at,
      })),
    };
    downloadJson(exportData, `api-log-${group.requestId}.json`);
  };

  // Export all filtered logs
  const exportAll = () => {
    downloadJson(filteredLogs, `api-logs-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const downloadJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const presets = [
    { key: "last1h", label: "Last 1h" },
    { key: "today", label: "Today" },
    { key: "last24h", label: "Last 24h" },
    { key: "last7d", label: "Last 7d" },
  ];

  return (
    <>
      <Navbar onLoginClick={() => {}} />
      <main className="min-h-screen bg-slate-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">API Logs</h1>
              <p className="text-sm text-slate-500">TBO API request/response logs with request tracking</p>
            </div>
            <div className="flex gap-2">
              {selectedGroups.size > 0 && (
                <button
                  onClick={exportSelected}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download size={16} />
                  Export Selected ({selectedGroups.size})
                </button>
              )}
              <button
                onClick={exportAll}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"
              >
                <Download size={16} />
                Export All
              </button>
            </div>
          </div>

          {/* Date Presets */}
          <div className="flex gap-2 mb-4">
            {presets.map(p => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePreset === p.key
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setActivePreset("custom")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activePreset === "custom"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Custom
            </button>
          </div>

          {/* Custom Date Range */}
          {activePreset === "custom" && (
            <div className="flex gap-3 mb-4">
              <input
                type="datetime-local"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
              />
              <span className="flex items-center text-slate-400">to</span>
              <input
                type="datetime-local"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
              />
              <button
                onClick={handleCustomDateSearch}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                Search
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-3 mb-4">
            <select
              value={filter.provider}
              onChange={(e) => setFilter({ ...filter, provider: e.target.value })}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
            >
              <option value="">All Providers</option>
              <option value="tbo_hotel">TBO Hotel</option>
              <option value="tbo_flight">TBO Flight</option>
            </select>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="200">200 OK</option>
              <option value="400">400 Bad Request</option>
              <option value="401">401 Unauthorized</option>
              <option value="500">500 Server Error</option>
            </select>
            <select
              value={filter.environment}
              onChange={(e) => setFilter({ ...filter, environment: e.target.value })}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
            >
              <option value="">All Environments</option>
              <option value="production">Production</option>
              <option value="preview">Preview (QA)</option>
              <option value="development">Development</option>
              <option value="standalone">Standalone (CockroachDB)</option>
            </select>
            <select
              value={filter.requestId}
              onChange={(e) => setFilter({ ...filter, requestId: e.target.value })}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
            >
              <option value="">All Requests</option>
              {uniqueRequestIds.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
            <button
              onClick={() => fetchLogs()}
              className="px-3 py-2 bg-slate-200 rounded-lg text-sm hover:bg-slate-300"
            >
              Refresh
            </button>
          </div>

          {/* Logs Table */}
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading...</div>
          ) : groupedLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No logs found</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600 w-10">
                        <input
                          type="checkbox"
                          checked={selectedGroups.size === groupedLogs.length}
                          onChange={toggleAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Request Group</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Provider</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Calls</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Duration</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Env</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Time</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedLogs.map((group) => (
                      <>
                        {/* Group Header */}
                        <tr
                          key={group.requestId}
                          className="border-b border-slate-100 cursor-pointer hover:bg-slate-50"
                          onClick={() => setExpandedGroup(expandedGroup === group.requestId ? null : group.requestId)}
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedGroups.has(group.requestId)}
                              onChange={() => toggleGroup(group.requestId)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            <div className="flex items-center gap-2">
                              {expandedGroup === group.requestId ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              <span className="text-blue-600">{group.requestId}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              group.logs[0]?.provider === 'tbo_hotel' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {group.logs[0]?.provider}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{group.logs.length}</td>
                          <td className="px-4 py-3 text-slate-500">{group.totalDuration}ms</td>
                          <td className="px-4 py-3">
                            {group.hasErrors ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Error</span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">OK</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                              group.logs[0]?.environment === 'production' ? 'bg-blue-50 text-blue-600' :
                              group.logs[0]?.environment === 'preview' ? 'bg-purple-50 text-purple-600' :
                              'bg-slate-50 text-slate-500'
                            }`}>
                              {group.logs[0]?.environment || 'unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {new Date(group.logs[0]?.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => exportGroup(group)}
                              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                              title="Export group"
                            >
                              <Download size={16} />
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Group Details */}
                        {expandedGroup === group.requestId && (
                          <tr key={`${group.requestId}-detail`}>
                            <td colSpan={9} className="p-0">
                              <div className="bg-slate-50 px-4 py-3">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-slate-500">
                                      <th className="pb-2 text-left">Endpoint</th>
                                      <th className="pb-2 text-left">Method</th>
                                      <th className="pb-2 text-left">Status</th>
                                      <th className="pb-2 text-left">Duration</th>
                                      <th className="pb-2 text-left">Batch</th>
                                      <th className="pb-2 text-left">Env</th>
                                      <th className="pb-2 text-left">Time</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {group.logs.map((log) => (
                                      <>
                                        <tr
                                          key={log.id}
                                          className="cursor-pointer hover:bg-white rounded"
                                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                        >
                                          <td className="py-2 pr-4 font-mono">{log.endpoint}</td>
                                          <td className="py-2 pr-4">{log.method}</td>
                                          <td className="py-2 pr-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                              log.status_code === 200 ? 'bg-emerald-100 text-emerald-700' :
                                              log.status_code >= 400 ? 'bg-red-100 text-red-700' :
                                              'bg-slate-100 text-slate-700'
                                            }`}>
                                              {log.status_code || 'N/A'}
                                            </span>
                                          </td>
                                          <td className="py-2 pr-4">{log.response_time_ms}ms</td>
                                          <td className="py-2 pr-4">
                                            {log.batch_index != null && log.batch_total != null ? (
                                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                                                {log.batch_index + 1}/{log.batch_total}
                                              </span>
                                            ) : (
                                              <span className="text-slate-300">-</span>
                                            )}
                                          </td>
                                          <td className="py-2 pr-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                              log.environment === 'production' ? 'bg-blue-50 text-blue-600' :
                                              log.environment === 'preview' ? 'bg-purple-50 text-purple-600' :
                                              'bg-slate-50 text-slate-500'
                                            }`}>
                                              {log.environment || 'unknown'}
                                            </span>
                                          </td>
                                          <td className="py-2 pr-4 text-slate-400">
                                            {new Date(log.created_at).toLocaleTimeString()}
                                          </td>
                                        </tr>
                                        {expandedId === log.id && (
                                          <tr key={`${log.id}-detail`}>
                                            <td colSpan={6} className="py-3">
                                              <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                  <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-xs font-bold text-slate-500">Request Body</h4>
                                                    <button
                                                      onClick={() => copyToClipboard(JSON.stringify(log.request_body, null, 2), `req-${log.id}`)}
                                                      className="p-1 text-slate-400 hover:text-slate-700"
                                                    >
                                                      {copiedId === `req-${log.id}` ? <Check size={14} /> : <Copy size={14} />}
                                                    </button>
                                                  </div>
                                                  <pre className="text-xs bg-white p-3 rounded-lg border border-slate-200 overflow-auto max-h-48">
                                                    {JSON.stringify(log.request_body, null, 2)}
                                                  </pre>
                                                </div>
                                                <div>
                                                  <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-xs font-bold text-slate-500">Response Body</h4>
                                                    <button
                                                      onClick={() => copyToClipboard(JSON.stringify(log.response_body, null, 2), `res-${log.id}`)}
                                                      className="p-1 text-slate-400 hover:text-slate-700"
                                                    >
                                                      {copiedId === `res-${log.id}` ? <Check size={14} /> : <Copy size={14} />}
                                                    </button>
                                                  </div>
                                                  <pre className="text-xs bg-white p-3 rounded-lg border border-slate-200 overflow-auto max-h-48">
                                                    {JSON.stringify(log.response_body, null, 2)}
                                                  </pre>
                                                </div>
                                              </div>
                                              {log.error_message && (
                                                <div className="mt-3">
                                                  <h4 className="text-xs font-bold text-red-500 mb-1">Error</h4>
                                                  <p className="text-xs text-red-600">{log.error_message}</p>
                                                </div>
                                              )}
                                            </td>
                                          </tr>
                                        )}
                                      </>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
