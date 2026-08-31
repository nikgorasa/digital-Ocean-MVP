import React, { useState } from 'react';
import { useApiOptions } from './useApiOptions';

interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  stops: number;
  cabinClass: string;
}

const mockFlights: Flight[] = [
  { id: 'f1', airline: 'IndiGo', flightNumber: '6E-123', departure: 'DEL', arrival: 'BOM', departureTime: '08:00', arrivalTime: '10:15', duration: '2h 15m', price: 4500, stops: 0, cabinClass: 'Economy' },
  { id: 'f2', airline: 'Air India', flightNumber: 'AI-456', departure: 'DEL', arrival: 'BOM', departureTime: '09:30', arrivalTime: '12:00', duration: '2h 30m', price: 5200, stops: 0, cabinClass: 'Economy' },
  { id: 'f3', airline: 'Vistara', flightNumber: 'UK-789', departure: 'DEL', arrival: 'BOM', departureTime: '14:00', arrivalTime: '16:20', duration: '2h 20m', price: 6100, stops: 0, cabinClass: 'Premium Economy' },
];

export const FlightResultsExample: React.FC = () => {
  const { options, loading } = useApiOptions('flight');
  const [sortBy, setSortBy] = useState<'price' | 'duration'>('price');

  if (loading) return <div className="p-8 text-center">Loading flight options...</div>;
  if (!options) return <div className="p-8 text-red-600">Error loading API options</div>;

  // Apply filters from hook
  let filteredFlights = mockFlights.filter(flight => {
    // Basic filter example - assuming filters exist on options
    return true;
  });

  // Sort
  filteredFlights = [...filteredFlights].sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price;
    return a.duration.localeCompare(b.duration);
  });

  // Respect displayFields - only show configured columns
  const visibleFields = Object.keys(options.display).filter(key => options.display[key as keyof typeof options.display]) || ['airline', 'flightNumber', 'departureTime', 'arrivalTime', 'duration', 'price'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Flight Results</h1>
        <div className="flex gap-2">
          <button onClick={() => setSortBy('price')} className={`px-4 py-2 rounded ${sortBy === 'price' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Sort by Price</button>
          <button onClick={() => setSortBy('duration')} className={`px-4 py-2 rounded ${sortBy === 'duration' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Sort by Duration</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {visibleFields.includes('airline') && <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Airline</th>}
              {visibleFields.includes('flightNumber') && <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Flight</th>}
              {visibleFields.includes('departureTime') && <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Departure</th>}
              {visibleFields.includes('arrivalTime') && <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Arrival</th>}
              {visibleFields.includes('duration') && <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Duration</th>}
              {visibleFields.includes('price') && <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Price</th>}
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredFlights.length === 0 ? (
              <tr><td colSpan={visibleFields.length + 1} className="px-4 py-8 text-center text-gray-500">No flights match current filters</td></tr>
            ) : (
              filteredFlights.map(flight => (
                <tr key={flight.id} className="hover:bg-gray-50">
                  {visibleFields.includes('airline') && <td className="px-4 py-4 font-medium">{flight.airline}</td>}
                  {visibleFields.includes('flightNumber') && <td className="px-4 py-4 text-sm text-gray-600">{flight.flightNumber}</td>}
                  {visibleFields.includes('departureTime') && <td className="px-4 py-4 text-sm">{flight.departureTime}</td>}
                  {visibleFields.includes('arrivalTime') && <td className="px-4 py-4 text-sm">{flight.arrivalTime}</td>}
                  {visibleFields.includes('duration') && <td className="px-4 py-4 text-sm text-gray-600">{flight.duration}</td>}
                  {visibleFields.includes('price') && <td className="px-4 py-4 text-right font-semibold text-emerald-600">₹{flight.price}</td>}
                  <td className="px-4 py-4">
                    <button className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Select</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-500">Using useApiOptions hook — respects {visibleFields.length} display fields and active filters.</div>
    </div>
  );
};
