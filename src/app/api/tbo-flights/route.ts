import { NextRequest, NextResponse } from "next/server";
import {
  searchFlights,
  getFareRule,
  getFareQuote,
  getSSR,
  bookFlight,
  ticketFlight,
  getBookingDetail,
  setLastResults,
} from "@/lib/tbo-flight-client";

function getEndUserIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "192.168.1.1";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const endUserIp = getEndUserIp(req);

    switch (action) {
      case "search": {
        const { origin, destination, date, adults, children, infants, journeyType } = body;

        const result = await searchFlights({
          Origin: origin,
          Destination: destination,
          AdultCount: adults || 1,
          ChildCount: children || 0,
          InfantCount: infants || 0,
          JourneyType: journeyType || 1,
          PreferredDepartureTime: date,
          EndUserIp: endUserIp,
          forceMock: !!body.demo,
        });
        setLastResults(result.flights.map(f => ({
          ResultIndex: f.resultIndex,
          Source: f.source,
          IsLCC: f.isLCC,
          IsRefundable: f.isRefundable,
          Fare: {
            Currency: f.currency,
            BaseFare: f.baseFare,
            Tax: f.tax,
            YQTax: 0,
            AdditionalTxnFeeOfrd: 0,
            AdditionalTxnFeePub: 0,
            OtherCharges: 0,
            Discount: 0,
            PublishedFare: f.publishedFare,
            CommissionEarned: f.commissionEarned,
            PLBEarned: 0,
            IncentiveEarned: 0,
            OfferedFare: f.offeredFare,
            TdsOnCommission: 0,
            TdsOnPLB: 0,
            TdsOnIncentive: 0,
            ServiceFee: 0,
            ChargeBU: [],
          },
          FareBreakdown: f.fareBreakdown,
          Segments: f.segments,
          LastTicketDate: "",
          Penalty: "",
          FareRules: "",
        })));
        return NextResponse.json(result);
      }

      case "fare-rule": {
        const { traceId, resultIndex } = body;
        const result = await getFareRule({ traceId, resultIndex, EndUserIp: endUserIp });
        return NextResponse.json(result);
      }

      case "fare-quote": {
        const { traceId, resultIndex } = body;
        const result = await getFareQuote({ traceId, resultIndex, EndUserIp: endUserIp });
        return NextResponse.json(result);
      }

      case "ssr": {
        const { traceId, resultIndex } = body;
        const result = await getSSR({ traceId, resultIndex, EndUserIp: endUserIp });
        return NextResponse.json(result);
      }

      case "get-ssr": {
        const { traceId: tId, resultIndex: rIdx } = body;
        const result = await getSSR({ traceId: tId, resultIndex: rIdx, EndUserIp: endUserIp });
        return NextResponse.json(result);
      }

      case "book": {
        const { traceId, resultIndex, passengers } = body;
        const result = await bookFlight({ traceId, resultIndex, passengers, EndUserIp: endUserIp });
        return NextResponse.json(result);
      }

      case "ticket": {
        const {
          traceId, resultIndex, pnr, bookingId,
          passengers, segments, fare, fareBreakdown, isLCC,
        } = body;
        const result = await ticketFlight({
          traceId,
          resultIndex,
          PNR: pnr,
          BookingId: bookingId,
          passengers,
          segments,
          fare,
          fareBreakdown,
          isLCC,
          EndUserIp: endUserIp,
        });

        return NextResponse.json(result);
      }

      case "booking-detail": {
        const { bookingIds } = body;
        if (!Array.isArray(bookingIds)) {
          return NextResponse.json({ error: "bookingIds must be an array" }, { status: 400 });
        }
        const result = await getBookingDetail({ bookingIds, EndUserIp: endUserIp });
        return NextResponse.json({ bookings: result });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (e) {
    console.error("TBO flight API route error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 },
    );
  }
}
