import type {
  TBOHotelSearchResponse,
  TBOHotelPreBookResponse,
  TBOHotelBookRequest,
  TBOHotelBookResponse,
  TBOHotelBookingDetailResponse,
  TBOHotelSearchRequest,
  TBOHotelDayRate,
  TBOHotelCancelPolicy,
  TBOHotelSupplement,
  TBOHotelRoom,
  TBOHotelResult,
  TBOStatus,
} from "./tbo-hotel-types";

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const TRACE_ID = uuid();

function bookingCode(hotelCode: number, roomIdx: number): string {
  return `${hotelCode}!TB!${roomIdx}!TB!${uuid().slice(0, 8)}!TB!AFF!`;
}

function dayRate(price: number): TBOHotelDayRate {
  return { BasePrice: price, ExtraGuest: 0, Child: 0 };
}

function cancelPolicy(
  index: string,
  fromDays: number,
  charge: number,
  chargeType = "Percentage",
): TBOHotelCancelPolicy {
  const d = new Date();
  d.setDate(d.getDate() + fromDays);
  return {
    Index: index,
    FromDate: d.toISOString(),
    ChargeType: chargeType,
    CancellationCharge: charge,
  };
}

function supplement(
  index: number,
  desc: string,
  price: number,
  currency: string,
): TBOHotelSupplement {
  return { Index: index, Type: "AtProperty", Description: desc, Price: price, Currency: currency };
}

/* ── Hotel definitions ── */

interface MockHotelDef {
  code: number;
  name: string;
  rating: number;
  location: string;
  currency: string;
  imageUrl: string;
  rooms: {
    name: string;
    refundable: boolean;
    mealType: string;
    inclusion: string;
    basePrice: number;
    tax: number;
    amenities: string[];
  }[];
}

const HOTELS: Record<string, MockHotelDef[]> = {
  Goa: [
    {
      code: 1279415, name: "Fairfield by Marriott Goa", rating: 4, location: "Calangute, Goa",
      currency: "INR",
      imageUrl: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Deluxe Room, 1 King Bed", refundable: false, mealType: "Room_Only", inclusion: "Free parking", basePrice: 3500, tax: 650, amenities: ["Free WiFi", "Free Parking", "Air Conditioning"] },
        { name: "Premium Room, 1 King Bed", refundable: true, mealType: "Breakfast", inclusion: "Free breakfast, Free parking", basePrice: 4800, tax: 850, amenities: ["Free WiFi", "Free Parking", "Breakfast", "Air Conditioning"] },
      ],
    },
    {
      code: 2235336, name: "The Zuri White Sands Goa", rating: 5, location: "Cavelossim, Goa",
      currency: "INR",
      imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Garden View Room", refundable: false, mealType: "Half_Board", inclusion: "Breakfast & Dinner", basePrice: 6500, tax: 1200, amenities: ["Free WiFi", "Pool Access", "Breakfast", "Dinner", "Air Conditioning"] },
      ],
    },
  ],
  Mumbai: [
    {
      code: 3382101, name: "The Taj Mahal Palace", rating: 5, location: "Colaba, Mumbai",
      currency: "INR",
      imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Heritage Room", refundable: true, mealType: "Breakfast", inclusion: "Free breakfast", basePrice: 12000, tax: 2100, amenities: ["Free WiFi", "Breakfast", "Gym", "Pool", "Air Conditioning", "Airport Transfer"] },
        { name: "Sea View Suite", refundable: true, mealType: "Half_Board", inclusion: "Breakfast & Dinner", basePrice: 22000, tax: 3800, amenities: ["Free WiFi", "Breakfast", "Dinner", "Gym", "Pool", "Butler Service"] },
      ],
    },
    {
      code: 4478923, name: "ITC Grand Central", rating: 5, location: "Lower Parel, Mumbai",
      currency: "INR",
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Executive Room", refundable: false, mealType: "Breakfast", inclusion: "Free breakfast", basePrice: 8500, tax: 1500, amenities: ["Free WiFi", "Breakfast", "Gym", "Air Conditioning"] },
      ],
    },
  ],
  Delhi: [
    {
      code: 5567341, name: "The Lalit New Delhi", rating: 5, location: "Connaught Place, New Delhi",
      currency: "INR",
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Superior Room", refundable: false, mealType: "Breakfast", inclusion: "Free breakfast", basePrice: 6000, tax: 1050, amenities: ["Free WiFi", "Breakfast", "Gym", "Pool", "Air Conditioning"] },
      ],
    },
    {
      code: 6628345, name: "Claridges New Delhi", rating: 5, location: "Lutyens Delhi, New Delhi",
      currency: "INR",
      imageUrl: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Deluxe Room", refundable: true, mealType: "Breakfast", inclusion: "Free breakfast, Free minibar", basePrice: 7500, tax: 1300, amenities: ["Free WiFi", "Breakfast", "Minibar", "Air Conditioning"] },
        { name: "Suite", refundable: true, mealType: "Half_Board", inclusion: "Breakfast & Dinner", basePrice: 14000, tax: 2500, amenities: ["Free WiFi", "Breakfast", "Dinner", "Butler Service", "Air Conditioning"] },
      ],
    },
  ],
  Jaipur: [
    {
      code: 7712398, name: "Rambagh Palace", rating: 5, location: "Bhawani Singh Road, Jaipur",
      currency: "INR",
      imageUrl: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Palace Room", refundable: true, mealType: "Breakfast", inclusion: "Free breakfast", basePrice: 15000, tax: 2600, amenities: ["Free WiFi", "Breakfast", "Pool", "Spa", "Air Conditioning", "Heritage Walk"] },
      ],
    },
    {
      code: 8834567, name: "ITC Rajputana", rating: 5, location: "Palace Road, Jaipur",
      currency: "INR",
      imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Classic Room", refundable: false, mealType: "Breakfast", inclusion: "Free breakfast", basePrice: 5500, tax: 950, amenities: ["Free WiFi", "Breakfast", "Pool", "Air Conditioning"] },
        { name: "Executive Suite", refundable: true, mealType: "Half_Board", inclusion: "Breakfast & Dinner", basePrice: 10000, tax: 1800, amenities: ["Free WiFi", "Breakfast", "Dinner", "Pool", "Spa", "Air Conditioning"] },
      ],
    },
  ],
  Bangalore: [
    {
      code: 9901234, name: "The Oberoi Bangalore", rating: 5, location: "MG Road, Bangalore",
      currency: "INR",
      imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Premier Room", refundable: true, mealType: "Breakfast", inclusion: "Free breakfast", basePrice: 9000, tax: 1600, amenities: ["Free WiFi", "Breakfast", "Gym", "Pool", "Air Conditioning"] },
      ],
    },
  ],
  Dubai: [
    {
      code: 10928374, name: "JW Marriott Marquis Dubai", rating: 5, location: "Business Bay, Dubai",
      currency: "AED",
      imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Deluxe Room", refundable: false, mealType: "Room_Only", inclusion: "Free parking", basePrice: 550, tax: 75, amenities: ["Free WiFi", "Free Parking", "Gym", "Pool", "Air Conditioning", "Beach Access"] },
        { name: "Executive Suite", refundable: true, mealType: "Breakfast", inclusion: "Free breakfast, Lounge access", basePrice: 950, tax: 130, amenities: ["Free WiFi", "Breakfast", "Lounge", "Gym", "Pool"] },
      ],
    },
    {
      code: 20938475, name: "Rove Downtown", rating: 4, location: "Downtown Dubai",
      currency: "AED",
      imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Standard Room", refundable: false, mealType: "Room_Only", inclusion: "", basePrice: 320, tax: 45, amenities: ["Free WiFi", "Gym", "Pool"] },
      ],
    },
  ],
  Bangkok: [
    {
      code: 30948576, name: "Centara Grand at CentralWorld", rating: 5, location: "Pathum Wan, Bangkok",
      currency: "THB",
      imageUrl: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Superior Room", refundable: false, mealType: "Breakfast", inclusion: "Free breakfast", basePrice: 3200, tax: 500, amenities: ["Free WiFi", "Breakfast", "Gym", "Pool", "Air Conditioning", "Spa"] },
        { name: "Deluxe Room", refundable: true, mealType: "Breakfast", inclusion: "Free breakfast, Free minibar", basePrice: 4500, tax: 700, amenities: ["Free WiFi", "Breakfast", "Minibar", "Gym", "Pool", "Spa"] },
      ],
    },
    {
      code: 40192837, name: "Novotel Bangkok Platinum", rating: 4, location: "Siam, Bangkok",
      currency: "THB",
      imageUrl: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Standard Room", refundable: false, mealType: "Room_Only", inclusion: "", basePrice: 1800, tax: 300, amenities: ["Free WiFi", "Gym", "Pool", "Air Conditioning"] },
      ],
    },
  ],
  Singapore: [
    {
      code: 50384756, name: "Marina Bay Sands", rating: 5, location: "Marina Bay, Singapore",
      currency: "SGD",
      imageUrl: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Deluxe Room", refundable: false, mealType: "Room_Only", inclusion: "Free parking", basePrice: 400, tax: 50, amenities: ["Free WiFi", "Free Parking", "Gym", "Pool", "Air Conditioning", "Infinity Pool"] },
        { name: "Premier Room", refundable: true, mealType: "Breakfast", inclusion: "Free breakfast", basePrice: 550, tax: 70, amenities: ["Free WiFi", "Breakfast", "Gym", "Pool", "Infinity Pool"] },
      ],
    },
    {
      code: 60493827, name: "Pan Pacific Singapore", rating: 5, location: "Marina Square, Singapore",
      currency: "SGD",
      imageUrl: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Harbour View Room", refundable: true, mealType: "Breakfast", inclusion: "Free breakfast", basePrice: 320, tax: 45, amenities: ["Free WiFi", "Breakfast", "Gym", "Pool", "Air Conditioning", "Bay View"] },
      ],
    },
  ],
  "Kuala Lumpur": [
    {
      code: 70192834, name: "The Kuala Lumpur Journal", rating: 4, location: "Bukit Bintang, Kuala Lumpur",
      currency: "MYR",
      imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Studio Room", refundable: false, mealType: "Room_Only", inclusion: "Free parking", basePrice: 250, tax: 35, amenities: ["Free WiFi", "Free Parking", "Gym", "Pool", "Air Conditioning"] },
      ],
    },
    {
      code: 80293847, name: "Grand Hyatt Kuala Lumpur", rating: 5, location: "KLCC, Kuala Lumpur",
      currency: "MYR",
      imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Grand Room", refundable: true, mealType: "Breakfast", inclusion: "Free breakfast", basePrice: 480, tax: 65, amenities: ["Free WiFi", "Breakfast", "Gym", "Pool", "Spa", "Air Conditioning", "KLCC View"] },
        { name: "Suite", refundable: true, mealType: "Half_Board", inclusion: "Breakfast & Dinner", basePrice: 800, tax: 110, amenities: ["Free WiFi", "Breakfast", "Dinner", "Lounge", "Gym", "Pool", "Spa"] },
      ],
    },
  ],
};

const CITY_CODES: Record<string, number> = {
  Goa: 49592, Mumbai: 41924, Delhi: 42374, Jaipur: 42810,
  Bangalore: 41324, Dubai: 52163, Bangkok: 52173,
  Singapore: 52188, "Kuala Lumpur": 52203,
};

export function generateFallbackHotels(cityName: string): MockHotelDef[] {
  const city = cityName || "Unknown";
  return [
    {
      code: 9999001,
      name: `Hotel in ${city}`,
      rating: 3,
      location: `${city} City Center`,
      currency: "INR",
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Standard Room", refundable: false, mealType: "Room_Only", inclusion: "Free WiFi", basePrice: 1500, tax: 270, amenities: ["Free WiFi", "Air Conditioning"] },
        { name: "Deluxe Room", refundable: true, mealType: "Breakfast", inclusion: "Free breakfast", basePrice: 2500, tax: 450, amenities: ["Free WiFi", "Breakfast", "Air Conditioning"] },
      ],
    },
    {
      code: 9999002,
      name: `Resort in ${city}`,
      rating: 4,
      location: `${city} Outskirts`,
      currency: "INR",
      imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Garden View Room", refundable: true, mealType: "Breakfast", inclusion: "Free breakfast, Pool access", basePrice: 3500, tax: 630, amenities: ["Free WiFi", "Breakfast", "Pool", "Air Conditioning"] },
      ],
    },
    {
      code: 9999003,
      name: `Guest House in ${city}`,
      rating: 2,
      location: `${city} Main Area`,
      currency: "INR",
      imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      rooms: [
        { name: "Economy Room", refundable: false, mealType: "Room_Only", inclusion: "Free WiFi", basePrice: 1500, tax: 270, amenities: ["Free WiFi"] },
      ],
    },
  ];
}

function buildRoom(
  def: MockHotelDef["rooms"][0],
  hotelCode: number,
  roomIdx: number,
  checkIn: string,
  checkOut: string,
  nights: number,
): TBOHotelRoom {
  const dr: TBOHotelDayRate[] = [];
  for (let n = 0; n < nights; n++) {
    dr.push(dayRate(def.basePrice));
  }

  return {
    Name: [def.name],
    BookingCode: bookingCode(hotelCode, roomIdx + 1),
    Inclusion: def.inclusion,
    DayRates: [dr],
    SelectedDateRange: `${checkIn} to ${checkOut}`,
    TotalFare: def.basePrice * nights,
    TotalTax: def.tax * nights,
    RoomID: [`${hotelCode}${roomIdx}${uuid().slice(0, 4)}`],
    RoomPromotion: ["Standard Rate"],
    CancelPolicies: [
      cancelPolicy("1", -2, 100),
      cancelPolicy("2", -7, 50),
    ],
    MealType: def.mealType,
    IsRefundable: def.refundable,
    Supplements: [[supplement(1, "GST", Math.round(def.tax / nights), hotelCode >= 10000000 ? "AED" : "INR")]],
    WithTransfers: false,
  };
}

function findHotelsByCity(city: string): MockHotelDef[] {
  return HOTELS[city] || [];
}

function findHotelsByCodes(codes: string): MockHotelDef[] {
  const codeSet = new Set(codes.split(",").map(c => parseInt(c, 10)));
  const results: MockHotelDef[] = [];
  for (const entries of Object.values(HOTELS)) {
    for (const h of entries) {
      if (codeSet.has(h.code)) results.push(h);
    }
  }
  return results;
}

export function mockSearchHotels(req: TBOHotelSearchRequest): TBOHotelSearchResponse {
  const { CheckIn, CheckOut, HotelCodes, PaxRooms } = req;
  const checkIn = new Date(CheckIn);
  const checkOutDate = new Date(CheckOut);
  const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkIn.getTime()) / 86400000));

  const totalPax = PaxRooms.reduce((s, r) => s + r.Adults + r.Children, 0);
  const cityKey = req.SearchedCities?.[0] || guessCityFromHotels(HotelCodes);
  const defs = HotelCodes ? findHotelsByCodes(HotelCodes) : findHotelsByCity(cityKey);

  if (defs.length === 0) {
    // Generate fallback hotels for the city
    const fallbackCity = cityKey || "Unknown";
    const fallbackDefs = generateFallbackHotels(fallbackCity);

    const fallbackResults: TBOHotelResult[] = fallbackDefs.map(h => ({
      HotelCode: String(h.code),
      Currency: h.currency,
      Rooms: h.rooms.map((r, ri) => buildRoom(r, h.code, ri, CheckIn, CheckOut, nights)),
    }));

    return {
      Status: { Code: 200, Description: "Fallback" },
      HotelResult: fallbackResults,
      NoOfRooms: fallbackResults.reduce((s, r) => s + r.Rooms.length, 0),
    };
  }

  const results: TBOHotelResult[] = defs.map(h => ({
    HotelCode: String(h.code),
    Currency: h.currency,
    Rooms: h.rooms.map((r, ri) => buildRoom(r, h.code, ri, CheckIn, CheckOut, nights)),
  }));

  return {
    Status: { Code: 200, Description: "Successful" },
    HotelResult: results,
    NoOfRooms: results.reduce((s, r) => s + r.Rooms.length, 0),
  };
}

function guessCityFromHotels(hotelCodes: string): string {
  const code = hotelCodes.split(",")[0];
  for (const [city, hotels] of Object.entries(HOTELS)) {
    if (hotels.some(h => String(h.code) === code.trim())) return city;
  }
  return "Goa";
}

const mockPreBookCache = new Map<string, TBOHotelPreBookResponse>();

export function mockPreBook(bookingCode: string): TBOHotelPreBookResponse {
  const cached = mockPreBookCache.get(bookingCode);
  if (cached) return cached;

  const codeMatch = bookingCode.match(/^(\d+)!/);
  const hotelCode = codeMatch ? parseInt(codeMatch[1], 10) : 1279415;

  let hotel: MockHotelDef | undefined;
  for (const entries of Object.values(HOTELS)) {
    hotel = entries.find(h => h.code === hotelCode);
    if (hotel) break;
  }

  if (!hotel) {
    hotel = HOTELS.Goa[0];
  }

  const room = hotel.rooms[0];
  const resp: TBOHotelPreBookResponse = {
    Status: { Code: 200, Description: "Successful" },
    Amenities: room.amenities,
    RateConditions: ["Non Refundable", "Booking amount non refundable"],
    ValidationInfo: {
      PanMandatory: false,
      PanPassport: false,
      PassportMandatory: hotelCode >= 10000000,
    },
    HotelName: hotel.name,
    HotelCode: String(hotel.code),
    RoomRate: room.basePrice,
    RoomTax: room.tax,
    RoomExtraGuestCharges: 0,
    RoomChildCharges: hotelCode >= 10000000 ? 200 : 0,
    ServiceFee: 0,
    AgentCommission: -Math.round(room.basePrice * 0.5),
    TDS: Math.round(room.basePrice * 0.05),
    NetAmount: room.basePrice + room.tax,
    NetTax: room.tax,
    TaxBreakup: [{ ChargeType: "GST", Amount: Math.round(room.tax * 0.6), Description: "GST" }],
    RoomCombined: [
      {
        Name: [room.name],
        Supplier: "N/A",
        PassengerSlab: 1,
        Currency: hotel.currency,
        DayRates: [[{ BasePrice: room.basePrice, ExtraGuest: 0, Child: 0 }]],
        TotalFare: room.basePrice,
        TotalTax: room.tax,
      },
    ],
    TraceId: TRACE_ID,
  };

  mockPreBookCache.set(bookingCode, resp);
  return resp;
}

let bookingIdCounter = 1000000;

const mockBookings = new Map<number, {
  bookingId: number;
  confirmationNo: string;
  bookingRefNo: string;
  invoiceNumber: string;
  hotelBookingStatus: string;
  hotelName: string;
  hotelCode: string;
  currency: string;
  checkIn: string;
  checkOut: string;
  guestNationality: string;
  netAmount: number;
  rooms: {
    roomId: string;
    roomName: string;
    bookingCode: string;
    passengers: { title: string; firstName: string; lastName: string; paxType: number; lead: boolean; age: number; email: string; phone: string }[];
    totalFare: number;
    totalTax: number;
    mealType: string;
    isRefundable: boolean;
  }[];
  amenities: string[];
}>();

export function mockBook(req: TBOHotelBookRequest): TBOHotelBookResponse {
  bookingIdCounter++;
  const bookingId = bookingIdCounter;
  const confirmationNo = `CF${Math.floor(Math.random() * 10000000000)}`;
  const bookingRefNo = `${Math.floor(Math.random() * 1000000000)}`;
  const invoiceNumber = `INV/25/${Math.floor(Math.random() * 10000)}`;

  const preBook = mockPreBookCache.get(req.BookingCode);
  const hotelName = preBook?.HotelName || "Hotel";
  const hotelCode = preBook?.HotelCode || "1279415";

  const rooms = req.HotelRoomsDetails.map((rd, ri) => ({
    roomId: `${hotelCode}${ri}${uuid().slice(0, 4)}`,
    roomName: preBook?.RoomCombined[ri]?.Name[0] || `Room ${ri + 1}`,
    bookingCode: req.BookingCode,
    passengers: rd.HotelPassenger.map(p => ({
      title: p.Title,
      firstName: p.FirstName,
      lastName: p.LastName,
      paxType: p.PaxType,
      lead: p.LeadPassenger,
      age: p.Age,
      email: p.Email,
      phone: p.Phoneno,
    })),
    totalFare: preBook?.RoomCombined[ri]?.TotalFare || 5000,
    totalTax: preBook?.RoomCombined[ri]?.TotalTax || 1000,
    mealType: preBook?.RoomCombined[ri] ? "Breakfast" : "Room_Only",
    isRefundable: false,
  }));

  mockBookings.set(bookingId, {
    bookingId,
    confirmationNo,
    bookingRefNo,
    invoiceNumber,
    hotelBookingStatus: "Confirmed",
    hotelName,
    hotelCode,
    currency: preBook?.RoomCombined[0]?.Currency || "INR",
    checkIn: "",
    checkOut: "",
    guestNationality: req.GuestNationality,
    netAmount: req.NetAmount,
    rooms,
    amenities: preBook?.Amenities || [],
  });

  return {
    BookResult: {
      VoucherStatus: true,
      ResponseStatus: 1,
      Error: { ErrorCode: 0, ErrorMessage: "" },
      TraceId: TRACE_ID,
      Status: 1,
      HotelBookingStatus: "Confirmed",
      InvoiceNumber: invoiceNumber,
      ConfirmationNo: confirmationNo,
      BookingRefNo: bookingRefNo,
      BookingId: bookingId,
      IsPriceChanged: false,
      IsCancellationPolicyChanged: false,
    },
  };
}

export function mockBookingDetail(bookingId: number): TBOHotelBookingDetailResponse {
  const entry = mockBookings.get(bookingId);

  if (!entry) {
    return {
      Status: { Code: 200, Description: "Booking not found" },
      BookingDetail: null as unknown as TBOHotelBookingDetailResponse["BookingDetail"],
    };
  }

  return {
    Status: { Code: 200, Description: "Successful" },
    BookingDetail: {
      BookingId: entry.bookingId,
      ConfirmationNo: entry.confirmationNo,
      BookingRefNo: entry.bookingRefNo,
      InvoiceNumber: entry.invoiceNumber,
      HotelBookingStatus: entry.hotelBookingStatus,
      HotelName: entry.hotelName,
      HotelCode: entry.hotelCode,
      Currency: entry.currency,
      CheckIn: entry.checkIn || "2025-06-20",
      CheckOut: entry.checkOut || "2025-06-22",
      GuestNationality: entry.guestNationality,
      IsVoucherBooking: true,
      Rooms: entry.rooms.map(r => ({
        RoomId: r.roomId,
        RoomName: r.roomName,
        BookingCode: r.bookingCode,
        HotelPassenger: r.passengers.map(p => ({
          Title: p.title,
          FirstName: p.firstName,
          LastName: p.lastName,
          PaxType: p.paxType,
          LeadPassenger: p.lead,
          Age: p.age,
          Email: p.email,
          Phoneno: p.phone,
        })),
        DayRates: [[{ BasePrice: Math.round(r.totalFare / 2), ExtraGuest: 0, Child: 0 }]],
        TotalFare: r.totalFare,
        TotalTax: r.totalTax,
        MealType: r.mealType,
        IsRefundable: r.isRefundable,
        CancelPolicies: [{
          Index: "1",
          FromDate: new Date().toISOString(),
          ChargeType: "Percentage",
          CancellationCharge: 100,
        }],
        Supplements: [],
      })),
      PriceBreakup: {
        RoomRate: entry.netAmount,
        RoomTax: 0,
        ExtraGuestCharges: 0,
        ChildCharges: 0,
        ServiceFee: 0,
        AgentCommission: -Math.round(entry.netAmount * 0.5),
        TDS: Math.round(entry.netAmount * 0.05),
        NetAmount: entry.netAmount,
        NetTax: 0,
        TaxBreakup: [{ ChargeType: "GST", Amount: Math.round(entry.netAmount * 0.06), Description: "GST" }],
      },
      Amenities: entry.amenities,
    },
  };
}

export function getMockCountries(): { Code: string; Name: string }[] {
  return [
    { Code: "IN", Name: "India" },
    { Code: "AE", Name: "United Arab Emirates" },
    { Code: "TH", Name: "Thailand" },
    { Code: "SG", Name: "Singapore" },
    { Code: "MY", Name: "Malaysia" },
  ];
}

export function getMockCities(countryCode: string): { CityCode: number; CityName: string; CountryCode: string; CountryName: string }[] {
  const cities: Record<string, { CityCode: number; CityName: string; CountryCode: string; CountryName: string }[]> = {
    IN: [
      { CityCode: 49592, CityName: "Goa", CountryCode: "IN", CountryName: "India" },
      { CityCode: 41924, CityName: "Mumbai", CountryCode: "IN", CountryName: "India" },
      { CityCode: 42374, CityName: "Delhi", CountryCode: "IN", CountryName: "India" },
      { CityCode: 42810, CityName: "Jaipur", CountryCode: "IN", CountryName: "India" },
      { CityCode: 41324, CityName: "Bangalore", CountryCode: "IN", CountryName: "India" },
    ],
    AE: [
      { CityCode: 52163, CityName: "Dubai", CountryCode: "AE", CountryName: "United Arab Emirates" },
    ],
    TH: [
      { CityCode: 52173, CityName: "Bangkok", CountryCode: "TH", CountryName: "Thailand" },
    ],
    SG: [
      { CityCode: 52188, CityName: "Singapore", CountryCode: "SG", CountryName: "Singapore" },
    ],
    MY: [
      { CityCode: 52203, CityName: "Kuala Lumpur", CountryCode: "MY", CountryName: "Malaysia" },
    ],
  };
  return cities[countryCode] || [];
}

export function getMockHotelCodes(cityCode: number): { HotelCode: string; HotelName: string; CityName: string; HotelRating: string; imageUrl: string }[] {
  const cityMap: Record<number, string> = {};
  for (const [name, code] of Object.entries(CITY_CODES)) {
    cityMap[code] = name;
  }
  const cityName = cityMap[cityCode];
  if (!cityName) return [];

  const hotels = HOTELS[cityName];
  if (!hotels) return [];

  return hotels.map(h => ({
    HotelCode: String(h.code),
    HotelName: h.name,
    CityName: cityName,
    HotelRating: h.rating === 5 ? "FiveStar" : h.rating === 4 ? "FourStar" : h.rating === 3 ? "ThreeStar" : "TwoStar",
    imageUrl: h.imageUrl,
  }));
}

export function getHotelInfoByCode(hotelCode: string | number): {
  HotelCode: string;
  HotelName: string;
  CityName: string;
  HotelRating: number;
  imageUrl: string;
} | null {
  const code = typeof hotelCode === 'string' ? parseInt(hotelCode) : hotelCode;

  // Check for fallback hotel codes (9999001, 9999002, 9999003)
  if (code >= 9999001 && code <= 9999999) {
    const fallbackHotels = generateFallbackHotels("Unknown");
    const hotel = fallbackHotels.find(h => h.code === code);
    if (hotel) {
      return {
        HotelCode: String(hotel.code),
        HotelName: hotel.name,
        CityName: hotel.location,
        HotelRating: hotel.rating,
        imageUrl: hotel.imageUrl,
      };
    }
  }

  for (const entries of Object.values(HOTELS)) {
    const h = entries.find(e => e.code === code);
    if (h) {
      return {
        HotelCode: String(h.code),
        HotelName: h.name,
        CityName: h.location,
        HotelRating: h.rating,
        imageUrl: h.imageUrl,
      };
    }
  }
  return null;
}

export function resetMock(): void {
  mockPreBookCache.clear();
  mockBookings.clear();
  bookingIdCounter = 1000000;
}
