"use client";

import React from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Building2, Map, Plane, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

const SEARCH_TABS = [
  { id: "holidays", label: "Plan My Holiday", icon: Map, href: "/holidays" },
  { id: "hotels", label: "Hotels", icon: Building2, href: "/hotels" },
  { id: "flights", label: "Flights", icon: Plane, href: "/flights" },
];

interface HeroSectionProps {
  imageSrc?: string;
  imageAlt?: string;
  title?: string;
  titleAccent?: string;
  subtitle?: string;
  showCorporateCta?: boolean;
}

export default function HeroSection({
  imageSrc = "/images/hero.jpg",
  imageAlt = "Hero banner",
  title = "Reserve luxury",
  titleAccent = "&amp; Composure",
  subtitle = "Curated stays, flights, and packages with a dedicated concierge.",
  showCorporateCta = true,
}: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, -30]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[55vh] md:min-h-[62vh] lg:min-h-[70vh] flex items-end overflow-hidden bg-slate-900"
    >
      {/* Parallax Background Image */}
      <motion.div
        className="absolute inset-0"
        style={{ y: imageY }}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover object-center scale-110"
          priority
          sizes="100vw"
          quality={90}
        />
        {/* Multi-layer gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-slate-900/20" />
      </motion.div>

      {/* Subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-antique-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-brand-emerald/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <motion.div
        className="relative w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-16 md:pb-20 pt-24"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl"
        >
          {/* Eyebrow */}
          <motion.span
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 text-brand-champagne/80 text-caption font-bold uppercase tracking-[0.2em] mb-5"
          >
            <span className="w-8 h-px bg-brand-antique-gold" />
            Premium Travel
          </motion.span>

          {/* Headline — fluid typography */}
          <h1 className="heading-hero text-white">
            {title}
            {titleAccent && (
              <motion.span
                className="block text-brand-saffron italic"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                dangerouslySetInnerHTML={{ __html: titleAccent }}
              />
            )}
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-4 text-slate-300 text-body-lg max-w-md leading-relaxed"
          >
            {subtitle}
          </motion.p>

          {/* Search Tab CTAs */}
          <div className="flex flex-wrap gap-3 mt-8">
            {SEARCH_TABS.map((tab, i) => {
              const Icon = tab.icon;
              return (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={tab.href}
                    className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-semibold hover:bg-brand-saffron hover:border-brand-saffron hover:shadow-lg hover:shadow-brand-saffron/20 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <Icon size={17} className="opacity-80 group-hover:opacity-100 transition-opacity" />
                    {tab.label}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Corporate CTA */}
          {showCorporateCta && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-5 text-xs text-slate-400"
            >
              Managing corporate travel?{" "}
              <Link href="/admin" className="text-brand-saffron hover:text-brand-champagne font-medium transition-colors underline underline-offset-2">
                Access dashboard
              </Link>
            </motion.p>
          )}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown size={16} />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
