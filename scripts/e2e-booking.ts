import { prisma } from '../src/lib/db';
import { searchHotels, preBook, bookHotel, generateVoucher } from '../src/lib/tbo-hotel-client';
import { searchFlights, getFareQuote, bookFlight, ticketFlight } from '../src/lib/tbo-flight-client';
import { create } from '../src/lib/db/bookings';

function addDays(d: Date, n: number): string {
  return new Date(d.getTime() + n * 86400000).toISOString().slice(0, 10);
}

async function findTestUser(): Promise<{ id: string; email: string; name: string | null }> {
  const user = await prisma.user.findFirst({
    where: { email: { in: ['test-booking-flow@gorasa.in', 'hmittal@gorasa.in'] } },
    orderBy: { createdAt: 'desc' },
  });
  if (user) return user;
  const fallback = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (fallback) return fallback;
  throw new Error('No test user found in DB. Create one first.');
}

async function doHotelBooking(userId: string, userEmail: string): Promise<void> {
  console.log('\n========== HOTEL BOOKING ==========\n');

  const checkIn = addDays(new Date(), 15);
  const checkOut = addDays(new Date(), 17);

  const searchResult = await searchHotels({
    checkIn,
    checkOut,
    city: 'Goa',
    rooms: [{ adults: 1, children: 0, childrenAges: [] }],
    guestNationality: 'IN',
    preferredCurrency: 'INR',
  });

  if (!searchResult.hotels.length) {
    console.log('No hotels found — skipping hotel booking');
    return;
  }

  const hotel = searchResult.hotels[0];
  console.log(`Hotel: ${hotel.name} (${hotel.hotelCode})`);
  console.log(`Rating: ${hotel.starRating}, Price: ${hotel.price} ${hotel.currency}`);

  const room = hotel.rooms?.[0];
  if (!room) {
    console.log('No rooms found — skipping hotel booking');
    return;
  }

  const bookingCode = room.bookingCode;
  console.log(`\nRoom: ${room.roomName}, BookingCode: ${bookingCode}`);

  const preBookResult = await preBook({ bookingCode });
  console.log(`PreBook: NetAmount=${preBookResult.netAmount}, RoomRate=${preBookResult.roomRate}`);

  const bookResult = await bookHotel({
    bookingCode,
    guestNationality: 'IN',
    netAmount: preBookResult.netAmount,
    hotelRoomsDetails: [{
      passengers: [{
        title: 'Mr',
        firstName: 'Harsh',
        lastName: 'Mittal',
        paxType: 1,
        leadPassenger: true,
        age: 30,
        email: userEmail,
        phone: '9876543210',
        pan: 'AMMPM1234M',
        addressLine1: 'Test Address',
        city: 'Goa',
        countryCode: 'IN',
        nationality: 'IN',
      }],
    }],
  });

  console.log(`\nBook Result: BookingId=${bookResult.bookingId}, ConfirmationNo=${bookResult.confirmationNo}`);
  console.log(`HotelBookingStatus=${bookResult.hotelBookingStatus}, IsPriceChanged=${bookResult.isPriceChanged}`);

  if (!bookResult.bookingId) {
    console.log('No booking ID returned — skipping voucher generation');
    return;
  }

  const voucherResult = await generateVoucher({ bookingId: bookResult.bookingId });
  console.log(`\nVoucher: Status=${voucherResult.voucherStatus}, BookingStatus=${voucherResult.hotelBookingStatus}`);

  await create({
    userId,
    type: 'HOTEL',
    itemName: hotel.name,
    providerOrAirline: 'TBO',
    price: preBookResult.netAmount,
    status: voucherResult.hotelBookingStatus === 'Confirmed' ? 'CONFIRMED' : 'PENDING',
    pnr: bookResult.confirmationNo || null,
    seatOrRoom: room.roomName,
    leadGuestPan: null,
    paxCount: 1,
    travelDates: `${checkIn} to ${checkOut}`,
    paymentStatus: 'PAID',
    supplierBookingRef: `${bookResult.bookingId}`,
    metadata: {
      hotelCode: hotel.hotelCode,
      confirmationNo: bookResult.confirmationNo,
      roomBookingCode: bookingCode,
      invoiceNumber: bookResult.invoiceNumber,
    },
  } as any);

  console.log(`Hotel booking saved to DB ✓`);
}

async function doFlightBooking(userId: string, userEmail: string): Promise<void> {
  console.log('\n========== FLIGHT BOOKING ==========\n');

  const flightDate = addDays(new Date(), 5);

  const searchResult = await searchFlights({
    Origin: 'DEL',
    Destination: 'BOM',
    AdultCount: 1,
    ChildCount: 0,
    InfantCount: 0,
    JourneyType: 1,
    PreferredDepartureTime: flightDate,
  });

  if (!searchResult.flights.length) {
    console.log('No flights found — skipping flight booking');
    return;
  }

  // Prefer direct flights (1 segment) over connecting flights
  const directFlight = searchResult.flights.find(f => f.segments[0]?.length === 1);
  const flight = directFlight || searchResult.flights[0];
  const isDirect = flight.segments[0]?.length === 1;
  if (!isDirect) {
    console.log('Warning: No direct flight found, using connecting flight (ticket may fail)');
  }
  console.log(`Flight: ${flight.airline} ${flight.flightNumber}`);
  console.log(`Route: ${flight.origin} → ${flight.destination}`);
  console.log(`Time: ${flight.departureTime} → ${flight.arrivalTime}`);
  console.log(`Fare: ${flight.offeredFare} ${flight.currency}`);
  console.log(`IsLCC: ${flight.isLCC}`);

  const fareQuote = await getFareQuote({
    traceId: searchResult.traceId || '',
    resultIndex: flight.resultIndex,
  });

  console.log(`\nFareQuote: PriceChanged=${fareQuote.isPriceChanged}, BaseFare=${fareQuote.fare?.BaseFare}`);

  let bookingId: string | null = null;
  let pnr: string | null = null;

  if (flight.isLCC) {
    console.log('LCC flight — skipping Book, going directly to Ticket');
    const ticketResult = await ticketFlight({
      traceId: searchResult.traceId || '',
      resultIndex: flight.resultIndex,
      passengers: [{
        PaxId: 1,
        Title: 'Mr',
        FirstName: 'Harsh',
        LastName: 'Mittal',
        DateOfBirth: '1994-06-15',
        Gender: 1,
        AddressLine1: 'Test Address',
        City: 'New Delhi',
        CountryCode: 'IN',
        CountryName: 'India',
        ContactNo: '9876543210',
        Email: userEmail,
        IsLeadPax: true,
        Nationality: 'IN',
        PaxType: 1,
        Fare: {
          BaseFare: flight.baseFare,
          Tax: flight.tax,
          TransactionFee: 0,
          YQTax: flight.yqTax ?? 0,
          AdditionalTxnFeeOfrd: 0,
          AdditionalTxnFeePub: 0,
          AirTransFee: 0,
        },
      }],
      segments: [],
      fare: fareQuote.fare,
      fareBreakdown: fareQuote.fareBreakdown,
      isLCC: flight.isLCC,
    });
    bookingId = ticketResult.results?.[0]?.bookingId || null;
    pnr = ticketResult.results?.[0]?.pnr || null;
    console.log(`\nTicket Result: BookingId=${bookingId}, PNR=${pnr}`);
  } else {
    const bookResult = await bookFlight({
      traceId: searchResult.traceId || '',
      resultIndex: flight.resultIndex,
      passengers: [{
        Title: 'Mr',
        FirstName: 'Harsh',
        LastName: 'Mittal',
        PaxType: 1,
        DateOfBirth: '1994-06-15',
        Gender: 1,
        AddressLine1: 'Test Address',
        City: 'New Delhi',
        CountryCode: 'IN',
        CountryName: 'India',
        ContactNo: '9876543210',
        Email: userEmail,
        IsLeadPax: true,
        Nationality: 'IN',
        Fare: {
          BaseFare: flight.baseFare,
          Tax: flight.tax,
          TransactionFee: 0,
          YQTax: flight.yqTax ?? 0,
          AdditionalTxnFeeOfrd: 0,
          AdditionalTxnFeePub: 0,
          AirTransFee: 0,
        },
      }],
    });

    console.log(`\nBook Result: BookingId=${bookResult.bookingId}, PNR=${bookResult.pnr}, PriceChanged=${bookResult.isPriceChanged}`);

    if (!bookResult.bookingId) {
      console.log('No booking ID returned — skipping ticketing');
      return;
    }
    bookingId = bookResult.bookingId;
    pnr = bookResult.pnr;

    const ticketResult = await ticketFlight({
      traceId: searchResult.traceId || '',
      resultIndex: flight.resultIndex,
      PNR: bookResult.pnr,
      BookingId: bookResult.bookingId,
      passengers: [{
        PaxId: 1,
        Title: 'Mr',
        FirstName: 'Harsh',
        LastName: 'Mittal',
        DateOfBirth: '1994-06-15',
        Gender: 1,
        AddressLine1: 'Test Address',
        City: 'New Delhi',
        CountryCode: 'IN',
        CountryName: 'India',
        ContactNo: '9876543210',
        Email: userEmail,
        IsLeadPax: true,
        Nationality: 'IN',
        PaxType: 1,
        Fare: {
          BaseFare: flight.baseFare,
          Tax: flight.tax,
          TransactionFee: 0,
          YQTax: flight.yqTax ?? 0,
          AdditionalTxnFeeOfrd: 0,
          AdditionalTxnFeePub: 0,
          AirTransFee: 0,
        },
      }],
      segments: [],
      fare: fareQuote.fare,
      fareBreakdown: fareQuote.fareBreakdown,
      isLCC: flight.isLCC,
    });

    console.log(`\nTicket Result: BookingId=${ticketResult.results?.[0]?.bookingId}, PNR=${ticketResult.results?.[0]?.pnr}`);
    pnr = ticketResult.results?.[0]?.pnr || pnr;
    bookingId = ticketResult.results?.[0]?.bookingId || bookingId;
  }

  await create({
    userId,
    type: 'FLIGHT',
    itemName: `${flight.airline} ${flight.flightNumber} (${flight.origin}→${flight.destination})`,
    providerOrAirline: flight.airline,
    price: flight.offeredFare || flight.publishedFare || flight.baseFare + flight.tax,
    status: pnr ? 'CONFIRMED' : 'PENDING',
    pnr,
    seatOrRoom: `${flight.cabinClass || 'Economy'}`,
    paxCount: 1,
    travelDates: flightDate,
    paymentStatus: 'PAID',
    supplierBookingRef: `${bookingId}`,
    metadata: {
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      origin: flight.origin,
      destination: flight.destination,
      baseFare: flight.baseFare,
      tax: flight.tax,
    },
  } as any);

  console.log(`Flight booking saved to DB ✓`);
}

async function main() {
  console.log('Starting end-to-end booking flow...\n');

  const user = await findTestUser();
  console.log(`Test user: ${user.email} (${user.id})`);

  await doHotelBooking(user.id, user.email);
  await doFlightBooking(user.id, user.email);

  console.log('\n========== VERIFICATION ==========\n');
  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    orderBy: { bookedAt: 'desc' },
    take: 5,
  });

  for (const b of bookings) {
    console.log(`[${b.type}] ${b.itemName} — Status: ${b.status}, PNR: ${b.pnr || 'N/A'}, Price: ${b.price}, Payment: ${b.paymentStatus}`);
  }

  await prisma.$disconnect();
  console.log('\nDone!');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
