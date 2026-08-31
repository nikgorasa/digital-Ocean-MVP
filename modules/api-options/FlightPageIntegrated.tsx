'use client';

import React, { useState } from 'react';
import { useApiOptions } from './useApiOptions';
import { FlightSearchParams, FlightResult } from './types';

const MOCK_FLIGHTS: FlightResult[] = [
  { id: '1', airline: 'IndiGo', flightNumber: '6E-123', origin: 'DEL', destination: 'BOM', departure: '2026-09-15T08:00', arrival: '2026-09-15T10:30', price: 4500, stops: 0, duration: '2h 30m', cabinClass: 'economy' },
  { id: '2', airline: 'Air India', flightNumber: 'AI-456', origin: 'DEL', destination: 'BOM', departure: '2026-09-15T14:00', arrival: '2026-09-15T16:45', price: 5200, stops: 1, duration: '2h 45m', cabinClass: 'economy' },
];

export default function FlightPageIntegrated() {
  const { options, loading } = useApiOptions('flight');
  const [searchParams, setSearchParams] = useState<Partial<FlightSearchParams>>({ origin: 'DEL', destination: 'BOM', date: '2026-09-15' });
  const [results, setResults] = useState<FlightResult[]>([]);
  const [activeFilters, setActiveFilters] = useState<{ stops?: number; airlines?: string[] }>({});

  if (loading) {
    return <div className="p-8 text-center">Loading API options...</div>;
  }
  if (!options) {
    return <div className="p-8 text-center">Failed to load API options.</div>;
  }

  const enabledFields = Object.keys(options.display).filter(key => options.display[key as keyof typeof options.display]) || [];
  const enabledFilters = Object.keys(options.filters).filter(key => options.filters[key as keyof typeof options.filters].enabled) || [];

  const handleSearch = () => {
    let filtered = MOCK_FLIGHTS.filter(f => 
      f.origin === searchParams.origin && f.destination === searchParams.destination
    );
    if (activeFilters.stops !== undefined && enabledFilters.includes('stops')) {
      filtered = filtered.filter(f => f.stops === activeFilters.stops);
    }
    if (activeFilters.airlines?.length && enabledFilters.includes('airlines')) {
      filtered = filtered.filter(f => f.airline && activeFilters.airlines!.includes(f.airline));
    }
    setResults(filtered);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Flight Search (API Options Integrated)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search Form */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {enabledFields.includes('origin') && (
              <input type="text" placeholder="Origin" value={searchParams.origin} onChange={e => setSearchParams(p => ({...p, origin: e.target.value}))} className="border p-3 rounded" />
            )}
            {enabledFields.includes('destination') && (
              <input type="text" placeholder="Destination" value={searchParams.destination} onChange={e => setSearchParams(p => ({...p, destination: e.target.value}))} className="border p-3 rounded" />
            )}
            {enabledFields.includes('date') && (
              <input type="date" value={searchParams.date} onChange={e => setSearchParams(p => ({...p, date: e.target.value}))} className="border p-3 rounded" />
            )}
            {enabledFields.includes('cabinClass') && (
              <select className="border p-3 rounded">
                <option>Economy</option>
                <option>Business</option>
              </select>
            )}
          </div>
          <button onClick={handleSearch} className="mt-4 bg-blue-600 text-white px-8 py-3 rounded-lg">Search Flights</button>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow h-fit">
          <h3 className="font-semibold mb-4">Filters</h3>
          {enabledFilters.includes('stops') && (
            <div className="mb-4">
              <label className="block text-sm mb-1">Stops</label>
              <select onChange={e => setActiveFilters(f => ({...f, stops: parseInt(e.target.value) || undefined}))} className="w-full border p-2 rounded">
                <option value="">Any</option>
                <option value="0">Non-stop</option>
                <option value="1">1 stop</option>
              </select>
            </div>
          )}
          {enabledFilters.includes('airlines') && (
            <div>
              <label className="block text-sm mb-1">Airlines</label>
              <div className="space-y-1 text-sm">
                {['IndiGo', 'Air India'].map(a => (
                  <label key={a} className="flex items-center gap-2">
                    <input type="checkbox" onChange={e => {
                      const list = activeFilters.airlines || [];
                      setActiveFilters(f => ({...f, airlines: e.target.checked ? [...list, a] : list.filter(x => x !== a)}));
                    }} /> {a}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mt-8">
        {results.length === 0 ? (
          <p className="text-gray-500">No results yet. Adjust filters and search.</p>
        ) : (
          results.map(r => (
            <div key={r.id} className="border rounded-xl p-5 mb-4 flex justify-between items-center">
              <div>
                <div className="font-semibold">{r.airline} {r.flightNumber}</div>
                <div className="text-sm text-gray-600">{r.origin} → {r.destination} • {r.duration} • {r.stops === 0 ? 'Non-stop' : `${r.stops} stop`}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">₹{r.price}</div>
                {enabledFields.includes('cabinClass') && <div className="text-xs uppercase tracking-widest text-gray-500">{r.cabinClass}</div>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
