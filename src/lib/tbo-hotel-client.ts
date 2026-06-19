import type {
  TBOHotelAuthRequest,
  TBOHotelSearchRequest,
  TBOHotelPreBookRequest,
  TBOHotelBookRequest,
  TBOHotelBookingDetailRequest,
  TBOHotelGenerateVoucherRequest,
  TBOHotelSendChangeRequest,
  TBOHotelGetChangeRequestStatusRequest,
  TBOHotelDisplay,
  TBOHotelRoomDisplay,
  TBOHotelSearchOutput,
  TBOHotelPreBookOutput,
  TBOHotelBookOutput,
  TBOHotelBookingDetailOutput,
  TBOHotelGenerateVoucherOutput,
  TBOHotelCancelOutput,
  TBOHotelCancelStatusOutput,
} from "./tbo-hotel-types";
import * as api from "./tbo-hotel-api";
import * as mock from "./tbo-hotel-mock";
import { calculatePrice } from "./pricing";

const hasBasicAuth = !!(process.env.TBO_HOTEL_USERNAME && process.env.TBO_HOTEL_PASSWORD);
const hasTokenAuth = !!(process.env.TBO_USERNAME && process.env.TBO_PASSWORD);
const hasCredentials = (hasBasicAuth || hasTokenAuth) && process.env.TBO_HOTEL_FORCE_MOCK !== "true";

const CLIENT_ID = process.env.TBO_CLIENT_ID || "ApiIntegrationNew";

let cachedToken: { tokenId: string; date: string } | null = null;

function getEndUserIp(): string {
  return "192.168.1.1";
}

async function ensureToken(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  if (cachedToken?.date === today) {
    return cachedToken.tokenId;
  }
  const req: TBOHotelAuthRequest = {
    ClientId: CLIENT_ID,
    UserName: process.env.TBO_USERNAME || "",
    Password: process.env.TBO_PASSWORD || "",
    EndUserIp: getEndUserIp(),
  };
  const res = await api.authenticate(req);
  if (res.Status !== 1) {
    throw new Error(`TBO hotel auth failed: Status=${res.Status} ${res.Error?.ErrorMessage || ""}`);
  }
  cachedToken = { tokenId: res.TokenId, date: today };
  return res.TokenId;
}

async function toDisplay(
  h: { HotelCode: string; Currency: string; Rooms: any[] },
  context?: { destination?: string; hotelName?: string },
): Promise<TBOHotelDisplay> {
  const details = _hotelDetailsCache[h.HotelCode] || {};
  const hotelAmenities = details.amenities || [];

  const rooms: TBOHotelRoomDisplay[] = h.Rooms.map((r: any, ri: number) => {
    const roomName = Array.isArray(r.Name) ? r.Name[0] : (r.Name || "Room");
    const totalFare = r.TotalFare || 0;
    const totalTax = r.TotalTax || 0;
    const dayRates = r.DayRates?.[0] || [];
    const cancelPolicies = r.CancelPolicies || [];

    return {
      roomId: r.RoomID?.[0] || `${h.HotelCode}-${ri}`,
      roomName,
      name: roomName,
      bookingCode: r.BookingCode || "",
      mealType: r.MealType || "Room_Only",
      isRefundable: r.IsRefundable ?? false,
      totalFare,
      totalTax,
      inclusion: r.Inclusion || "",
      dayRates: dayRates.map((dr: any) => ({
        basePrice: dr.BasePrice || 0,
      })),
      cancelPolicy: cancelPolicies[0]
        ? `${cancelPolicies[0].ChargeType}: ${cancelPolicies[0].CancellationCharge}%`
        : "Non Refundable",
      cancellationPolicy: cancelPolicies[0]
        ? `${cancelPolicies[0].ChargeType}: ${cancelPolicies[0].CancellationCharge}%`
        : "Non Refundable",
      roomIndex: ri + 1,
      typeCode: "",
      ratePlanCode: "",
      roomFare: dayRates[0]?.BasePrice || totalFare,
      roomTax: totalTax / Math.max(1, dayRates.length || 1),
      currency: h.Currency,
      amenities: hotelAmenities,
    };
  });

  const minFare = Math.min(...rooms.map(r => r.totalFare));
  const ratingMap: Record<string, number> = {
    "OneStar": 1, "TwoStar": 2, "ThreeStar": 3, "FourStar": 4, "FiveStar": 5,
  };

  const pricing = await calculatePrice(minFare, {
    category: "HOTEL",
    destination: context?.destination,
    hotelName: details.name || context?.hotelName,
  });

  return {
    hotelCode: Number(h.HotelCode) || 0,
    name: details.name || `Hotel ${h.HotelCode}`,
    hotelRating: ratingMap[details.rating] || 3,
    location: details.city || details.address || "",
    currency: h.Currency,
    minTotalFare: pricing.displayedPrice,
    rooms,
    resultIndex: 1,
    picture: details.imageUrl || "",
    rating: "ThreeStar",
    address: details.address || "",
    tripAdvisorRating: 0,
    description: "",
    price: pricing.displayedPrice,
    starRating: ratingMap[details.rating] || 3,
    originalPrice: pricing.originalPrice,
  };
}

let _lastHotelResults: any[] = [];
let _lastTraceId = "";

export function setLastHotelResults(results: any[], traceId: string): void {
  _lastHotelResults = results;
  _lastTraceId = traceId;
}

const CITY_TO_CODE: Record<string, number> = {
  goa: 15648,
  mumbai: 13484,
  delhi: 13482,
  "new delhi": 13482,
  bangalore: 14565,
  bengaluru: 14565,
  chennai: 14564,
  hyderabad: 15664,
  jaipur: 15197,
  kolkata: 13543,
  pune: 14612,
  kodaikanal: 123608,
  ooty: 13014,
  manali: 12597,
  varanasi: 14312,
};

let _hotelCodesCache: Record<string, string> = {};
let _hotelDetailsCache: Record<string, { name: string; rating: string; address: string; city: string; imageUrl?: string; amenities: string[]; facilities: string[] }> = {};

async function fetchHotelImages(hotelCodes: string[], requestId?: string): Promise<void> {
  const uncached = hotelCodes.filter(code => !_hotelDetailsCache[code]?.imageUrl);
  if (uncached.length === 0) return;

  const BATCH_SIZE = 15;
  const batches: string[][] = [];
  for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
    batches.push(uncached.slice(i, i + BATCH_SIZE));
  }

  const batchTotal = batches.length;
  const results = await Promise.allSettled(
    batches.map(async (batch, batchIndex) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await api.getHotelDetails(batch.join(","), { requestId, batchIndex, batchTotal });
        clearTimeout(timeout);
        if (res.HotelDetails && Array.isArray(res.HotelDetails)) {
          for (const detail of res.HotelDetails) {
            const existing = _hotelDetailsCache[detail.HotelCode] || {};
            const images = detail.Images || [];
            _hotelDetailsCache[detail.HotelCode] = {
              ...existing,
              name: detail.HotelName || existing.name || "",
              rating: detail.HotelRating || existing.rating || "",
              address: detail.Address || existing.address || "",
              imageUrl: images[0] || existing.imageUrl,
              amenities: detail.Amenities || existing.amenities || [],
              facilities: detail.HotelFacilities || existing.facilities || [],
            };
          }
        }
      } catch (error) {
        clearTimeout(timeout);
        console.warn("[fetchHotelImages] Batch failed:", error);
      }
    })
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  console.log(`[fetchHotelImages] ${succeeded}/${batches.length} batches succeeded, ${failed} failed`);
}

async function resolveHotelCodes(city?: string, hotelCodes?: string, cityCode?: string, requestId?: string): Promise<string> {
  // 1. If hotel codes provided directly, use them
  if (hotelCodes) return hotelCodes;

  // 2. If city code provided from dropdown, use it directly
  if (cityCode) {
    const cacheKey = `code:${cityCode}`;
    if (_hotelCodesCache[cacheKey]) return _hotelCodesCache[cacheKey];

    try {
      const res = await api.getHotelCodeList(cityCode, { requestId });
      if (res.Status?.Code === 200 && res.Hotels?.length > 0) {
        const codeStr = res.Hotels.slice(0, 50).map(c => c.HotelCode).join(",");
        _hotelCodesCache[cacheKey] = codeStr;
        for (const h of res.Hotels) {
          _hotelDetailsCache[h.HotelCode] = {
            name: h.HotelName,
            rating: h.HotelRating,
            address: h.Address || "",
            city: h.CityName || city || "",
            amenities: [],
            facilities: [],
          };
        }
        console.log(`Resolved ${res.Hotels.length} hotel codes for city code ${cityCode} (showing first 50)`);
        return codeStr;
      }
      console.warn(`No hotel codes returned for city code ${cityCode}:`, res.Status?.Description);
    } catch (e) {
      console.warn(`Failed to fetch hotel codes for city code ${cityCode}:`, e);
    }
    return "";
  }

  // 3. Fallback: try hardcoded mapping by city name
  if (!city) return "";
  const key = city.toLowerCase().trim();
  if (_hotelCodesCache[key]) return _hotelCodesCache[key];

  const mappedCode = CITY_TO_CODE[key];
  if (!mappedCode) {
    console.warn(`No city code mapping for "${city}" and no cityCode provided`);
    return "";
  }

  try {
    const res = await api.getHotelCodeList(String(mappedCode));
    if (res.Status?.Code === 200 && res.Hotels?.length > 0) {
      const codeStr = res.Hotels.slice(0, 50).map(c => c.HotelCode).join(",");
      _hotelCodesCache[key] = codeStr;
      for (const h of res.Hotels) {
        _hotelDetailsCache[h.HotelCode] = {
          name: h.HotelName,
          rating: h.HotelRating,
          address: h.Address || "",
          city: h.CityName || city,
          amenities: [],
          facilities: [],
        };
      }
      console.log(`Resolved ${res.Hotels.length} hotel codes for ${city} (showing first 50)`);
      return codeStr;
    }
    console.warn(`No hotel codes returned for ${city}:`, res.Status?.Description);
  } catch (e) {
    console.warn(`Failed to fetch hotel codes for ${city}:`, e);
  }

  return "";
}

export async function searchHotels(params: {
  checkIn: string;
  checkOut: string;
  hotelCodes?: string;
  city?: string;
  cityCode?: string;
  rooms: { adults: number; children: number; childrenAges: number[] }[];
  guestNationality?: string;
  preferredCurrency?: string;
  forceMock?: boolean;
}): Promise<TBOHotelSearchOutput> {
  const requestId = `search_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (!params.forceMock && hasCredentials) {
    try {
      const resolvedCodes = await resolveHotelCodes(params.city, params.hotelCodes, params.cityCode, requestId);
      if (!resolvedCodes) {
        console.warn("No hotel codes resolved for city:", params.city, "— falling back to mock");
      } else {
        // Fetch images for resolved hotel codes
        await fetchHotelImages(resolvedCodes.split(","), requestId);

        const searchReq: TBOHotelSearchRequest = {
          CheckIn: params.checkIn,
          CheckOut: params.checkOut,
          HotelCodes: resolvedCodes,
          GuestNationality: params.guestNationality || "IN",
          PaxRooms: params.rooms.map(r => ({ Adults: r.adults, Children: r.children, ChildrenAges: r.childrenAges })),
          PreferredCurrency: params.preferredCurrency || "INR",
        };
        const res = await api.searchHotels(searchReq, { requestId });
        if (res.TraceId) _lastTraceId = res.TraceId;
        if (res.Status?.Code === 200 && res.HotelResult?.length > 0) {
          const hotels = await Promise.all(
            res.HotelResult.map(h => toDisplay(h, { destination: params.city }).then(d => ({ ...d, source: "tbo" as const })))
          );
          return { hotels, traceId: _lastTraceId };
        }
        throw new Error(`Hotel search failed: ${res.Status?.Description}`);
      }
    } catch (e) {
      console.warn("TBO hotel API search failed, fallback to mock:", e);
    }
  }

  const mockReq: TBOHotelSearchRequest = {
    CheckIn: params.checkIn,
    CheckOut: params.checkOut,
    HotelCodes: params.hotelCodes || "",
    GuestNationality: params.guestNationality || "IN",
    PaxRooms: params.rooms.map(r => ({ Adults: r.adults, Children: r.children, ChildrenAges: r.childrenAges })),
    PreferredCurrency: params.preferredCurrency || "INR",
    SearchedCities: params.city ? [params.city] : undefined,
  };

  const mockRes = mock.mockSearchHotels(mockReq);

  // Check if mock returned fallback hotels (no real inventory for this city)
  const isFallback = mockRes.Status.Description === "Fallback";

  if (isFallback) {
    // Use fallback hotels with correct city name
    const fallbackCity = params.city || "Unknown";
    const fallbackHotels = mock.generateFallbackHotels(fallbackCity);
    const fallbackNights = Math.max(1, Math.ceil(
      (new Date(params.checkOut).getTime() - new Date(params.checkIn).getTime()) / 86400000
    ));

    const hotels: TBOHotelDisplay[] = await Promise.all(fallbackHotels.map(async (h, idx) => {
      const rooms: TBOHotelRoomDisplay[] = h.rooms.map((r, ri) => ({
        roomId: `${h.code}-${ri}`,
        roomName: r.name,
        name: r.name,
        bookingCode: `${h.code}!TB!${ri + 1}!TB!fallback`,
        mealType: r.mealType,
        isRefundable: r.refundable,
        totalFare: r.basePrice * fallbackNights,
        totalTax: r.tax * fallbackNights,
        inclusion: r.inclusion,
        dayRates: Array.from({ length: fallbackNights }, () => ({ basePrice: r.basePrice })),
        cancelPolicy: "Non Refundable",
        cancellationPolicy: "Non Refundable",
        roomIndex: ri + 1,
        typeCode: "",
        ratePlanCode: "",
        roomFare: r.basePrice,
        roomTax: r.tax,
        currency: h.currency,
        amenities: r.amenities,
      }));

      const minFare = Math.min(...rooms.map(r => r.totalFare));
      const pricing = await calculatePrice(minFare, {
        category: "HOTEL",
        destination: fallbackCity,
        hotelName: h.name,
      });

      return {
        hotelCode: h.code,
        name: h.name,
        hotelRating: h.rating,
        location: h.location,
        currency: h.currency,
        minTotalFare: pricing.displayedPrice,
        rooms,
        resultIndex: idx + 1,
        picture: h.imageUrl,
        rating: h.rating === 5 ? "FiveStar" : h.rating === 4 ? "FourStar" : h.rating === 3 ? "ThreeStar" : "TwoStar",
        address: h.location,
        tripAdvisorRating: 0,
        description: "",
        price: pricing.displayedPrice,
        starRating: h.rating,
        originalPrice: pricing.originalPrice,
        source: "fallback" as const,
      };
    }));

    return { hotels, traceId: "" };
  }

  // Mock data found - use it
  const hotels = await Promise.all(mockRes.HotelResult.map(async (h) => {
    const info = mock.getHotelInfoByCode(h.HotelCode);
    const location = info?.CityName || params.city || "";

    const rooms: TBOHotelRoomDisplay[] = h.Rooms.map((r: any, ri: number) => ({
      roomId: r.RoomID?.[0] || "",
      roomName: r.Name?.[0] || "Room",
      name: r.Name?.[0] || "Room",
      bookingCode: r.BookingCode || "",
      mealType: r.MealType || "Room_Only",
      isRefundable: r.IsRefundable ?? false,
      totalFare: r.TotalFare || 0,
      totalTax: r.TotalTax || 0,
      inclusion: r.Inclusion || "",
      dayRates: (r.DayRates?.[0] || []).map((dr: any) => ({
        basePrice: dr.BasePrice || 0,
      })),
      cancelPolicy: r.CancelPolicies?.[0]
        ? `${r.CancelPolicies[0].ChargeType}: ${r.CancelPolicies[0].CancellationCharge}%`
        : "Non Refundable",
      cancellationPolicy: r.CancelPolicies?.[0]
        ? `${r.CancelPolicies[0].ChargeType}: ${r.CancelPolicies[0].CancellationCharge}%`
        : "Non Refundable",
      roomIndex: ri + 1,
      typeCode: r.RoomTypeCode || "",
      ratePlanCode: r.RatePlanCode || "",
      roomFare: r.DayRates?.[0]?.[0]?.BasePrice || 0,
      roomTax: (r.TotalTax || 0) / Math.max(1, (r.DayRates?.[0]?.length || 1)),
      currency: h.Currency,
      amenities: r.Amenities?.Amenity || [],
    }));

    const minFare = Math.min(...rooms.map(r => r.totalFare));
    const pricing = await calculatePrice(minFare, {
      category: "HOTEL",
      destination: location,
      hotelName: info?.HotelName,
    });

    return {
      hotelCode: Number(h.HotelCode) || 0,
      name: info?.HotelName || `Hotel ${h.HotelCode}`,
      hotelRating: info?.HotelRating || 0,
      location,
      currency: h.Currency,
      minTotalFare: pricing.displayedPrice,
      rooms,
      resultIndex: 1,
      picture: info?.imageUrl || "",
      rating: "ThreeStar",
      address: "",
      tripAdvisorRating: 0,
      description: "",
      price: pricing.displayedPrice,
      starRating: info?.HotelRating || 3,
      originalPrice: pricing.originalPrice,
      source: "mock" as const,
    };
  }));

  return { hotels, traceId: "" };
}

export async function preBook(params: {
  bookingCode: string;
}): Promise<TBOHotelPreBookOutput> {
  if (hasCredentials) {
    try {
      const req: TBOHotelPreBookRequest = {
        BookingCode: params.bookingCode,
        EndUserIp: getEndUserIp(),
        TokenId: await ensureToken(),
        TraceId: _lastTraceId || undefined,
      };
      const res = await api.preBook(req);
      if (res.Status?.Code === 200) {
        if (res.TraceId) _lastTraceId = res.TraceId;
        return {
          hotelName: res.HotelName,
          hotelCode: res.HotelCode,
          netAmount: res.NetAmount,
          roomRate: res.RoomRate,
          roomTax: res.RoomTax,
          serviceFee: res.ServiceFee,
          agentCommission: res.AgentCommission,
          tds: res.TDS,
          validationInfo: res.ValidationInfo,
          amenities: res.Amenities,
          rateConditions: res.RateConditions,
          taxBreakup: res.TaxBreakup.map(t => ({ chargeType: t.ChargeType, amount: t.Amount })),
          traceId: res.TraceId,
        };
      }
      throw new Error(`PreBook failed: ${res.Status?.Description}`);
    } catch (e) {
      console.warn("TBO hotel preBook failed, fallback to mock:", e);
    }
  }

  const mockRes = mock.mockPreBook(params.bookingCode);
  return {
    hotelName: mockRes.HotelName,
    hotelCode: mockRes.HotelCode,
    netAmount: mockRes.NetAmount,
    roomRate: mockRes.RoomRate,
    roomTax: mockRes.RoomTax,
    serviceFee: mockRes.ServiceFee,
    agentCommission: mockRes.AgentCommission,
    tds: mockRes.TDS,
    validationInfo: mockRes.ValidationInfo,
    amenities: mockRes.Amenities,
    rateConditions: mockRes.RateConditions,
    taxBreakup: mockRes.TaxBreakup.map(t => ({ chargeType: t.ChargeType, amount: t.Amount })),
    traceId: _lastTraceId,
  };
}

export async function bookHotel(params: {
  bookingCode: string;
  guestNationality: string;
  netAmount: number;
  hotelRoomsDetails: { passengers: {
    title: string; firstName: string; lastName: string;
    paxType: number; leadPassenger: boolean; age: number;
    email: string; phone: string;
    pan?: string;
    addressLine1?: string;
    city?: string;
    countryCode?: string;
    nationality?: string;
  }[] }[];
  EndUserIp?: string;
}): Promise<TBOHotelBookOutput> {
  if (hasCredentials) {
    try {
      const req: TBOHotelBookRequest = {
        BookingCode: params.bookingCode,
        IsVoucherBooking: true,
        GuestNationality: params.guestNationality,
        NetAmount: params.netAmount,
        EndUserIp: getEndUserIp(),
        HotelRoomsDetails: params.hotelRoomsDetails.map(rd => ({
          HotelPassenger: rd.passengers.map(p => ({
            Title: p.title,
            FirstName: p.firstName,
            LastName: p.lastName,
            PaxType: p.paxType,
            LeadPassenger: p.leadPassenger,
            Age: p.age,
            Email: p.email,
            Phoneno: p.phone,
            PAN: p.pan || undefined,
            AddressLine1: p.addressLine1 || undefined,
            City: p.city || undefined,
            CountryCode: p.countryCode || undefined,
            Nationality: p.nationality || undefined,
          })),
        })),
      };
      const res = await api.bookHotel(req);
      if (res.BookResult?.ResponseStatus === 1) {
        return {
          bookingId: res.BookResult.BookingId,
          confirmationNo: res.BookResult.ConfirmationNo,
          bookingRefNo: res.BookResult.BookingRefNo,
          invoiceNumber: res.BookResult.InvoiceNumber,
          hotelBookingStatus: res.BookResult.HotelBookingStatus,
          isPriceChanged: res.BookResult.IsPriceChanged,
        };
      }
      throw new Error(`Hotel book failed: ${res.BookResult?.Error?.ErrorMessage || ""}`);
    } catch (e) {
      console.warn("TBO hotel book failed, fallback to mock:", e);
    }
  }

  const mockReq: TBOHotelBookRequest = {
    BookingCode: params.bookingCode,
    IsVoucherBooking: true,
    GuestNationality: params.guestNationality,
    NetAmount: params.netAmount,
    HotelRoomsDetails: params.hotelRoomsDetails.map(rd => ({
      HotelPassenger: rd.passengers.map(p => ({
        Title: p.title,
        FirstName: p.firstName,
        LastName: p.lastName,
        PaxType: p.paxType,
        LeadPassenger: p.leadPassenger,
        Age: p.age,
        Email: p.email,
        Phoneno: p.phone,
        PAN: p.pan || undefined,
        AddressLine1: p.addressLine1 || undefined,
        City: p.city || undefined,
        CountryCode: p.countryCode || undefined,
        Nationality: p.nationality || undefined,
      })),
    })),
  };
  const mockRes = mock.mockBook(mockReq);
  return {
    bookingId: mockRes.BookResult.BookingId,
    confirmationNo: mockRes.BookResult.ConfirmationNo,
    bookingRefNo: mockRes.BookResult.BookingRefNo,
    invoiceNumber: mockRes.BookResult.InvoiceNumber,
    hotelBookingStatus: mockRes.BookResult.HotelBookingStatus,
    isPriceChanged: mockRes.BookResult.IsPriceChanged,
  };
}

export async function getBookingDetail(params: {
  bookingId: number;
}): Promise<TBOHotelBookingDetailOutput> {
  if (hasCredentials) {
    try {
      const req: TBOHotelBookingDetailRequest = {
        BookingId: params.bookingId,
        EndUserIp: getEndUserIp(),
        TokenId: await ensureToken(),
        TraceId: _lastTraceId || undefined,
      };
      const res = await api.getBookingDetail(req);
      if (res.Status?.Code === 200 && res.BookingDetail) {
        const bd = res.BookingDetail;
        return {
          bookingId: bd.BookingId,
          confirmationNo: bd.ConfirmationNo,
          invoiceNumber: bd.InvoiceNumber,
          hotelName: bd.HotelName,
          hotelCode: bd.HotelCode,
          checkIn: bd.CheckIn,
          checkOut: bd.CheckOut,
          status: bd.HotelBookingStatus,
          rooms: (bd.Rooms || []).map(r => ({
            roomName: r.RoomName,
            passengers: (r.HotelPassenger || []).map(p => ({
              title: p.Title,
              firstName: p.FirstName,
              lastName: p.LastName,
              paxType: p.PaxType,
            })),
            totalFare: r.TotalFare,
            totalTax: r.TotalTax,
          })),
          priceBreakup: {
            roomRate: bd.PriceBreakup.RoomRate,
            roomTax: bd.PriceBreakup.RoomTax,
            extraGuestCharges: bd.PriceBreakup.ExtraGuestCharges,
            childCharges: bd.PriceBreakup.ChildCharges,
            netAmount: bd.PriceBreakup.NetAmount,
          },
        };
      }
      throw new Error(`Booking detail failed: ${res.Status?.Description || "Not found"}`);
    } catch (e) {
      console.warn("TBO hotel booking detail failed, fallback to mock:", e);
    }
  }

  const mockRes = mock.mockBookingDetail(params.bookingId);
  if (!mockRes.BookingDetail) {
    throw new Error("Booking not found");
  }

  const bd = mockRes.BookingDetail;
  return {
    bookingId: bd.BookingId,
    confirmationNo: bd.ConfirmationNo,
    invoiceNumber: bd.InvoiceNumber,
    hotelName: bd.HotelName,
    hotelCode: bd.HotelCode,
    checkIn: bd.CheckIn,
    checkOut: bd.CheckOut,
    status: bd.HotelBookingStatus,
    rooms: (bd.Rooms || []).map(r => ({
      roomName: r.RoomName,
      passengers: (r.HotelPassenger || []).map(p => ({
        title: p.Title,
        firstName: p.FirstName,
        lastName: p.LastName,
        paxType: p.PaxType,
      })),
      totalFare: r.TotalFare,
      totalTax: r.TotalTax,
    })),
    priceBreakup: {
      roomRate: bd.PriceBreakup.RoomRate,
      roomTax: bd.PriceBreakup.RoomTax,
      extraGuestCharges: bd.PriceBreakup.ExtraGuestCharges,
      childCharges: bd.PriceBreakup.ChildCharges,
      netAmount: bd.PriceBreakup.NetAmount,
    },
  };
}

export function getCountries(): { Code: string; Name: string }[] {
  return mock.getMockCountries();
}

export function getCities(countryCode: string): any[] {
  return mock.getMockCities(countryCode);
}

export function getHotelCodes(cityCode: number): any[] {
  return mock.getMockHotelCodes(cityCode);
}

export async function generateVoucher(params: {
  bookingId: number;
}): Promise<TBOHotelGenerateVoucherOutput> {
  if (hasTokenAuth) {
    try {
      const req: TBOHotelGenerateVoucherRequest = {
        EndUserIp: getEndUserIp(),
        BookingId: params.bookingId,
      };
      const res = await api.generateVoucher(req);
      if (res.GenerateVoucherResult?.ResponseStatus === 1) {
        return {
          voucherStatus: res.GenerateVoucherResult.VoucherStatus,
          status: res.GenerateVoucherResult.Status,
          hotelBookingStatus: res.GenerateVoucherResult.HotelBookingStatus,
          bookingId: res.GenerateVoucherResult.BookingId,
          confirmationNo: res.GenerateVoucherResult.ConfirmationNo,
          invoiceNumber: res.GenerateVoucherResult.InvoiceNumber,
          traceId: res.GenerateVoucherResult.TraceId,
        };
      }
      throw new Error(`Voucher failed: ${res.GenerateVoucherResult?.Error?.ErrorMessage || ""}`);
    } catch (e) {
      console.warn("TBO generateVoucher failed, fallback to mock:", e);
    }
  }

  const mockRes = mock.mockGenerateVoucher(params.bookingId);
  return mockRes;
}

export async function cancelBooking(params: {
  bookingId: number;
  remarks?: string;
}): Promise<TBOHotelCancelOutput> {
  if (hasTokenAuth) {
    try {
      const tokenId = await ensureToken();
      const req: TBOHotelSendChangeRequest = {
        BookingMode: 5,
        RequestType: 4,
        Remarks: params.remarks || "Customer requested cancellation",
        BookingId: params.bookingId,
        EndUserIp: getEndUserIp(),
        TokenId: tokenId,
      };
      const res = await api.sendChangeRequest(req);
      if (res.HotelChangeRequestResult?.ResponseStatus === 1) {
        return {
          changeRequestId: res.HotelChangeRequestResult.ChangeRequestId,
          changeRequestStatus: res.HotelChangeRequestResult.ChangeRequestStatus,
          traceId: res.HotelChangeRequestResult.TraceId,
        };
      }
      throw new Error(`Cancel failed: ${res.HotelChangeRequestResult?.Error?.ErrorMessage || ""}`);
    } catch (e) {
      console.warn("TBO cancel failed, fallback to mock:", e);
    }
  }

  return mock.mockCancel(params.bookingId);
}

export async function getCancelStatus(params: {
  changeRequestId: number;
}): Promise<TBOHotelCancelStatusOutput> {
  if (hasTokenAuth) {
    try {
      const tokenId = await ensureToken();
      const req: TBOHotelGetChangeRequestStatusRequest = {
        BookingMode: 5,
        ChangeRequestId: params.changeRequestId,
        EndUserIp: getEndUserIp(),
        TokenId: tokenId,
      };
      const res = await api.getChangeRequestStatus(req);
      if (res.HotelChangeRequestStatusResult?.ResponseStatus === 1) {
        return {
          changeRequestId: res.HotelChangeRequestStatusResult.ChangeRequestId,
          refundedAmount: res.HotelChangeRequestStatusResult.RefundedAmount,
          cancellationCharge: res.HotelChangeRequestStatusResult.CancellationCharge,
          changeRequestStatus: res.HotelChangeRequestStatusResult.ChangeRequestStatus,
          traceId: res.HotelChangeRequestStatusResult.TraceId,
        };
      }
      throw new Error(`Cancel status failed: ${res.HotelChangeRequestStatusResult?.Error?.ErrorMessage || ""}`);
    } catch (e) {
      console.warn("TBO cancel status failed, fallback to mock:", e);
    }
  }

  return mock.mockCancelStatus(params.changeRequestId);
}

export function resetClient(): void {
  mock.resetMock();
  _lastHotelResults = [];
  _lastTraceId = "";
  cachedToken = null;
}
