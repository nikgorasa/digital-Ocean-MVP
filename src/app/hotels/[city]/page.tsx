import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb, { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import { getVisaRequirement } from "@/lib/visa-requirements";

export const revalidate = 600;

const SITE_URL = "https://cckr.vercel.app";

interface CityMeta {
  name: string;
  country: string;
  countryCode: string;
  description: string;
  overview: string;
  image: string;
  highlights: string[];
  bestTime: string;
  avgBudget: string;
  popularAreas: string[];
  faqs: { question: string; answer: string }[];
}

const CITY_META: Record<string, CityMeta> = {
  dubai: {
    name: "Dubai",
    country: "UAE",
    countryCode: "AE",
    description:
      "Find the best hotels in Dubai — from luxury 5-star resorts on Palm Jumeirah to budget-friendly stays in Deira. Book Dubai hotels at the best prices with GoRASA.",
    overview:
      "Dubai offers an incredible range of hotels, from ultra-luxury properties like Burj Al Arab and Atlantis The Palm to affordable boutique hotels in old Dubai. Whether you're looking for beachfront resorts, downtown skyscraper hotels, or desert retreats, Dubai has something for every budget.",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Palm Jumeirah resorts", "Downtown Burj Khalifa area", "Dubai Marina waterfront", "Deira & Creek traditional hotels", "JBR Beach hotels", "Desert resort experiences"],
    bestTime: "November to March",
    avgBudget: "₹5,000–₹50,000 per night",
    popularAreas: ["Palm Jumeirah", "Downtown Dubai", "Dubai Marina", "JBR", "Deira", "Bur Dubai"],
    faqs: [
      { question: "What are the best areas to stay in Dubai?", answer: "Downtown Dubai (near Burj Khalifa) for sightseeing, Palm Jumeirah for luxury beach resorts, Dubai Marina for nightlife, and Deira for budget-friendly options with easy metro access." },
      { question: "How much do hotels in Dubai cost?", answer: "Budget hotels start from ₹3,000–5,000/night, mid-range hotels from ₹8,000–15,000/night, and luxury 5-star hotels from ₹20,000–1,00,000+/night. Prices are lower from June to August." },
      { question: "Is breakfast included in Dubai hotels?", answer: "Many Dubai hotels include breakfast, especially 4-star and 5-star properties. Always check the room details — meal plans range from Room Only to All-Inclusive." },
    ],
  },
  bangkok: {
    name: "Bangkok",
    country: "Thailand",
    countryCode: "TH",
    description:
      "Book hotels in Bangkok — from luxury riverside suites to budget hostels on Khao San Road. Find the best Bangkok hotel deals with GoRASA.",
    overview:
      "Bangkok is one of the world's most visited cities, offering incredible value for hotel stays. From opulent riverside hotels with rooftop pools to vibrant hostels in the backpacker district, Bangkok caters to every type of traveler.",
    image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Riverside luxury hotels", "Sukhumvit modern hotels", "Silom business district", "Khao San Road backpacker area", "Siam shopping district", "Chatuchak nearby stays"],
    bestTime: "November to February",
    avgBudget: "₹1,500–₹15,000 per night",
    popularAreas: ["Sukhumvit", "Silom", "Siam", "Khao San Road", "Riverside", "Chatuchak"],
    faqs: [
      { question: "What is the best area to stay in Bangkok?", answer: "Sukhumvit is best for modern hotels and nightlife, Siam for shopping, Riverside for luxury, and Khao San Road for budget travelers and backpackers." },
      { question: "Are Bangkok hotels cheap?", answer: "Yes, Bangkok offers excellent value. Budget hotels start from ₹1,000/night, mid-range from ₹3,000–6,000/night, and luxury riverside hotels from ₹10,000+/night." },
      { question: "Do Bangkok hotels accept Indian payment methods?", answer: "Most hotels accept international credit/debit cards. Many also accept UPI payments through booking platforms like GoRASA." },
    ],
  },
  singapore: {
    name: "Singapore",
    country: "Singapore",
    countryCode: "SG",
    description:
      "Book hotels in Singapore — Marina Bay luxury, Sentosa resorts, and Orchard Road boutique stays. Find the best Singapore hotel deals with GoRASA.",
    overview:
      "Singapore's hotel scene ranges from iconic luxury properties like Marina Bay Sands to charming boutique hotels in Chinatown and Little India. Despite being compact, each neighborhood offers a distinct hotel experience.",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Marina Bay iconic hotels", "Sentosa Island resorts", "Orchard Road shopping hotels", "Chinatown boutique stays", "Little India budget options", "Clarke Quay riverside hotels"],
    bestTime: "Year-round (Feb–Apr best)",
    avgBudget: "₹5,000–₹30,000 per night",
    popularAreas: ["Marina Bay", "Sentosa", "Orchard Road", "Chinatown", "Little India", "Clarke Quay"],
    faqs: [
      { question: "What is the best area to stay in Singapore?", answer: "Marina Bay for luxury and iconic views, Sentosa for family resorts, Orchard Road for shopping, and Chinatown for culture and mid-range hotels." },
      { question: "Is Singapore expensive for hotels?", answer: "Singapore hotels are mid-range to expensive. Budget options start from ₹4,000/night, mid-range from ₹8,000–15,000/night, and luxury from ₹20,000+/night." },
      { question: "Are there budget hotels in Singapore?", answer: "Yes, look in Little India, Chinatown, and Geylang for budget-friendly options from ₹3,000–5,000/night. Hostels are available from ₹1,500/night." },
    ],
  },
  bali: {
    name: "Bali",
    country: "Indonesia",
    countryCode: "ID",
    description:
      "Book hotels and villas in Bali — beachfront resorts in Seminyak, jungle retreats in Ubud, and clifftop hotels in Uluwatu. Best Bali deals with GoRASA.",
    overview:
      "Bali offers an extraordinary range of accommodation, from world-class luxury villas with private infinity pools to charming guesthouses surrounded by rice terraces. Each area of Bali offers a different vibe — from party-friendly Seminyak to spiritual Ubud.",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Seminyak beach clubs & villas", "Ubud rice terrace retreats", "Uluwatu clifftop resorts", "Canggu surf hostels", "Nusa Dua family resorts", "Jimbaran bay hotels"],
    bestTime: "April to October",
    avgBudget: "₹2,000–₹25,000 per night",
    popularAreas: ["Seminyak", "Ubud", "Uluwatu", "Canggu", "Nusa Dua", "Jimbaran"],
    faqs: [
      { question: "What is the best area to stay in Bali?", answer: "Seminyak for beach clubs and dining, Ubud for culture and nature, Uluwatu for surfing and clifftop views, and Nusa Dua for family-friendly resorts." },
      { question: "How much do Bali villas cost?", answer: "Private pool villas start from ₹5,000/night in Ubud and Canggu. Luxury villas in Seminyak range from ₹15,000–50,000/night. Budget guesthouses start from ₹800/night." },
      { question: "Is Bali safe for solo travelers?", answer: "Yes, Bali is very safe for solo travelers. Stick to popular areas, use ride-hailing apps, and keep valuables secure. The local community is welcoming and tourist-friendly." },
    ],
  },
  maldives: {
    name: "Maldives",
    country: "Maldives",
    countryCode: "MV",
    description:
      "Book Maldives resorts — overwater villas, underwater restaurants, and private island escapes. Find the best Maldives hotel deals with GoRASA.",
    overview:
      "The Maldives is synonymous with luxury — private island resorts, overwater bungalows with glass floors, and crystal-clear lagoons. While famous for honeymoon splurges, budget guesthouses on local islands now make the Maldives accessible to all.",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Overwater villas", "Private island resorts", "Underwater restaurants", "Budget guesthouses on local islands", "Dive resorts", "All-inclusive packages"],
    bestTime: "November to April",
    avgBudget: "₹8,000–₹1,00,000+ per night",
    popularAreas: ["North Malé Atoll", "South Malé Atoll", "Baa Atoll", "Ari Atoll", "Local Islands (Maafushi, Thulusdhoo)"],
    faqs: [
      { question: "Can I visit Maldives on a budget?", answer: "Yes! Stay on local islands like Maafushi or Thulusdhoo where guesthouses cost ₹3,000–8,000/night. Day trips to resort islands are available for ₹5,000–15,000." },
      { question: "What is the difference between resort islands and local islands?", answer: "Resort islands are private with luxury amenities and higher prices. Local islands have guesthouses, restaurants, and a more authentic experience at lower costs. Alcohol is only available on resort islands." },
      { question: "How many days are enough for Maldives?", answer: "4–5 nights is ideal for a relaxing getaway. Add 2–3 more nights if you want to include diving or visit multiple islands." },
    ],
  },
  goa: {
    name: "Goa",
    country: "India",
    countryCode: "IN",
    description:
      "Book hotels in Goa — beachside resorts in North Goa, luxury stays in South Goa, and heritage hotels in Old Goa. Best Goa hotel deals with GoRASA.",
    overview:
      "Goa offers everything from luxury beach resorts and heritage Portuguese villas to budget beach shacks and boutique hotels. North Goa is lively with nightlife, while South Goa is serene with pristine beaches.",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Calangute & Baga beach hotels", "Anjuna & Vagator boutique stays", "South Goa luxury resorts", "Panaji heritage hotels", "Arambol budget hostels", "Old Goa heritage villas"],
    bestTime: "October to March",
    avgBudget: "₹1,500–₹20,000 per night",
    popularAreas: ["Calangute", "Baga", "Anjuna", "Vagator", "Palolem", "Colva"],
    faqs: [
      { question: "North Goa or South Goa — where should I stay?", answer: "North Goa (Calangute, Baga, Anjuna) for nightlife, markets, and budget stays. South Goa (Palolem, Colva, Majorda) for serene beaches, luxury resorts, and relaxation." },
      { question: "What are the best beach resorts in Goa?", answer: "Top picks include Taj Fort Aguada, Alila Diwa, W Goa, and The Leela. Budget-friendly beach resorts start from ₹3,000/night in North Goa." },
      { question: "Is Goa safe for solo female travelers?", answer: "Yes, Goa is generally safe. Stick to well-lit areas at night, use registered taxis, and keep valuables secure. South Goa is particularly peaceful." },
    ],
  },
  kashmir: {
    name: "Kashmir",
    country: "India",
    countryCode: "IN",
    description:
      "Book hotels and houseboats in Kashmir — Dal Lake houseboats, Gulmarg ski resorts, and Pahalgam valley hotels. Best Kashmir deals with GoRASA.",
    overview:
      "Kashmir offers unique accommodation experiences — from traditional houseboats on Dal Lake to ski resorts in Gulmarg and cozy guesthouses in Pahalgam. Each season brings a different charm.",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Dal Lake houseboats", "Gulmarg ski resorts", "Pahalgam valley hotels", "Sonmarg guesthouses", "Srinagar boutique hotels", "Mughal Garden nearby stays"],
    bestTime: "March to October (Dec–Feb for snow)",
    avgBudget: "₹2,000–₹15,000 per night",
    popularAreas: ["Dal Lake", "Gulmarg", "Pahalgam", "Sonmarg", "Srinagar City"],
    faqs: [
      { question: "Are houseboats in Kashmir comfortable?", answer: "Yes, Kashmir houseboats range from budget to luxury. Premium houseboats have heated rooms, Wi-Fi, and attached bathrooms. Prices range from ₹3,000–15,000/night." },
      { question: "What is the best time to visit Kashmir?", answer: "March to October for greenery and flowers. December to February for snow activities in Gulmarg. Spring (March–April) is tulip season." },
      { question: "Is Kashmir safe for tourists?", answer: "Yes, popular tourist areas like Srinagar, Gulmarg, Pahalgam, and Sonmarg are safe. Follow local advisories and use registered tour operators." },
    ],
  },
  manali: {
    name: "Manali",
    country: "India",
    countryCode: "IN",
    description:
      "Book hotels in Manali — mountain view resorts, Solang Valley adventure stays, and Old Manali boutique hotels. Best Manali deals with GoRASA.",
    overview:
      "Manali offers a range of stays from luxury mountain resorts with Himalayan views to cozy guesthouses in Old Manali and adventure camps near Solang Valley.",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Mall Road central hotels", "Old Manali boutique stays", "Solang Valley adventure camps", "Naggar heritage hotels", "River-side cottages", "Luxury spa resorts"],
    bestTime: "October to June",
    avgBudget: "₹1,500–₹12,000 per night",
    popularAreas: ["Mall Road", "Old Manali", "Solang Valley", "Naggar", "Vashisht"],
    faqs: [
      { question: "What is the best area to stay in Manali?", answer: "Mall Road for convenience and shopping, Old Manali for cafes and bohemian vibe, Solang Valley for adventure activities, and Vashisht for hot springs." },
      { question: "Are there luxury resorts in Manali?", answer: "Yes, luxury options include Span Resort, Manu Allaya, and The Himalayan. Prices range from ₹8,000–20,000/night with mountain views and spa facilities." },
      { question: "Is Manali safe in winter?", answer: "Yes, but carry heavy woolens. Roads may close temporarily due to snow. Check weather forecasts and carry tire chains if driving." },
    ],
  },
};

export async function generateStaticParams() {
  return Object.keys(CITY_META).map((city) => ({ city }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const meta = CITY_META[city];
  if (!meta) {
    return { title: "City Hotels Not Found", description: "This city hotel page does not exist." };
  }

  return {
    title: `Hotels in ${meta.name} — Best ${meta.name} Hotel Deals | GoRASA`,
    description: meta.description,
    keywords: [
      `hotels in ${meta.name}`,
      `${meta.name} hotel deals`,
      `best hotels ${meta.name}`,
      `cheap hotels ${meta.name}`,
      `luxury hotels ${meta.name}`,
      `${meta.name} accommodation`,
      "GoRASA",
    ],
    alternates: {
      canonical: `${SITE_URL}/hotels/${city}`,
    },
    openGraph: {
      title: `Hotels in ${meta.name} | GoRASA`,
      description: meta.description,
      url: `${SITE_URL}/hotels/${city}`,
      type: "website",
      images: [{ url: meta.image, width: 1200, height: 627, alt: `Hotels in ${meta.name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Hotels in ${meta.name} | GoRASA`,
      description: meta.description,
      images: [meta.image],
    },
  };
}

export default async function CityHotelsPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const meta = CITY_META[city];

  if (!meta) {
    notFound();
  }

  const visaInfo = getVisaRequirement(meta.countryCode);

  const flights = await prisma.flight.findMany({
    where: {
      destination: { contains: meta.name, mode: "insensitive" },
    },
    orderBy: { price: "asc" },
    take: 5,
  });

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Hotels", href: "/hotels" },
    { name: meta.name, href: `/hotels/${city}` },
  ];

  const hotelSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Hotel",
      name: `Best Hotels in ${meta.name}`,
      description: meta.overview,
      address: {
        "@type": "PostalAddress",
        addressLocality: meta.name,
        addressCountry: meta.country,
      },
      url: `${SITE_URL}/hotels/${city}`,
    },
    ...meta.popularAreas.slice(0, 5).map((area) => ({
      "@context": "https://schema.org",
      "@type": "Hotel",
      name: `Hotels in ${area}, ${meta.name}`,
      description: `Find the best hotels in ${area}, ${meta.name}. Compare prices and book with GoRASA.`,
      address: {
        "@type": "PostalAddress",
        addressLocality: `${area}, ${meta.name}`,
        addressCountry: meta.country,
      },
    })),
  ];

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Popular Hotel Areas in ${meta.name}`,
    itemListElement: meta.popularAreas.map((area, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: area,
      url: `${SITE_URL}/hotels/${city}#${area.toLowerCase().replace(/\s+/g, "-")}`,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelSchemas) }}
      />
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
        <section className="relative h-[50vh] min-h-[350px] overflow-hidden bg-brand-emerald">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${meta.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
            <div className="max-w-6xl mx-auto">
              <Breadcrumb items={breadcrumbItems} />
              <h1 className="text-4xl md:text-5xl font-bold text-white font-display mb-4">
                Hotels in {meta.name}
              </h1>
              <p className="text-lg text-white/90 max-w-2xl">{meta.description}</p>
              <div className="flex flex-wrap gap-4 mt-6">
                <Link
                  href={`/hotels?city=${encodeURIComponent(meta.name)}`}
                  className="px-6 py-3 bg-brand-antique-gold text-white rounded-lg font-semibold hover:bg-brand-dark-gold transition-colors"
                >
                  Search Hotels
                </Link>
                <a
                  href="#areas"
                  className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-colors"
                >
                  Browse Areas
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Overview & Quick Facts */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold text-brand-charcoal mb-4 font-display">
                About Hotels in {meta.name}
              </h2>
              <p className="text-brand-charcoal/80 leading-relaxed">{meta.overview}</p>
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-brand-charcoal mb-3">Highlights</h3>
                <div className="grid grid-cols-2 gap-2">
                  {meta.highlights.map((h) => (
                    <div key={h} className="flex items-center gap-2 text-sm text-brand-charcoal/70">
                      <span className="w-2 h-2 rounded-full bg-brand-antique-gold" />
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 h-fit">
              <h3 className="text-lg font-semibold text-brand-charcoal mb-4">Quick Facts</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-charcoal/60">Country</span>
                  <span className="font-medium">{meta.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-charcoal/60">Best Time</span>
                  <span className="font-medium">{meta.bestTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-charcoal/60">Budget Range</span>
                  <span className="font-medium text-right max-w-[160px]">{meta.avgBudget}</span>
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

        {/* Popular Areas */}
        <section id="areas" className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-brand-charcoal mb-6 font-display">
            Popular Areas to Stay in {meta.name}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meta.popularAreas.map((area) => (
              <div
                key={area}
                id={area.toLowerCase().replace(/\s+/g, "-")}
                className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-brand-charcoal mb-2">{area}</h3>
                <p className="text-sm text-brand-charcoal/60 mb-3">
                  Find the best hotels in {area}, {meta.name}. Compare prices and book with GoRASA.
                </p>
                <Link
                  href={`/hotels?city=${encodeURIComponent(meta.name)}&area=${encodeURIComponent(area)}`}
                  className="text-sm text-brand-antique-gold font-medium hover:underline"
                >
                  Search Hotels in {area} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Flights to City */}
        {flights.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold text-brand-charcoal mb-6 font-display">
              Flights to {meta.name}
            </h2>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-brand-ivory border-b border-slate-100">
                      <th className="text-left p-3 font-semibold text-brand-charcoal">Airline</th>
                      <th className="text-left p-3 font-semibold text-brand-charcoal">Flight</th>
                      <th className="text-left p-3 font-semibold text-brand-charcoal">Route</th>
                      <th className="text-left p-3 font-semibold text-brand-charcoal">Departure</th>
                      <th className="text-right p-3 font-semibold text-brand-charcoal">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flights.map((f) => (
                      <tr key={f.id} className="border-b border-slate-100 hover:bg-brand-ivory/50">
                        <td className="p-3 font-medium">{f.airline}</td>
                        <td className="p-3 text-brand-charcoal/70">{f.flightNumber}</td>
                        <td className="p-3 text-brand-charcoal/70">
                          {f.origin} → {f.destination}
                        </td>
                        <td className="p-3 text-brand-charcoal/70">{f.departureTime}</td>
                        <td className="p-3 text-right font-bold text-brand-antique-gold">
                          ₹{f.price.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="text-center mt-6">
              <Link
                href={`/flights?destination=${encodeURIComponent(meta.name)}`}
                className="px-6 py-3 border-2 border-brand-antique-gold text-brand-antique-gold rounded-lg font-semibold hover:bg-brand-antique-gold hover:text-white transition-colors"
              >
                Search Flights to {meta.name}
              </Link>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-brand-charcoal mb-6 font-display">
            Frequently Asked Questions — Hotels in {meta.name}
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
              Ready to book your {meta.name} hotel?
            </h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Compare prices from top booking platforms and get the best deals on {meta.name} hotels
              with GoRASA.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href={`/hotels?city=${encodeURIComponent(meta.name)}`}
                className="px-6 py-3 bg-brand-antique-gold text-white rounded-lg font-semibold hover:bg-brand-dark-gold transition-colors"
              >
                Search Hotels
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
