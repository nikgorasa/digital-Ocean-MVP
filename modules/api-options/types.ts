import { z } from 'zod';

export const BookingRequiredSchema = z.enum(['auto', 'always', 'never']);
export type BookingRequired = z.infer<typeof BookingRequiredSchema>;

export const DisplayFieldsSchema = z.object({
  airline: z.boolean().default(true),
  flightNumber: z.boolean().default(true),
  departureTime: z.boolean().default(true),
  arrivalTime: z.boolean().default(true),
  duration: z.boolean().default(true),
  stops: z.boolean().default(true),
  fareType: z.boolean().default(true),
  mealPlan: z.boolean().default(true),
  baggage: z.boolean().default(true),
  cancellationPolicy: z.boolean().default(true),
  price: z.boolean().default(true),
});

export const FilterConfigSchema = z.object({
  enabled: z.boolean().default(true),
  label: z.string().optional(),
});

export const LabelOverridesSchema = z.object({
  mealPlans: z.record(z.string(), z.string()).default({}),
  fareTypes: z.record(z.string(), z.string()).default({}),
  stops: z.record(z.string(), z.string()).default({}),
  cancellation: z.record(z.string(), z.string()).default({}),
  starLabels: z.record(z.string(), z.string()).default({}),
});

export const BookingFieldsSchema = z.object({
  pan: z.object({ required: BookingRequiredSchema.default('auto') }),
  passport: z.object({ required: BookingRequiredSchema.default('auto') }),
  gst: z.object({ required: BookingRequiredSchema.default('auto') }),
});

export const ApiOptionsSchema = z.object({
  display: DisplayFieldsSchema.default({
    airline: true, flightNumber: true, departureTime: true, arrivalTime: true, 
    duration: true, stops: true, fareType: true, mealPlan: true, 
    baggage: true, cancellationPolicy: true, price: true
  }),
  filters: z.object({
    stops: FilterConfigSchema.default({ enabled: true }),
    fareType: FilterConfigSchema.default({ enabled: true }),
    mealPlan: FilterConfigSchema.default({ enabled: true }),
    baggage: FilterConfigSchema.default({ enabled: true }),
    refundable: FilterConfigSchema.default({ enabled: true }),
    airline: FilterConfigSchema.default({ enabled: true }),
  }),
  labels: LabelOverridesSchema.default({
    mealPlans: {}, fareTypes: {}, stops: {}, cancellation: {}, starLabels: {}
  }),
  booking: BookingFieldsSchema.default({
    pan: { required: 'auto' }, passport: { required: 'auto' }, gst: { required: 'auto' }
  }),
});

export type ApiOptions = z.infer<typeof ApiOptionsSchema>;

export interface FlightResult {
  id?: string;
  price: number;
  stops: number;
  airline?: string;
  airlineCode?: string;
  flightNumber?: string;
  origin?: string;
  destination?: string;
  departure?: string;
  arrival?: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  cabinClass?: string;
  isRefundable?: boolean;
  tier?: string;
  fareType?: string;
  fareInclusions?: string[];
  isLCC?: boolean;
  isFreeMealAvailable?: boolean;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  date: string;
}
