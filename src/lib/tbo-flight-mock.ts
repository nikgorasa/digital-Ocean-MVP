import type {
  TBOFlightResult,
  TBOFlightSearchResponse,
  TBOFlightFareRuleResponse,
  TBOFlightFareQuoteResponse,
  TBOFlightSSRResponse,
  TBOFlightSSRData,
  TBOFlightBookRequest,
  TBOFlightBookResponse,
  TBOFlightTicketResponse,
  TBOFlightBookingDetailResponse,
  TBOFlightFare,
  TBOFlightFareBreakdown,
  TBOFlightSegment,
} from "./tbo-flight-types";

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const TRACE_ID = uuid();
const NOW = new Date().toISOString();

function departureDate(daysFromNow = 14): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

const DEP_DATE = departureDate();

interface SectorConfig {
  origin: string;
  destination: string;
  duration: string;
  flights: {
    airline: string;
    code: string;
    flightNum: string;
    dep: string;
    arr: string;
    cabinClass: string;
    bookingClass: string;
    baggage: string;
    cabinBaggage: string;
    isLCC: boolean;
    isRefundable: boolean;
    baseFare: number;
    tax: number;
  }[];
}

const SECTORS: Record<string, SectorConfig> = {
  "DEL→BOM": {
    origin: "DEL", destination: "BOM", duration: "1hr 45min",
    flights: [
      { airline: "IndiGo", code: "6E", flightNum: "6E-2137", dep: "06:00", arr: "07:45", cabinClass: "Economy", bookingClass: "Q", baggage: "15 KG", cabinBaggage: "7 KG", isLCC: true, isRefundable: false, baseFare: 4235, tax: 587 },
      { airline: "SpiceJet", code: "SG", flightNum: "SG-8157", dep: "09:30", arr: "11:15", cabinClass: "Economy", bookingClass: "M", baggage: "15 KG", cabinBaggage: "7 KG", isLCC: true, isRefundable: false, baseFare: 3899, tax: 512 },
      { airline: "Air India", code: "AI", flightNum: "AI-865", dep: "14:00", arr: "15:50", cabinClass: "Economy", bookingClass: "H", baggage: "25 KG", cabinBaggage: "7 KG", isLCC: false, isRefundable: true, baseFare: 5400, tax: 823 },
    ],
  },
  "DEL→BLR": {
    origin: "DEL", destination: "BLR", duration: "2hr 35min",
    flights: [
      { airline: "IndiGo", code: "6E", flightNum: "6E-6011", dep: "05:45", arr: "08:20", cabinClass: "Economy", bookingClass: "Q", baggage: "15 KG", cabinBaggage: "7 KG", isLCC: true, isRefundable: false, baseFare: 5640, tax: 760 },
      { airline: "Air India", code: "AI", flightNum: "AI-505", dep: "11:30", arr: "14:05", cabinClass: "Economy", bookingClass: "H", baggage: "25 KG", cabinBaggage: "7 KG", isLCC: false, isRefundable: true, baseFare: 6780, tax: 945 },
    ],
  },
  "DEL→DXB": {
    origin: "DEL", destination: "DXB", duration: "3hr 45min",
    flights: [
      { airline: "Air India", code: "AI", flightNum: "AI-915", dep: "07:30", arr: "09:15", cabinClass: "Economy", bookingClass: "L", baggage: "30 KG", cabinBaggage: "7 KG", isLCC: false, isRefundable: true, baseFare: 12450, tax: 2150 },
      { airline: "IndiGo", code: "6E", flightNum: "6E-1401", dep: "22:00", arr: "00:45+1", cabinClass: "Economy", bookingClass: "Q", baggage: "25 KG", cabinBaggage: "7 KG", isLCC: true, isRefundable: false, baseFare: 9870, tax: 1800 },
    ],
  },
  "DEL→BKK": {
    origin: "DEL", destination: "BKK", duration: "4hr 00min",
    flights: [
      { airline: "Air India", code: "AI", flightNum: "AI-331", dep: "23:50", arr: "05:20+1", cabinClass: "Economy", bookingClass: "L", baggage: "30 KG", cabinBaggage: "7 KG", isLCC: false, isRefundable: true, baseFare: 14500, tax: 2800 },
      { airline: "IndiGo", code: "6E", flightNum: "6E-1053", dep: "08:30", arr: "13:00", cabinClass: "Economy", bookingClass: "Q", baggage: "25 KG", cabinBaggage: "7 KG", isLCC: true, isRefundable: false, baseFare: 11200, tax: 2100 },
    ],
  },
  "BOM→DEL": {
    origin: "BOM", destination: "DEL", duration: "1hr 45min",
    flights: [
      { airline: "IndiGo", code: "6E", flightNum: "6E-531", dep: "10:00", arr: "11:45", cabinClass: "Economy", bookingClass: "Q", baggage: "15 KG", cabinBaggage: "7 KG", isLCC: true, isRefundable: false, baseFare: 4450, tax: 610 },
    ],
  },
  "DXB→DEL": {
    origin: "DXB", destination: "DEL", duration: "3hr 30min",
    flights: [
      { airline: "Air India", code: "AI", flightNum: "AI-916", dep: "10:30", arr: "15:00", cabinClass: "Economy", bookingClass: "L", baggage: "30 KG", cabinBaggage: "7 KG", isLCC: false, isRefundable: true, baseFare: 13200, tax: 2280 },
    ],
  },
};

function routeKey(origin: string, dest: string): string {
  return `${origin}→${dest}`;
}

function makeFare(
  baseFare: number,
  tax: number,
  paxType: number,
  paxCount: number,
): TBOFlightFare {
  const totalBase = baseFare * paxCount;
  const totalTax = tax * paxCount;
  return {
    Currency: "INR",
    BaseFare: totalBase,
    Tax: totalTax,
    YQTax: 0,
    AdditionalTxnFeeOfrd: paxCount * 30,
    AdditionalTxnFeePub: 0,
    OtherCharges: 0,
    Discount: 0,
    PublishedFare: totalBase + totalTax,
    CommissionEarned: 0,
    PLBEarned: 0,
    IncentiveEarned: 0,
    OfferedFare: totalBase + totalTax,
    TdsOnCommission: 0,
    TdsOnPLB: 0,
    TdsOnIncentive: 0,
    ServiceFee: 0,
    ChargeBU: [],
  };
}

function makeFareBreakdown(
  baseFare: number,
  tax: number,
  paxType: number,
  paxCount: number,
): TBOFlightFareBreakdown {
  const multiplier = paxType === 2 ? 0.75 : paxType === 3 ? 0.25 : 1;
  const paxBase = Math.round(baseFare * multiplier);
  const paxTax = Math.round(tax * multiplier);
  return {
    Currency: "INR",
    PassengerType: paxType,
    PassengerCount: paxCount,
    BaseFare: paxBase * paxCount,
    Tax: paxTax * paxCount,
    YQTax: 0,
    AdditionalTxnFeeOfrd: paxCount * 30,
    AdditionalTxnFeePub: 0,
    OtherCharges: 0,
    Discount: 0,
    PublishedFare: (paxBase + paxTax) * paxCount,
    CommissionEarned: 0,
    PLBEarned: 0,
    IncentiveEarned: 0,
    OfferedFare: (paxBase + paxTax) * paxCount,
    TdsOnCommission: 0,
    TdsOnPLB: 0,
    TdsOnIncentive: 0,
    ServiceFee: 0,
  };
}

function makeSegments(
  cfg: SectorConfig["flights"][0],
  origin: string,
  dest: string,
  tripIndicator: number,
  segmentIndicator: number,
  flightDate: string,
): TBOFlightSegment[] {
  return [
    {
      TripIndicator: tripIndicator,
      SegmentIndicator: segmentIndicator,
      Airline: cfg.airline,
      AirlineCode: cfg.code,
      Origin: origin,
      Destination: dest,
      DepTime: `${flightDate}T${cfg.dep}:00`,
      ArrTime: `${flightDate}T${cfg.arr}:00`,
      FlightNumber: cfg.flightNum,
      OperatingCarrier: cfg.code,
      Baggage: cfg.baggage,
      CabinBaggage: cfg.cabinBaggage,
      CabinClass: cfg.cabinClass,
      BookingClass: cfg.bookingClass,
      Duration: SECTORS[routeKey(origin, dest)]?.duration ?? "0hr",
    },
  ];
}

function buildResult(
  idx: number,
  cfg: SectorConfig["flights"][0],
  origin: string,
  dest: string,
  adultCount: number,
  childCount: number,
  infantCount: number,
  tripIndicator: number,
  flightDate: string,
): TBOFlightResult {
  const paxCount = adultCount + childCount + infantCount;
  const fare = makeFare(cfg.baseFare, cfg.tax, 1, paxCount);
  const breakdowns: TBOFlightFareBreakdown[] = [];

  if (adultCount > 0) breakdowns.push(makeFareBreakdown(cfg.baseFare, cfg.tax, 1, adultCount));
  if (childCount > 0) breakdowns.push(makeFareBreakdown(cfg.baseFare, cfg.tax, 2, childCount));
  if (infantCount > 0) breakdowns.push(makeFareBreakdown(cfg.baseFare, cfg.tax, 3, infantCount));

  const totalFare = breakdowns.reduce((s, b) => s + b.PublishedFare, 0);
  fare.PublishedFare = totalFare;
  fare.OfferedFare = totalFare;
  fare.BaseFare = breakdowns.reduce((s, b) => s + b.BaseFare, 0);
  fare.Tax = breakdowns.reduce((s, b) => s + b.Tax, 0);

  return {
    ResultIndex: String(idx),
    Source: 1,
    IsLCC: cfg.isLCC,
    IsRefundable: cfg.isRefundable,
    Fare: fare,
    FareBreakdown: breakdowns,
    Segments: makeSegments(cfg, origin, dest, tripIndicator, 1, flightDate),
    LastTicketDate: new Date(new Date(flightDate).getTime() - 86400000 * 3).toISOString().slice(0, 10) + "T23:59:00",
    Penalty: cfg.isRefundable ? "As per airline policy" : "Non Refundable",
    FareRules: "Available through FareRule API",
  };
}

export function mockSearchFlights(params: {
  Origin: string;
  Destination: string;
  AdultCount: number;
  ChildCount: number;
  InfantCount: number;
  JourneyType: number;
  PreferredDepartureTime?: string;
}): TBOFlightSearchResponse {
  const { Origin, Destination, AdultCount, ChildCount, InfantCount, JourneyType } = params;
  const key = routeKey(Origin, Destination);
  const sector = SECTORS[key];
  if (!sector) {
    return {
      Response: {
        ResponseStatus: 2,
        Error: { ErrorCode: 1001, ErrorMessage: `No flights found for ${key}` },
        TraceId: TRACE_ID,
        Results: [],
      },
    };
  }

  const flightDate = params.PreferredDepartureTime
    ? params.PreferredDepartureTime.slice(0, 10)
    : DEP_DATE;

  const results: TBOFlightResult[] = [];

  sector.flights.forEach((f, i) => {
    results.push(buildResult(i + 1, f, Origin, Destination, AdultCount, ChildCount, InfantCount, 1, flightDate));
  });

  if (JourneyType === 2 || JourneyType === 5) {
    const returnKey = routeKey(Destination, Origin);
    const returnSector = SECTORS[returnKey];
    if (returnSector) {
      const returnDate = new Date(new Date(flightDate).getTime() + 86400000 * 2)
        .toISOString().slice(0, 10);
      returnSector.flights.forEach((f, i) => {
        const idx = results.length + i + 1;
        results.push(buildResult(idx, f, Destination, Origin, AdultCount, ChildCount, InfantCount, 2, returnDate));
      });
    }
  }

  return {
    Response: {
      ResponseStatus: 1,
      Error: null,
      TraceId: TRACE_ID,
      Results: results,
    },
  };
}

const FARE_RULE_TEXT = `
1. CANCELLATION:
   - Before 24 hours: INR 3000 + GST per passenger
   - Within 24 hours: Non Refundable
2. DATE CHANGE:
   - Before 24 hours: INR 2500 + GST per passenger + fare difference
   - Within 24 hours: Not allowed
3. REISSUE:
   - Allowed with penalty as per fare rules
4. BAGGAGE:
   - As per fare basis
`;

export function mockFareRule(_traceId: string, _resultIndex: string): TBOFlightFareRuleResponse {
  return {
    Response: {
      ResponseStatus: 1,
      Error: null,
      TraceId: TRACE_ID,
      FareRules: [
        {
          Airline: "All",
          Origin: "All",
          Destination: "All",
          FareBasisCode: "NONREF",
          FareRestriction: "Non Refundable",
          FareRuleDetail: FARE_RULE_TEXT.trim(),
        },
      ],
    },
  };
}

let priceChangedIndexes = new Set<string>();

export function mockFareQuote(_traceId: string, resultIndex: string, origResults: TBOFlightResult[]): TBOFlightFareQuoteResponse {
  const result = origResults.find(r => r.ResultIndex === resultIndex);
  const triggerIndex = resultIndex;
  const isPriceChanged = priceChangedIndexes.has(triggerIndex);
  let results: TBOFlightResult[] = [];

  if (result) {
    const r = { ...result };
    if (isPriceChanged) {
      r.Fare = { ...r.Fare, PublishedFare: Math.round(r.Fare.PublishedFare * 1.08), OfferedFare: Math.round(r.Fare.OfferedFare * 1.08), BaseFare: Math.round(r.Fare.BaseFare * 1.08) };
      r.FareBreakdown = r.FareBreakdown.map(fb => ({ ...fb, PublishedFare: Math.round(fb.PublishedFare * 1.08), OfferedFare: Math.round(fb.OfferedFare * 1.08), BaseFare: Math.round(fb.BaseFare * 1.08) }));
    }
    results = [r];
  }

  return {
    Response: {
      ResponseStatus: 1,
      Error: null,
      TraceId: TRACE_ID,
      IsPriceChanged: isPriceChanged,
      Results: results,
    },
  };
}

export function mockSSR(_traceId: string, resultIndex: string, origResults: TBOFlightResult[]): TBOFlightSSRResponse {
  const result = origResults.find(r => r.ResultIndex === resultIndex);
  const isLCC = result?.IsLCC ?? true;

  const ssr: TBOFlightSSRData = {
    Baggage: [
      { WayType: 1, Code: "BK15", Weight: "15 KG", Currency: "INR", Price: 0, Origin: "DEL", Destination: "BOM", AirlineCode: "6E", FlightNumber: "6E-2137" },
      { WayType: 1, Code: "BK20", Weight: "20 KG", Currency: "INR", Price: 900, Origin: "DEL", Destination: "BOM", AirlineCode: "6E", FlightNumber: "6E-2137" },
      { WayType: 1, Code: "BK25", Weight: "25 KG", Currency: "INR", Price: 1800, Origin: "DEL", Destination: "BOM", AirlineCode: "6E", FlightNumber: "6E-2137" },
    ],
    MealDynamic: [
      { WayType: 1, Code: "ML01", Description: "Vegetarian Meal", AirlineDescription: "Veg Meal", Quantity: 1, Price: 350, Currency: "INR" },
      { WayType: 1, Code: "ML02", Description: "Non-Vegetarian Meal", AirlineDescription: "Non-Veg Meal", Quantity: 1, Price: 450, Currency: "INR" },
      { WayType: 1, Code: "ML03", Description: "Special Meal", AirlineDescription: "Special Meal", Quantity: 1, Price: 600, Currency: "INR" },
    ],
    SeatDynamic: [
      {
        SegmentSeatId: 1,
        RowSeats: {
          RowSeats: [
            { Code: "ST01", RowNo: "1", SeatNo: "A", SeatType: "Window", Price: 500 },
            { Code: "ST02", RowNo: "1", SeatNo: "B", SeatType: "Middle", Price: 300 },
            { Code: "ST03", RowNo: "1", SeatNo: "C", SeatType: "Aisle", Price: 400 },
            { Code: "ST04", RowNo: "2", SeatNo: "A", SeatType: "Window", Price: 400 },
            { Code: "ST05", RowNo: "2", SeatNo: "B", SeatType: "Middle", Price: 200 },
            { Code: "ST06", RowNo: "2", SeatNo: "C", SeatType: "Aisle", Price: 300 },
          ],
        },
      },
    ],
  };

  return {
    Response: {
      ResponseStatus: 1,
      Error: null,
      TraceId: TRACE_ID,
      IsLCC: isLCC,
      SSR: isLCC ? ssr : { Baggage: [], MealDynamic: [], SeatDynamic: [] },
    },
  };
}

let bookingCounter = 100000;

function generateBookingId(): string {
  bookingCounter++;
  return `B${bookingCounter}`;
}

function generatePNR(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const mockBookings = new Map<string, {
  bookingId: string;
  pnr: string;
  isLCC: boolean;
  isDomestic: boolean;
  passengers: TBOFlightBookRequest["Passengers"];
  segments: TBOFlightSegment[];
  fare: TBOFlightFare;
  fareBreakdown: TBOFlightFareBreakdown[];
}>();

export function mockBook(req: TBOFlightBookRequest): TBOFlightBookResponse {
  const bookingId = generateBookingId();
  const pnr = generatePNR();
  const isDomestic = req.Passengers.every(p => p.CountryCode === "IN");
  const isLCC = false;

  const passengers = req.Passengers.map((p, i) => ({
    PaxId: i + 1,
    Title: p.Title,
    FirstName: p.FirstName,
    LastName: p.LastName,
    Ticket: null,
  }));

  mockBookings.set(bookingId, {
    bookingId,
    pnr,
    isLCC,
    isDomestic,
    passengers: req.Passengers,
    segments: [],
    fare: {} as TBOFlightFare,
    fareBreakdown: [],
  });

  return {
    Response: {
      ResponseStatus: 1,
      Error: null,
      TraceId: TRACE_ID,
      IsPriceChanged: false,
      IsTimeChanged: false,
      FlightItinerary: {
        BookingId: bookingId,
        PNR: pnr,
        IsLCC: isLCC,
        IsDomestic: isDomestic,
        Passenger: passengers,
      },
    },
  };
}

export function mockTicket(params: {
  PNR?: string;
  BookingId?: string;
  isLCC: boolean;
  passengers: { PaxId: number; Title: string; FirstName: string; LastName: string }[];
  segments: TBOFlightSegment[];
  fare: TBOFlightFare;
  fareBreakdown: TBOFlightFareBreakdown[];
}): TBOFlightTicketResponse {
  const bookingId = params.BookingId || generateBookingId();
  const pnr = params.PNR || generatePNR();

  const ticketedPassengers = params.passengers.map((p, i) => ({
    PaxId: p.PaxId,
    Title: p.Title,
    FirstName: p.FirstName,
    LastName: p.LastName,
    Ticket: {
      TicketId: 1000000 + i,
      TicketNumber: `${Math.floor(Math.random() * 10000000000).toString().padStart(10, "0")}`,
      TicketStatus: "Ticketed",
      TicketType: "E-Ticket",
      ConjunctionNumber: "",
      ValidOn: new Date().toISOString().slice(0, 10),
    },
  }));

  return {
    Response: {
      ResponseStatus: 1,
      Error: null,
      TraceId: TRACE_ID,
      IsPriceChanged: false,
      PNR: pnr,
      BookingId: bookingId,
      FlightItinerary: {
        BookingId: bookingId,
        PNR: pnr,
        IsLCC: params.isLCC,
        IsDomestic: params.segments[0]?.Origin === "DEL" ? true : false,
        Passenger: ticketedPassengers,
        Segments: params.segments,
        Fare: params.fare,
        FareBreakdown: params.fareBreakdown,
      },
    },
  };
}

export function mockBookingDetail(req: { BookingId?: string; PNR?: string }): TBOFlightBookingDetailResponse {
  const entry = req.BookingId
    ? mockBookings.get(req.BookingId)
    : mockBookings.values().next().value;

  if (!entry) {
    return {
      Response: {
        ResponseStatus: 2,
        Error: { ErrorCode: 2001, ErrorMessage: "Booking not found" },
        TraceId: TRACE_ID,
        FlightItinerary: null as unknown as TBOFlightBookingDetailResponse["Response"]["FlightItinerary"],
      },
    };
  }

  return {
    Response: {
      ResponseStatus: 1,
      Error: null,
      TraceId: TRACE_ID,
      FlightItinerary: {
        BookingId: entry.bookingId,
        PNR: entry.pnr,
        IsLCC: entry.isLCC,
        IsDomestic: entry.isDomestic,
        Passenger: entry.passengers.map((p, i) => ({
          PaxId: i + 1,
          Title: p.Title,
          FirstName: p.FirstName,
          LastName: p.LastName,
          Ticket: [{
            TicketId: 1000000 + i,
            TicketNumber: `TK${entry.bookingId}-${i}`,
            TicketStatus: "Ticketed",
          }],
        })),
        Segments: entry.segments,
        Fare: entry.fare,
        FareBreakdown: entry.fareBreakdown,
      },
    },
  };
}

export function setPriceChanged(resultIndex: string): void {
  priceChangedIndexes.add(resultIndex);
}

export function resetMock(): void {
  bookingCounter = 100000;
  mockBookings.clear();
  priceChangedIndexes.clear();
}
