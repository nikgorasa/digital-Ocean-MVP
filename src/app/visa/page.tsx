import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb, { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import { getVisaRequirement, isSchengenCountry } from "@/lib/visa-requirements";

export const revalidate = 86400;

const SITE_URL = "https://cckr.vercel.app";

interface CountryVisaInfo {
  code: string;
  name: string;
  region: string;
  visaRequired: boolean;
  visaOnArrival?: boolean;
  eVisa?: boolean;
  notes?: string;
}

const COUNTRIES: { code: string; name: string; region: string }[] = [
  { code: "AE", name: "Dubai (UAE)", region: "Middle East" },
  { code: "TH", name: "Thailand", region: "Southeast Asia" },
  { code: "SG", name: "Singapore", region: "Southeast Asia" },
  { code: "ID", name: "Bali (Indonesia)", region: "Southeast Asia" },
  { code: "MY", name: "Malaysia", region: "Southeast Asia" },
  { code: "VN", name: "Vietnam", region: "Southeast Asia" },
  { code: "PH", name: "Philippines", region: "Southeast Asia" },
  { code: "MV", name: "Maldives", region: "South Asia" },
  { code: "LK", name: "Sri Lanka", region: "South Asia" },
  { code: "NP", name: "Nepal", region: "South Asia" },
  { code: "BH", name: "Bahrain", region: "Middle East" },
  { code: "QA", name: "Qatar", region: "Middle East" },
  { code: "OM", name: "Oman", region: "Middle East" },
  { code: "KW", name: "Kuwait", region: "Middle East" },
  { code: "SA", name: "Saudi Arabia", region: "Middle East" },
  { code: "IL", name: "Israel", region: "Middle East" },
  { code: "TR", name: "Turkey", region: "Europe" },
  { code: "EG", name: "Egypt", region: "Africa" },
  { code: "KE", name: "Kenya", region: "Africa" },
  { code: "ZA", name: "South Africa", region: "Africa" },
  { code: "US", name: "United States", region: "North America" },
  { code: "GB", name: "United Kingdom", region: "Europe" },
  { code: "CA", name: "Canada", region: "North America" },
  { code: "AU", name: "Australia", region: "Oceania" },
  { code: "NZ", name: "New Zealand", region: "Oceania" },
  { code: "JP", name: "Japan", region: "East Asia" },
  { code: "KR", name: "South Korea", region: "East Asia" },
  { code: "CN", name: "China", region: "East Asia" },
  { code: "MX", name: "Mexico", region: "North America" },
  { code: "BR", name: "Brazil", region: "South America" },
  { code: "AR", name: "Argentina", region: "South America" },
  { code: "CL", name: "Chile", region: "South America" },
  { code: "RU", name: "Russia", region: "Europe" },
  { code: "DE", name: "Germany", region: "Europe" },
  { code: "FR", name: "France", region: "Europe" },
  { code: "IT", name: "Italy", region: "Europe" },
  { code: "ES", name: "Spain", region: "Europe" },
  { code: "NL", name: "Netherlands", region: "Europe" },
  { code: "CH", name: "Switzerland", region: "Europe" },
];

function getVisaData(): CountryVisaInfo[] {
  return COUNTRIES.map((c) => {
    const req = getVisaRequirement(c.code);
    return {
      code: c.code,
      name: c.name,
      region: c.region,
      visaRequired: req?.visaRequired ?? true,
      visaOnArrival: req?.visaOnArrival,
      eVisa: req?.eVisa,
      notes: req?.notes,
    };
  });
}

function getVisaStatusBadge(info: CountryVisaInfo) {
  if (info.visaOnArrival) {
    return { label: "Visa on Arrival", color: "bg-green-100 text-green-700" };
  }
  if (info.eVisa && !info.visaRequired) {
    return { label: "e-Visa Available", color: "bg-blue-100 text-blue-700" };
  }
  if (info.eVisa && info.visaRequired) {
    return { label: "e-Visa Required", color: "bg-blue-100 text-blue-700" };
  }
  if (!info.visaRequired) {
    return { label: "No Visa Required", color: "bg-green-100 text-green-700" };
  }
  return { label: "Visa Required", color: "bg-amber-100 text-amber-700" };
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Visa Requirements for Indian Passport Holders | GoRASA",
    description:
      "Complete visa guide for Indian passport holders. Check visa requirements, visa on arrival, and e-Visa availability for 40+ countries including Dubai, Thailand, Singapore, Bali, and more.",
    keywords: [
      "visa requirements India",
      "Indian passport visa",
      "visa on arrival for Indians",
      "e-Visa countries",
      "Dubai visa for Indians",
      "Thailand visa on arrival",
      "Singapore visa",
      "Bali visa",
    ],
    alternates: {
      canonical: `${SITE_URL}/visa`,
    },
    openGraph: {
      title: "Visa Requirements for Indian Passport Holders | GoRASA",
      description:
        "Complete visa guide for Indian passport holders. Check visa requirements for 40+ countries.",
      url: `${SITE_URL}/visa`,
      type: "website",
    },
  };
}

export default function VisaPage() {
  const visaData = getVisaData();

  const byRegion = visaData.reduce<Record<string, CountryVisaInfo[]>>((acc, c) => {
    if (!acc[c.region]) acc[c.region] = [];
    acc[c.region].push(c);
    return acc;
  }, {});

  const faqs = [
    {
      question: "Do Indians need a visa for Dubai?",
      answer:
        "Indian passport holders can get a Visa on Arrival for 14 days in Dubai/UAE. You need a valid passport (6+ months validity), return ticket, and hotel booking confirmation. The visa can be extended for an additional 14 days.",
    },
    {
      question: "Which countries offer visa on arrival for Indian citizens?",
      answer:
        "Popular visa on arrival countries for Indian passport holders include Thailand (15 days), Indonesia/Bali (30 days), Maldives (30 days), UAE/Dubai (14 days), Qatar (30 days), Bahrain, Jordan, and several others. Always check the latest requirements before travel.",
    },
    {
      question: "What is the difference between e-Visa and visa on arrival?",
      answer:
        "An e-Visa must be applied for online before your trip and is electronically linked to your passport. Visa on Arrival is obtained at the airport when you land. e-Visas generally offer more certainty, while VOA is more convenient but may have queues.",
    },
    {
      question: "How long does it take to get a Schengen visa from India?",
      answer:
        "A Schengen visa from India typically takes 15-20 working days to process. Apply at the consulate of the country where you'll spend the most time. You need travel insurance, bank statements, hotel bookings, and flight reservations.",
    },
    {
      question: "Do Indians need a visa for Thailand?",
      answer:
        "Indian passport holders can get a Visa on Arrival for 15 days in Thailand. For longer stays (up to 60 days), apply for a tourist visa in advance at the Thai embassy or consulate.",
    },
    {
      question: "Is Bali visa-free for Indians?",
      answer:
        "Indonesia offers Visa on Arrival (VOA) for Indian passport holders for 30 days. The VOA costs approximately $35 USD and can be extended once for another 30 days at the local immigration office.",
    },
    {
      question: "Do Indians need a visa for Singapore?",
      answer:
        "Yes, Indian passport holders need a visa to visit Singapore. You can apply for an e-Visa online or through authorized visa agents. Processing typically takes 3-5 working days.",
    },
    {
      question: "Which European countries are visa-free for Indian passport?",
      answer:
        "No European countries offer visa-free entry for Indian passport holders. All European countries (including Schengen area) require a valid visa. Serbia is the only European country that allows visa-free entry for Indians for up to 30 days.",
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Visa Requirements", href: "/visa" },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="min-h-screen bg-brand-ivory">
        {/* Hero */}
        <section className="bg-brand-emerald py-16">
          <div className="max-w-6xl mx-auto px-4">
            <Breadcrumb items={breadcrumbItems} />
            <h1 className="text-4xl md:text-5xl font-bold text-white font-display mb-4">
              Visa Requirements for Indian Passport Holders
            </h1>
            <p className="text-lg text-white/80 max-w-2xl">
              Complete visa guide for 40+ countries. Check visa on arrival, e-Visa, and visa-required
              destinations for Indian citizens.
            </p>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="max-w-6xl mx-auto px-4 -mt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
              <p className="text-2xl font-bold text-green-600">
                {visaData.filter((c) => c.visaOnArrival || !c.visaRequired).length}
              </p>
              <p className="text-xs text-brand-charcoal/60">Visa-Free / VOA</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {visaData.filter((c) => c.eVisa).length}
              </p>
              <p className="text-xs text-brand-charcoal/60">e-Visa Available</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
              <p className="text-2xl font-bold text-amber-600">
                {visaData.filter((c) => c.visaRequired && !c.visaOnArrival && !c.eVisa).length}
              </p>
              <p className="text-xs text-brand-charcoal/60">Visa Required</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
              <p className="text-2xl font-bold text-brand-charcoal">{visaData.length}</p>
              <p className="text-xs text-brand-charcoal/60">Countries Covered</p>
            </div>
          </div>
        </section>

        {/* Visa Table by Region */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          {Object.entries(byRegion).map(([region, countries]) => (
            <div key={region} className="mb-10">
              <h2 className="text-xl font-bold text-brand-charcoal mb-4 font-display">{region}</h2>
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-brand-ivory border-b border-slate-100">
                        <th className="text-left p-3 font-semibold text-brand-charcoal">Country</th>
                        <th className="text-left p-3 font-semibold text-brand-charcoal">Status</th>
                        <th className="text-left p-3 font-semibold text-brand-charcoal hidden md:table-cell">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {countries.map((c) => {
                        const badge = getVisaStatusBadge(c);
                        return (
                          <tr key={c.code} className="border-b border-slate-100 hover:bg-brand-ivory/50">
                            <td className="p-3 font-medium text-brand-charcoal">{c.name}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${badge.color}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="p-3 text-brand-charcoal/70 text-xs hidden md:table-cell">
                              {c.notes || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-brand-charcoal mb-6 font-display">
            Visa FAQ for Indian Travelers
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
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
          <div className="bg-brand-emerald rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 font-display">
              Need help with your visa?
            </h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Our travel experts can guide you through the visa application process and help plan your
              trip.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/support"
                className="px-6 py-3 bg-brand-antique-gold text-white rounded-lg font-semibold hover:bg-brand-dark-gold transition-colors"
              >
                Talk to an Expert
              </Link>
              <Link
                href="/flights"
                className="px-6 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors"
              >
                Search Flights
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
