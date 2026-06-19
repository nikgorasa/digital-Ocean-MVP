import { NextRequest, NextResponse } from "next/server";
import {
  searchHotels,
  preBook,
  bookHotel,
  getBookingDetail,
  generateVoucher,
  cancelBooking,
  getCancelStatus,
  setLastHotelResults,
  getCountries,
  getCities,
  getHotelCodes,
} from "@/lib/tbo-hotel-client";

export const maxDuration = 30;

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // MM/DD/YYYY or M/D/YYYY
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, month, day, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return dateStr;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "search": {
        const p = body.params || body;
        const cityName = p.CityName || p.cityName || p.city;
        const cityCode = p.CityCode || p.cityCode;
        const hotelCodes = p.HotelCodes || p.hotelCodes;
        const checkIn = formatDate(p.CheckInDate || p.CheckIn || p.checkIn);
        const checkOut = formatDate(p.CheckOutDate || p.CheckOut || p.checkOut);
        const roomsRaw = p.RoomGuests || p.rooms || [{ Adults: 1, Children: 0, ChildAge: [] }];
        const roomsArray = roomsRaw.map((r: any) => ({
          adults: r.Adults || r.adults || 1,
          children: r.Children || r.children || 0,
          childrenAges: r.ChildAge || r.childrenAges || [],
        }));

        const result = await searchHotels({
          checkIn,
          checkOut,
          hotelCodes,
          city: cityName,
          cityCode,
          rooms: roomsArray,
          guestNationality: p.GuestNationality || p.guestNationality || "IN",
          preferredCurrency: p.PreferredCurrency || p.preferredCurrency || "INR",
          forceMock: !!body.demo,
        });
        return NextResponse.json(result);
      }

      case "pre-book":
      case "block": {
        const { bookingCode } = body;
        if (!bookingCode) {
          return NextResponse.json({ error: "bookingCode required" }, { status: 400 });
        }
        const result = await preBook({ bookingCode });
        return NextResponse.json({
          success: true,
          bookingCode,
          isPriceChanged: false,
          ...result,
        });
      }

      case "book": {
        const {
          bookingCode, guestNationality, netAmount, hotelRoomsDetails,
        } = body;
        if (!bookingCode || !hotelRoomsDetails) {
          return NextResponse.json(
            { error: "bookingCode and hotelRoomsDetails required" },
            { status: 400 },
          );
        }
        const result = await bookHotel({
          bookingCode,
          guestNationality: guestNationality || "IN",
          netAmount: netAmount || 0,
          hotelRoomsDetails,
        });
        return NextResponse.json({ success: true, ...result });
      }

      case "booking-detail": {
        const { bookingId } = body;
        if (!bookingId) {
          return NextResponse.json({ error: "bookingId required" }, { status: 400 });
        }
        const result = await getBookingDetail({ bookingId: Number(bookingId) });
        return NextResponse.json(result);
      }

      case "static-data/countries": {
        const result = getCountries();
        return NextResponse.json({ countries: result });
      }

      case "static-data/cities": {
        const { countryCode } = body;
        if (!countryCode) {
          return NextResponse.json({ error: "countryCode required" }, { status: 400 });
        }
        const result = getCities(countryCode);
        return NextResponse.json({ cities: result });
      }

      case "static-data/hotel-codes": {
        const { cityCode } = body;
        if (!cityCode) {
          return NextResponse.json({ error: "cityCode required" }, { status: 400 });
        }
        const result = getHotelCodes(Number(cityCode));
        return NextResponse.json({ hotels: result });
      }

      case "generate-voucher": {
        const { bookingId } = body;
        if (!bookingId) {
          return NextResponse.json({ error: "bookingId required" }, { status: 400 });
        }
        const result = await generateVoucher({ bookingId: Number(bookingId) });
        return NextResponse.json(result);
      }

      case "cancel": {
        const { bookingId, remarks } = body;
        if (!bookingId) {
          return NextResponse.json({ error: "bookingId required" }, { status: 400 });
        }
        const result = await cancelBooking({ bookingId: Number(bookingId), remarks });
        return NextResponse.json(result);
      }

      case "cancel-status": {
        const { changeRequestId } = body;
        if (!changeRequestId) {
          return NextResponse.json({ error: "changeRequestId required" }, { status: 400 });
        }
        const result = await getCancelStatus({ changeRequestId: Number(changeRequestId) });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (e) {
    console.error("TBO hotel API route error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 },
    );
  }
}
