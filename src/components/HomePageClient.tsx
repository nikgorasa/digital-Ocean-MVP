"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import InquiryModal from "@/components/InquiryModal";
import PackageCarousel from "@/components/PackageCarousel";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "motion/react";
import {
  Building2,
  ArrowRight,
  Shield,
  Clock,
  Star,
  Headphones,
  TrendingUp,
  Calendar,
  Compass,
  Sparkles,
  Sun,
  Award,
  User,
  CreditCard,
  Map,
  Plane,
  MessageCircle,
  CircleCheck,
  Palmtree,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PackageItem {
  id: string;
  title: string;
  duration: string;
  price: number;
  originalPrice?: number;
  rating: number;
  imageUrl: string;
  provider: string;
  inclusions: string[];
}

interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
}

interface CategoryMeta {
  title: string;
  subtitle: string;
  icon: string;
  badgeColor: string;
  badgeText: string;
}

interface ValueProp {
  icon: string;
  title: string;
  description: string;
}

interface HomePageClientProps {
  carouselPackages: Record<string, PackageItem[]>;
  testimonials: TestimonialItem[];
  categories: Record<string, CategoryMeta>;
  categoryOrder: string[];
  valueProps: ValueProp[];
  stats: { companies: string; bookings: string; rating: string };
  error?: string | null;
}

const SEARCH_TABS: {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  color: string;
}[] = [
  { id: "holidays", label: "Plan My Holiday", icon: Map, href: "/holidays", color: "#C99A52" },
  { id: "hotels", label: "Hotels", icon: Building2, href: "/hotels", color: "#C99A52" },
  { id: "flights", label: "Flights", icon: Plane, href: "/flights", color: "#C99A52" },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  Shield: <Shield className="w-6 h-6" />,
  Clock: <Clock className="w-6 h-6" />,
  Star: <Star className="w-6 h-6" />,
  Headphones: <Headphones className="w-6 h-6" />,
  TrendingUp: <TrendingUp className="w-3.5 h-3.5 text-brand-antique-gold" />,
  Calendar: <Calendar className="w-3.5 h-3.5 text-brand-emerald" />,
  Compass: <Compass className="w-3.5 h-3.5 text-brand-antique-gold" />,
  Sparkles: <Sparkles className="w-3.5 h-3.5 text-brand-champagne" />,
  Sun: <Sun className="w-3.5 h-3.5 text-brand-antique-gold" />,
  Award: <Award className="w-3.5 h-3.5 text-brand-champagne" />,
};

export default function HomePageClient({
  carouselPackages,
  testimonials,
  categories,
  categoryOrder,
  valueProps,
  stats,
  error,
}: HomePageClientProps) {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [inquiryPackage, setInquiryPackage] = useState<PackageItem | null>(null);

  return (
    <>
      <Navbar onLoginClick={() => setShowLogin(true)} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      <InquiryModal
        isOpen={!!inquiryPackage}
        onClose={() => setInquiryPackage(null)}
        pkg={inquiryPackage}
        userName={user?.name}
        userEmail={user?.email}
      />

      <main className="min-h-screen pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[50vh] md:min-h-[58vh] lg:min-h-[65vh] flex items-center overflow-hidden bg-brand-emerald">
          {/* Hero image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1600&q=80"
              alt="Taj Mahal at golden hour, Agra, India"
              fill
              className="object-cover object-center"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-emerald/90 via-brand-emerald/75 to-brand-emerald/40" />
          </div>

          {/* Content — left-aligned */}
          <div className="relative w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 md:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-xl"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight tracking-tight">
                Reserve luxury
                <span className="block text-brand-antique-gold italic">&amp; Composure</span>
              </h1>
              <p className="mt-3 text-brand-champagne/80 text-base md:text-lg max-w-md leading-relaxed">
                Curated stays, flights, and packages with a dedicated concierge.
              </p>

              {/* Quick action tiles */}
              <div className="flex flex-wrap gap-2.5 mt-6">
                {SEARCH_TABS.map((tab, i) => {
                  const Icon = tab.icon;
                  return (
                    <motion.div
                      key={tab.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.25 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link
                        href={tab.href}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white text-sm font-medium hover:bg-brand-antique-gold hover:border-brand-antique-gold transition-colors duration-200"
                      >
                        <Icon size={16} />
                        {tab.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Corporate travel CTA */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-4 text-xs text-brand-sand"
              >
                Managing corporate travel?{" "}
                <Link href="/admin" className="text-brand-antique-gold hover:underline font-medium">
                  Access dashboard
                </Link>
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Value Propositions */}
        <section className="py-16 bg-brand-ivory">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {valueProps.map((prop, i) => (
                <motion.div
                  key={prop.title}
                  initial={{ opacity: 1, y: 0 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center p-4"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-brand-champagne/20 flex items-center justify-center">
                    {ICON_MAP[prop.icon]}
                  </div>
                  <h3 className="font-bold text-brand-charcoal text-sm mb-1">{prop.title}</h3>
                  <p className="text-brand-sand text-xs">{prop.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Package Carousels */}
        <section className="py-12 bg-brand-ivory/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {error ? (
              <div className="text-center py-12">
                <p className="text-brand-sand mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-brand-antique-gold text-white rounded-xl font-bold hover:bg-brand-emerald transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : (
              categoryOrder.map((cat) => {
                const items = carouselPackages[cat];
                if (!items || items.length === 0) return null;
                const meta = categories[cat];
                if (!meta) return null;
                return (
                  <React.Fragment key={cat}>
                    <PackageCarousel
                      title={meta.title}
                      subtitle={meta.subtitle}
                      icon={ICON_MAP[meta.icon]}
                      items={items}
                      badgeColor={meta.badgeColor}
                      badgeText={meta.badgeText}
                      onInterested={setInquiryPackage}
                    />
                    {cat === "GORASA_SELECT" && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-12">
                        {[
                           { icon: <MessageCircle size={22} className="text-brand-emerald" />, label: "WhatsApp Support" },
                           { icon: <Star size={22} className="text-brand-antique-gold" />, label: "RASA Rewards" },
                           { icon: <CircleCheck size={22} className="text-brand-emerald" />, label: "Verified Stays" },
                           { icon: <Palmtree size={22} className="text-brand-antique-gold" />, label: "All inclusive vacation" },
                           { icon: <Award size={22} className="text-brand-champagne" />, label: "19+ years of combined industry experience" },
                          ].map((feature) => (
                           <div
                              key={feature.label}
                              className="bg-white rounded-2xl p-4 border border-brand-sand/20 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap-2"
                            >
                              {feature.icon}
                              <span className="text-xs font-semibold text-brand-charcoal leading-tight">
                                {feature.label}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-brand-ivory">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-serif font-bold text-brand-charcoal mb-4">
                What Our Travelers Say
              </h2>
              <p className="text-brand-sand max-w-2xl mx-auto">
                Trusted by thousands of travelers for premium experiences across India and the world.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, i) => (
                <motion.div
                  key={testimonial.id || testimonial.name}
                  initial={{ opacity: 1, y: 0 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-6 border border-brand-sand/20"
                >
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} size={16} className="fill-brand-antique-gold text-brand-antique-gold" />
                    ))}
                  </div>
                  <p className="text-brand-charcoal/80 text-sm mb-4 italic">&ldquo;{testimonial.text}&rdquo;</p>
                  <div>
                    <p className="font-bold text-brand-charcoal text-sm">{testimonial.name}</p>
                    <p className="text-brand-sand text-xs">{testimonial.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Corporate Travel */}
        <section className="py-20 bg-gradient-to-br from-brand-emerald via-brand-emerald to-brand-charcoal relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-antique-gold rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-block text-brand-antique-gold font-bold uppercase tracking-widest text-[10px] bg-brand-antique-gold/10 border border-brand-antique-gold/20 px-3 py-1 rounded-full mb-4">
                  Corporate Travel
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-5 leading-tight">
                  Business Travel,<br />
                  <span className="text-brand-antique-gold italic">Elevated</span>
                </h2>
                <p className="text-brand-sand text-lg mb-8 leading-relaxed max-w-lg">
                  Streamline your corporate travel with dedicated account management, negotiated rates, and 24/7 concierge support.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                  {[
                    { icon: User, label: "Dedicated account manager" },
                    { icon: TrendingUp, label: "Negotiated corporate rates" },
                    { icon: CreditCard, label: "Expense management dashboard" },
                    { icon: Headphones, label: "24/7 priority support" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                      <div className="w-8 h-8 rounded-lg bg-brand-antique-gold/20 flex items-center justify-center shrink-0">
                        <item.icon size={16} className="text-brand-antique-gold" />
                      </div>
                      <span className="text-brand-champagne/80 text-sm font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-antique-gold text-white rounded-xl font-bold hover:bg-brand-emerald transition-colors shadow-lg shadow-brand-antique-gold/20"
                  >
                    Get Started
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    href="/holidays"
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors border border-white/10"
                  >
                    Learn More
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=800&q=80"
                    alt="Corporate Travel - Modern office building"
                    className="w-full h-[400px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-emerald/80 via-transparent to-transparent rounded-3xl" />
                </div>

                <div className="absolute -bottom-6 left-6 right-6 flex gap-3">
                  <div className="flex-1 bg-white rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-emerald/10 rounded-full flex items-center justify-center">
                        <Shield size={20} className="text-brand-emerald" />
                      </div>
                      <div>
                        <p className="font-bold text-brand-charcoal text-lg">{stats.companies}</p>
                        <p className="text-brand-sand text-xs">Corporate Partners</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 bg-white rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-antique-gold/10 rounded-full flex items-center justify-center">
                        <Building2 size={20} className="text-brand-antique-gold" />
                      </div>
                      <div>
                        <p className="font-bold text-brand-charcoal text-lg">{stats.bookings}</p>
                        <p className="text-brand-sand text-xs">Bookings Made</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 bg-white rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-champagne/30 rounded-full flex items-center justify-center">
                        <Star size={20} className="text-brand-champagne" />
                      </div>
                      <div>
                        <p className="font-bold text-brand-charcoal text-lg">{stats.rating}</p>
                        <p className="text-brand-sand text-xs">Client Rating</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-brand-emerald to-brand-charcoal">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
              Ready to Experience The Finest?
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Join thousands of travelers who trust GoRASA for their premium travel needs.
            </p>
            {!user ? (
              <button
                onClick={() => setShowLogin(true)}
                className="px-8 py-3 bg-brand-antique-gold text-white rounded-xl font-bold hover:bg-brand-emerald transition-colors shadow-lg cursor-pointer"
              >
                Get Started
              </button>
            ) : (
              <Link
                href="/flights"
                className="inline-block px-8 py-3 bg-brand-antique-gold text-white rounded-xl font-bold hover:bg-brand-emerald transition-colors shadow-lg"
              >
                Search Flights
              </Link>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
