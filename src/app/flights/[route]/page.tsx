import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb, { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import { getVisaRequirement } from "@/lib/visa-requirements";

export const revalidate = 600;

const SITE_URL = "https://cckr.vercel.app";

interface RouteMeta {
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  destinationCountry: string;
  destinationCountryCode: string;
  description: string;
  overview: string;
  distance: string;
  flightDuration: string;
  airlines: string[];
  tips: string[];
  faqs: { question: string; answer: string }[];
}

const ROUTE_META: Record<string, RouteMeta> = {
  "mumbai-dubai": {
    origin: "Mumbai",
    originCode: "BOM",
    destination: "Dubai",
    destinationCode: "DXB",
    destinationCountry: "UAE",
    destinationCountryCode: "AE",
    description:
      "Book cheap flights from Mumbai to Dubai. Compare airfares from IndiGo, Emirates, Air India, and more. Find the best Mumbai to Dubai flight deals with GoRASA.",
    overview:
      "The Mumbai to Dubai route is one of the busiest international routes from India. Multiple airlines operate daily direct flights, making it easy to find competitive prices. Flight time is approximately 3–3.5 hours.",
    distance: "1,930 km",
    flightDuration: "3h – 3h 30m",
    airlines: ["Emirates", "IndiGo", "Air India", "SpiceJet", "FlyDubai", "Air Arabia"],
    tips: [
      "Book 3–4 weeks in advance for the best prices",
      "Early morning flights are often cheaper",
      "Dubai has Visa on Arrival for Indian passport holders",
      "Carry a printed hotel booking for immigration",
    ],
    faqs: [
      { question: "How long is the flight from Mumbai to Dubai?", answer: "Direct flights from Mumbai to Dubai take approximately 3 to 3.5 hours. Connecting flights via other Gulf cities can take 5–8 hours." },
      { question: "Which airlines fly from Mumbai to Dubai?", answer: "Emirates, IndiGo, Air India, SpiceJet, FlyDubai, and Air Arabia operate direct flights. Emirates offers the most frequent service with multiple daily flights." },
      { question: "What is the cheapest month to fly Mumbai to Dubai?", answer: "June to August (summer) typically offers the lowest fares. November to March (peak season) has higher prices but better weather in Dubai." },
      { question: "Do Indians need a visa for Dubai?", answer: "Indian passport holders can get a Visa on Arrival for 14 days in Dubai/UAE. You need a valid passport, return ticket, and hotel booking confirmation." },
    ],
  },
  "delhi-bangkok": {
    origin: "Delhi",
    originCode: "DEL",
    destination: "Bangkok",
    destinationCode: "BKK",
    destinationCountry: "Thailand",
    destinationCountryCode: "TH",
    description:
      "Book cheap flights from Delhi to Bangkok. Compare airfares from Thai Airways, IndiGo, Air India, and more. Find the best Delhi to Bangkok flight deals with GoRASA.",
    overview:
      "Delhi to Bangkok is a popular route for both business and leisure travelers. Direct flights take about 4–4.5 hours. Multiple airlines offer competitive fares year-round.",
    distance: "2,950 km",
    flightDuration: "4h – 4h 30m",
    airlines: ["Thai Airways", "IndiGo", "Air India", "SpiceJet", "Vistara", "Bangkok Airways"],
    tips: [
      "Book 4–6 weeks ahead for the best deals",
      "Thailand offers Visa on Arrival for 15 days for Indians",
      "Carry 10,000 THB equivalent for VOA financial proof",
      "Return flights are often cheaper on weekdays",
    ],
    faqs: [
      { question: "How long is the flight from Delhi to Bangkok?", answer: "Direct flights from Delhi to Bangkok take approximately 4 to 4.5 hours. Connecting flights via Kolkata or other hubs take 6–10 hours." },
      { question: "Which airlines fly from Delhi to Bangkok?", answer: "Thai Airways, IndiGo, Air India, SpiceJet, Vistara, and Bangkok Airways operate on this route. Thai Airways offers the most premium service." },
      { question: "What is the cheapest time to fly Delhi to Bangkok?", answer: "May to September (monsoon season) offers the cheapest fares. November to February is peak season with higher prices." },
      { question: "Do Indians need a visa for Bangkok?", answer: "Indian passport holders can get Visa on Arrival for 15 days in Thailand. Alternatively, apply for a tourist visa in advance for longer stays (60 days)." },
    ],
  },
  "delhi-dubai": {
    origin: "Delhi",
    originCode: "DEL",
    destination: "Dubai",
    destinationCode: "DXB",
    destinationCountry: "UAE",
    destinationCountryCode: "AE",
    description:
      "Book cheap flights from Delhi to Dubai. Compare airfares from Emirates, IndiGo, Air India, and more. Find the best Delhi to Dubai flight deals with GoRASA.",
    overview:
      "Delhi to Dubai is a high-demand route with multiple daily direct flights. The 3.5-hour flight connects India's capital with the Middle East's business hub.",
    distance: "2,200 km",
    flightDuration: "3h 30m – 4h",
    airlines: ["Emirates", "IndiGo", "Air India", "SpiceJet", "FlyDubai", "Vistara"],
    tips: [
      "Emirates and IndiGo offer the most frequent service",
      "Book 3–4 weeks in advance for best prices",
      "Dubai Visa on Arrival available for Indian passport holders",
      "Early morning departures are often cheaper",
    ],
    faqs: [
      { question: "How long is the flight from Delhi to Dubai?", answer: "Direct flights take approximately 3.5 to 4 hours. Multiple airlines operate daily non-stop services." },
      { question: "Which airlines fly from Delhi to Dubai?", answer: "Emirates, IndiGo, Air India, SpiceJet, FlyDubai, and Vistara offer direct flights. Emirates has the most premium service with A380 aircraft." },
      { question: "What is the cheapest month to fly Delhi to Dubai?", answer: "Summer months (June–August) offer the lowest fares due to extreme heat in Dubai. Winter (Nov–Mar) is peak season with higher prices." },
      { question: "Is food included on Delhi to Dubai flights?", answer: "Most full-service carriers (Emirates, Air India) include meals. Budget carriers (IndiGo, SpiceJet) offer buy-on-board options." },
    ],
  },
  "mumbai-singapore": {
    origin: "Mumbai",
    originCode: "BOM",
    destination: "Singapore",
    destinationCode: "SIN",
    destinationCountry: "Singapore",
    destinationCountryCode: "SG",
    description:
      "Book cheap flights from Mumbai to Singapore. Compare airfares from Singapore Airlines, IndiGo, Air India, and more. Find the best Mumbai to Singapore flight deals with GoRASA.",
    overview:
      "Mumbai to Singapore is a popular route for business travelers and tourists. Direct flights take about 5.5–6 hours. Singapore Airlines and Air India offer premium service on this route.",
    distance: "3,900 km",
    flightDuration: "5h 30m – 6h",
    airlines: ["Singapore Airlines", "IndiGo", "Air India", "Vistara", "Scoot"],
    tips: [
      "Singapore requires a visa for Indian passport holders — apply in advance",
      "Book 4–6 weeks ahead for competitive fares",
      "Singapore Airlines offers the best premium experience",
      "Scoot (budget arm) offers cheaper alternatives",
    ],
    faqs: [
      { question: "How long is the flight from Mumbai to Singapore?", answer: "Direct flights take approximately 5.5 to 6 hours. Connecting flights via other hubs take 8–12 hours." },
      { question: "Which airlines fly from Mumbai to Singapore?", answer: "Singapore Airlines, IndiGo, Air India, Vistara, and Scoot operate on this route. Singapore Airlines offers the most premium service." },
      { question: "Do Indians need a visa for Singapore?", answer: "Yes, Indian passport holders need a visa to visit Singapore. Apply online for an e-Visa or through authorized visa agents. Processing takes 3–5 working days." },
      { question: "What is the cheapest time to fly to Singapore?", answer: "February to April and September to November typically offer the best fares. Avoid December and June–July when prices peak." },
    ],
  },
  "delhi-singapore": {
    origin: "Delhi",
    originCode: "DEL",
    destination: "Singapore",
    destinationCode: "SIN",
    destinationCountry: "Singapore",
    destinationCountryCode: "SG",
    description:
      "Book cheap flights from Delhi to Singapore. Compare airfares from Singapore Airlines, Air India, IndiGo, and more. Find the best Delhi to Singapore flight deals with GoRASA.",
    overview:
      "Delhi to Singapore connects India's capital with the Lion City. Direct flights take about 5.5–6 hours, making it a convenient route for business and leisure.",
    distance: "4,150 km",
    flightDuration: "5h 30m – 6h 30m",
    airlines: ["Singapore Airlines", "Air India", "IndiGo", "Vistara", "Scoot"],
    tips: [
      "Apply for Singapore visa at least 2 weeks before travel",
      "Singapore Airlines and Air India offer direct flights",
      "Budget options available via Scoot with layovers",
      "Carry proof of hotel booking and return ticket for immigration",
    ],
    faqs: [
      { question: "How long is the flight from Delhi to Singapore?", answer: "Direct flights take approximately 5.5 to 6.5 hours. Singapore Airlines and Air India offer non-stop services." },
      { question: "Which airlines fly from Delhi to Singapore?", answer: "Singapore Airlines, Air India, IndiGo, Vistara, and Scoot operate on this route." },
      { question: "Do Indians need a visa for Singapore?", answer: "Yes, Indian passport holders need a visa. Apply online for an e-Visa or through authorized agents. Processing takes 3–5 working days." },
    ],
  },
  "mumbai-bangkok": {
    origin: "Mumbai",
    originCode: "BOM",
    destination: "Bangkok",
    destinationCode: "BKK",
    destinationCountry: "Thailand",
    destinationCountryCode: "TH",
    description:
      "Book cheap flights from Mumbai to Bangkok. Compare airfares from Thai Airways, IndiGo, and more. Find the best Mumbai to Bangkok flight deals with GoRASA.",
    overview:
      "Mumbai to Bangkok is a popular leisure route. Direct flights take about 4.5–5 hours. Thailand's Visa on Arrival makes it a convenient destination for Indian travelers.",
    distance: "3,300 km",
    flightDuration: "4h 30m – 5h",
    airlines: ["Thai Airways", "IndiGo", "SpiceJet", "Vistara", "Bangkok Airways"],
    tips: [
      "Thailand offers Visa on Arrival for 15 days",
      "Monsoon season (May–Sep) has the cheapest fares",
      "Thai Airways offers the best premium experience",
      "Carry 10,000 THB equivalent for VOA financial proof",
    ],
    faqs: [
      { question: "How long is the flight from Mumbai to Bangkok?", answer: "Direct flights take approximately 4.5 to 5 hours. Thai Airways and IndiGo offer non-stop services." },
      { question: "Which airlines fly from Mumbai to Bangkok?", answer: "Thai Airways, IndiGo, SpiceJet, Vistara, and Bangkok Airways operate on this route." },
      { question: "Do Indians need a visa for Bangkok?", answer: "Indian passport holders can get Visa on Arrival for 15 days in Thailand. For longer stays, apply for a tourist visa in advance." },
    ],
  },
  "mumbai-bali": {
    origin: "Mumbai",
    originCode: "BOM",
    destination: "Bali",
    destinationCode: "DPS",
    destinationCountry: "Indonesia",
    destinationCountryCode: "ID",
    description:
      "Book cheap flights from Mumbai to Bali. Compare airfares and find the best Mumbai to Bali flight deals with GoRASA.",
    overview:
      "Mumbai to Bali flights usually have one stop via Singapore, Kuala Lumpur, or Bangkok. Direct flights are limited. The total travel time is 8–12 hours depending on the connection.",
    distance: "5,800 km",
    flightDuration: "8h – 12h (1 stop)",
    airlines: ["Singapore Airlines", "IndiGo", "AirAsia", "Malaysia Airlines", "Thai Airways"],
    tips: [
      "Bali offers Visa on Arrival for 30 days ($35 USD)",
      "Flights with 1 stop via Singapore are usually cheapest",
      "Book 6–8 weeks ahead for best prices",
      "Peak season is July–August and December–January",
    ],
    faqs: [
      { question: "Are there direct flights from Mumbai to Bali?", answer: "Direct flights are limited and seasonal. Most flights have 1 stop via Singapore, Kuala Lumpur, or Bangkok. Total travel time is 8–12 hours." },
      { question: "Which airlines fly from Mumbai to Bali?", answer: "Singapore Airlines (via Singapore), AirAsia (via KL), Malaysia Airlines (via KL), and Thai Airways (via Bangkok) offer good connections." },
      { question: "Do Indians need a visa for Bali?", answer: "Indian passport holders get Visa on Arrival for 30 days in Bali/Indonesia. The VOA costs approximately $35 USD and can be extended once." },
    ],
  },
  "delhi-bali": {
    origin: "Delhi",
    originCode: "DEL",
    destination: "Bali",
    destinationCode: "DPS",
    destinationCountry: "Indonesia",
    destinationCountryCode: "ID",
    description:
      "Book cheap flights from Delhi to Bali. Compare airfares and find the best Delhi to Bali flight deals with GoRASA.",
    overview:
      "Delhi to Bali flights typically connect via Singapore, Kuala Lumpur, or Bangkok. Total travel time is 9–13 hours. The route is popular for honeymoon and leisure travelers.",
    distance: "6,200 km",
    flightDuration: "9h – 13h (1 stop)",
    airlines: ["Singapore Airlines", "IndiGo", "AirAsia", "Malaysia Airlines", "Batik Air"],
    tips: [
      "Bali offers Visa on Arrival for 30 days ($35 USD)",
      "Singapore Airlines via SIN offers the smoothest connection",
      "Book 6–8 weeks ahead for best prices",
      "Avoid peak season (Jul–Aug, Dec–Jan) for lower fares",
    ],
    faqs: [
      { question: "Are there direct flights from Delhi to Bali?", answer: "No direct flights currently operate from Delhi to Bali. All routes have 1 stop, typically via Singapore, KL, or Bangkok. Total travel time is 9–13 hours." },
      { question: "Which airlines fly from Delhi to Bali?", answer: "Singapore Airlines (via SIN), AirAsia (via KL), Malaysia Airlines (via KL), and Batik Air offer good connections with competitive prices." },
      { question: "Do Indians need a visa for Bali?", answer: "Indian passport holders get Visa on Arrival for 30 days. The VOA costs $35 USD and can be extended once for another 30 days." },
    ],
  },
  "mumbai-maldives": {
    origin: "Mumbai",
    originCode: "BOM",
    destination: "Maldives",
    destinationCode: "MLE",
    destinationCountry: "Maldives",
    destinationCountryCode: "MV",
    description:
      "Book cheap flights from Mumbai to Maldives. Compare airfares and find the best Mumbai to Maldives flight deals with GoRASA.",
    overview:
      "Mumbai to Maldives is a short and convenient route with direct flights taking just 2.5–3 hours. Multiple airlines operate daily flights to Malé (Velana International Airport).",
    distance: "1,600 km",
    flightDuration: "2h 30m – 3h",
    airlines: ["IndiGo", "Air India", "GoAir", "Vistara", "Maldivian"],
    tips: [
      "Maldives offers free Visa on Arrival for 30 days for Indians",
      "Direct flights available from Mumbai, Delhi, and Bangalore",
      "Carry hotel/resort booking confirmation for immigration",
      "Seaplane transfers to resorts must be pre-arranged",
    ],
    faqs: [
      { question: "How long is the flight from Mumbai to Maldives?", answer: "Direct flights take approximately 2.5 to 3 hours. IndiGo, Air India, and GoAir offer non-stop services to Malé." },
      { question: "Do Indians need a visa for Maldives?", answer: "No visa required! Indian passport holders get free Visa on Arrival for 30 days in the Maldives. Just carry a valid passport and return ticket." },
      { question: "What is the cheapest time to fly to Maldives?", answer: "May to October (wet season) offers the cheapest fares. December to April is peak season with higher prices." },
    ],
  },
  "delhi-maldives": {
    origin: "Delhi",
    originCode: "DEL",
    destination: "Maldives",
    destinationCode: "MLE",
    destinationCountry: "Maldives",
    destinationCountryCode: "MV",
    description:
      "Book cheap flights from Delhi to Maldives. Compare airfares and find the best Delhi to Maldives flight deals with GoRASA.",
    overview:
      "Delhi to Maldives flights take about 4–4.5 hours direct. The route is popular for honeymoon trips and luxury getaways. Air India and IndiGo offer direct services.",
    distance: "2,700 km",
    flightDuration: "4h – 4h 30m",
    airlines: ["Air India", "IndiGo", "Vistara", "GoAir"],
    tips: [
      "Maldives offers free Visa on Arrival for 30 days",
      "Direct flights available from Delhi",
      "Book resort transfers (seaplane/speedboat) in advance",
      "Best deals during monsoon season (May–October)",
    ],
    faqs: [
      { question: "How long is the flight from Delhi to Maldives?", answer: "Direct flights take approximately 4 to 4.5 hours. Air India and IndiGo offer non-stop services." },
      { question: "Do Indians need a visa for Maldives?", answer: "No visa required! Indian passport holders get free Visa on Arrival for 30 days. Just carry a valid passport and return ticket." },
    ],
  },
};

function parseRouteSlug(slug: string): { origin: string; destination: string } | null {
  const parts = slug.split("-");
  if (parts.length !== 2) return null;
  return { origin: parts[0], destination: parts[1] };
}

export async function generateStaticParams() {
  return Object.keys(ROUTE_META).map((route) => ({ route }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ route: string }>;
}): Promise<Metadata> {
  const { route } = await params;
  const meta = ROUTE_META[route];
  if (!meta) {
    return { title: "Flight Route Not Found", description: "This flight route page does not exist." };
  }

  return {
    title: `Flights from ${meta.origin} to ${meta.destination} — Best Deals | GoRASA`,
    description: meta.description,
    keywords: [
      `flights ${meta.origin} to ${meta.destination}`,
      `${meta.origin} ${meta.destination} flight`,
      `cheap flights ${meta.origin} ${meta.destination}`,
      `${meta.origin} to ${meta.destination} airfare`,
      `${meta.destination} flights`,
      "GoRASA",
    ],
    alternates: {
      canonical: `${SITE_URL}/flights/${route}`,
    },
    openGraph: {
      title: `Flights from ${meta.origin} to ${meta.destination} | GoRASA`,
      description: meta.description,
      url: `${SITE_URL}/flights/${route}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Flights from ${meta.origin} to ${meta.destination} | GoRASA`,
      description: meta.description,
    },
  };
}

export default async function FlightRoutePage({
  params,
}: {
  params: Promise<{ route: string }>;
}) {
  const { route } = await params;
  const meta = ROUTE_META[route];

  if (!meta) {
    notFound();
  }

  const visaInfo = getVisaRequirement(meta.destinationCountryCode);

  const flights = await prisma.flight.findMany({
    where: {
      origin: { contains: meta.origin, mode: "insensitive" },
      destination: { contains: meta.destination, mode: "insensitive" },
    },
    orderBy: { price: "asc" },
    take: 10,
  });

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Flights", href: "/flights" },
    { name: `${meta.origin} to ${meta.destination}`, href: `/flights/${route}` },
  ];

  const flightSchemas = flights.slice(0, 5).map((f) => ({
    "@context": "https://schema.org",
    "@type": "Flight",
    name: `${f.airline} ${f.flightNumber}`,
    airline: {
      "@type": "Airline",
      name: f.airline,
    },
    departureAirport: {
      "@type": "Airport",
      name: f.origin,
    },
    arrivalAirport: {
      "@type": "Airport",
      name: f.destination,
    },
    departureTime: f.departureTime,
    arrivalTime: f.arrivalTime,
    offers: {
      "@type": "Offer",
      price: f.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
  }));

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Flights from ${meta.origin} to ${meta.destination}`,
    itemListElement: flights.slice(0, 10).map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${f.airline} ${f.flightNumber} — ${f.origin} to ${f.destination}`,
      url: `${SITE_URL}/flights/${route}`,
    })),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: meta.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      {flightSchemas.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(flightSchemas) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="min-h-screen bg-brand-ivory">
        {/* Hero */}
        <section className="bg-brand-emerald py-10 sm:py-16">
          <div className="max-w-6xl mx-auto px-4">
            <Breadcrumb items={breadcrumbItems} />
            <h1 className="text-4xl md:text-5xl font-bold text-white font-display mb-4">
              Flights from {meta.origin} to {meta.destination}
            </h1>
            <p className="text-lg text-white/80 max-w-2xl">{meta.description}</p>
            <div className="flex flex-wrap gap-4 mt-6">
              <Link
                href={`/flights?origin=${encodeURIComponent(meta.origin)}&destination=${encodeURIComponent(meta.destination)}`}
                className="px-6 py-3 bg-brand-antique-gold text-white rounded-lg font-semibold hover:bg-brand-dark-gold transition-colors"
              >
                Search Flights
              </Link>
              <a
                href="#fares"
                className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-colors"
              >
                View Fares
              </a>
            </div>
          </div>
        </section>

        {/* Route Info */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-xl sm:text-2xl font-bold text-brand-charcoal mb-4 font-display">
                {meta.origin} to {meta.destination} Flight Information
              </h2>
              <p className="text-brand-charcoal/80 leading-relaxed mb-6">{meta.overview}</p>

              <h3 className="text-lg font-semibold text-brand-charcoal mb-3">Travel Tips</h3>
              <ul className="space-y-2">
                {meta.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-brand-charcoal/70">
                    <span className="w-2 h-2 rounded-full bg-brand-antique-gold mt-1.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 h-fit">
              <h3 className="text-lg font-semibold text-brand-charcoal mb-4">Route Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-charcoal/60">Route</span>
                  <span className="font-medium">{meta.originCode} → {meta.destinationCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-charcoal/60">Distance</span>
                  <span className="font-medium">{meta.distance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-charcoal/60">Flight Time</span>
                  <span className="font-medium">{meta.flightDuration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-charcoal/60">Destination</span>
                  <span className="font-medium">{meta.destinationCountry}</span>
                </div>
                {visaInfo && (
                  <div className="flex justify-between">
                    <span className="text-brand-charcoal/60">Visa</span>
                    <span className="font-medium text-right max-w-[160px]">
                      {visaInfo.visaOnArrival
                        ? "Visa on Arrival"
                        : visaInfo.eVisa
                          ? "e-Visa Available"
                          : visaInfo.visaRequired
                            ? "Visa Required"
                            : "No Visa Required"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Airlines */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-xl font-bold text-brand-charcoal mb-4 font-display">
            Airlines Operating {meta.origin} → {meta.destination}
          </h2>
          <div className="flex flex-wrap gap-2">
            {meta.airlines.map((airline) => (
              <span
                key={airline}
                className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-brand-charcoal border border-slate-100"
              >
                {airline}
              </span>
            ))}
          </div>
        </section>

        {/* Fares */}
        <section id="fares" className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-brand-charcoal mb-6 font-display">
            {meta.origin} to {meta.destination} Flight Fares
          </h2>
          {flights.length > 0 ? (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-brand-ivory border-b border-slate-100">
                      <th className="text-left p-3 font-semibold text-brand-charcoal">Airline</th>
                      <th className="text-left p-3 font-semibold text-brand-charcoal">Flight</th>
                      <th className="text-left p-3 font-semibold text-brand-charcoal">Departure</th>
                      <th className="text-left p-3 font-semibold text-brand-charcoal">Arrival</th>
                      <th className="text-left p-3 font-semibold text-brand-charcoal">Duration</th>
                      <th className="text-left p-3 font-semibold text-brand-charcoal">Stops</th>
                      <th className="text-right p-3 font-semibold text-brand-charcoal">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flights.map((f) => (
                      <tr key={f.id} className="border-b border-slate-100 hover:bg-brand-ivory/50">
                        <td className="p-3 font-medium">{f.airline}</td>
                        <td className="p-3 text-brand-charcoal/70">{f.flightNumber}</td>
                        <td className="p-3 text-brand-charcoal/70">{f.departureTime}</td>
                        <td className="p-3 text-brand-charcoal/70">{f.arrivalTime}</td>
                        <td className="p-3 text-brand-charcoal/70">{f.duration}</td>
                        <td className="p-3 text-brand-charcoal/70">
                          {f.stops === 0 ? "Non-stop" : `${f.stops} stop`}
                        </td>
                        <td className="p-3 text-right font-bold text-brand-antique-gold">
                          ₹{f.price.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100 text-center">
              <p className="text-brand-charcoal/60 mb-4">
                No cached fares available. Search for live prices.
              </p>
              <Link
                href={`/flights?origin=${encodeURIComponent(meta.origin)}&destination=${encodeURIComponent(meta.destination)}`}
                className="px-6 py-3 bg-brand-antique-gold text-white rounded-lg font-semibold hover:bg-brand-dark-gold transition-colors"
              >
                Search Live Flights
              </Link>
            </div>
          )}
          {flights.length > 0 && (
            <div className="text-center mt-6">
              <Link
                href={`/flights?origin=${encodeURIComponent(meta.origin)}&destination=${encodeURIComponent(meta.destination)}`}
                className="px-6 py-3 border-2 border-brand-antique-gold text-brand-antique-gold rounded-lg font-semibold hover:bg-brand-antique-gold hover:text-white transition-colors"
              >
                Search More Flights
              </Link>
            </div>
          )}
        </section>

        {/* Visa Info */}
        {visaInfo && (
          <section className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-brand-charcoal mb-3 font-display">
                Visa Information for {meta.destinationCountry}
              </h2>
              <div className="flex flex-wrap gap-3 mb-3">
                {visaInfo.visaOnArrival && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                    Visa on Arrival
                  </span>
                )}
                {visaInfo.eVisa && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                    e-Visa Available
                  </span>
                )}
                {visaInfo.visaRequired && !visaInfo.visaOnArrival && !visaInfo.eVisa && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full font-medium">
                    Visa Required
                  </span>
                )}
                {!visaInfo.visaRequired && !visaInfo.visaOnArrival && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                    No Visa Required
                  </span>
                )}
              </div>
              {visaInfo.notes && (
                <p className="text-sm text-brand-charcoal/70">{visaInfo.notes}</p>
              )}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-brand-charcoal mb-6 font-display">
            Frequently Asked Questions — {meta.origin} to {meta.destination} Flights
          </h2>
          <div className="space-y-4">
            {meta.faqs.map((faq, i) => (
              <details
                key={i}
                className="bg-white rounded-xl shadow-sm border border-slate-100 group"
              >
                <summary className="p-4 cursor-pointer font-semibold text-brand-charcoal hover:text-brand-antique-gold transition-colors list-none flex justify-between items-center">
                  {faq.question}
                  <span className="text-brand-charcoal/40 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="px-4 pb-4 text-sm text-brand-charcoal/70 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-brand-deep-teal rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 font-display">
              Ready to fly from {meta.origin} to {meta.destination}?
            </h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Compare prices and find the best flight deals with GoRASA.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href={`/flights?origin=${encodeURIComponent(meta.origin)}&destination=${encodeURIComponent(meta.destination)}`}
                className="px-6 py-3 bg-brand-antique-gold text-white rounded-lg font-semibold hover:bg-brand-dark-gold transition-colors"
              >
                Search Flights
              </Link>
              <Link
                href={`/hotels/${meta.destination.toLowerCase()}`}
                className="px-6 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors"
              >
                Find Hotels in {meta.destination}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
