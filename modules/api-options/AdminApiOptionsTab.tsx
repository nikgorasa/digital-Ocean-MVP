'use client';

import React, { useState } from 'react';

interface AdminApiOptionsTabProps {
  provider: 'flight' | 'hotel';
}

interface FieldConfig {
  key: string;
  label: string;
  enabled: boolean;
}

interface FilterConfig {
  key: string;
  label: string;
  enabled: boolean;
}

const DEFAULT_DISPLAY_FIELDS: FieldConfig[] = [
  { key: 'id', label: 'ID', enabled: true },
  { key: 'name', label: 'Name', enabled: true },
  { key: 'status', label: 'Status', enabled: true },
  { key: 'createdAt', label: 'Created At', enabled: false },
  { key: 'updatedAt', label: 'Updated At', enabled: false },
];

const DEFAULT_FILTERS: FilterConfig[] = [
  { key: 'status', label: 'Status', enabled: true },
  { key: 'dateRange', label: 'Date Range', enabled: true },
  { key: 'search', label: 'Search', enabled: true },
  { key: 'category', label: 'Category', enabled: false },
];

export default function AdminApiOptionsTab({ provider }: AdminApiOptionsTabProps) {
  const [displayFields, setDisplayFields] = useState<FieldConfig[]>(DEFAULT_DISPLAY_FIELDS);
  const [filters, setFilters] = useState<FilterConfig[]>(DEFAULT_FILTERS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const toggleDisplayField = (index: number) => {
    const updated = [...displayFields];
    updated[index] = { ...updated[index], enabled: !updated[index].enabled };
    setDisplayFields(updated);
    setSaveMessage('');
  };

  const updateDisplayLabel = (index: number, label: string) => {
    const updated = [...displayFields];
    updated[index] = { ...updated[index], label };
    setDisplayFields(updated);
    setSaveMessage('');
  };

  const toggleFilter = (index: number) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], enabled: !updated[index].enabled };
    setFilters(updated);
    setSaveMessage('');
  };

  const updateFilterLabel = (index: number, label: string) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], label };
    setFilters(updated);
    setSaveMessage('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    const config = {
      provider,
      displayFields: displayFields.filter(f => f.enabled).map(f => ({ key: f.key, label: f.label })),
      filters: filters.filter(f => f.enabled).map(f => ({ key: f.key, label: f.label })),
      timestamp: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 350));

    console.log('=== API OPTIONS CONFIG SAVED ===');
    console.log(JSON.stringify(config, null, 2));
    console.log('================================');

    setIsSaving(false);
    setSaveMessage('Configuration saved to console log. Ready for backend integration.');

    setTimeout(() => setSaveMessage(''), 4500);
  };

  const resetToDefaults = () => {
    setDisplayFields(DEFAULT_DISPLAY_FIELDS);
    setFilters(DEFAULT_FILTERS);
    setSaveMessage('');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto bg-slate-50 min-h-screen">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-500 mb-3">
            {provider.toUpperCase()} API
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">API Options</h2>
          <p className="mt-2 text-sm text-slate-600 max-w-md">
            Control which fields appear in responses and which filters are exposed to clients.
          </p>
        </div>
        <button
          onClick={resetToDefaults}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-all"
        >
          Reset Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Display Fields Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2m0 0a2 2 0 002-2" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-slate-900">Display Fields</div>
                <div className="text-xs text-slate-500">Fields returned in API responses</div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {displayFields.map((field, index) => (
              <div key={field.key} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/60 transition-colors group">
                <label className="flex-shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.enabled}
                    onChange={() => toggleDisplayField(index)}
                    className="w-4 h-4 accent-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                </label>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] tracking-widest text-slate-400 mb-1.5 uppercase">{field.key}</div>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateDisplayLabel(index, e.target.value)}
                    className="w-full text-sm px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    placeholder="Display label"
                  />
                </div>
                <div className={`flex-shrink-0 text-[10px] px-2.5 py-0.5 rounded-full font-medium tracking-wide ${field.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {field.enabled ? 'SHOWN' : 'HIDDEN'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.707 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-slate-900">Filters</div>
                <div className="text-xs text-slate-500">Query parameters clients can use</div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filters.map((filter, index) => (
              <div key={filter.key} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/60 transition-colors group">
                <label className="flex-shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filter.enabled}
                    onChange={() => toggleFilter(index)}
                    className="w-4 h-4 accent-violet-600 border-slate-300 rounded focus:ring-violet-500"
                  />
                </label>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] tracking-widest text-slate-400 mb-1.5 uppercase">{filter.key}</div>
                  <input
                    type="text"
                    value={filter.label}
                    onChange={(e) => updateFilterLabel(index, e.target.value)}
                    className="w-full text-sm px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400"
                    placeholder="Filter label"
                  />
                </div>
                <div className={`flex-shrink-0 text-[10px] px-2.5 py-0.5 rounded-full font-medium tracking-wide ${filter.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {filter.enabled ? 'ACTIVE' : 'DISABLED'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Bar */}
      <div className="mt-8 flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
        <div className="text-sm text-slate-500">
          Changes are client-side only. Click Save to log the final configuration.
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <div className="text-sm text-emerald-600 font-medium px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
              {saveMessage}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black active:bg-slate-950 text-white text-sm font-semibold disabled:opacity-60 transition-all shadow-sm"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
