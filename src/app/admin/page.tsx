'use client';

import { useState } from 'react';

interface ApiOption {
  id: string;
  label: string;
  enabled: boolean;
  endpoint: string;
  mode: 'search' | 'booking' | 'both';
}

export default function AdminApiOptions() {
  const [options, setOptions] = useState<ApiOption[]>([
    { id: 'tbo-hotel-search', label: 'TBO Hotel Search', enabled: true, endpoint: 'https://affiliate.tektravels.com/HotelAPI', mode: 'search' },
    { id: 'tbo-hotel-book', label: 'TBO Hotel Booking', enabled: true, endpoint: 'https://HotelBE.tektravels.com/hotelservice.svc/rest', mode: 'booking' },
    { id: 'tbo-flight-search', label: 'TBO Flight Search', enabled: true, endpoint: 'https://flight.tektravels.com', mode: 'search' },
  ]);

  const toggleOption = (id: string) => {
    setOptions(prev => prev.map(o => o.id === id ? { ...o, enabled: !o.enabled } : o));
  };

  const updateEndpoint = (id: string, endpoint: string) => {
    setOptions(prev => prev.map(o => o.id === id ? { ...o, endpoint } : o));
  };

  const saveConfig = async () => {
    await fetch('/api/api-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options }),
    });
    alert('API Options saved — public route will now serve this config');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin — API Options (EPIC #321)</h1>
      <p className="text-sm text-gray-500 mb-6">Configure which endpoints and modes are active. Changes are served via /api/api-options</p>

      <div className="space-y-4">
        {options.map(opt => (
          <div key={opt.id} className="border rounded-lg p-4 flex items-center gap-4 bg-white">
            <input type="checkbox" checked={opt.enabled} onChange={() => toggleOption(opt.id)} className="w-5 h-5" />
            <div className="flex-1">
              <div className="font-medium">{opt.label}</div>
              <input
                type="text"
                value={opt.endpoint}
                onChange={e => updateEndpoint(opt.id, e.target.value)}
                className="w-full mt-1 text-sm font-mono border px-2 py-1 rounded"
              />
            </div>
            <select value={opt.mode} onChange={e => setOptions(prev => prev.map(o => o.id === opt.id ? { ...o, mode: e.target.value as any } : o))} className="border px-2 py-1 rounded text-sm">
              <option value="search">Search only</option>
              <option value="booking">Booking only</option>
              <option value="both">Both</option>
            </select>
          </div>
        ))}
      </div>

      <button onClick={saveConfig} className="mt-6 px-6 py-2 bg-black text-white rounded hover:bg-gray-800">Save & Publish to Public API</button>
      <div className="mt-4 text-xs text-gray-400">Public endpoint: GET /api/api-options — consumed by Flight & Hotel pages via useApiOptions hook</div>
    </div>
  );
}
