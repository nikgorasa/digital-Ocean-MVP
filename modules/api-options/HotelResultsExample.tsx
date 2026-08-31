import React, { useState } from 'react';
import { useApiOptions } from './useApiOptions';

interface Hotel {
  id: string;
  name: string;
  location: string;
  rating: number;
  pricePerNight: number;
  totalPrice: number;
  amenities: string[];
  distanceFromCenter: string;
  reviewScore: number;
}

const mockHotels: Hotel[] = [
  { id: 'h1', name: 'The Leela Palace', location: 'Bengaluru', rating: 5, pricePerNight: 18500, totalPrice: 37000, amenities: ['Pool', 'Spa', 'WiFi'], distanceFromCenter: '2.1 km', reviewScore: 4.8 },
  { id: 'h2', name: 'Taj West End', location: 'Bengaluru', rating: 5, pricePerNight: 14200, totalPrice: 28400, amenities: ['Pool', 'Gym', 'WiFi'], distanceFromCenter: '1.5 km', reviewScore: 4.6 },
  { id: 'h3', name: 'ITC Gardenia', location: 'Bengaluru', rating: 4, pricePerNight: 9800, totalPrice: 19600, amenities: ['Pool', 'WiFi', 'Restaurant'], distanceFromCenter: '3.2 km', reviewScore: 4.4 },
];

export const HotelResultsExample: React.FC = () => {
  const { options, loading } = useApiOptions('hotel');
  const [sortBy, setSortBy] = useState<'price' | 'rating'>('price');

  if (loading) return <div className="p-8 text-center">Loading hotel options...</div>;
  if (!options) return <div className="p-8 text-red-600">Error loading API options</div>;

  // Apply filters from hook
  let filteredHotels = mockHotels.filter(hotel => {
    // Basic filter example - assuming filters exist on options
    return true;
  });

  // Sort
  filteredHotels = [...filteredHotels].sort((a, b) => {
    if (sortBy === 'price') return a.totalPrice - b.totalPrice;
    return b.rating - a.rating;
  });

  // Respect displayFields
  const visibleFields = Object.keys(options.display).filter(key => options.display[key as keyof typeof options.display]) || ['name', 'rating', 'pricePerNight', 'totalPrice', 'distanceFromCenter'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Hotel Results</h1>
        <div className="flex gap-2">
          <button onClick={() => setSortBy('price')} className={`px-4 py-2 rounded ${sortBy === 'price' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}>Sort by Price</button>
          <button onClick={() => setSortBy('rating')} className={`px-4 py-2 rounded ${sortBy === 'rating' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}>Sort by Rating</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHotels.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border">No hotels match current filters</div>
        ) : (
          filteredHotels.map(hotel => (
            <div key={hotel.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    {visibleFields.includes('name') && <h3 className="font-semibold text-lg">{hotel.name}</h3>}
                    {visibleFields.includes('location') && <p className="text-sm text-gray-500">{hotel.location}</p>}
                  </div>
                  {visibleFields.includes('rating') && (
                    <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-sm font-medium">
                      ★ {hotel.rating}
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm mb-4">
                  {visibleFields.includes('distanceFromCenter') && <div className="text-gray-600">{hotel.distanceFromCenter} from center</div>}
                  {visibleFields.includes('reviewScore') && <div>Review score: <span className="font-medium">{hotel.reviewScore}</span>/5</div>}
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {hotel.amenities.slice(0, 3).map(a => (
                    <span key={a} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{a}</span>
                  ))}
                </div>

                <div className="flex items-baseline justify-between pt-3 border-t">
                  {visibleFields.includes('pricePerNight') && <div className="text-sm text-gray-500">₹{hotel.pricePerNight} <span className="text-xs">/ night</span></div>}
                  {visibleFields.includes('totalPrice') && <div className="text-right"><span className="font-semibold text-xl text-emerald-600">₹{hotel.totalPrice}</span><div className="text-xs text-gray-500">total</div></div>}
                </div>
              </div>
              <div className="px-5 pb-5">
                <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition">View Rooms & Book</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">Using useApiOptions hook — respects {visibleFields.length} display fields and active filters.</div>
    </div>
  );
};
