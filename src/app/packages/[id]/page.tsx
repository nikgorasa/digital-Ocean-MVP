import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb, { BreadcrumbJsonLd } from "@/components/Breadcrumb";

export const revalidate = 600;

const SITE_URL = "https://cckr.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const pkg = await prisma.package.findUnique({
    where: { id },
    select: { title: true, duration: true, price: true, overview: true, images: true },
  });

  if (!pkg) {
    return { title: "Package Not Found", description: "This holiday package does not exist." };
  }

  let images: string[] = [];
  try {
    images = typeof pkg.images === "string" ? JSON.parse(pkg.images) : [];
  } catch {
    images = [];
  }

  const description = `${pkg.title} — ${pkg.duration} holiday package starting at ₹${pkg.price.toLocaleString("en-IN")}/person. Book with GoRASA for best prices and 24/7 support.`;

  return {
    title: `${pkg.title} — ${pkg.duration} Package`,
    description,
    keywords: [
      pkg.title,
      "holiday package",
      "travel package",
      pkg.duration,
      "GoRASA",
      "book package",
    ],
    alternates: {
      canonical: `${SITE_URL}/packages/${id}`,
    },
    openGraph: {
      title: `${pkg.title} | GoRASA`,
      description,
      url: `${SITE_URL}/packages/${id}`,
      type: "website",
      images: images[0]
        ? [{ url: images[0], width: 1200, height: 627, alt: pkg.title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${pkg.title} | GoRASA`,
      description,
      images: images[0] ? [images[0]] : [],
    },
  };
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const pkg = await prisma.package.findUnique({
    where: { id },
  });

  if (!pkg || !pkg.isActive) {
    notFound();
  }

  const parseJsonSafe = <T,>(val: unknown, fallback: T): T => {
    if (typeof val !== "string") return fallback;
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  };

  const images = parseJsonSafe<string[]>(pkg.images, []);
  const itinerary = parseJsonSafe<Record<string, string[]>>(pkg.itinerary, {});
  const inclusions = parseJsonSafe<string[]>(pkg.inclusions, []);
  const exclusions = parseJsonSafe<string[]>(pkg.exclusions, []);
  const overview = parseJsonSafe<Record<string, string>>(pkg.overview, {});
  const importantNotes = parseJsonSafe<Record<string, string>>(pkg.importantNotes, {});

  const relatedPackages = await prisma.package.findMany({
    where: {
      isActive: true,
      id: { not: id },
      category: pkg.category || undefined,
    },
    orderBy: { rating: "desc" },
    take: 3,
  });

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Packages", href: "/holidays" },
    { name: pkg.title, href: `/packages/${id}` },
  ];

  const tourSchema = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: pkg.title,
    description: `Holiday package — ${pkg.duration}`,
    touristType: "Leisure",
    provider: {
      "@type": "Organization",
      name: pkg.provider || "GoRASA",
      url: SITE_URL,
    },
    offers: {
      "@type": "Offer",
      price: pkg.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/packages/${id}`,
    },
    image: images[0] || undefined,
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pkg.title,
    description: `${pkg.title} — ${pkg.duration} holiday package`,
    image: images[0] || undefined,
    brand: {
      "@type": "Brand",
      name: "GoRASA",
    },
    offers: {
      "@type": "Offer",
      price: pkg.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "GoRASA",
      },
      ...(pkg.originalPrice && pkg.originalPrice > pkg.price
        ? {
            priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          }
        : {}),
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: pkg.rating,
      reviewCount: Math.max(10, Math.round(pkg.rating * 20)),
      bestRating: 5,
      worstRating: 1,
    },
  };

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tourSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <main className="min-h-screen bg-brand-ivory">
        {/* Hero Image Gallery */}
        <section className="relative h-[50vh] min-h-[350px] overflow-hidden">
          {images.length > 0 ? (
            <img
              src={images[0]}
              alt={pkg.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-brand-deep-teal" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <div className="max-w-6xl mx-auto">
              <Breadcrumb items={breadcrumbItems} />
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-display mb-3">
                {pkg.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <span className="flex items-center gap-1">
                  <span className="text-brand-antique-gold">★</span> {pkg.rating}
                </span>
                <span>•</span>
                <span>{pkg.duration}</span>
                <span>•</span>
                <span>{pkg.provider || "GoRASA Direct"}</span>
                {pkg.category && (
                  <>
                    <span>•</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded text-sm">{pkg.category}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Overview */}
              {Object.keys(overview).length > 0 && (
                <section className="bg-white rounded-xl p-6 shadow-sm border border-brand-sand/20">
                  <h2 className="text-xl font-bold text-brand-charcoal mb-4 font-display">Overview</h2>
                  <div className="space-y-3">
                    {Object.entries(overview).map(([key, value]) => (
                      <div key={key}>
                        <h3 className="text-sm font-semibold text-brand-charcoal/60 uppercase tracking-wide mb-1">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </h3>
                        <p className="text-brand-charcoal/80 text-sm leading-relaxed">{value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Itinerary */}
              {Object.keys(itinerary).length > 0 && (
                <section className="bg-white rounded-xl p-6 shadow-sm border border-brand-sand/20">
                  <h2 className="text-xl font-bold text-brand-charcoal mb-4 font-display">Itinerary</h2>
                  <div className="space-y-4">
                    {Object.entries(itinerary).map(([day, activities]) => (
                      <div key={day} className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-antique-gold/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-brand-antique-gold">
                            {day.replace(/\D/g, "") || "•"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-brand-charcoal mb-1">{day}</h3>
                          <ul className="space-y-1">
                            {Array.isArray(activities) &&
                              activities.map((act, i) => (
                                <li key={i} className="text-sm text-brand-charcoal/70 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand-sand mt-1.5 flex-shrink-0" />
                                  {act}
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Inclusions & Exclusions */}
              <div className="grid md:grid-cols-2 gap-6">
                {inclusions.length > 0 && (
                  <section className="bg-white rounded-xl p-6 shadow-sm border border-brand-sand/20">
                    <h2 className="text-lg font-bold text-brand-charcoal mb-4 font-display flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm">✓</span>
                      Inclusions
                    </h2>
                    <ul className="space-y-2">
                      {inclusions.map((item, i) => (
                        <li key={i} className="text-sm text-brand-charcoal/70 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {exclusions.length > 0 && (
                  <section className="bg-white rounded-xl p-6 shadow-sm border border-brand-sand/20">
                    <h2 className="text-lg font-bold text-brand-charcoal mb-4 font-display flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-sm">✕</span>
                      Exclusions
                    </h2>
                    <ul className="space-y-2">
                      {exclusions.map((item, i) => (
                        <li key={i} className="text-sm text-brand-charcoal/70 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">✕</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              {/* Important Notes */}
              {Object.keys(importantNotes).length > 0 && (
                <section className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                  <h2 className="text-lg font-bold text-brand-charcoal mb-4 font-display">
                    Important Notes
                  </h2>
                  <div className="space-y-2">
                    {Object.entries(importantNotes).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-semibold text-brand-charcoal">{key}: </span>
                        <span className="text-brand-charcoal/70">{value}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Image Gallery */}
              {images.length > 1 && (
                <section>
                  <h2 className="text-xl font-bold text-brand-charcoal mb-4 font-display">Gallery</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {images.slice(1, 7).map((img, i) => (
                      <div key={i} className="relative h-40 rounded-lg overflow-hidden">
                        <img
                          src={img}
                          alt={`${pkg.title} — image ${i + 2}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar — Pricing Card */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-xl p-6 shadow-sm border border-brand-sand/20">
                <div className="mb-4">
                  {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg text-brand-charcoal/40 line-through">
                        ₹{pkg.originalPrice.toLocaleString("en-IN")}
                      </span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                        {Math.round(
                          ((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100
                        )}
                        % OFF
                      </span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-brand-antique-gold">
                      ₹{pkg.price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm text-brand-charcoal/50">/person</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between py-2 border-b border-brand-sand/10">
                    <span className="text-brand-charcoal/60">Duration</span>
                    <span className="font-medium">{pkg.duration}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-brand-sand/10">
                    <span className="text-brand-charcoal/60">Rating</span>
                    <span className="font-medium">★ {pkg.rating}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-brand-sand/10">
                    <span className="text-brand-charcoal/60">Provider</span>
                    <span className="font-medium">{pkg.provider || "GoRASA Direct"}</span>
                  </div>
                  {pkg.category && (
                    <div className="flex justify-between py-2">
                      <span className="text-brand-charcoal/60">Category</span>
                      <span className="font-medium">{pkg.category}</span>
                    </div>
                  )}
                </div>

                <Link
                  href={`/holidays`}
                  className="block w-full text-center px-6 py-3 bg-brand-antique-gold text-white rounded-lg font-semibold hover:bg-brand-dark-gold transition-colors mb-3"
                >
                  Book Now
                </Link>
                <Link
                  href="/support"
                  className="block w-full text-center px-6 py-3 border-2 border-brand-charcoal/20 text-brand-charcoal rounded-lg font-semibold hover:border-brand-antique-gold hover:text-brand-antique-gold transition-colors"
                >
                  Enquire
                </Link>

                <p className="text-xs text-brand-charcoal/40 text-center mt-4">
                  Prices are per person on twin sharing. Taxes extra.
                </p>
              </div>
            </aside>
          </div>

          {/* Related Packages */}
          {relatedPackages.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-brand-charcoal mb-6 font-display">
                Related Packages
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPackages.map((rp) => {
                  const rpImages = parseJsonSafe<string[]>(rp.images, []);
                  const rpInclusions = parseJsonSafe<string[]>(rp.inclusions, []);
                  return (
                    <Link
                      key={rp.id}
                      href={`/packages/${rp.id}`}
                      className="bg-white rounded-xl overflow-hidden shadow-sm border border-brand-sand/20 hover:shadow-md transition-shadow group"
                    >
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={
                            rpImages[0] ||
                            "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80"
                          }
                          alt={rp.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 rounded text-xs font-semibold">
                          {rp.duration}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-brand-charcoal mb-1 group-hover:text-brand-antique-gold transition-colors">
                          {rp.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-brand-charcoal/50">★ {rp.rating}</span>
                        </div>
                        {rpInclusions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {rpInclusions.slice(0, 2).map((inc) => (
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
                          {rp.originalPrice && rp.originalPrice > rp.price && (
                            <span className="text-sm text-brand-charcoal/40 line-through">
                              ₹{rp.originalPrice.toLocaleString("en-IN")}
                            </span>
                          )}
                          <span className="text-lg font-bold text-brand-antique-gold">
                            ₹{rp.price.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
