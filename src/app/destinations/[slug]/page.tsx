import { prisma } from "@/lib/prisma";
import { getVisaRequirement } from "@/lib/visa-requirements";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Breadcrumb, { BreadcrumbJsonLd } from "@/components/Breadcrumb";

export const revalidate = 600;

const SITE_URL = "https://cckr.vercel.app";

const DESTINATION_META: Record<
  string,
  {
    title: string;
    description: string;
    country: string;
    countryCode: string;
    bestTime: string;
    highlights: string[];
    overview: string;
    image: string;
    faqs: { question: string; answer: string }[];
  }
> = {
  goa: {
    title: "Goa — Beaches, Nightlife & Portuguese Heritage",
    description:
      "Explore Goa's pristine beaches, vibrant nightlife, historic churches, and Portuguese heritage. Book Goa holiday packages, flights, and luxury hotels with GoRASA.",
    country: "India",
    countryCode: "IN",
    bestTime: "October to March",
    highlights: [
      "Baga & Calangute Beaches",
      "Old Goa Churches (UNESCO)",
      "Dudhsagar Waterfalls",
      "Anjuna Flea Market",
      "Fort Aguada",
      "Spice Plantations",
    ],
    overview:
      "Goa is India's smallest state and a world-renowned beach destination. Known for its golden-sand beaches, vibrant nightlife, Portuguese-era churches, and laid-back vibe, Goa offers something for every traveler — from luxury resorts to budget beach shacks.",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
    faqs: [
      {
        question: "What is the best time to visit Goa?",
        answer:
          "October to March is the best time, with pleasant weather ideal for beach activities and sightseeing. Monsoon (June–September) is great for lush greenery but many beach shacks close.",
      },
      {
        question: "How many days are enough for Goa?",
        answer:
          "4–5 days is ideal to explore North and South Goa beaches, Old Goa churches, Dudhsagar Falls, and enjoy the nightlife.",
      },
      {
        question: "Is Goa safe for solo travelers?",
        answer:
          "Yes, Goa is generally safe. Stick to well-lit areas at night, use registered taxis, and keep valuables secure.",
      },
    ],
  },
  dubai: {
    title: "Dubai — Luxury, Shopping & Desert Adventures",
    description:
      "Discover Dubai's iconic skyscrapers, luxury shopping, desert safaris, and world-class dining. Book Dubai flights, hotels, and holiday packages with GoRASA.",
    country: "UAE",
    countryCode: "AE",
    bestTime: "November to March",
    highlights: [
      "Burj Khalifa",
      "Dubai Mall & Gold Souk",
      "Desert Safari",
      "Palm Jumeirah",
      "Dubai Marina",
      "Dubai Frame",
    ],
    overview:
      "Dubai is a city of superlatives — home to the world's tallest building, largest mall, and most luxurious hotels. From desert adventures to indoor ski slopes, Dubai blends Arabian heritage with futuristic architecture.",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    faqs: [
      {
        question: "Do Indians need a visa for Dubai?",
        answer:
          "Indian passport holders can get a Visa on Arrival for 14 days in Dubai/UAE. You need a valid passport, return ticket, and hotel booking confirmation.",
      },
      {
        question: "What is the best time to visit Dubai?",
        answer:
          "November to March offers the best weather (20–30°C). Summers (June–August) are extremely hot (40°C+) but offer great hotel deals.",
      },
      {
        question: "How much does a Dubai trip cost from India?",
        answer:
          "A 5-day Dubai trip from India costs ₹50,000–₹1,50,000 per person depending on flight class, hotel star rating, and activities included.",
      },
    ],
  },
  bali: {
    title: "Bali — Temples, Rice Terraces & Tropical Paradise",
    description:
      "Experience Bali's ancient temples, terraced rice fields, pristine beaches, and vibrant culture. Book Bali holiday packages, flights, and villas with GoRASA.",
    country: "Indonesia",
    countryCode: "ID",
    bestTime: "April to October",
    highlights: [
      "Tanah Lot Temple",
      "Ubud Rice Terraces",
      "Seminyak Beach",
      "Uluwatu Temple",
      "Mount Batur Sunrise Trek",
      "Nusa Penida Island",
    ],
    overview:
      "Bali, the Island of the Gods, is Indonesia's most famous destination. Known for its forested volcanic mountains, iconic rice paddies, pristine beaches, and coral reefs, Bali offers spiritual retreats, adventure sports, and world-class surfing.",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
    faqs: [
      {
        question: "Do Indians need a visa for Bali?",
        answer:
          "Indian passport holders get Visa on Arrival for 30 days in Bali/Indonesia. The VOA costs approximately $35 USD and can be extended once.",
      },
      {
        question: "What is the best time to visit Bali?",
        answer:
          "April to October (dry season) is ideal. July-August are peak tourist months. The wet season (Nov–Mar) has short daily showers but is less crowded.",
      },
      {
        question: "How many days are enough for Bali?",
        answer:
          "7–10 days is ideal to explore Ubud, Seminyak, Uluwatu, and take day trips to Nusa Penida or the Gili Islands.",
      },
    ],
  },
  maldives: {
    title: "Maldives — Overwater Villas & Crystal Waters",
    description:
      "Escape to the Maldives' luxury overwater villas, turquoise lagoons, and world-class diving. Book Maldives holiday packages and resorts with GoRASA.",
    country: "Maldives",
    countryCode: "MV",
    bestTime: "November to April",
    highlights: [
      "Overwater Villas",
      "Coral Reef Diving",
      "Male City Tour",
      "Bioluminescent Beaches",
      "Whale Shark Snorkeling",
      "Underwater Restaurants",
    ],
    overview:
      "The Maldives is a tropical paradise of 1,190 coral islands in the Indian Ocean. Famous for its crystal-clear waters, vibrant marine life, luxury overwater bungalows, and pristine white-sand beaches, it's the ultimate honeymoon and diving destination.",
    image:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80",
    faqs: [
      {
        question: "Do Indians need a visa for Maldives?",
        answer:
          "No visa required! Indian passport holders get free Visa on Arrival for 30 days in the Maldives. Just carry a valid passport and return ticket.",
      },
      {
        question: "How much does a Maldives trip cost from India?",
        answer:
          "A 4-night Maldives trip costs ₹60,000–₹3,00,000+ per person depending on resort category. Budget guesthouses on local islands start at ₹15,000/night.",
      },
      {
        question: "What is the best time to visit Maldives?",
        answer:
          "November to April (dry season) is the best time. May to October has more rain but lower prices and is great for surfing.",
      },
    ],
  },
  thailand: {
    title: "Thailand — Temples, Street Food & Tropical Islands",
    description:
      "Explore Thailand's ornate temples, legendary street food, tropical islands, and vibrant nightlife. Book Thailand flights, hotels, and packages with GoRASA.",
    country: "Thailand",
    countryCode: "TH",
    bestTime: "November to February",
    highlights: [
      "Bangkok Grand Palace",
      "Phi Phi Islands",
      "Chiang Mai Temples",
      "Phuket Beaches",
      "Floating Markets",
      "Full Moon Party",
    ],
    overview:
      "Thailand is Southeast Asia's most popular destination, offering ancient temples, tropical islands, bustling markets, and legendary street food. From Bangkok's energy to the serene islands of the south, Thailand caters to every budget.",
    image:
      "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80",
    faqs: [
      {
        question: "Do Indians need a visa for Thailand?",
        answer:
          "Indian passport holders can get Visa on Arrival for 15 days in Thailand. Alternatively, apply for a tourist visa in advance for longer stays (60 days).",
      },
      {
        question: "What is the cheapest time to fly to Thailand?",
        answer:
          "May to September (monsoon season) offers the cheapest flights and hotel rates. Weather is warm with occasional rain showers.",
      },
      {
        question: "How much does a Thailand trip cost from India?",
        answer:
          "A 5-day Thailand trip costs ₹25,000–₹80,000 per person from India, making it one of the most affordable international destinations.",
      },
    ],
  },
  kashmir: {
    title: "Kashmir — Paradise on Earth",
    description:
      "Discover Kashmir's snow-capped mountains, serene Dal Lake, Mughal gardens, and houseboats. Book Kashmir holiday packages and flights with GoRASA.",
    country: "India",
    countryCode: "IN",
    bestTime: "March to October",
    highlights: [
      "Dal Lake & Shikara Rides",
      "Gulmarg Gondola",
      "Pahalgam Valley",
      "Mughal Gardens",
      "Sonmarg Glacier",
      "Houseboat Stay",
    ],
    overview:
      "Kashmir, often called Paradise on Earth, is a breathtaking valley in northern India. With snow-capped Himalayan peaks, pristine lakes, lush meadows, and charming houseboats, Kashmir offers an unforgettable experience in every season.",
    image:
      "https://images.unsplash.com/photo-1597074866923-dc0589150458?auto=format&fit=crop&w=1200&q=80",
    faqs: [
      {
        question: "What is the best time to visit Kashmir?",
        answer:
          "March to October for lush greenery, flowers, and pleasant weather. December to February for snow activities in Gulmarg. Spring (March–April) is tulip season.",
      },
      {
        question: "Is Kashmir safe for tourists?",
        answer:
          "Yes, popular tourist areas like Srinagar, Gulmarg, Pahalgam, and Sonmarg are safe for tourists. Follow local advisories and use registered tour operators.",
      },
      {
        question: "How many days are enough for Kashmir?",
        answer:
          "6–7 days is ideal to cover Srinagar (Dal Lake, Mughal Gardens), Gulmarg (Gondola), Pahalgam (Betaab Valley), and Sonmarg.",
      },
    ],
  },
  singapore: {
    title: "Singapore — Gardens, Hawker Food & Modern Marvels",
    description:
      "Explore Singapore's futuristic gardens, world-class hawker food, Sentosa Island, and vibrant culture. Book Singapore flights, hotels, and packages with GoRASA.",
    country: "Singapore",
    countryCode: "SG",
    bestTime: "Year-round (Feb–Apr best)",
    highlights: [
      "Marina Bay Sands",
      "Gardens by the Bay",
      "Sentosa Island",
      "Chinatown & Little India",
      "Universal Studios",
      "Hawker Centres",
    ],
    overview:
      "Singapore is a futuristic city-state that blends ultra-modern architecture with rich cultural heritage. Famous for its stunning skyline, world-class street food, shopping on Orchard Road, and family-friendly attractions.",
    image:
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
    faqs: [
      {
        question: "Do Indians need a visa for Singapore?",
        answer:
          "Yes, Indian passport holders need a visa to visit Singapore. Apply online for an e-Visa or through authorized visa agents. Processing takes 3–5 working days.",
      },
      {
        question: "How many days are enough for Singapore?",
        answer:
          "4–5 days is ideal to cover Marina Bay, Sentosa, Gardens by the Bay, Chinatown, and Universal Studios.",
      },
      {
        question: "Is Singapore expensive for Indian tourists?",
        answer:
          "Singapore is mid-range to expensive. Budget ₹5,000–₹8,000/day for mid-range hotels and hawker food. Save with MRT transport and free attractions.",
      },
    ],
  },
  manali: {
    title: "Manali — Mountains, Adventure & Solang Valley",
    description:
      "Experience Manali's snow-capped peaks, Solang Valley adventures, Hadimba Temple, and Old Manali charm. Book Manali holiday packages with GoRASA.",
    country: "India",
    countryCode: "IN",
    bestTime: "October to June",
    highlights: [
      "Solang Valley",
      "Rohtang Pass",
      "Hadimba Temple",
      "Old Manali",
      "Jogini Waterfall",
      "Mall Road",
    ],
    overview:
      "Manali is a stunning hill station in Himachal Pradesh, nestled in the Kullu Valley. With snow-capped mountains, adventure sports, ancient temples, and charming cafes, Manali is a year-round destination for nature lovers and thrill-seekers.",
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80",
    faqs: [
      {
        question: "What is the best time to visit Manali?",
        answer:
          "October to June is ideal. December–February for snow, March–June for pleasant weather and adventure sports. Avoid monsoon (July–September) due to landslide risk.",
      },
      {
        question: "How to reach Manali from Delhi?",
        answer:
          "Manali is ~540 km from Delhi. Options: overnight Volvo bus (12–14 hrs), drive via Chandigarh (10–12 hrs), or fly to Kullu (Bhuntar) airport then 1 hr drive.",
      },
      {
        question: "Is Manali safe in winter?",
        answer:
          "Yes, Manali is safe in winter but carry heavy woolens. Roads may close temporarily due to snow. Check weather forecasts and carry tire chains if driving.",
      },
    ],
  },
};

const COUNTRY_CODE_MAP: Record<string, string> = {
  India: "IN",
  UAE: "AE",
  Indonesia: "ID",
  Maldives: "MV",
  Thailand: "TH",
  Singapore: "SG",
  Malaysia: "MY",
  "Sri Lanka": "LK",
  Nepal: "NP",
  Japan: "JP",
  "South Korea": "KR",
  Vietnam: "VN",
  Philippines: "PH",
  Turkey: "TR",
  Egypt: "EG",
};

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function generateStaticParams() {
  return Object.keys(DESTINATION_META).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dest = DESTINATION_META[slug];
  if (!dest) {
    return { title: "Destination Not Found", description: "This destination page does not exist." };
  }

  return {
    title: dest.title,
    description: dest.description,
    keywords: [
      slug,
      dest.country,
      `${slug} packages`,
      `${slug} flights`,
      `${slug} hotels`,
      `${slug} holiday`,
      "GoRASA",
    ],
    alternates: {
      canonical: `${SITE_URL}/destinations/${slug}`,
    },
    openGraph: {
      title: `${dest.title} | GoRASA`,
      description: dest.description,
      url: `${SITE_URL}/destinations/${slug}`,
      type: "website",
      images: [{ url: dest.image, width: 1200, height: 627, alt: dest.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${dest.title} | GoRASA`,
      description: dest.description,
      images: [dest.image],
    },
  };
}

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dest = DESTINATION_META[slug];

  if (!dest) {
    notFound();
  }

  const cityName = slug.charAt(0).toUpperCase() + slug.slice(1);

  const [city, packages, flightsTo, flightsFrom] = await Promise.all([
    prisma.city.findFirst({
      where: {
        name: { contains: cityName, mode: "insensitive" },
        isactive: true,
      },
    }),
    prisma.package.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: cityName, mode: "insensitive" } },
          { overview: { contains: cityName, mode: "insensitive" } },
        ],
      },
      orderBy: { rating: "desc" },
      take: 6,
    }),
    prisma.flight.findMany({
      where: {
        destination: { contains: cityName, mode: "insensitive" },
      },
      orderBy: { price: "asc" },
      take: 5,
    }),
    prisma.flight.findMany({
      where: {
        origin: { contains: cityName, mode: "insensitive" },
      },
      orderBy: { price: "asc" },
      take: 5,
    }),
  ]);

  const visaInfo = getVisaRequirement(dest.countryCode);

  const parseJsonSafe = <T,>(val: unknown, fallback: T): T => {
    if (typeof val !== "string") return fallback;
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  };

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Destinations", href: "/destinations" },
    { name: cityName, href: `/destinations/${slug}` },
  ];

  const faqSchema = dest.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: dest.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  } : null;

  const touristDestinationSchema = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: cityName,
    description: dest.overview,
    address: {
      "@type": "PostalAddress",
      addressCountry: dest.country,
    },
    touristType: "Leisure",
    ...(city?.iata_code
      ? {
          containsPlace: {
            "@type": "Airport",
            iataCode: city.iata_code,
          },
        }
      : {}),
  };

  const packageSchemas = packages.map((p) => {
    const images = parseJsonSafe<string[]>(p.images, []);
    return {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: p.title,
      description: `Holiday package to ${cityName} — ${p.duration}`,
      touristType: "Leisure",
      provider: { "@type": "Organization", name: p.provider || "GoRASA" },
      offers: {
        "@type": "Offer",
        price: p.price,
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
      },
      image: images[0] || undefined,
    };
  });

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(touristDestinationSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {packageSchemas.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(packageSchemas) }}
        />
      )}

      <main className="min-h-screen bg-brand-ivory">
        {/* Hero */}
        <section className="relative h-[60vh] min-h-[400px] overflow-hidden bg-brand-emerald">
          <Image
            src={dest.image}
            alt={dest.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
            <div className="max-w-6xl mx-auto">
              <Breadcrumb items={breadcrumbItems} />
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-display mb-4">
                {dest.title}
              </h1>
              <p className="text-lg text-white/90 max-w-2xl">{dest.description}</p>
              <div className="flex flex-wrap gap-4 mt-6">
                <a
                  href="#packages"
                  className="px-6 py-3 bg-brand-antique-gold text-white rounded-lg font-semibold hover:bg-brand-dark-gold transition-colors"
                >
                  View Packages
                </a>
                <a
                  href="#flights"
                  className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-colors"
                >
                  Find Flights
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Overview & Best Time */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold text-brand-charcoal mb-4 font-display">
                About {cityName}
              </h2>
              <p className="text-brand-charcoal/80 leading-relaxed">{dest.overview}</p>
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-brand-charcoal mb-3">Highlights</h3>
                <div className="grid grid-cols-2 gap-2">
                  {dest.highlights.map((h) => (
                    <div key={h} className="flex items-center gap-2 text-sm text-brand-charcoal/70">
                      <span className="w-2 h-2 rounded-full bg-brand-antique-gold" />
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-sand/20 h-fit">
              <h3 className="text-lg font-semibold text-brand-charcoal mb-4">Quick Facts</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-charcoal/60">Country</span>
                  <span className="font-medium">{dest.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-charcoal/60">Best Time</span>
                  <span className="font-medium">{dest.bestTime}</span>
                </div>
                {city?.iata_code && (
                  <div className="flex justify-between">
                    <span className="text-brand-charcoal/60">Airport Code</span>
                    <span className="font-medium">{city.iata_code}</span>
                  </div>
                )}
                {visaInfo && (
                  <div className="flex justify-between">
                    <span className="text-brand-charcoal/60">Visa</span>
                    <span className="font-medium text-right max-w-[180px]">
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

        {/* Visa Info */}
        {visaInfo && (
          <section className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-sand/20">
              <h2 className="text-xl font-bold text-brand-charcoal mb-3 font-display">
                Visa Information for Indian Passport Holders
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

        {/* Packages */}
        {packages.length > 0 && (
          <section id="packages" className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold text-brand-charcoal mb-6 font-display">
              Top {cityName} Packages
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => {
                const images = parseJsonSafe<string[]>(pkg.images, []);
                const inclusions = parseJsonSafe<string[]>(pkg.inclusions, []);
                return (
                  <Link
                    key={pkg.id}
                    href={`/packages/${pkg.id}`}
                    className="bg-white rounded-xl overflow-hidden shadow-sm border border-brand-sand/20 hover:shadow-md transition-shadow group"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={
                          images[0] ||
                          "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80"
                        }
                        alt={pkg.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 rounded text-xs font-semibold">
                        {pkg.duration}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-brand-charcoal mb-1 group-hover:text-brand-antique-gold transition-colors">
                        {pkg.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-brand-charcoal/50">★ {pkg.rating}</span>
                        <span className="text-xs text-brand-charcoal/50">• {pkg.provider}</span>
                      </div>
                      {inclusions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {inclusions.slice(0, 3).map((inc) => (
                            <span
                              key={inc}
                              className="px-2 py-0.5 bg-brand-ivory text-xs text-brand-charcoal/60 rounded"
                            >
                              {inc}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-baseline gap-2">
                        {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                          <span className="text-sm text-brand-charcoal/40 line-through">
                            ₹{pkg.originalPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                        <span className="text-lg font-bold text-brand-antique-gold">
                          ₹{pkg.price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-brand-charcoal/50">/person</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/holidays"
                className="px-6 py-3 bg-brand-antique-gold text-white rounded-lg font-semibold hover:bg-brand-dark-gold transition-colors"
              >
                View All Packages
              </Link>
            </div>
          </section>
        )}

        {/* Flights */}
        {(flightsTo.length > 0 || flightsFrom.length > 0) && (
          <section id="flights" className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold text-brand-charcoal mb-6 font-display">
              Flights to {cityName}
            </h2>
            {flightsTo.length > 0 ? (
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-brand-sand/20">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-brand-ivory border-b border-brand-sand/20">
                        <th className="text-left p-3 font-semibold text-brand-charcoal">Airline</th>
                        <th className="text-left p-3 font-semibold text-brand-charcoal">Flight</th>
                        <th className="text-left p-3 font-semibold text-brand-charcoal">Route</th>
                        <th className="text-left p-3 font-semibold text-brand-charcoal">Departure</th>
                        <th className="text-left p-3 font-semibold text-brand-charcoal">Duration</th>
                        <th className="text-right p-3 font-semibold text-brand-charcoal">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flightsTo.map((f) => (
                        <tr key={f.id} className="border-b border-brand-sand/10 hover:bg-brand-ivory/50">
                          <td className="p-3 font-medium">{f.airline}</td>
                          <td className="p-3 text-brand-charcoal/70">{f.flightNumber}</td>
                          <td className="p-3 text-brand-charcoal/70">
                            {f.origin} → {f.destination}
                          </td>
                          <td className="p-3 text-brand-charcoal/70">{f.departureTime}</td>
                          <td className="p-3 text-brand-charcoal/70">{f.duration}</td>
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
              <p className="text-brand-charcoal/60">
                No direct flights found. <Link href="/flights" className="text-brand-antique-gold underline">Search all flights</Link>.
              </p>
            )}
            <div className="text-center mt-6">
              <Link
                href={`/flights?destination=${encodeURIComponent(cityName)}`}
                className="px-6 py-3 border-2 border-brand-antique-gold text-brand-antique-gold rounded-lg font-semibold hover:bg-brand-antique-gold hover:text-white transition-colors"
              >
                Search Flights to {cityName}
              </Link>
            </div>
          </section>
        )}

        {/* FAQ */}
        {dest.faqs.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold text-brand-charcoal mb-6 font-display">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {dest.faqs.map((faq, i) => (
                <details
                  key={i}
                  className="bg-white rounded-xl shadow-sm border border-brand-sand/20 group"
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
        )}

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-brand-emerald rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 font-display">
              Ready to explore {cityName}?
            </h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Let our travel experts plan the perfect {cityName} trip for you. Custom itineraries, best
              prices, and 24/7 support.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/holidays"
                className="px-6 py-3 bg-brand-antique-gold text-white rounded-lg font-semibold hover:bg-brand-dark-gold transition-colors"
              >
                Browse Packages
              </Link>
              <Link
                href="/support"
                className="px-6 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors"
              >
                Talk to an Expert
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
