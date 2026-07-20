"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { motion } from "motion/react";
import { HelpCircle, ChevronDown, ChevronUp, Search } from "lucide-react";
import Breadcrumb, { BreadcrumbJsonLd } from "@/components/Breadcrumb";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const STATIC_FAQS: FaqItem[] = [
  {
    id: "static-1",
    question: "How do I book a hotel on GoRASA?",
    answer: "Navigate to the Hotels page, enter your destination, dates, and room details, then click Search. Browse results, select a room, and complete the booking by signing in and paying.",
    category: "Hotels",
  },
  {
    id: "static-2",
    question: "Can I book round-trip flights?",
    answer: "Yes. On the Flights page, select 'Return' as your trip type, enter origin, destination, departure and return dates, then search. You can select outbound and inbound flights separately.",
    category: "Flights",
  },
  {
    id: "static-3",
    question: "What is the cancellation policy?",
    answer: "Cancellation policies vary by hotel and fare type. Refundable bookings can be cancelled for a fee; non-refundable bookings cannot. Check the room or fare details before booking.",
    category: "General",
  },
  {
    id: "static-4",
    question: "How do I contact support?",
    answer: "Visit the Support page to chat with our AI concierge, create a support ticket, or reach us via WhatsApp. You can also email rasatravelindia@gmail.com.",
    category: "Support",
  },
  {
    id: "static-5",
    question: "Do you offer holiday packages?",
    answer: "Yes. GoRASA offers curated holiday packages to destinations across India and internationally. Visit the Holidays page to explore packages by category.",
    category: "Holidays",
  },
  {
    id: "static-6",
    question: "Is my payment information secure?",
    answer: "Yes. GoRASA uses industry-standard encryption and secure payment gateways. We never store your full card details on our servers.",
    category: "Payments",
  },
  {
    id: "static-7",
    question: "Can I book for a large group?",
    answer: "For groups requiring more than 9 rooms or 10 passengers, please contact our concierge through the Support page for special rates and arrangements.",
    category: "General",
  },
  {
    id: "static-8",
    question: "What currencies are supported?",
    answer: "GoRASA supports multiple currencies including INR, USD, AED, EUR, GBP, and more. The currency is automatically detected based on your nationality.",
    category: "Payments",
  },
];

interface FaqPageClientProps {
  dbFaqs: FaqItem[];
}

export default function FaqPageClient({ dbFaqs }: FaqPageClientProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const allFaqs = [...STATIC_FAQS, ...dbFaqs];
  const filtered = search.trim()
    ? allFaqs.filter(
        (f) =>
          f.question.toLowerCase().includes(search.toLowerCase()) ||
          f.answer.toLowerCase().includes(search.toLowerCase())
      )
    : allFaqs;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqs.map((faq) => ({
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar onLoginClick={() => setShowLogin(true)} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />

      <main className="min-h-screen pt-16 bg-brand-ivory">
        <BreadcrumbJsonLd items={[
          { name: "Home", href: "/" },
          { name: "FAQ", href: "/faq" },
        ]} />
        <section className="py-12 bg-brand-emerald">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/20 flex items-center justify-center">
              <HelpCircle size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-white mb-1">Frequently Asked Questions</h1>
            <p className="text-white/70 text-sm">Find answers to common questions about GoRASA</p>
          </div>
        </section>

        <section className="py-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative mb-6">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-antique-gold outline-none"
              />
            </div>

            <div className="space-y-3">
              {filtered.map((faq) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                    className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-brand-ivory/50 transition-colors"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-antique-gold">{faq.category}</span>
                      <p className="font-semibold text-brand-charcoal mt-0.5">{faq.question}</p>
                    </div>
                    {openId === faq.id ? (
                      <ChevronUp size={18} className="text-slate-600 shrink-0 ml-4" />
                    ) : (
                      <ChevronDown size={18} className="text-slate-600 shrink-0 ml-4" />
                    )}
                  </button>
                  {openId === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="px-4 pb-4"
                    >
                      <p className="text-sm text-brand-charcoal/80 leading-relaxed">{faq.answer}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <HelpCircle size={48} className="mx-auto text-slate-600/50 mb-3" />
                  <p className="text-slate-600">No matching questions found.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
