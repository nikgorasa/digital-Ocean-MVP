import type { ApiOptions } from './types';

export const DEFAULT_API_OPTIONS: ApiOptions = {
  display: {
    airline: true,
    flightNumber: true,
    departureTime: true,
    arrivalTime: true,
    duration: true,
    stops: true,
    fareType: true,
    mealPlan: true,
    baggage: true,
    cancellationPolicy: true,
    price: true,
  },
  filters: {
    stops: { enabled: true },
    fareType: { enabled: true },
    mealPlan: { enabled: true },
    baggage: { enabled: true },
    refundable: { enabled: true },
    airline: { enabled: true },
  },
  labels: {
    mealPlans: {},
    fareTypes: {},
    stops: {},
    cancellation: {},
    starLabels: {},
  },
  booking: {
    pan: { required: 'auto' },
    passport: { required: 'auto' },
    gst: { required: 'auto' },
  },
};
