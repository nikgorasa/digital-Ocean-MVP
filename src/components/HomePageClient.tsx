"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import InquiryModal from "@/components/InquiryModal";
import PackageCarousel from "@/components/PackageCarousel";
import HeroSection from "@/components/HeroSection";
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
  MessageCircle,
  CircleCheck,
  Palmtree,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/motion";

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
        <HeroSection />

        {/* Value Propositions */}
        <section className="py-10 bg-brand-ivory">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {valueProps.map((prop) => (
                <StaggerItem key={prop.title}>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-brand-champagne/20 flex items-center justify-center">
                      {ICON_MAP[prop.icon]}
                    </div>
                    <h3 className="font-bold text-brand-charcoal text-sm mb-1">{prop.title}</h3>
                    <p className="text-brand-sand text-xs">{prop.description}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
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
                      <StaggerContainer className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-12" delayChildren={0.1}>
                        {[
                           { icon: <MessageCircle size={22} className="text-brand-emerald" />, label: "WhatsApp Support" },
                           { icon: <Star size={22} className="text-brand-antique-gold" />, label: "RASA Rewards" },
                           { icon: <CircleCheck size={22} className="text-brand-emerald" />, label: "Verified Stays" },
                           { icon: <Palmtree size={22} className="text-brand-antique-gold" />, label: "All inclusive vacation" },
                           { icon: <Award size={22} className="text-brand-champagne" />, label: "19+ years of combined industry experience" },
                          ].map((feature) => (
                           <StaggerItem key={feature.label}>
                             <div
                               className="bg-white rounded-2xl p-4 card-elevated flex flex-col items-center text-center gap-2"
                             >
                               {feature.icon}
                               <span className="text-xs font-semibold text-brand-charcoal leading-tight">
                                 {feature.label}
                               </span>
                             </div>
                           </StaggerItem>
                          ))}
                      </StaggerContainer>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </section>

        {/* Popular Destinations */}
        <section className="py-16 bg-brand-ivory">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-10">
              <h2 className="heading-section text-brand-charcoal mb-4">
                Popular Destinations
              </h2>
              <p className="text-body text-brand-sand max-w-2xl mx-auto">
                Explore our most-loved travel destinations with curated packages, flights, and hotels.
              </p>
            </FadeIn>
            <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Dubai", slug: "dubai", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=400&q=80", country: "UAE" },
                { name: "Bali", slug: "bali", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80", country: "Indonesia" },
                { name: "Maldives", slug: "maldives", image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=400&q=80", country: "Maldives" },
                { name: "Thailand", slug: "thailand", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=400&q=80", country: "Thailand" },
                { name: "Goa", slug: "goa", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=400&q=80", country: "India" },
                { name: "Kashmir", slug: "kashmir", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=400&q=80", country: "India" },
                { name: "Singapore", slug: "singapore", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=400&q=80", country: "Singapore" },
                { name: "Manali", slug: "manali", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=400&q=80", country: "India" },
              ].map((dest) => (
                <StaggerItem key={dest.slug}>
                  <Link
                    href={`/destinations/${dest.slug}`}
                    className="group relative block h-48 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                  >
                    <Image
                      src={dest.image}
                      alt={`${dest.name}, ${dest.country}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent group-hover:from-black/80 transition-colors duration-300" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div>
                        <p className="text-white font-bold text-lg">{dest.name}</p>
                        <p className="text-white/70 text-xs">{dest.country}</p>
                      </div>
                      <span className="text-white/0 group-hover:text-white/90 text-xs font-medium transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        Explore →
                      </span>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-brand-ivory">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-12">
              <h2 className="heading-section text-brand-charcoal mb-4">
                What Our Travelers Say
              </h2>
              <p className="text-body text-brand-sand max-w-2xl mx-auto">
                Trusted by thousands of travelers for premium experiences across India and the world.
              </p>
            </FadeIn>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <StaggerItem key={testimonial.id || testimonial.name}>
                  <div className="bg-white rounded-2xl p-6 border border-brand-sand/20 card-elevated relative">
                    <div className="text-5xl text-brand-antique-gold/20 font-serif absolute top-3 right-5 leading-none select-none">&ldquo;</div>
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <Star key={j} size={16} className="fill-brand-antique-gold text-brand-antique-gold" />
                      ))}
                    </div>
                    <p className="text-brand-charcoal/80 text-sm mb-4 italic relative z-10">{testimonial.text}</p>
                    <div>
                      <p className="font-bold text-brand-charcoal text-sm">{testimonial.name}</p>
                      <p className="text-brand-charcoal/50 text-xs">{testimonial.role}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
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
              <FadeIn direction="left">
                <span className="inline-flex items-center gap-2 text-brand-antique-gold font-bold uppercase tracking-[0.2em] text-[10px] bg-brand-antique-gold/10 border border-brand-antique-gold/20 px-3 py-1 rounded-full mb-5">
                  <span className="w-4 h-px bg-brand-antique-gold" />
                  Corporate Travel
                </span>
                <h2 className="heading-hero text-white mb-5">
                  Business Travel,<br />
                  <span className="text-brand-antique-gold italic">Elevated</span>
                </h2>
                <p className="text-brand-sand text-body-lg mb-8 leading-relaxed max-w-lg">
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
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      href="/login"
                      className="btn btn-primary px-8 py-3.5 shadow-lg shadow-brand-antique-gold/20"
                    >
                      Get Started
                      <ArrowRight size={18} />
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      href="/holidays"
                      className="btn text-white border border-white/30 hover:bg-white/10 hover:border-white/50"
                    >
                      Learn More
                    </Link>
                  </motion.div>
                </div>
              </FadeIn>

              <FadeIn direction="right" delay={0.15}>
                <div className="relative">
                  <div className="rounded-3xl overflow-hidden shadow-2xl">
                    <Image
                      src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=800&q=80"
                      alt="Corporate Travel - Modern office building"
                      width={800}
                      height={400}
                      className="w-full h-[400px] object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-emerald/80 via-transparent to-transparent rounded-3xl" />
                  </div>

                  <div className="absolute -bottom-6 left-6 right-6 flex gap-3">
                    <div className="flex-1 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-emerald/10 rounded-full flex items-center justify-center">
                          <Shield size={20} className="text-brand-emerald" />
                        </div>
                        <div>
                          <p className="font-bold text-brand-charcoal text-lg">{stats.companies}</p>
                          <p className="text-brand-charcoal/50 text-xs">Corporate Partners</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-antique-gold/10 rounded-full flex items-center justify-center">
                          <Building2 size={20} className="text-brand-antique-gold" />
                        </div>
                        <div>
                          <p className="font-bold text-brand-charcoal text-lg">{stats.bookings}</p>
                          <p className="text-brand-charcoal/50 text-xs">Bookings Made</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-champagne/30 rounded-full flex items-center justify-center">
                          <Star size={20} className="text-brand-champagne" />
                        </div>
                        <div>
                          <p className="font-bold text-brand-charcoal text-lg">{stats.rating}</p>
                          <p className="text-brand-charcoal/50 text-xs">Client Rating</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 bg-gradient-to-r from-brand-emerald to-brand-charcoal">
          <FadeIn className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="heading-section text-white mb-4">
              Ready to Experience The Finest?
            </h2>
            <p className="text-white/80 mb-8 text-body-lg">
              Join thousands of travelers who trust GoRASA for their premium travel needs.
            </p>
            <div className="flex items-center justify-center gap-4">
              {!user ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={() => setShowLogin(true)}
                    className="btn btn-primary px-8 py-3.5 text-base shadow-lg cursor-pointer"
                  >
                    Get Started
                  </motion.button>
                  <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}>
                    <Link
                      href="/holidays"
                      className="btn px-8 py-3.5 text-base text-white border border-white/20 hover:bg-white/10"
                    >
                      Browse Packages
                    </Link>
                  </motion.div>
                </>
              ) : (
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}>
                  <Link
                    href="/flights"
                    className="btn btn-primary px-8 py-3.5 text-base shadow-lg"
                  >
                    Search Flights
                  </Link>
                </motion.div>
              )}
            </div>
          </FadeIn>
        </section>
      </main>

      <Footer />
    </>
  );
}
