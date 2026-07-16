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
  TBOHotelPassenger,
  TBOHotelResult,
  TBOHotelRoom,
  TBOHotelDayRate,
  TBOHotelCity,
} from "./tbo-hotel-types";
import * as api from "./tbo-hotel-api";
import { calculatePrice } from "./pricing";
import { HOTEL_BOOKING_MODE } from "./tbo-hotel-types";
import { readConfig } from "./config-service";

let cachedToken: { tokenId: string; date: string } | null = null;

let _defaultEndUserIp = "192.168.1.1";

function getEndUserIp(): string {
  return _defaultEndUserIp;
}

export function setEndUserIp(ip: string): void {
  _defaultEndUserIp = ip;
}

async function getClientId(): Promise<string> {
  const cfg = await readConfig("tbo_hotel");
  return cfg.clientId || process.env.TBO_CLIENT_ID || "ApiIntegrationNew";
}

async function validateCredentials(): Promise<void> {
  const cfg = await readConfig("tbo_hotel");
  const username = cfg.username || process.env.TBO_USERNAME || "";
  const password = cfg.password || process.env.TBO_PASSWORD || "";
  if (!username || !password) {
    throw new Error("TBO hotel credentials not configured. Set TBO_USERNAME and TBO_PASSWORD.");
  }
}

async function ensureToken(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  if (cachedToken?.date === today) {
    return cachedToken.tokenId;
  }
  const clientId = await getClientId();
  const cfg = await readConfig("tbo_hotel");
  const username = cfg.username || process.env.TBO_USERNAME || "";
  const password = cfg.password || process.env.TBO_PASSWORD || "";

  const req: TBOHotelAuthRequest = {
    ClientId: clientId,
    UserName: username,
    Password: password,
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
  h: TBOHotelResult,
  context?: { destination?: string; hotelName?: string },
): Promise<TBOHotelDisplay> {
  const details = _hotelDetailsCache[h.HotelCode] || {};
  const hotelAmenities = details.amenities || [];

  const rooms: TBOHotelRoomDisplay[] = h.Rooms.map((r: TBOHotelRoom, ri: number) => {
    const roomName = Array.isArray(r.Name) ? r.Name[0] : (r.Name || "Room");
    const totalFare = r.TotalFare || 0;
    const totalTax = r.TotalTax || 0;
    const dayRates: TBOHotelDayRate[] = r.DayRates?.[0] || [];
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
      dayRates: dayRates.map((dr: TBOHotelDayRate) => ({
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

  const rawRating = details.rating;
  const numericRating =
    typeof rawRating === "number" ? rawRating : ratingMap[rawRating] || 3;
  const ratingLabel =
    typeof rawRating === "number"
      ? `${rawRating}Star`
      : rawRating || "ThreeStar";

  const pricing = await calculatePrice(minFare, {
    category: "HOTEL",
    destination: context?.destination,
    hotelCode: h.HotelCode,
    hotelName: details.name || context?.hotelName,
  });

  return {
    hotelCode: Number(h.HotelCode) || 0,
    name: details.name || `Hotel ${h.HotelCode}`,
    hotelRating: numericRating,
    location: details.city || details.address || "",
    currency: h.Currency,
    minTotalFare: pricing.displayedPrice,
    rooms,
    resultIndex: 1,
    picture: details.imageUrl || "",
    rating: ratingLabel,
    address: details.address || "",
    tripAdvisorRating: 0,
    description: "",
    price: pricing.displayedPrice,
    starRating: numericRating,
    originalPrice: pricing.originalPrice,
  };
}

let _hotelCodesCache: Record<string, string> = {};
let _hotelDetailsCache: Record<string, { name: string; rating: string; address: string; city: string; imageUrl?: string; amenities: string[]; facilities: string[] }> = {};
let _cityNameToCodeCache: Record<string, string> = {};

async function lookupTboCityCode(cityName: string, requestId?: string, countryCode = "IN"): Promise<string | null> {
  const cacheKey = `${countryCode}:${cityName.toLowerCase()}`;
  if (_cityNameToCodeCache[cacheKey]) return _cityNameToCodeCache[cacheKey];

  try {
    const res = await api.getCities(countryCode);
    if (res.CityList) {
      let bestMatch: { code: string; name: string } | null = null;
      for (const c of res.CityList) {
        const fullName = c.CityName || c.Name || "";
        const name = fullName.split(",")[0].trim().toLowerCase();
        const code = c.CityCode || c.Code;
        if (!name || !code) continue;

        if (name === cityName.toLowerCase()) {
          _cityNameToCodeCache[cacheKey] = String(code);
          console.log(`Looked up TBO city code for "${cityName}": ${code} (exact match: ${fullName})`);
          return String(code);
        }
        if (fullName.toLowerCase().includes(cityName.toLowerCase())) {
          if (!bestMatch || name.length < bestMatch.name.length) {
            bestMatch = { code: String(code), name: fullName };
          }
        }
      }
      if (bestMatch) {
        _cityNameToCodeCache[cacheKey] = bestMatch.code;
        console.log(`Looked up TBO city code for "${cityName}": ${bestMatch.code} (partial match: ${bestMatch.name})`);
        return bestMatch.code;
      }
    }
  } catch (e) {
    console.warn(`Failed to look up TBO city code for "${cityName}":`, e);
  }
  return null;
}

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
  if (hotelCodes) return hotelCodes;

  let resolvedCode = cityCode;

  if (!resolvedCode && city) {
    resolvedCode = await lookupTboCityCode(city, requestId) || undefined;
  }

  if (!resolvedCode) {
    throw new Error(`No cityCode provided or resolved for "${city}". Cannot search hotels.`);
  }

  const cacheKey = `code:${resolvedCode}`;
  if (_hotelCodesCache[cacheKey]) return _hotelCodesCache[cacheKey];

  const res = await api.getHotelCodeList(resolvedCode, { requestId });
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
    console.log(`Resolved ${res.Hotels.length} hotel codes for city code ${resolvedCode} (showing first 50)`);
    return codeStr;
  }

  if (cityCode && city) {
    const lookedUp = await lookupTboCityCode(city, requestId);
    if (lookedUp && lookedUp !== cityCode) {
      console.log(`Retrying with looked-up city code ${lookedUp} for "${city}"`);
      const retryRes = await api.getHotelCodeList(lookedUp, { requestId });
      if (retryRes.Status?.Code === 200 && retryRes.Hotels?.length > 0) {
        const codeStr = retryRes.Hotels.slice(0, 50).map(c => c.HotelCode).join(",");
        _hotelCodesCache[`code:${lookedUp}`] = codeStr;
        for (const h of retryRes.Hotels) {
          _hotelDetailsCache[h.HotelCode] = {
            name: h.HotelName,
            rating: h.HotelRating,
            address: h.Address || "",
            city: h.CityName || city || "",
            amenities: [],
            facilities: [],
          };
        }
        console.log(`Resolved ${retryRes.Hotels.length} hotel codes with looked-up code ${lookedUp}`);
        return codeStr;
      }
    }
  }

  throw new Error(`No hotels found for city "${city}" (code: ${resolvedCode}).`);
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
}): Promise<TBOHotelSearchOutput> {
  await validateCredentials();
  const requestId = `search_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const resolvedCodes = await resolveHotelCodes(params.city, params.hotelCodes, params.cityCode, requestId);
  await fetchHotelImages(resolvedCodes.split(","), requestId);

  const tokenId = await ensureToken();
  const searchReq: TBOHotelSearchRequest = {
    CheckIn: params.checkIn,
    CheckOut: params.checkOut,
    HotelCodes: resolvedCodes,
    GuestNationality: params.guestNationality || "IN",
    PaxRooms: params.rooms.map(r => ({ Adults: r.adults, Children: r.children, ChildrenAges: r.childrenAges })),
    PreferredCurrency: params.preferredCurrency || "INR",
    ResponseTime: 29,
    IsDetailedResponse: true,
    Filters: { Refundable: false, NoOfRooms: 0, MealType: null, StarRating: null },
    EndUserIp: getEndUserIp(),
    TokenId: tokenId,
  };
  const res = await api.searchHotels(searchReq, { requestId });
  const traceId = res.TraceId || "";
  if (res.Status?.Code !== 200 || !res.HotelResult?.length) {
    throw new Error(`Hotel search failed: ${res.Status?.Description || "No hotels found"}`);
  }
  const hotels = await Promise.all(
    res.HotelResult.map(h => toDisplay(h, { destination: params.city }))
  );
  return { hotels, traceId };
}

export async function preBook(params: {
  bookingCode: string;
  paymentMode?: string;
}): Promise<TBOHotelPreBookOutput> {
  await validateCredentials();
  const req: TBOHotelPreBookRequest = {
    BookingCode: params.bookingCode,
    PaymentMode: params.paymentMode || "Default",
  };
  const res = await api.preBook(req);
  if (res.Status?.Code !== 200) {
    throw new Error(`PreBook failed: ${res.Status?.Description}`);
  }
  const hotel = res.HotelResult?.[0];
  const room = hotel?.Rooms?.[0];
  const priceBreakup = room?.PriceBreakUp?.[0];
  return {
    hotelName: hotel?.HotelCode || '',
    hotelCode: hotel?.HotelCode || '',
    netAmount: room?.NetAmount || 0,
    roomRate: priceBreakup?.RoomRate || 0,
    roomTax: priceBreakup?.RoomTax || 0,
    serviceFee: 0,
    agentCommission: priceBreakup?.AgentCommission || 0,
    tds: 0,
    validationInfo: res.ValidationInfo,
    amenities: room?.Amenities || [],
    rateConditions: hotel?.RateConditions || [],
    taxBreakup: (priceBreakup?.TaxBreakup || []).map(t => ({ chargeType: t.TaxType, taxableAmount: t.TaxableAmount, taxPercentage: t.TaxPercentage, amount: t.TaxAmount })),
    traceId: '',
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
  await validateCredentials();
  const clientRef = `gorasa_${Date.now()}`;
  const req: TBOHotelBookRequest = {
    BookingCode: params.bookingCode,
    IsVoucherBooking: false,
    GuestNationality: params.guestNationality,
    RequestedBookingMode: HOTEL_BOOKING_MODE,
    NetAmount: params.netAmount,
    ClientReferenceId: clientRef,
    EndUserIp: getEndUserIp(),
    TokenId: await ensureToken(),
    HotelRoomsDetails: params.hotelRoomsDetails.map(rd => ({
      HotelPassenger: rd.passengers.map(p => {
        const passenger: TBOHotelPassenger = {
          Title: p.title,
          FirstName: p.firstName,
          LastName: p.lastName,
          PaxType: p.paxType,
          LeadPassenger: p.leadPassenger,
          Age: p.age,
        };
        if (p.email && p.email.trim()) passenger.Email = p.email;
        if (p.phone && p.phone.trim()) passenger.Phoneno = p.phone;
        if (p.pan && p.pan.trim()) passenger.PAN = p.pan;
        if (p.addressLine1 && p.addressLine1.trim()) passenger.AddressLine1 = p.addressLine1;
        if (p.city && p.city.trim()) passenger.City = p.city;
        if (p.countryCode && p.countryCode.trim()) passenger.CountryCode = p.countryCode;
        if (p.nationality && p.nationality.trim()) passenger.Nationality = p.nationality;
        return passenger as TBOHotelPassenger;
      }),
    })),
  };
  const res = await api.bookHotel(req);
  if (res.BookResult?.ResponseStatus !== 1) {
    throw new Error(`Hotel book failed: ${res.BookResult?.Error?.ErrorMessage || "Unknown error"}`);
  }
  return {
    bookingId: res.BookResult.BookingId,
    confirmationNo: res.BookResult.ConfirmationNo,
    bookingRefNo: res.BookResult.BookingRefNo,
    invoiceNumber: res.BookResult.InvoiceNumber,
    hotelBookingStatus: res.BookResult.HotelBookingStatus,
    isPriceChanged: res.BookResult.IsPriceChanged,
  };
}

export async function getBookingDetail(params: {
  bookingId: number;
  traceId?: string;
}): Promise<TBOHotelBookingDetailOutput> {
  await validateCredentials();
  const req: TBOHotelBookingDetailRequest = {
    BookingId: params.bookingId,
    EndUserIp: getEndUserIp(),
    TokenId: await ensureToken(),
    TraceId: params.traceId || undefined,
  };
  const res = await api.getBookingDetail(req);
  const result = res.GetBookingDetailResult;
  if (result.ResponseStatus !== 1) {
    throw new Error(`Booking detail failed: ${result.Error?.ErrorMessage || "Unknown error"}`);
  }
  return {
    bookingId: result.BookingId,
    confirmationNo: result.ConfirmationNo,
    invoiceNumber: result.InvoiceNo,
    hotelName: result.HotelName,
    hotelCode: result.HotelCode,
    checkIn: result.CheckInDate,
    checkOut: result.CheckOutDate,
    status: result.HotelBookingStatus,
    rooms: (result.Rooms || []).map(r => ({
      roomName: r.RoomTypeName,
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
      roomRate: result.Rooms?.[0]?.PriceBreakUp?.RoomRate || 0,
      roomTax: result.Rooms?.[0]?.PriceBreakUp?.RoomTax || 0,
      extraGuestCharges: result.Rooms?.[0]?.PriceBreakUp?.RoomExtraGuestCharges || 0,
      childCharges: result.Rooms?.[0]?.PriceBreakUp?.RoomChildCharges || 0,
      netAmount: result.NetAmount,
    },
  };
}

export async function getCountries(): Promise<{ Code: string; Name: string }[]> {
  const res = await api.getCountries();
  return res.CountryList || [];
}

export async function getCities(countryCode: string): Promise<any[]> {
  const res = await api.getCities(countryCode);
  return res.CityList || [];
}

export async function getHotelCodes(cityCode: string): Promise<any[]> {
  const res = await api.getHotelCodeList(cityCode);
  return res.Hotels || [];
}

export async function generateVoucher(params: {
  bookingId: number;
}): Promise<TBOHotelGenerateVoucherOutput> {
  await validateCredentials();
  const req: TBOHotelGenerateVoucherRequest = {
    EndUserIp: getEndUserIp(),
    BookingId: params.bookingId,
  };
  const res = await api.generateVoucher(req);
  if (res.GenerateVoucherResult?.ResponseStatus !== 1) {
    throw new Error(`Voucher failed: ${res.GenerateVoucherResult?.Error?.ErrorMessage || "Unknown error"}`);
  }
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

export async function cancelBooking(params: {
  bookingId: number;
  remarks?: string;
}): Promise<TBOHotelCancelOutput> {
  await validateCredentials();
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
  if (res.HotelChangeRequestResult?.ResponseStatus !== 1) {
    throw new Error(`Cancel failed: ${res.HotelChangeRequestResult?.Error?.ErrorMessage || "Unknown error"}`);
  }
  return {
    changeRequestId: res.HotelChangeRequestResult.ChangeRequestId,
    changeRequestStatus: res.HotelChangeRequestResult.ChangeRequestStatus,
    traceId: res.HotelChangeRequestResult.TraceId,
  };
}

export async function getCancelStatus(params: {
  changeRequestId: number;
}): Promise<TBOHotelCancelStatusOutput> {
  await validateCredentials();
  const tokenId = await ensureToken();
  const req: TBOHotelGetChangeRequestStatusRequest = {
    BookingMode: 5,
    ChangeRequestId: params.changeRequestId,
    EndUserIp: getEndUserIp(),
    TokenId: tokenId,
  };
  const res = await api.getChangeRequestStatus(req);
  if (res.HotelChangeRequestStatusResult?.ResponseStatus !== 1) {
    throw new Error(`Cancel status failed: ${res.HotelChangeRequestStatusResult?.Error?.ErrorMessage || "Unknown error"}`);
  }
  return {
    changeRequestId: res.HotelChangeRequestStatusResult.ChangeRequestId,
    refundedAmount: res.HotelChangeRequestStatusResult.RefundedAmount,
    cancellationCharge: res.HotelChangeRequestStatusResult.CancellationCharge,
    changeRequestStatus: res.HotelChangeRequestStatusResult.ChangeRequestStatus,
    traceId: res.HotelChangeRequestStatusResult.TraceId,
  };
}
