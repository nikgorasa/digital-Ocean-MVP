import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import { HelpCircle, ChevronDown, ArrowLeft } from "lucide-react";

export const revalidate = 300;

const SITE_URL = "https://cckr.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categories = await prisma.faqCategory.findMany({
    where: { isactive: true },
    select: { id: true, label: true, keywords: true },
  });

  const cat = categories.find((c) => {
    const slug = c.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    return slug === category;
  });

  if (!cat) {
    return { title: "FAQ Category Not Found" };
  }

  return {
    title: `${cat.label} — Frequently Asked Questions`,
    description: `Find answers to common questions about ${cat.label.toLowerCase()} on GoRASA. Expert travel advice and booking help.`,
    alternates: { canonical: `${SITE_URL}/faq/${category}` },
    openGraph: {
      title: `${cat.label} FAQ | GoRASA`,
      description: `Find answers to common questions about ${cat.label.toLowerCase()}.`,
      url: `${SITE_URL}/faq/${category}`,
      type: "website",
    },
  };
}

export default async function FaqCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  const categories = await prisma.faqCategory.findMany({
    where: { isactive: true },
    orderBy: { sortorder: "asc" },
    select: { id: true, label: true, keywords: true },
  });

  const cat = categories.find((c) => {
    const slug = c.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    return slug === category;
  });

  if (!cat) {
    notFound();
  }

  let catKeywords: string[] = [];
  try { catKeywords = JSON.parse(cat.keywords); } catch { /* ignore */ }

  const faqs = await prisma.faq.findMany({
    where: { isActive: true },
    orderBy: { keyword: "asc" },
    select: { id: true, question: true, answer: true, keyword: true },
  });

  const categoryFaqs = faqs.filter(
    (f) => f.keyword && catKeywords.some((kw) => f.keyword.toLowerCase().includes(kw.toLowerCase()))
  );

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "FAQ", href: "/faq" },
    { name: cat.label, href: `/faq/${category}` },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: categoryFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const categorySlug = (label: string) => label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      {categoryFaqs.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      <main className="min-h-screen bg-brand-ivory">
        <section className="py-12 bg-brand-emerald">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/20 flex items-center justify-center">
              <HelpCircle size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-white mb-1">{cat.label}</h1>
            <p className="text-white/70 text-sm">Frequently asked questions about {cat.label.toLowerCase()}</p>
          </div>
        </section>

        <section className="py-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/faq" className="inline-flex items-center gap-1 text-sm text-brand-antique-gold hover:text-brand-dark-gold mb-6">
              <ArrowLeft size={14} /> Back to All FAQs
            </Link>

            {/* Category navigation */}
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map((c) => {
                const slug = categorySlug(c.label);
                return (
                  <Link
                    key={c.id}
                    href={`/faq/${slug}`}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${slug === category ? "bg-brand-antique-gold text-white" : "bg-white border border-slate-200 text-brand-charcoal hover:bg-brand-ivory"}`}
                  >
                    {c.label}
                  </Link>
                );
              })}
            </div>

            {categoryFaqs.length > 0 ? (
              <div className="space-y-3">
                {categoryFaqs.map((faq) => (
                  <details
                    key={faq.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden group"
                  >
                    <summary className="p-4 cursor-pointer font-semibold text-brand-charcoal hover:text-brand-antique-gold transition-colors list-none flex justify-between items-center">
                      {faq.question}
                      <span className="text-brand-charcoal/40 group-open:rotate-180 transition-transform">
                        <ChevronDown size={18} />
                      </span>
                    </summary>
                    <div className="px-4 pb-4 text-sm text-brand-charcoal/80 leading-relaxed">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <HelpCircle size={48} className="mx-auto text-slate-600/50 mb-3" />
                <p className="text-brand-charcoal/50">No FAQs in this category yet.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
