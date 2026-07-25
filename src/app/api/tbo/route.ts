import { NextRequest, NextResponse } from "next/server";
import {
  searchFlights,
  getFareRule,
  getFareQuote,
  bookFlight,
  ticketFlight,
  getBookingDetail,
  getSSR,
  setEndUserIp,
  getCancellationCharges,
  cancelFlight,
  getCancelStatus,
} from "@/lib/tbo-flight-client";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    const endUserIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "192.168.1.1";
    setEndUserIp(endUserIp);

    switch (action) {
      case "search": {
        const p = body.params || {};
        const tripType = p.tripType || p.TripType || "OneWay";
        const journeyType = tripType === "Return" ? 2 : tripType === "Circle" ? 3 : 1;

        const result = await searchFlights({
          Origin: p.origin || "",
          Destination: p.destination || "",
          AdultCount: p.adults || 1,
          ChildCount: p.children || 0,
          InfantCount: p.infants || 0,
          JourneyType: journeyType,
          PreferredDepartureTime: p.departureDate || "",
          PreferredArrivalTime: p.returnDate || "",
          CabinClass: p.cabinClass || "Economy",
          multiCityLegs: journeyType === 3 ? p.multiCityLegs : undefined,
        });
        return NextResponse.json(result);
      }

      case "fare-rule": {
        const p = body.params || body;
        if (!p.traceId || !p.resultIndex) {
          return NextResponse.json({ error: "traceId and resultIndex required" }, { status: 400 });
        }
        const result = await getFareRule({ traceId: p.traceId, resultIndex: p.resultIndex });
        return NextResponse.json(result);
      }

      case "fare-quote": {
        const p = body.params || body;
        if (!p.traceId || !p.resultIndex) {
          return NextResponse.json({ error: "traceId and resultIndex required" }, { status: 400 });
        }
        try {
          const result = await getFareQuote({ traceId: p.traceId, resultIndex: p.resultIndex });
          return NextResponse.json(result);
        } catch (e: any) {
          return NextResponse.json({
            error: e.message || "FareQuote failed",
            freshTraceId: e.freshTraceId || null,
            errorCode: e.errorCode || null,
          });
        }
      }

      case "book": {
        const p = body.params || body;
        if (!p.traceId || !p.resultIndex || !p.passengers) {
          return NextResponse.json({ error: "traceId, resultIndex, passengers required" }, { status: 400 });
        }
        try {
          const result = await bookFlight({
            traceId: p.traceId,
            resultIndex: p.resultIndex,
            passengers: p.passengers,
          });
          return NextResponse.json(result);
        } catch (e: any) {
          return NextResponse.json({
            error: e.message || "Book failed",
            freshTraceId: e.freshTraceId || null,
            errorCode: e.errorCode || null,
          });
        }
      }

      case "ticket": {
        const p = body.params || body;
        if (!p.traceId || !p.passengers) {
          return NextResponse.json({ error: "traceId, passengers required" }, { status: 400 });
        }
        try {
          const result = await ticketFlight({
            traceId: p.traceId,
            resultIndex: p.resultIndex,
            PNR: p.pnr,
            BookingId: p.bookingId,
            passengers: p.passengers,
            segments: p.segments || [],
            fare: p.fare || {},
            fareBreakdown: p.fareBreakdown || [],
            isLCC: p.isLCC || false,
            ssrBaggage: p.ssrBaggage,
            ssrMeals: p.ssrMeals,
            ssrSeats: p.ssrSeats,
          });
          return NextResponse.json(result);
        } catch (e: any) {
          return NextResponse.json({
            error: e.message || "Ticket failed",
            freshTraceId: e.freshTraceId || null,
            errorCode: e.errorCode || null,
          });
        }
      }

      case "ssr": {
        const p = body.params || body;
        if (!p.traceId || !p.resultIndex) {
          return NextResponse.json({ error: "traceId and resultIndex required" }, { status: 400 });
        }
        try {
          const result = await getSSR({ traceId: p.traceId, resultIndex: p.resultIndex });
          return NextResponse.json(result);
        } catch (e: any) {
          return NextResponse.json({
            error: e.message || "SSR failed",
            freshTraceId: e.freshTraceId || null,
            errorCode: e.errorCode || null,
          });
        }
      }

      case "booking-detail": {
        const p = body.params || body;
        if (!p.bookingIds) {
          return NextResponse.json({ error: "bookingIds required" }, { status: 400 });
        }
        const result = await getBookingDetail({ bookingIds: p.bookingIds });
        return NextResponse.json(result);
      }

      case "cancellation-charges": {
        const p = body.params || body;
        if (!p.bookingId) {
          return NextResponse.json({ error: "bookingId required" }, { status: 400 });
        }
        const result = await getCancellationCharges({ bookingId: p.bookingId });
        return NextResponse.json(result);
      }

      case "cancel": {
        const p = body.params || body;
        if (!p.bookingId) {
          return NextResponse.json({ error: "bookingId required" }, { status: 400 });
        }
        console.log("[TBO-API] Cancel request for bookingId:", p.bookingId);
        try {
          const result = await cancelFlight({
            bookingId: p.bookingId,
            remarks: p.remarks || "Customer requested cancellation",
          });
          console.log("[TBO-API] Cancel result:", JSON.stringify(result));
          return NextResponse.json(result);
        } catch (e) {
          console.error("[TBO-API] Cancel error:", e);
          return NextResponse.json(
            { error: e instanceof Error ? e.message : "Cancel failed" },
            { status: 500 }
          );
        }
      }

      case "cancel-status": {
        const p = body.params || body;
        if (!p.changeRequestId) {
          return NextResponse.json({ error: "changeRequestId required" }, { status: 400 });
        }
        const result = await getCancelStatus({ changeRequestId: p.changeRequestId });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    console.error("TBO API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 },
    );
  }
}
